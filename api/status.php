<?php
/* GET  api/status.php?c=CODE&t=TOKEN  — the customer's live order status
   POST api/status.php {c, t, action: "cancel"} — cancel while not yet accepted */

declare(strict_types=1);
require __DIR__ . '/lib.php';

housekeeping();
$in = $_SERVER['REQUEST_METHOD'] === 'POST' ? body() : $_GET;
$code = strtoupper(str($in['c'] ?? '', 8));
$token = str($in['t'] ?? '', 64);
if ($code === '' || strlen($token) !== 32) fail('not_found', 404);

$q = db()->prepare('SELECT * FROM orders WHERE token = ? AND code = ?');
$q->execute([$token, $code]);
$o = $q->fetch();
if (!$o) fail('not_found', 404);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    rate_limit('cancel', 10, 600);
    if (($in['action'] ?? '') !== 'cancel') fail('bad_action');
    if ($o['status'] !== 'new') fail('too_late', 409);
    $o = set_status((int) $o['id'], 'cancelled', ['reject_reason' => 'Annullato dal cliente']);
}

$cfg = site_config();
json_out(['ok' => true, 'order' => public_order($o), 'canCancel' => $o['status'] === 'new',
    'shop' => ['phone' => $cfg['phone'] ?? '', 'whatsapp' => $cfg['whatsapp'] ?? '']]);
