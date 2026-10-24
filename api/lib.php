<?php
/* =====================================================================
   Vizi Capitali · order system — shared helpers
   Storage: SQLite in api/private/ (blocked from the web by .htaccess).
   Settings that must stay secret (PIN, Telegram) live in
   api/private/config.php, created by api/setup.php.
   ===================================================================== */

declare(strict_types=1);

const ROOT = __DIR__ . '/..';
const PRIVATE_DIR = __DIR__ . '/private';
const ORDER_STATUSES = ['new', 'accepted', 'ready', 'out', 'done', 'rejected', 'cancelled'];
const REJECT_REASONS = ['Forno pieno, troppi ordini', 'Fuori zona di consegna', 'Siamo chiusi', 'Un piatto è finito', 'Ordine non valido'];

date_default_timezone_set('Europe/Rome');

// ---------- responses ----------
function json_out(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(string $error, int $code = 400, array $extra = []): never {
    json_out(['ok' => false, 'error' => $error] + $extra, $code);
}
function body(int $max = 100000): array {
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > $max) fail('too_large', 413);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
function str(mixed $v, int $max = 200): string {
    $s = is_scalar($v) ? trim((string) $v) : '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}

// ---------- settings ----------
function private_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $file = PRIVATE_DIR . '/config.php';
        $cfg = is_file($file) ? (require $file) : [];
        $cfg += [
            'pin_hash' => '', 'telegram_token' => '', 'telegram_secret' => '',
            'telegram_shop_chat' => '', 'telegram_riders_chat' => '', 'riders' => [],
            'mail_from' => '', 'site_url' => '', 'retention_days' => 30,
        ];
    }
    return $cfg;
}
function configured(): bool { return private_config()['pin_hash'] !== ''; }

/** Reads data/config.js or data/menu.js ("window.X = {json};" with a leading comment). */
function site_data(string $file): array {
    static $cache = [];
    if (!isset($cache[$file])) {
        $s = (string) @file_get_contents(ROOT . '/data/' . $file);
        $s = preg_replace('#^\s*/\*.*?\*/#s', '', $s) ?? '';
        $s = preg_replace('#^\s*window\.[A-Z_]+\s*=\s*#', '', trim($s)) ?? '';
        $s = rtrim($s, "; \n\r\t");
        $cache[$file] = json_decode($s, true) ?: [];
    }
    return $cache[$file];
}
/** data/live.js: what the Gestione page saved. Not in git, so a redeploy never overwrites staff edits. */
const LIVE_FILE = ROOT . '/data/live.js';
function live_data(bool $fresh = false): ?array {
    static $live = false;
    if ($live === false || $fresh) {
        $live = null;
        $s = (string) @file_get_contents(LIVE_FILE);
        if (preg_match('#^window\.VC_LIVE = (\{.*\});$#m', $s, $m)) $live = json_decode($m[1], true) ?: null;
    }
    return $live;
}
function site_config(): array { return live_data()['config'] ?? site_data('config.js'); }
function site_menu(): array { return live_data()['menu'] ?? site_data('menu.js'); }
/** Version stamp of the live content, so two people saving at once can't overwrite each other. */
function live_version(): string { return is_file(LIVE_FILE) ? sha1_file(LIVE_FILE) : 'defaults'; }
function write_live(array $config, array $menu): void {
    $json = json_encode(['config' => $config, 'menu' => $menu], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $text = "/* Vizi Capitali · contenuti salvati dalla pagina Gestione il " . date('d/m/Y H:i') . ".\n" .
        "   Non modificare a mano: usa ordini.html → Gestione. */\n" .
        "window.VC_LIVE = {$json};\n" .
        "window.SITE_CONFIG = window.VC_LIVE.config; window.MENU = window.VC_LIVE.menu;\n";
    $tmp = LIVE_FILE . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $text) === false || !rename($tmp, LIVE_FILE)) { @unlink($tmp); fail('write_failed', 500); }
    live_data(true);
}
/** Promo codes are kept on the server only (api/private/promos.json), so customers can't read the list. */
function promo_codes(): array {
    $f = PRIVATE_DIR . '/promos.json';
    if (is_file($f)) return json_decode((string) file_get_contents($f), true) ?: [];
    return site_data('config.js')['promoCodes'] ?? [];
}
function find_promo(string $code): ?array {
    foreach (promo_codes() as $p) {
        if (strtoupper((string) ($p['code'] ?? '')) !== strtoupper($code)) continue;
        if (!empty($p['validUntil']) && date('Y-m-d') > $p['validUntil']) return null;
        return $p;
    }
    return null;
}
function menu_items(): array {
    $items = [];
    foreach (site_menu() as $cat) {
        foreach ($cat['items'] ?? [] as $it) $items[$it['id']] = $it;
    }
    return $items;
}

// ---------- database ----------
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    if (!is_dir(PRIVATE_DIR)) mkdir(PRIVATE_DIR, 0750, true);
    $pdo = new PDO('sqlite:' . PRIVATE_DIR . '/orders.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 4000;');
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL, token TEXT NOT NULL,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, service_day TEXT NOT NULL,
        status TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'web', lang TEXT DEFAULT 'it',
        mode TEXT NOT NULL, slot TEXT, ready_at TEXT,
        name TEXT, phone TEXT, email TEXT,
        street TEXT, civico TEXT, cap TEXT, buzzer TEXT, lat REAL, lng REAL, km REAL, geo TEXT,
        items TEXT NOT NULL, subtotal REAL NOT NULL, discount REAL DEFAULT 0, promo TEXT,
        fee REAL, total REAL NOT NULL, payment TEXT, cash_with INTEGER, notes TEXT,
        reject_reason TEXT, rider TEXT, alerted INTEGER DEFAULT 0, purged INTEGER DEFAULT 0,
        tg_message_id INTEGER
    )");
    $pdo->exec('CREATE INDEX IF NOT EXISTS orders_day ON orders(service_day)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS hits (kind TEXT, ip TEXT, ts INTEGER)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)');
    return $pdo;
}

/** The "service day": a late shift after midnight still belongs to the evening it started. */
function service_day(?int $ts = null): string {
    return date('Y-m-d', ($ts ?? time()) - 5 * 3600);
}
function client_ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? '0', 0, 64); }

/** Allows at most $max hits of $kind per IP in $window seconds. */
function rate_limit(string $kind, int $max, int $window): void {
    $db = db();
    $now = time();
    $db->prepare('DELETE FROM hits WHERE ts < ?')->execute([$now - 86400]);
    $q = $db->prepare('SELECT COUNT(*) FROM hits WHERE kind = ? AND ip = ? AND ts > ?');
    $q->execute([$kind, client_ip(), $now - $window]);
    if ((int) $q->fetchColumn() >= $max) fail('rate_limited', 429);
    $db->prepare('INSERT INTO hits VALUES (?, ?, ?)')->execute([$kind, client_ip(), $now]);
}

// ---------- switches set from the Ordini board ----------
function flag(string $k): string {
    $q = db()->prepare('SELECT v FROM meta WHERE k = ?');
    $q->execute(['flag_' . $k]);
    return (string) ($q->fetchColumn() ?: '');
}
function set_flag(string $k, string $v): void {
    db()->prepare('INSERT OR REPLACE INTO meta VALUES (?, ?)')->execute(['flag_' . $k, $v]);
}
/** maintenance: the public site shows "back soon"; paused: no new online orders. */
function site_state(): array {
    return ['maintenance' => flag('maintenance') === '1', 'paused' => flag('paused') === '1', 'message' => flag('message'),
        'busy' => busy_minutes()];
}
/** Extra waiting time set on the board when the kitchen is busy (0, 15, 30…). */
function busy_minutes(): int {
    $f = flag('busy');
    return $f === '' ? (int) (site_config()['ordering']['busyExtraMinutes'] ?? 0) : (int) $f;
}

// ---------- opening hours (mirrors assets/js/app.js) ----------
function to_min(string $hhmm): int { [$h, $m] = array_map('intval', explode(':', $hhmm)); return $h * 60 + $m; }
function fmt_time(int $min): string { $m = (($min % 1440) + 1440) % 1440; return sprintf('%02d:%02d', intdiv($m, 60), $m % 60); }
function periods_for(int $day): array {
    $out = [];
    foreach (site_config()['hours'][(string) $day] ?? [] as $s) {
        $o = to_min($s[0]); $c = to_min($s[1]);
        if ($c <= $o) $c += 1440;
        $out[] = ['open' => $o, 'close' => $c];
    }
    return $out;
}
/** Returns the open period when orders are being accepted right now, or null. */
function ordering_period(): ?array {
    $cfg = site_config();
    $ord = $cfg['ordering'] ?? [];
    if (($ord['open'] ?? true) === false) return null;
    $st = site_state();
    if ($st['paused'] || $st['maintenance']) return null;
    $day = (int) date('w'); $now = (int) date('G') * 60 + (int) date('i');
    $early = (int) ($ord['startBeforeOpenMin'] ?? 0); $stop = (int) ($ord['stopBeforeCloseMin'] ?? 0);
    $periods = array_merge(
        array_map(fn($p) => ['open' => $p['open'] - 1440, 'close' => $p['close'] - 1440], periods_for(($day + 6) % 7)),
        periods_for($day)
    );
    foreach ($periods as $p) {
        if ($now >= $p['open'] - $early && $now < $p['close'] - $stop) return $p + ['now' => $now];
    }
    return null;
}

// ---------- pricing (never trust the browser's totals) ----------
function km_between(float $lat1, float $lng1, float $lat2, float $lng2): float {
    $r = 6371; $rad = M_PI / 180;
    $dLat = ($lat2 - $lat1) * $rad; $dLng = ($lng2 - $lng1) * $rad;
    $h = sin($dLat / 2) ** 2 + cos($lat1 * $rad) * cos($lat2 * $rad) * sin($dLng / 2) ** 2;
    return round(2 * $r * asin(sqrt($h)), 1);
}
function zones(): array {
    $z = site_config()['delivery']['zones'] ?? [];
    usort($z, fn($a, $b) => $a['upToKm'] <=> $b['upToKm']);
    return $z;
}
function eval_promo(string $code, float $sub): ?array {
    if ($code === '' || !($p = find_promo($code))) return null;
    if (!empty($p['minOrder']) && $sub < $p['minOrder']) return null;
    $disc = match ($p['type']) {
        'percent' => round($sub * $p['value'] / 100, 2),
        'fixed' => min((float) $p['value'], $sub),
        default => 0.0,
    };
    return ['code' => $p['code'], 'discount' => $disc, 'freeDelivery' => $p['type'] === 'freeDelivery'];
}
/** Builds the priced order lines from {id: qty}; drops unknown or sold-out items. */
function price_lines(array $wanted, array $notes = []): array {
    $menu = menu_items();
    $lines = []; $sub = 0.0;
    foreach ($wanted as $id => $qty) {
        $id = (string) $id; $qty = (int) $qty;
        if ($qty < 1 || $qty > 30 || !isset($menu[$id]) || ($menu[$id]['available'] ?? true) === false) continue;
        $price = (float) $menu[$id]['price'];
        $lines[] = ['id' => $id, 'name' => $menu[$id]['name'], 'qty' => $qty, 'price' => $price, 'total' => round($price * $qty, 2),
            'note' => str($notes[$id] ?? '', 120)];
        $sub += $price * $qty;
    }
    return [$lines, round($sub, 2)];
}

// ---------- staff login ----------
function staff_session(): bool {
    $t = $_COOKIE['vc_staff'] ?? '';
    if (!is_string($t) || strlen($t) !== 64) return false;
    $q = db()->prepare('SELECT 1 FROM sessions WHERE token = ? AND expires > ?');
    $q->execute([hash('sha256', $t), time()]);
    return (bool) $q->fetchColumn();
}
function require_staff(): void { if (!staff_session()) fail('not_logged_in', 401); }
function start_session(): void {
    $t = bin2hex(random_bytes(32));
    $exp = time() + 14 * 86400;
    db()->prepare('INSERT INTO sessions VALUES (?, ?)')->execute([hash('sha256', $t), $exp]);
    db()->prepare('DELETE FROM sessions WHERE expires < ?')->execute([time()]);
    setcookie('vc_staff', $t, ['expires' => $exp, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')]);
}

// ---------- orders ----------
function money(float $n): string { return number_format($n, 2, ',', '.') . ' €'; }
function new_code(): string {
    $chars = 'ACDEFHJKMNPRTUVWXY3479';
    $c = ''; for ($i = 0; $i < 4; $i++) $c .= $chars[random_int(0, strlen($chars) - 1)];
    return $c;
}
function get_order(int $id): ?array {
    $q = db()->prepare('SELECT * FROM orders WHERE id = ?');
    $q->execute([$id]);
    $o = $q->fetch();
    return $o ?: null;
}
function public_order(array $o, bool $staff = false): array {
    $out = [
        'id' => (int) $o['id'], 'code' => $o['code'], 'status' => $o['status'], 'source' => $o['source'],
        'mode' => $o['mode'], 'slot' => $o['slot'], 'readyAt' => $o['ready_at'],
        'createdAt' => (int) $o['created_at'], 'items' => json_decode($o['items'], true) ?: [],
        'subtotal' => (float) $o['subtotal'], 'discount' => (float) $o['discount'], 'promo' => $o['promo'],
        'fee' => $o['fee'] === null ? null : (float) $o['fee'], 'total' => (float) $o['total'],
        'payment' => $o['payment'], 'cashWith' => $o['cash_with'] === null ? null : (int) $o['cash_with'],
        'rejectReason' => $o['reject_reason'], 'notes' => $o['notes'],
    ];
    if ($staff) {
        $out += ['name' => $o['name'], 'phone' => $o['phone'], 'email' => $o['email'], 'street' => $o['street'],
            'civico' => $o['civico'], 'cap' => $o['cap'], 'buzzer' => $o['buzzer'], 'lat' => $o['lat'], 'lng' => $o['lng'],
            'km' => $o['km'], 'geo' => $o['geo'], 'rider' => $o['rider'], 'purged' => (bool) $o['purged'],
            'serviceDay' => $o['service_day'], 'suggestedTime' => suggested_time($o)];
    }
    return $out;
}
/** When the order can realistically be ready: the customer's slot, or now + prep (+ delivery time). */
function suggested_time(array $o): string {
    if ($o['slot'] && $o['slot'] !== 'asap') return $o['slot'];
    $ord = site_config()['ordering'] ?? [];
    $mins = (int) ($ord['prepMinutes'] ?? 20) + busy_minutes();
    if ($o['mode'] === 'delivery') {
        $extra = (int) (zones()[0]['extraMinutes'] ?? 0);
        if ($o['km'] !== null) foreach (zones() as $z) { if ($o['km'] <= $z['upToKm']) { $extra = (int) ($z['extraMinutes'] ?? 0); break; } }
        $mins += $extra;
    }
    $now = (int) date('G') * 60 + (int) date('i');
    $step = max(5, (int) ($ord['slotMinutes'] ?? 15));
    return fmt_time((int) (ceil(($now + $mins) / $step) * $step));
}
function add_minutes(string $hhmm, int $mins): string { return fmt_time(to_min($hhmm) + $mins); }

function set_status(int $id, string $status, array $fields = []): array {
    $fields['status'] = $status;
    $fields['updated_at'] = time();
    $sets = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($fields)));
    $q = db()->prepare("UPDATE orders SET $sets WHERE id = :id");
    $q->execute($fields + ['id' => $id]);
    $o = get_order($id);
    tg_refresh_order($o);
    return $o;
}

// ---------- order text (Telegram, print, email) ----------
function order_text(array $o, bool $withContacts = true): string {
    $mode = $o['mode'] === 'delivery' ? 'CONSEGNA' : 'RITIRO';
    $src = $o['source'] === 'web' ? '' : ' · ' . strtoupper($o['source']);
    $when = $o['ready_at'] ? 'pronto ' . $o['ready_at'] : ($o['slot'] === 'asap' || !$o['slot'] ? 'prima possibile' : 'per le ' . $o['slot']);
    $t = "#{$o['code']} · {$mode}{$src} · {$when}\n";
    foreach (json_decode($o['items'], true) ?: [] as $l) {
        $t .= "{$l['qty']}× {$l['name']}" . ($l['note'] ? " ({$l['note']})" : '') . "\n";
    }
    if ($o['notes']) $t .= "Note: {$o['notes']}\n";
    $t .= 'Totale: ' . money((float) $o['total']) . ($o['fee'] === null && $o['mode'] === 'delivery' ? ' + consegna' : '');
    $t .= ' · ' . ($o['payment'] === 'cash' ? 'Contanti' . ($o['cash_with'] ? ' (paga con ' . $o['cash_with'] . ' €)' : '') : 'Carta') . "\n";
    if ($withContacts && !$o['purged']) {
        $t .= "{$o['name']} · {$o['phone']}\n";
        if ($o['mode'] === 'delivery') {
            $t .= trim("{$o['street']} {$o['civico']}, {$o['cap']}") . ($o['buzzer'] ? " · {$o['buzzer']}" : '') . "\n";
            if ($o['km'] !== null) $t .= "{$o['km']} km\n";
        }
    }
    return trim($t);
}
function maps_link(array $o): string {
    if ($o['lat'] !== null) return 'https://www.google.com/maps/dir/?api=1&destination=' . $o['lat'] . ',' . $o['lng'];
    $area = site_config()['address']['searchArea'] ?? '';
    return 'https://www.google.com/maps/dir/?api=1&destination=' . rawurlencode(trim("{$o['street']} {$o['civico']}, {$o['cap']} {$area}"));
}

// ---------- Telegram (free alerts) ----------
function tg(string $method, array $params): ?array {
    $token = private_config()['telegram_token'];
    if ($token === '' || !function_exists('curl_init')) return null;
    $ch = curl_init("https://api.telegram.org/bot{$token}/{$method}");
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => json_encode($params)]);
    $res = curl_exec($ch);
    curl_close($ch);
    $data = is_string($res) ? json_decode($res, true) : null;
    return is_array($data) ? $data : null;
}
function tg_keyboard(array $o): array {
    $id = $o['id'];
    return match ($o['status']) {
        'new' => ['inline_keyboard' => [
            [['text' => '✅ Accetta', 'callback_data' => "acc:$id:0"], ['text' => '+15′', 'callback_data' => "acc:$id:15"], ['text' => '+30′', 'callback_data' => "acc:$id:30"]],
            [['text' => '❌ Rifiuta', 'callback_data' => "rej:$id"]],
        ]],
        default => ['inline_keyboard' => []],
    };
}
function status_label(string $s): string {
    return ['new' => '🔔 NUOVO', 'accepted' => '👨‍🍳 Accettato', 'ready' => '✅ Pronto', 'out' => '🛵 In consegna',
        'done' => '✔️ Completato', 'rejected' => '⛔ Rifiutato', 'cancelled' => '↩️ Annullato'][$s] ?? $s;
}
function tg_order_message(array $o): string {
    return status_label($o['status']) . ($o['reject_reason'] ? " ({$o['reject_reason']})" : '') . "\n" . order_text($o);
}
function tg_new_order(array $o): void {
    $chat = private_config()['telegram_shop_chat'];
    if ($chat === '') return;
    $res = tg('sendMessage', ['chat_id' => $chat, 'text' => tg_order_message($o), 'reply_markup' => tg_keyboard($o)]);
    if ($res && !empty($res['result']['message_id'])) {
        db()->prepare('UPDATE orders SET tg_message_id = ? WHERE id = ?')->execute([$res['result']['message_id'], $o['id']]);
    }
}
function tg_refresh_order(?array $o): void {
    $chat = private_config()['telegram_shop_chat'];
    if (!$o || $chat === '' || !$o['tg_message_id']) return;
    tg('editMessageText', ['chat_id' => $chat, 'message_id' => (int) $o['tg_message_id'],
        'text' => tg_order_message($o), 'reply_markup' => tg_keyboard($o)]);
}
function tg_rider(array $o): bool {
    $chat = private_config()['telegram_riders_chat'];
    if ($chat === '') return false;
    $text = '🛵 ' . ($o['rider'] ? $o['rider'] . ' · ' : '') . "CONSEGNA #{$o['code']}\n" . order_text($o);
    $res = tg('sendMessage', ['chat_id' => $chat, 'text' => $text, 'reply_markup' => ['inline_keyboard' => [
        [['text' => '🧭 Naviga', 'url' => maps_link($o)], ['text' => '💬 WhatsApp cliente', 'url' => 'https://wa.me/' . preg_replace('/\D/', '', (string) $o['phone'])]],
        [['text' => '✔️ Consegnato', 'callback_data' => "del:{$o['id']}"]],
    ]]]);
    return (bool) ($res['ok'] ?? false);
}

// ---------- email confirmation (free, uses the hosting's mail) ----------
function send_confirmation_email(array $o): void {
    $from = private_config()['mail_from'];
    if (!$o['email'] || $from === '' || !filter_var($o['email'], FILTER_VALIDATE_EMAIL)) return;
    $it = $o['lang'] !== 'en';
    $subject = ($it ? 'Ordine ricevuto' : 'Order received') . " #{$o['code']} · Vizi Capitali";
    $url = rtrim(private_config()['site_url'], '/') . "/ordine.html?c={$o['code']}&t={$o['token']}";
    $body = ($it ? "Grazie! Abbiamo ricevuto il tuo ordine. Ti confermiamo l'orario a breve.\n\n" : "Thanks! We've received your order and will confirm the time shortly.\n\n")
        . order_text($o, false) . "\n\n" . ($it ? 'Segui il tuo ordine: ' : 'Track your order: ') . $url . "\n";
    @mail($o['email'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $body,
        "From: Vizi Capitali <{$from}>\r\nContent-Type: text/plain; charset=UTF-8");
}

// ---------- housekeeping: runs at most once a minute on any request ----------
function housekeeping(): void {
    $db = db();
    $last = (int) ($db->query("SELECT v FROM meta WHERE k = 'hk'")->fetchColumn() ?: 0);
    if (time() - $last < 60) return;
    $db->prepare("INSERT OR REPLACE INTO meta VALUES ('hk', ?)")->execute([time()]);

    // 1) remove customer details after the retention period (GDPR); keep anonymous figures
    $days = max(1, (int) private_config()['retention_days']);
    $db->prepare("UPDATE orders SET name = NULL, phone = NULL, email = NULL, street = NULL, civico = NULL, buzzer = NULL,
        lat = NULL, lng = NULL, notes = NULL, token = '', purged = 1 WHERE purged = 0 AND created_at < ?")
        ->execute([time() - $days * 86400]);

    // 2) second alert for orders nobody has accepted
    $after = (int) (site_config()['ordering']['alertAfterMin'] ?? 5);
    $q = $db->prepare("SELECT * FROM orders WHERE status = 'new' AND alerted = 0 AND created_at < ?");
    $q->execute([time() - $after * 60]);
    foreach ($q->fetchAll() as $o) {
        $chat = private_config()['telegram_shop_chat'];
        if ($chat !== '') tg('sendMessage', ['chat_id' => $chat, 'text' => "⏰ Ordine #{$o['code']} in attesa da {$after} minuti. Il cliente aspetta!"]);
        $db->prepare('UPDATE orders SET alerted = 1 WHERE id = ?')->execute([$o['id']]);
    }
}
