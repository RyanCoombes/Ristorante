<?php
/* Front door for the public pages (index.html, ordine.html): .htaccess sends every visit here.
   While "Prossimamente" is on (Gestione → Stato del sito), visitors see "Apriamo presto";
   people who type the preview PIN, and staff logged in to Gestione, see the real site.
   With it off, the page is simply served as it is. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

const GATED = ['index.html', 'ordine.html'];

$page = (string) ($_GET['vc_page'] ?? '');
if ($page === '') $page = 'index.html';
if (!in_array($page, GATED, true)) { http_response_code(404); exit; }
header('X-Content-Type-Options: nosniff');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && configured() && soon_on()) {
    if (!rate_ok('preview', 8, 900)) {
        $error = 'wait';
    } elseif (flag('soon_pin') !== '' && password_verify(str($_POST['pin'] ?? '', 12), flag('soon_pin'))) {
        setcookie(PREVIEW_COOKIE, preview_token(), ['expires' => time() + 30 * 86400, 'path' => '/', 'httponly' => true,
            'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off']);
        $back = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        header('Location: ' . (str_starts_with($back, '/') && !str_starts_with($back, '//') ? $back : '/'), true, 303);
        exit;
    } else {
        $error = 'wrong';
    }
}

if (preview_allowed()) {
    header('Content-Type: text/html; charset=utf-8');
    // while the site is hidden, what this address shows depends on who asks: never keep a shared copy
    header('Cache-Control: ' . (soon_on() ? 'private, no-store' : 'no-cache'));
    readfile(ROOT . '/' . $page);
    exit;
}

// ---------- "Apriamo presto" ----------
$cfg = site_config();
$q = $_GET['lang'] ?? '';
$en = $q === 'en' || ($q !== 'it' && str_starts_with(strtolower((string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '')), 'en'));
$T = $en ? [
    'lang' => 'en', 'title' => 'Opening soon', 'kicker' => 'Treat yourself',
    'body' => 'The oven is warming up. Follow us on Instagram to find out when we open.',
    'ig' => 'Follow us on Instagram', 'code' => 'Have a preview code?', 'label' => 'Preview code', 'enter' => 'Enter',
    'wrong' => 'Wrong code.', 'wait' => 'Too many attempts. Try again in a few minutes.',
    'privacy' => 'Privacy & cookies', 'legal' => 'Legal notice',
] : [
    'lang' => 'it', 'title' => 'Apriamo presto', 'kicker' => 'Concediti il tuo vizio',
    'body' => 'Il forno si sta scaldando. Seguici su Instagram per sapere quando apriamo.',
    'ig' => 'Seguici su Instagram', 'code' => 'Hai il codice di anteprima?', 'label' => 'Codice di anteprima', 'enter' => 'Entra',
    'wrong' => 'Codice non corretto.', 'wait' => 'Troppi tentativi. Riprova tra qualche minuto.',
    'privacy' => 'Privacy e cookie', 'legal' => 'Note legali',
];
$h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES);
$ig = preg_replace('/[^A-Za-z0-9._]/', '', (string) ($cfg['instagram'] ?? ''));
$addr = trim(($cfg['address']['street'] ?? '') . ' · ' . ($cfg['address']['city'] ?? ''), ' ·');
$path = strtok((string) ($_SERVER['REQUEST_URI'] ?? '/'), '?') ?: '/';
$canAsk = configured() && flag('soon_pin') !== '';

http_response_code(200);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Robots-Tag: noindex');
?><!doctype html>
<html lang="<?= $T['lang'] ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title><?= $h($T['title']) ?> · Vizi Capitali</title>
<meta name="theme-color" content="#c8102e">
<link rel="icon" type="image/png" href="assets/img/favicon.png">
<link rel="stylesheet" href="assets/fonts/fonts.css?v=20261024m">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    min-height: 100vh; min-height: 100dvh; display: grid; grid-template-rows: auto 1fr auto;
    background: #c8102e; color: #f0e3cc; font-family: Archivo, system-ui, sans-serif; text-align: center;
  }
  a { color: inherit; }
  .top { display: flex; justify-content: flex-end; padding: 16px; }
  .lang { display: inline-flex; border: 2px solid #f0e3cc; border-radius: 999px; overflow: hidden; }
  .lang a { min-width: 48px; min-height: 40px; display: grid; place-items: center; font-weight: 800; text-decoration: none; font-size: 14px; }
  .lang a[aria-current="true"] { background: #f0e3cc; color: #b80f29; }
  main { display: grid; align-content: center; justify-items: center; gap: 14px; padding: 8px 16px 32px; max-width: 560px; margin: 0 auto; width: 100%; }
  .logo { width: min(260px, 70vw); height: auto; }
  .mascot { width: 120px; height: auto; margin-top: 4px; }
  .kicker { font-family: Yellowtail, cursive; font-size: 30px; margin: 0; }
  h1 { margin: 0; font-weight: 900; font-stretch: 125%; text-transform: uppercase; font-size: clamp(38px, 11vw, 64px); line-height: .95; letter-spacing: .01em; }
  p { margin: 0; font-size: 17px; line-height: 1.5; }
  .addr { font-size: 15px; }
  .ig { display: inline-flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 26px; border-radius: 999px;
    background: #f0e3cc; color: #b80f29; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; text-decoration: none; font-size: 15px; margin-top: 6px; }
  .ig:hover { background: #fff8ec; }
  details { margin-top: 18px; width: 100%; max-width: 340px; }
  summary { cursor: pointer; font-weight: 700; font-size: 15px; text-decoration: underline; text-underline-offset: 3px; list-style: none; padding: 8px; }
  summary::-webkit-details-marker { display: none; }
  form { display: grid; gap: 10px; margin-top: 8px; text-align: left; }
  label { font-weight: 700; font-size: 14px; }
  .row { display: flex; gap: 8px; }
  input { flex: 1; min-width: 0; min-height: 48px; padding: 0 14px; border-radius: 14px; border: 2px solid #f0e3cc; background: #fff8ec; color: #1c1c1c; font: 600 18px Archivo, system-ui, sans-serif; letter-spacing: .2em; }
  input:focus { outline: 3px solid #1c1c1c; outline-offset: 2px; }
  button { min-height: 48px; padding: 0 20px; border-radius: 999px; border: 0; background: #1c1c1c; color: #f0e3cc; font: 800 15px Archivo, system-ui, sans-serif; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; }
  .err { background: #1c1c1c; color: #fff; border-radius: 12px; padding: 10px 12px; font-size: 15px; font-weight: 700; }
  footer { padding: 18px 16px 24px; font-size: 14px; display: flex; flex-wrap: wrap; gap: 6px 18px; justify-content: center; }
  footer a { min-height: 32px; display: inline-flex; align-items: center; }
</style>
</head>
<body>
  <div class="top">
    <nav class="lang" aria-label="Lingua / Language">
      <a href="<?= $h($path) ?>?lang=it" aria-current="<?= $en ? 'false' : 'true' ?>" lang="it">IT</a>
      <a href="<?= $h($path) ?>?lang=en" aria-current="<?= $en ? 'true' : 'false' ?>" lang="en">EN</a>
    </nav>
  </div>
  <main>
    <img class="logo" src="assets/img/logo-cream.png" alt="Vizi Capitali" width="1000" height="438">
    <img class="mascot" src="assets/img/mascot-peel-cream.png" alt="" width="612" height="700">
    <p class="kicker"><?= $h($T['kicker']) ?></p>
    <h1><?= $h($T['title']) ?></h1>
    <p><?= $h($T['body']) ?></p>
    <?php if ($addr !== ''): ?><p class="addr"><?= $h($addr) ?></p><?php endif; ?>
    <?php if ($ig !== ''): ?>
      <a class="ig" href="https://instagram.com/<?= $h($ig) ?>" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
        <?= $h($T['ig']) ?>
      </a>
    <?php endif; ?>
    <?php if ($canAsk): ?>
      <details<?= $error ? ' open' : '' ?>>
        <summary><?= $h($T['code']) ?></summary>
        <form method="post">
          <label for="pin"><?= $h($T['label']) ?></label>
          <div class="row">
            <input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required<?= $error ? ' autofocus aria-describedby="pin-err"' : '' ?>>
            <button type="submit"><?= $h($T['enter']) ?></button>
          </div>
          <?php if ($error): ?><p class="err" id="pin-err" role="alert"><?= $h($T[$error]) ?></p><?php endif; ?>
        </form>
      </details>
    <?php endif; ?>
  </main>
  <footer>
    <a href="privacy.html<?= $en ? '?lang=en' : '' ?>"><?= $h($T['privacy']) ?></a>
    <a href="note-legali.html<?= $en ? '?lang=en' : '' ?>"><?= $h($T['legal']) ?></a>
  </footer>
</body>
</html>
