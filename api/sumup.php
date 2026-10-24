<?php
/* =====================================================================
   SumUp online payments — shared helpers for api/pay.php and Gestione.
   Ready but switched off: nothing happens until the SumUp keys are
   entered in Gestione → Pagamenti and the mode is set to "Attivi".

   Modes (api/private/payments.json, never published):
     off   no online payment on the site
     test  simulated SumUp page, offered only to browsers logged in to
           Gestione, so the whole flow can be tried on the real site
     live  real payments through SumUp's hosted checkout page

   SumUp API used (check against developer.sumup.com before going live):
     POST /v0.1/checkouts           create a checkout, hosted_checkout enabled
     GET  /v0.1/checkouts/{id}      the true status: PENDING, PAID, FAILED, EXPIRED
     GET  /v0.1/me                  "Verifica collegamento" in Gestione
   SumUp calls return_url (CHECKOUT_STATUS_CHANGED) when a status changes;
   that call is never trusted, the status is always re-read with GET.
   ===================================================================== */

declare(strict_types=1);
require_once __DIR__ . '/lib.php';

const PAY_FILE = PRIVATE_DIR . '/payments.json';
const SUMUP_API = 'https://api.sumup.com';
const PAY_MODES = ['off', 'test', 'live'];

function pay_settings(): array {
    $s = is_file(PAY_FILE) ? (json_decode((string) file_get_contents(PAY_FILE), true) ?: []) : [];
    $s += ['mode' => 'off', 'merchant_code' => '', 'api_key' => ''];
    if (!in_array($s['mode'], PAY_MODES, true)) $s['mode'] = 'off';
    return $s;
}
function pay_save_settings(array $s): void {
    if (!is_dir(PRIVATE_DIR)) mkdir(PRIVATE_DIR, 0750, true);
    $tmp = PAY_FILE . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, json_encode($s, JSON_PRETTY_PRINT)) === false || !rename($tmp, PAY_FILE)) {
        @unlink($tmp);
        fail('write_failed', 500);
    }
    @chmod(PAY_FILE, 0640);
}
/** Can this visitor be offered "pay online now"? */
function pay_offered(): bool {
    $s = pay_settings();
    if ($s['mode'] === 'live') return $s['api_key'] !== '' && $s['merchant_code'] !== '';
    if ($s['mode'] === 'test') return staff_session();
    return false;
}

/** The site's public address, for the links SumUp sends the customer back to. */
function site_base(): string {
    $u = rtrim(private_config()['site_url'], '/');
    if ($u !== '') return $u;
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $dir = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/pay.php'))), '/');
    return ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $dir;
}

/** One call to the SumUp API. Returns [http status, decoded body]; status 0 = no connection. */
function sumup(string $method, string $path, ?array $body = null, ?string $key = null): array {
    $key ??= pay_settings()['api_key'];
    if ($key === '' || !function_exists('curl_init')) return [0, null];
    $ch = curl_init(SUMUP_API . $path);
    $opts = [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $key, 'Content-Type: application/json', 'Accept: application/json']];
    if ($body !== null) $opts[CURLOPT_POSTFIELDS] = json_encode($body);
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return [$code, is_string($res) ? json_decode($res, true) : null];
}

// ---------- the payments table ----------
function pay_db(): PDO { return db(); }   // the payments table is created with the others in lib.php
function get_payment(string $col, string $value): ?array {
    if (!in_array($col, ['ref', 'checkout_id'], true)) return null;
    $q = pay_db()->prepare("SELECT * FROM payments WHERE $col = ?");
    $q->execute([$value]);
    return $q->fetch() ?: null;
}
function payment_by_ref_token(string $ref, string $token): ?array {
    $p = get_payment('ref', $ref);
    return $p && $p['token'] !== '' && hash_equals($p['token'], $token) ? $p : null;
}

/** Where SumUp sends the customer back after paying (or giving up). */
function pay_return_url(array $p, string $lang): string {
    return site_base() . '/index.html?pay=' . rawurlencode($p['ref']) . '&k=' . $p['token'] . ($lang === 'en' ? '&lang=en' : '');
}

/** Creates the SumUp checkout and returns the page the customer pays on. */
function pay_start(array $p, string $lang): string {
    if ($p['sim']) return site_base() . '/api/pay.php?sim=' . rawurlencode($p['ref']) . '&k=' . $p['token'] . '&lang=' . $lang;
    $s = pay_settings();
    [$code, $res] = sumup('POST', '/v0.1/checkouts', [
        'checkout_reference' => $p['ref'],
        'amount' => round((float) $p['amount'], 2),
        'currency' => 'EUR',
        'merchant_code' => $s['merchant_code'],
        'description' => 'Vizi Capitali · ordine ' . $p['ref'],
        'return_url' => site_base() . '/api/pay.php?webhook=1',   // SumUp tells us when the status changes
        'redirect_url' => pay_return_url($p, $lang),             // where the customer comes back to
        'hosted_checkout' => ['enabled' => true],
    ]);
    $url = $res['hosted_checkout_url'] ?? '';
    if ($code < 200 || $code >= 300 || empty($res['id']) || !is_string($url) || !str_starts_with($url, 'https://')) {
        error_log('SumUp checkout failed: HTTP ' . $code . ' ' . json_encode($res));
        pay_db()->prepare("UPDATE payments SET status = 'failed', updated_at = ? WHERE id = ?")->execute([time(), $p['id']]);
        fail('pay_unavailable', 502);
    }
    pay_db()->prepare('UPDATE payments SET checkout_id = ?, updated_at = ? WHERE id = ?')->execute([(string) $res['id'], time(), $p['id']]);
    return $url;
}

/** Re-reads the true status from SumUp and acts on a new payment. Returns the updated row. */
function pay_refresh(array $p): array {
    if (!$p['sim'] && $p['checkout_id'] && in_array($p['status'], ['pending', 'failed'], true)) {
        [$code, $res] = sumup('GET', '/v0.1/checkouts/' . rawurlencode($p['checkout_id']));
        if ($code === 200 && is_array($res)) {
            $status = ['PAID' => 'paid', 'FAILED' => 'failed', 'EXPIRED' => 'expired', 'PENDING' => 'pending'][strtoupper((string) ($res['status'] ?? ''))] ?? $p['status'];
            // the amount must be what we asked for, or it is not our payment
            if ($status === 'paid' && abs((float) ($res['amount'] ?? 0) - (float) $p['amount']) > 0.009) $status = 'failed';
            $txn = (string) ($res['transaction_code'] ?? ($res['transactions'][0]['transaction_code'] ?? ''));
            pay_set_status($p, $status, $txn);
        }
    }
    return get_payment('ref', $p['ref']);
}

/** Records a status; the first time a payment is paid, the order reaches the shop. */
function pay_set_status(array $p, string $status, string $txn = ''): void {
    $db = pay_db();
    // only one request may turn a payment into "paid"
    $q = $db->prepare("UPDATE payments SET status = ?, txn_code = COALESCE(NULLIF(?, ''), txn_code), updated_at = ? WHERE id = ? AND status != 'paid'");
    $q->execute([$status, $txn, time(), $p['id']]);
    if ($status !== 'paid' || $q->rowCount() !== 1) return;

    $p = get_payment('ref', $p['ref']);
    if ($p['channel'] === 'website' && !$p['order_id'] && ($row = json_decode((string) $p['payload'], true))) {
        $now = time();
        $row['created_at'] = $row['updated_at'] = $now;
        $row['service_day'] = service_day($now);
        $o = insert_order($row);
        $db->prepare('UPDATE payments SET order_id = ? WHERE id = ?')->execute([$o['id'], $p['id']]);
        tg_new_order($o);
        send_confirmation_email($o);
        return;
    }
    // WhatsApp orders: the customer sends the order in the chat; this tells the shop the money has arrived
    $chat = private_config()['telegram_shop_chat'];
    if ($chat !== '') {
        tg('sendMessage', ['chat_id' => $chat, 'text' => "💳 Pagato online " . money((float) $p['amount']) . " · rif. {$p['ref']}"
            . ($p['sim'] ? ' (PROVA)' : '') . "\n{$p['name']} · {$p['phone']}\n{$p['summary']}\nL'ordine arriva su WhatsApp con questo riferimento."]);
    }
}

function public_payment(array $p): array {
    return ['ref' => $p['ref'], 'status' => $p['status'], 'amount' => (float) $p['amount'], 'sim' => (bool) $p['sim'],
        'createdAt' => (int) $p['created_at'], 'name' => $p['name'], 'phone' => $p['phone'], 'summary' => $p['summary'],
        'txn' => $p['txn_code'], 'channel' => $p['channel']];
}
