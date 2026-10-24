<?php
/* One-time setup: the staff PIN for Gestione. Online-order alerts (Telegram, email) are
   optional and folded away until website orders are switched on.
   Works only while api/private/config.php does not exist. To redo it, delete that file
   (via FTP / file manager) and open this page again. The PIN can also be changed in Gestione. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

$done = is_file(PRIVATE_DIR . '/config.php');
$msg = ''; $chats = [];
$v = fn(string $k, string $d = '') => htmlspecialchars((string) ($_POST[$k] ?? $d), ENT_QUOTES);
$host = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
$siteDefault = $host . rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/setup.php')), '/');

if (!$done && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = trim((string) ($_POST['telegram_token'] ?? ''));
    if (($_POST['do'] ?? '') === 'find' && $token !== '') {
        // lists the chats the bot has seen, so nobody has to hunt for chat IDs
        $ch = curl_init("https://api.telegram.org/bot{$token}/getUpdates");
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8]);
        $r = json_decode((string) curl_exec($ch), true);
        foreach ($r['result'] ?? [] as $u) {
            $c = $u['message']['chat'] ?? $u['my_chat_member']['chat'] ?? null;
            if ($c) $chats[(string) $c['id']] = $c['title'] ?? trim(($c['first_name'] ?? '') . ' ' . ($c['last_name'] ?? ''));
        }
        $msg = $chats ? 'Chat trovate: copia il numero accanto al gruppo giusto.' : 'Nessuna chat trovata: aggiungi il bot al gruppo e scrivi un messaggio nel gruppo, poi riprova.';
    } elseif (($_POST['do'] ?? '') === 'save') {
        $pin = (string) ($_POST['pin'] ?? '');
        if (!preg_match('/^\d{6}$/', $pin) || $pin !== ($_POST['pin2'] ?? '')) {
            $msg = 'Il PIN deve avere 6 cifre e coincidere.';
        } elseif (($p = trim((string) ($_POST['preview_pin'] ?? ''))) !== '' && !preg_match('/^\d{4,8}$/', $p)) {
            $msg = 'Il codice di anteprima deve avere da 4 a 8 cifre.';
        } else {
            $cfg = [
                'pin_hash' => password_hash($pin, PASSWORD_DEFAULT),
                'telegram_token' => $token,
                'telegram_secret' => bin2hex(random_bytes(24)),
                'telegram_shop_chat' => trim((string) ($_POST['shop_chat'] ?? '')),
                'telegram_riders_chat' => trim((string) ($_POST['riders_chat'] ?? '')),
                'riders' => array_values(array_filter(array_map('trim', explode(',', (string) ($_POST['riders'] ?? ''))))),
                'mail_from' => trim((string) ($_POST['mail_from'] ?? '')),
                'site_url' => rtrim(trim((string) ($_POST['site_url'] ?? $siteDefault)), '/'),
                'retention_days' => max(1, (int) ($_POST['retention_days'] ?? 30)),
            ];
            if (!is_dir(PRIVATE_DIR)) mkdir(PRIVATE_DIR, 0750, true);
            // "Apriamo presto" until the site is opened from Gestione; the preview PIN lets friends in
            set_flag('soon', isset($_POST['soon']) ? '1' : '');
            $preview = trim((string) ($_POST['preview_pin'] ?? ''));
            if (preg_match('/^\d{4,8}$/', $preview)) set_flag('soon_pin', password_hash($preview, PASSWORD_DEFAULT));
            file_put_contents(PRIVATE_DIR . '/config.php', "<?php\n// Created by api/setup.php. Delete this file to run setup again.\nreturn " . var_export($cfg, true) . ";\n");
            @chmod(PRIVATE_DIR . '/config.php', 0640);
            // starting point for the Gestione page: today's menu and settings, promo codes moved out of public view
            if (!is_file(LIVE_FILE)) {
                $start = site_data('config.js');
                if (!is_file(PRIVATE_DIR . '/promos.json')) file_put_contents(PRIVATE_DIR . '/promos.json', json_encode($start['promoCodes'] ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                unset($start['promoCodes'], $start['admin']);
                write_live($start, site_data('menu.js'));
            }
            if ($token !== '' && str_starts_with($cfg['site_url'], 'https://')) {
                $ch = curl_init("https://api.telegram.org/bot{$token}/setWebhook");
                curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => ['url' => $cfg['site_url'] . '/api/telegram.php', 'secret_token' => $cfg['telegram_secret'],
                        'allowed_updates' => json_encode(['callback_query'])]]);
                $r = json_decode((string) curl_exec($ch), true);
                $msg = ($r['ok'] ?? false) ? 'Telegram collegato.' : 'Salvato, ma Telegram non ha accettato il collegamento: controlla il token.';
            }
            $done = true;
        }
    }
}
?><!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Prima configurazione · Vizi Capitali</title>
<link rel="stylesheet" href="../assets/css/style.css">
<style>
  body { padding: 24px 16px; } main { max-width: 640px; margin: 0 auto; display: grid; gap: 16px; }
  h1 { color: var(--red-ui); font-weight: 900; font-stretch: 120%; text-transform: uppercase; }
  .box { background: #fff8ec; border: 2px solid var(--cream-2); border-radius: 16px; padding: 18px; display: grid; gap: 12px; }
  label { display: grid; gap: 6px; font-weight: 700; font-size: 14px; }
  input { padding: 12px; border: 2px solid var(--cream-2); border-radius: 12px; font: inherit; font-size: 16px; }
  .help { font-size: 14px; color: #4f3d31; } .msg { font-weight: 800; padding: 12px; border-radius: 12px; background: #fff1b8; color: #4a3a00; }
  code { background: #eadbc0; padding: 1px 6px; border-radius: 6px; }
  details { border-top: 1px dashed var(--cream-2); padding-top: 12px; } summary { cursor: pointer; font-weight: 800; }
  details > div { display: grid; gap: 12px; margin-top: 12px; }
  .check { display: flex; align-items: center; gap: 10px; } .check input { width: 22px; height: 22px; accent-color: var(--red-ui); }
</style>
</head>
<body>
<main>
  <h1>Prima configurazione</h1>
  <?php if ($msg): ?><p class="msg"><?= htmlspecialchars($msg) ?></p><?php endif; ?>
  <?php if ($done): ?>
    <div class="box">
      <p><strong>Fatto.</strong> Ora entrate nella gestione del sito con il PIN: <a href="../admin.html">admin.html</a></p>
      <?php if (flag('soon') === '1'): ?><p class="help">Il sito mostra «Apriamo presto». Quando siete pronti: Gestione → Avanzate → Prossimamente.</p><?php endif; ?>
      <p class="help">Il PIN si può cambiare da Gestione → Avanzate.</p>
    </div>
  <?php else: ?>
  <form method="post" class="box">
    <p class="help">Scegliete il PIN per entrare nella gestione del sito (menu, orari, temi, manutenzione). Fatelo subito dopo aver caricato il sito: finché non è impostato, chiunque apra questa pagina potrebbe sceglierlo.</p>
    <label>PIN dello staff (6 cifre)<input name="pin" type="password" inputmode="numeric" maxlength="6" required></label>
    <label>Ripeti il PIN<input name="pin2" type="password" inputmode="numeric" maxlength="6" required></label>

    <h2>Prima dell'apertura</h2>
    <label class="check"><input type="checkbox" name="soon" value="1" checked> Mostra «Apriamo presto» al posto del sito</label>
    <p class="help">Il sito vero lo vede solo chi ha il codice di anteprima (da dare ad amici e collaboratori) e voi, entrati in Gestione. Lo aprite a tutti da Gestione → Stato del sito.</p>
    <label>Codice di anteprima (4–8 cifre, facoltativo)<input name="preview_pin" inputmode="numeric" maxlength="8" autocomplete="off" value="<?= $v('preview_pin') ?>"></label>

    <details><summary>Ordini dal sito (per più avanti, facoltativo)</summary><div>
    <p class="help">Per ora gli ordini arrivano su WhatsApp e questa parte non serve. Lasciatela vuota.</p>
    <h2>Avvisi su Telegram</h2>
    <ol class="help">
      <li>Su Telegram apri <strong>@BotFather</strong>, scrivi <code>/newbot</code> e copia il <em>token</em> qui sotto.</li>
      <li>Crea un gruppo "Vizi Capitali Ordini" con i gemelli, aggiungi il bot e scrivi un messaggio nel gruppo. Fai lo stesso con un gruppo "Rider" se volete.</li>
      <li>Premi <em>Trova chat</em> e copia i numeri dei gruppi.</li>
    </ol>
    <label>Token del bot<input name="telegram_token" value="<?= $v('telegram_token') ?>" autocomplete="off"></label>
    <button class="btn btn--outline btn--sm" name="do" value="find" formnovalidate>Trova chat</button>
    <?php foreach ($chats as $id => $title): ?><p class="help"><strong><?= htmlspecialchars($title) ?></strong>: <code><?= htmlspecialchars($id) ?></code></p><?php endforeach; ?>
    <label>Chat del locale (numero)<input name="shop_chat" value="<?= $v('shop_chat') ?>"></label>
    <label>Chat dei rider (numero, facoltativo)<input name="riders_chat" value="<?= $v('riders_chat') ?>"></label>
    <label>Nomi dei rider, separati da virgola<input name="riders" value="<?= $v('riders') ?>" placeholder="Luca, Marco"></label>

    <h2>Email di conferma (facoltativo)</h2>
    <label>Indirizzo mittente (es. ordini@vizicapitali.it)<input name="mail_from" type="email" value="<?= $v('mail_from') ?>"></label>
    <label>Indirizzo del sito<input name="site_url" value="<?= $v('site_url', $siteDefault) ?>"></label>
    <label>Giorni dopo cui cancellare i dati dei clienti<input name="retention_days" type="number" min="1" value="<?= $v('retention_days', '30') ?>"></label>
    </div></details>

    <button class="btn btn--red" name="do" value="save">Salva configurazione</button>
  </form>
  <?php endif; ?>
</main>
</body>
</html>
