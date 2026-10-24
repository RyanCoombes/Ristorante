<?php
/* GET api/promo.php?code=X — checks one promo code for the basket.
   Only the code asked for is returned; the list itself stays private. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

if (!configured()) fail('not_configured', 503);
rate_limit('promo', 20, 600);
$code = strtoupper(str($_GET['code'] ?? '', 30));
$p = $code === '' ? null : find_promo($code);
if (!$p) fail('invalid', 404);
json_out(['ok' => true, 'promo' => [
    'code' => (string) $p['code'], 'type' => (string) $p['type'], 'value' => (float) ($p['value'] ?? 0),
    'minOrder' => (float) ($p['minOrder'] ?? 0), 'validUntil' => (string) ($p['validUntil'] ?? ''),
]]);
