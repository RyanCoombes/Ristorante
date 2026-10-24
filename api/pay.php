<?php
/* api/pay.php — "Paga ora online" with SumUp (see api/sumup.php).
     POST {action:"create", ...checkout form}  checks and prices the order, returns the SumUp page to pay on
     POST {action:"status", ref, k}            the customer is back: paid, failed or still pending?
     POST ?webhook=1                           SumUp says a status changed (re-checked with SumUp, never trusted)
     GET  ?sim=REF&k=…                         test mode only: a pretend SumUp page for logged-in staff */

declare(strict_types=1);
require __DIR__ . '/sumup.php';

if (!configured()) fail('not_configured', 503);

// ---------- SumUp's status notification ----------
if (isset($_GET['webhook'])) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('method', 405);
    rate_limit('pay_webhook', 120, 600);
    $in = body(20000);
    $p = is_string($in['id'] ?? null) ? get_payment('checkout_id', $in['id']) : null;
    if ($p) pay_refresh($p);
    json_out(['ok' => true]);   // always 2xx, or SumUp keeps retrying
}

// ---------- test mode: pretend SumUp page ----------
if (isset($_GET['sim'])) {
    $p = payment_by_ref_token(str($_GET['sim'], 20), str($_GET['k'] ?? '', 40));
    if (!$p || !$p['sim'] || !staff_session() || pay_settings()['mode'] !== 'test') fail('not_found', 404);
    $lang = ($_GET['lang'] ?? '') === 'en' ? 'en' : 'it';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($p['status'] === 'pending') {
            $paid = ($_POST['outcome'] ?? '') === 'paid';
            pay_set_status($p, $paid ? 'paid' : 'failed', $paid ? 'PROVA-' . strtoupper(bin2hex(random_bytes(3))) : '');
        }
        header('Location: ' . pay_return_url($p, $lang), true, 303);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    $amount = htmlspecialchars(money((float) $p['amount']));
    $summary = htmlspecialchars((string) $p['summary']);
    $ref = htmlspecialchars($p['ref']);
    echo <<<HTML
<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Pagamento di prova</title>
<style>
  body{margin:0;font:16px/1.5 system-ui,sans-serif;background:#f3f1ec;color:#1c1c1c;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
  main{box-sizing:border-box;background:#fff;border-radius:20px;padding:28px 24px;max-width:420px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.08)}
  .tag{display:inline-block;background:#fff3cd;color:#664d03;border-radius:99px;padding:2px 12px;font-size:13px;font-weight:600}
  h1{font-size:22px;margin:14px 0 4px}.amount{font-size:34px;font-weight:800;margin:8px 0}
  p{margin:6px 0;color:#444}
  button{display:block;width:100%;border:0;border-radius:99px;padding:14px;font:600 16px system-ui,sans-serif;margin-top:12px;cursor:pointer}
  .pay{background:#1c1c1c;color:#fff}.no{background:#eee;color:#1c1c1c}
</style></head><body><main>
  <span class="tag">Modalità prova · nessun addebito</span>
  <h1>Qui ci sarà la pagina di SumUp</h1>
  <p>Ordine {$ref}</p>
  <p class="amount">{$amount}</p>
  <p>{$summary}</p>
  <form method="post">
    <button class="pay" name="outcome" value="paid">Simula pagamento riuscito</button>
    <button class="no" name="outcome" value="failed">Simula pagamento non riuscito</button>
  </form>
</main></body></html>
HTML;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('method', 405);
housekeeping();
$in = body();

switch ((string) ($in['action'] ?? '')) {
    case 'create': {
        if (!pay_offered()) fail('pay_off', 409);
        if (!empty($in['website'])) fail('spam');
        rate_limit('pay', 6, 600);
        if (site_state()['maintenance']) fail('maintenance', 503);
        if (!ordering_period()) fail(site_state()['paused'] ? 'paused' : 'closed', 409);

        $row = build_order($in, true);
        // the delivery fee must be known before taking money
        if ($row['mode'] === 'delivery' && $row['fee'] === null) fail('fee_unknown', 422);
        if ($row['total'] <= 0) fail('invalid', 422, ['fields' => ['items']]);

        do { $ref = date('ymd') . '-' . new_code(); } while (get_payment('ref', $ref));
        $now = time();
        $summary = implode(', ', array_map(fn($l) => "{$l['qty']}× {$l['name']}", json_decode($row['items'], true)));
        pay_db()->prepare('INSERT INTO payments (ref, token, created_at, updated_at, status, amount, channel, sim, name, phone, summary, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([
            $ref, bin2hex(random_bytes(16)), $now, $now, 'pending', $row['total'],
            (site_config()['ordering']['channel'] ?? '') === 'website' ? 'website' : 'whatsapp',
            pay_settings()['mode'] === 'test' ? 1 : 0, $row['name'], $row['phone'], mb_substr($summary, 0, 300),
            json_encode($row, JSON_UNESCAPED_UNICODE),
        ]);
        $p = get_payment('ref', $ref);
        $url = pay_start($p, $row['lang']);
        json_out(['ok' => true, 'url' => $url, 'ref' => $ref, 'k' => $p['token'], 'amount' => (float) $p['amount']]);
    }

    case 'status': {
        rate_limit('pay_status', 60, 600);
        $p = payment_by_ref_token(str($in['ref'] ?? '', 20), str($in['k'] ?? '', 40));
        if (!$p) fail('not_found', 404);
        $p = pay_refresh($p);
        $out = ['ok' => true, 'status' => $p['status'], 'ref' => $p['ref'], 'amount' => (float) $p['amount'], 'txn' => $p['txn_code']];
        if ($p['status'] === 'paid' && $p['order_id'] && ($o = get_order((int) $p['order_id']))) {
            $out += ['code' => $o['code'], 'token' => $o['token']];
        }
        json_out($out);
    }
}
fail('bad_action');
