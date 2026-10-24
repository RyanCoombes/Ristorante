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
if (!preview_allowed()) fail('closed', 409);           // "Prossimamente": only people with the preview PIN
$period = ordering_period();
if (!$period) fail(site_state()['paused'] ? 'paused' : 'closed', 409);

$o = insert_order(build_order($in));

tg_new_order($o);
send_confirmation_email($o);

json_out(['ok' => true, 'code' => $o['code'], 'token' => $o['token'], 'total' => (float) $o['total']]);
