<?php
/* POST api/staff.php {action, ...} — the "Ordini" board (ordini.html).
   Everything except "login" needs the staff cookie set by a correct PIN. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('method', 405);
if (!configured()) fail('not_configured', 503);
housekeeping();
$in = body();
$action = (string) ($in['action'] ?? '');

if ($action === 'login') {
    rate_limit('login', 8, 900);                         // 8 tries per 15 minutes per connection
    $pin = str($in['pin'] ?? '', 12);
    if (!password_verify($pin, private_config()['pin_hash'])) fail('wrong_pin', 403);
    start_session();
    json_out(['ok' => true]);
}
if ($action === 'logout') {
    if (isset($_COOKIE['vc_staff'])) db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([hash('sha256', (string) $_COOKIE['vc_staff'])]);
    setcookie('vc_staff', '', ['expires' => 1, 'path' => '/']);
    json_out(['ok' => true]);
}

require_staff();
$cfg = site_config();

switch ($action) {
    case 'board': {
        $day = service_day();
        $q = db()->prepare('SELECT * FROM orders WHERE service_day = ? OR status IN (\'new\', \'accepted\', \'ready\', \'out\') ORDER BY created_at');
        $q->execute([$day]);
        json_out(['ok' => true, 'now' => time(), 'day' => $day, 'orders' => array_map(fn($o) => public_order($o, true), $q->fetchAll()),
            'rejectReasons' => REJECT_REASONS,
            'riders' => private_config()['riders'], 'telegram' => private_config()['telegram_token'] !== '',
            'riderChat' => private_config()['telegram_riders_chat'] !== '', 'orderingOpen' => ordering_period() !== null,
            'state' => site_state()]);
    }

    case 'accept': {
        $o = get_order((int) ($in['id'] ?? 0));
        if (!$o || $o['status'] !== 'new') fail('not_new', 409);
        $time = str($in['time'] ?? '', 5);
        if (!preg_match('/^\d{2}:\d{2}$/', $time)) fail('bad_time');
        json_out(['ok' => true, 'order' => public_order(set_status((int) $o['id'], 'accepted', ['ready_at' => $time]), true)]);
    }

    case 'reject': {
        $o = get_order((int) ($in['id'] ?? 0));
        if (!$o || !in_array($o['status'], ['new', 'accepted', 'ready'], true)) fail('cannot_reject', 409);
        $reason = str($in['reason'] ?? '', 120) ?: 'Non disponibile';
        $status = $o['status'] === 'new' ? 'rejected' : 'cancelled';
        json_out(['ok' => true, 'order' => public_order(set_status((int) $o['id'], $status, ['reject_reason' => $reason]), true)]);
    }

    case 'status': {
        $o = get_order((int) ($in['id'] ?? 0));
        $to = (string) ($in['to'] ?? '');
        $allowed = ['accepted' => ['ready', 'out'], 'ready' => ['done', 'out'], 'out' => ['done'], 'done' => [], 'new' => []];
        if (!$o || !in_array($to, $allowed[$o['status']] ?? [], true)) fail('bad_transition', 409);
        $fields = [];
        if ($to === 'out') $fields['rider'] = str($in['rider'] ?? '', 40) ?: null;
        $o = set_status((int) $o['id'], $to, $fields);
        $sent = $to === 'out' ? tg_rider($o) : null;
        json_out(['ok' => true, 'order' => public_order($o, true), 'riderNotified' => $sent]);
    }

    case 'external': {
        // phone / Just Eat / Glovo / Deliveroo orders typed in by staff, so everything is on one board
        $source = in_array($in['source'] ?? '', ['phone', 'justeat', 'glovo', 'deliveroo', 'other'], true) ? $in['source'] : 'phone';
        [$lines, $sub] = price_lines(is_array($in['items'] ?? null) ? $in['items'] : []);
        $extraText = str($in['extra'] ?? '', 300);
        if (!$lines && $extraText === '') fail('no_items', 422);
        $mode = ($in['mode'] ?? '') === 'delivery' ? 'delivery' : 'pickup';
        $total = isset($in['total']) && is_numeric($in['total']) && (float) $in['total'] > 0 ? round((float) $in['total'], 2) : $sub;
        $time = str($in['time'] ?? '', 5);
        $now = time();
        $order = [
            'code' => new_code(), 'token' => bin2hex(random_bytes(16)), 'created_at' => $now, 'updated_at' => $now,
            'service_day' => service_day($now), 'status' => 'accepted', 'source' => $source, 'lang' => 'it', 'mode' => $mode,
            'slot' => preg_match('/^\d{2}:\d{2}$/', $time) ? $time : 'asap', 'ready_at' => preg_match('/^\d{2}:\d{2}$/', $time) ? $time : null,
            'name' => str($in['name'] ?? '', 60) ?: null, 'phone' => preg_replace('/[^\d+]/', '', str($in['phone'] ?? '', 25)) ?: null,
            'street' => str($in['street'] ?? '', 120) ?: null, 'civico' => str($in['civico'] ?? '', 12) ?: null,
            'cap' => str($in['cap'] ?? '', 5) ?: null, 'buzzer' => str($in['buzzer'] ?? '', 120) ?: null,
            'items' => json_encode($lines, JSON_UNESCAPED_UNICODE), 'subtotal' => $sub, 'discount' => 0, 'fee' => null,
            'total' => $total, 'payment' => ($in['payment'] ?? '') === 'cash' ? 'cash' : 'card',
            'notes' => trim(($extraText ? $extraText . ' · ' : '') . str($in['notes'] ?? '', 300), ' ·') ?: null,
        ];
        $cols = implode(', ', array_keys($order));
        $ph = implode(', ', array_map(fn($k) => ":$k", array_keys($order)));
        db()->prepare("INSERT INTO orders ($cols) VALUES ($ph)")->execute($order);
        json_out(['ok' => true, 'order' => public_order(get_order((int) db()->lastInsertId()), true)]);
    }

    case 'archive': {
        $day = str($in['day'] ?? '', 10);
        $days = db()->query('SELECT service_day AS day, COUNT(*) AS n, SUM(CASE WHEN status IN (\'done\',\'accepted\',\'ready\',\'out\') THEN total ELSE 0 END) AS total
            FROM orders GROUP BY service_day ORDER BY service_day DESC LIMIT 120')->fetchAll();
        $orders = [];
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) {
            $q = db()->prepare('SELECT * FROM orders WHERE service_day = ? ORDER BY created_at');
            $q->execute([$day]);
            $orders = array_map(fn($o) => public_order($o, true), $q->fetchAll());
        }
        json_out(['ok' => true, 'days' => $days, 'orders' => $orders]);
    }

    case 'flags': {
        if (array_key_exists('paused', $in)) set_flag('paused', $in['paused'] ? '1' : '');
        if (array_key_exists('maintenance', $in)) set_flag('maintenance', $in['maintenance'] ? '1' : '');
        if (array_key_exists('message', $in)) set_flag('message', str($in['message'], 200));
        if (array_key_exists('busy', $in)) set_flag('busy', (string) max(0, min(90, (int) $in['busy'])));
        json_out(['ok' => true, 'state' => site_state()]);
    }

    case 'test_telegram': {
        $chat = private_config()['telegram_shop_chat'];
        $r = $chat ? tg('sendMessage', ['chat_id' => $chat, 'text' => '✅ Prova: le notifiche degli ordini funzionano.']) : null;
        json_out(['ok' => (bool) ($r['ok'] ?? false)]);
    }
}
fail('bad_action');
