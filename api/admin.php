<?php
/* POST api/admin.php {action, ...} — the "Gestione" page (admin.html).
   Saves the menu and settings straight to the server (data/live.js),
   keeps the last versions so a mistake can be undone, stores photos
   and promo codes. Needs the same staff login as the Ordini board. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

const HISTORY_DIR = PRIVATE_DIR . '/history';
const HISTORY_KEEP = 15;
const UPLOAD_DIR = ROOT . '/assets/img/uploads';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('method', 405);
if (!configured()) fail('not_configured', 503);
$in = body(4000000);
require_staff();

function history(): array {
    $out = [];
    foreach (glob(HISTORY_DIR . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
        $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true) ?: [];
        $out[] = ['id' => basename($dir), 'at' => (int) ($meta['at'] ?? filemtime($dir)), 'label' => (string) ($meta['label'] ?? '')];
    }
    usort($out, fn($a, $b) => $b['at'] <=> $a['at'] ?: strcmp($b['id'], $a['id']));
    return $out;
}
/** Copies what is live now into the history folder before it changes. */
function snapshot(string $label): void {
    if (!is_dir(HISTORY_DIR)) mkdir(HISTORY_DIR, 0700, true);
    $dir = HISTORY_DIR . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(2));
    mkdir($dir, 0700);
    if (is_file(LIVE_FILE)) copy(LIVE_FILE, $dir . '/live.js');
    if (is_file(PRIVATE_DIR . '/promos.json')) copy(PRIVATE_DIR . '/promos.json', $dir . '/promos.json');
    file_put_contents($dir . '/meta.json', json_encode(['at' => time(), 'label' => $label]));
    foreach (array_slice(history(), HISTORY_KEEP) as $old) {
        array_map('unlink', glob(HISTORY_DIR . '/' . $old['id'] . '/*') ?: []);
        @rmdir(HISTORY_DIR . '/' . $old['id']);
    }
}
function current_state(): array {
    $config = site_config();
    unset($config['promoCodes'], $config['admin']);
    return ['ok' => true, 'version' => live_version(), 'config' => $config, 'menu' => site_menu(),
        'promos' => promo_codes(), 'history' => history()];
}

function clean_config(mixed $c): array {
    if (!is_array($c) || array_is_list($c)) fail('bad_config', 422);
    unset($c['promoCodes'], $c['admin']);
    if (isset($c['delivery']['zones']) && !is_array($c['delivery']['zones'])) fail('bad_config', 422);
    return $c;
}
function clean_menu(mixed $m): array {
    if (!is_array($m) || !array_is_list($m)) fail('bad_menu', 422);
    $ids = [];
    foreach ($m as $cat) {
        if (!is_array($cat) || !isset($cat['id']) || !is_array($cat['items'] ?? null)) fail('bad_menu', 422);
        foreach ($cat['items'] as $it) {
            $id = (string) ($it['id'] ?? '');
            if ($id === '' || isset($ids[$id])) fail('bad_menu', 422, ['item' => $it['name'] ?? $id]);
            $ids[$id] = 1;
            if (!is_numeric($it['price'] ?? null) || $it['price'] < 0) fail('bad_price', 422, ['item' => $it['name'] ?? $id]);
        }
    }
    return $m;
}
function clean_promos(mixed $p): array {
    if (!is_array($p) || !array_is_list($p)) fail('bad_promos', 422);
    $out = [];
    foreach ($p as $x) {
        $code = strtoupper(preg_replace('/\s+/', '', str($x['code'] ?? '', 30)) ?? '');
        if ($code === '') continue;
        $type = in_array($x['type'] ?? '', ['percent', 'fixed', 'freeDelivery'], true) ? $x['type'] : 'percent';
        $out[] = ['code' => $code, 'type' => $type, 'value' => (float) ($x['value'] ?? 0),
            'minOrder' => (float) ($x['minOrder'] ?? 0), 'validUntil' => str($x['validUntil'] ?? '', 10)];
    }
    return $out;
}
function write_private(string $file, string $text): void {
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $text) === false || !rename($tmp, $file)) { @unlink($tmp); fail('write_failed', 500); }
}

switch ((string) ($in['action'] ?? '')) {
    case 'load':
        json_out(current_state());

    case 'save': {
        // someone else saved since this page was loaded: don't overwrite their work
        if ((string) ($in['version'] ?? '') !== live_version()) fail('conflict', 409);
        $config = clean_config($in['config'] ?? null);
        $menu = clean_menu($in['menu'] ?? null);
        $promos = clean_promos($in['promos'] ?? []);
        snapshot('Salvataggio');
        write_private(PRIVATE_DIR . '/promos.json', json_encode($promos, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        write_live($config, $menu);
        json_out(current_state());
    }

    case 'restore': {
        $id = (string) ($in['id'] ?? '');
        if (!preg_match('/^\d{8}-\d{6}-[0-9a-f]{4}$/', $id) || !is_dir(HISTORY_DIR . '/' . $id)) fail('not_found', 404);
        $src = HISTORY_DIR . '/' . $id;
        snapshot('Prima del ripristino');
        if (is_file($src . '/live.js')) copy($src . '/live.js', LIVE_FILE); else @unlink(LIVE_FILE);
        if (is_file($src . '/promos.json')) copy($src . '/promos.json', PRIVATE_DIR . '/promos.json');
        live_data(true);
        json_out(current_state());
    }

    case 'upload': {
        // the browser has already resized the photo; this only checks it really is an image and stores it
        if (!preg_match('#^data:image/(webp|jpeg|png);base64,(.+)$#s', (string) ($in['data'] ?? ''), $m)) fail('bad_image', 422);
        $bytes = base64_decode($m[2], true);
        if ($bytes === false || strlen($bytes) > 2500000) fail('bad_image', 422);
        $info = @getimagesizefromstring($bytes);
        $ext = ['image/webp' => 'webp', 'image/jpeg' => 'jpg', 'image/png' => 'png'][$info['mime'] ?? ''] ?? null;
        if (!$ext) fail('bad_image', 422);
        if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
        $name = date('Ymd') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
        if (file_put_contents(UPLOAD_DIR . '/' . $name, $bytes) === false) fail('write_failed', 500);
        json_out(['ok' => true, 'url' => 'assets/img/uploads/' . $name]);
    }

    case 'change_pin': {
        rate_limit('pin_change', 5, 900);
        $cfg = private_config();
        if (!password_verify(str($in['current'] ?? '', 12), $cfg['pin_hash'])) fail('wrong_pin', 403);
        $pin = str($in['pin'] ?? '', 12);
        if (!preg_match('/^\d{6}$/', $pin)) fail('bad_pin', 422);
        $cfg['pin_hash'] = password_hash($pin, PASSWORD_DEFAULT);
        write_private(PRIVATE_DIR . '/config.php', "<?php\n// Created by api/setup.php. Delete this file to run setup again.\nreturn " . var_export($cfg, true) . ";\n");
        @chmod(PRIVATE_DIR . '/config.php', 0640);
        // everyone else has to log in again with the new PIN
        db()->exec('DELETE FROM sessions');
        start_session();
        json_out(['ok' => true]);
    }
}
fail('bad_action');
