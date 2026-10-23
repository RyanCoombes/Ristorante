<?php
/* POST api/order.php — a customer places an order from the website.
   Prices, fees, discounts and opening hours are all recalculated here. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('method', 405);
if (!configured()) fail('not_configured', 503);
housekeeping();

$in = body();
if (!empty($in['website'])) fail('spam');            // honeypot field, invisible to people
rate_limit('order', 6, 600);

if (site_state()['maintenance']) fail('maintenance', 503);
$period = ordering_period();
if (!$period) fail(site_state()['paused'] ? 'paused' : 'closed', 409);

$cfg = site_config();
$lang = ($in['lang'] ?? 'it') === 'en' ? 'en' : 'it';
$mode = ($in['mode'] ?? '') === 'delivery' && !empty($cfg['delivery']['enabled']) ? 'delivery' : 'pickup';

// customer
$name = str($in['name'] ?? '', 60);
$phone = preg_replace('/[^\d+]/', '', str($in['phone'] ?? '', 25)) ?? '';
$email = str($in['email'] ?? '', 120);
$bad = [];
if (mb_strlen($name) < 2) $bad[] = 'name';
if (!preg_match('/^\+?\d{8,15}$/', $phone)) $bad[] = 'phone';
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $bad[] = 'email';

// items, priced from data/menu.js
[$lines, $sub] = price_lines(is_array($in['items'] ?? null) ? $in['items'] : [], is_array($in['itemNotes'] ?? null) ? $in['itemNotes'] : []);
if (!$lines) $bad[] = 'items';

// delivery address and zone
$street = $civico = $cap = $buzzer = null; $lat = $lng = $km = null; $fee = 0.0; $geo = null; $zone = null;
if ($mode === 'delivery') {
    $street = str($in['street'] ?? '', 120);
    $civico = str($in['civico'] ?? '', 12);
    $cap = str($in['cap'] ?? '', 5);
    $buzzer = str($in['buzzer'] ?? '', 120);
    if ($street === '') $bad[] = 'street';
    if ($civico === '' || !preg_match('/\d/', $civico)) $bad[] = 'civico';
    if (!preg_match('/^\d{5}$/', $cap)) $bad[] = 'cap';
    if (isset($in['lat'], $in['lng']) && is_numeric($in['lat']) && is_numeric($in['lng'])) {
        $lat = (float) $in['lat']; $lng = (float) $in['lng'];
        $shop = $cfg['shopLocation'] ?? ['lat' => 0, 'lng' => 0];
        $km = km_between((float) $shop['lat'], (float) $shop['lng'], $lat, $lng);
        foreach (zones() as $z) { if ($km <= $z['upToKm']) { $zone = $z; break; } }
        if (!$zone) fail('out_of_zone', 422, ['km' => $km]);
        $fee = (float) ($zone['fee'] ?? 0);
        $geo = 'ok';
    } else {
        $fee = null;                                    // address not found on the map: staff confirm the fee
        $geo = 'unverified';
        $zone = zones()[0] ?? null;
    }
}
if ($bad) fail('invalid', 422, ['fields' => $bad]);

// minimum order and promo
$promo = eval_promo(str($in['promo'] ?? '', 30), $sub);
$discount = $promo['discount'] ?? 0.0;
if ($promo && $promo['freeDelivery'] && $mode === 'delivery') $fee = 0.0;
if ($mode === 'delivery' && $zone && $sub < (float) ($zone['minOrder'] ?? 0)) fail('below_minimum', 422, ['minimum' => (float) $zone['minOrder']]);
$total = round($sub - $discount + ($fee ?? 0), 2);

// time slot: "asap" or HH:MM inside the current service
$slot = str($in['slot'] ?? 'asap', 5);
if ($slot !== 'asap' && !preg_match('/^\d{2}:\d{2}$/', $slot)) $slot = 'asap';

$payment = ($in['payment'] ?? '') === 'cash' ? 'cash' : 'card';
$cashWith = $payment === 'cash' && isset($in['cashWith']) && is_numeric($in['cashWith']) ? max(0, min(500, (int) $in['cashWith'])) : null;

$now = time();
$order = [
    'code' => new_code(), 'token' => bin2hex(random_bytes(16)), 'created_at' => $now, 'updated_at' => $now,
    'service_day' => service_day($now), 'status' => 'new', 'source' => 'web', 'lang' => $lang, 'mode' => $mode,
    'slot' => $slot, 'name' => $name, 'phone' => $phone, 'email' => $email ?: null,
    'street' => $street, 'civico' => $civico, 'cap' => $cap, 'buzzer' => $buzzer ?: null,
    'lat' => $lat, 'lng' => $lng, 'km' => $km, 'geo' => $geo,
    'items' => json_encode($lines, JSON_UNESCAPED_UNICODE), 'subtotal' => $sub, 'discount' => $discount,
    'promo' => $promo['code'] ?? null, 'fee' => $fee, 'total' => $total, 'payment' => $payment, 'cash_with' => $cashWith,
    'notes' => str($in['notes'] ?? '', 300) ?: null,
];
$cols = implode(', ', array_keys($order));
$ph = implode(', ', array_map(fn($k) => ":$k", array_keys($order)));
db()->prepare("INSERT INTO orders ($cols) VALUES ($ph)")->execute($order);
$o = get_order((int) db()->lastInsertId());

tg_new_order($o);
send_confirmation_email($o);

json_out(['ok' => true, 'code' => $o['code'], 'token' => $o['token'], 'total' => (float) $o['total']]);
