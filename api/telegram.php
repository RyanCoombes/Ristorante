<?php
/* Telegram webhook: the Accetta / Rifiuta / Consegnato buttons in the shop and rider chats.
   Telegram calls this URL; api/setup.php registers it with a secret so nobody else can. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

$cfg = private_config();
if (!configured() || $cfg['telegram_secret'] === '' ||
    !hash_equals($cfg['telegram_secret'], (string) ($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? ''))) {
    http_response_code(403);
    exit;
}
$update = body();
$cb = $update['callback_query'] ?? null;
if (!$cb) json_out(['ok' => true]);

$chat = (string) ($cb['message']['chat']['id'] ?? '');
$allowed = array_filter([(string) $cfg['telegram_shop_chat'], (string) $cfg['telegram_riders_chat']]);
$answer = fn(string $text) => tg('answerCallbackQuery', ['callback_query_id' => $cb['id'], 'text' => $text]);
if (!in_array($chat, $allowed, true)) { $answer('Chat non autorizzata'); json_out(['ok' => true]); }

$parts = explode(':', (string) ($cb['data'] ?? ''));
$o = get_order((int) ($parts[1] ?? 0));
if (!$o) { $answer('Ordine non trovato'); json_out(['ok' => true]); }
$who = trim(($cb['from']['first_name'] ?? '') . ' ');

switch ($parts[0]) {
    case 'acc':
        if ($o['status'] !== 'new') { $answer('Già gestito: ' . status_label($o['status'])); break; }
        $time = add_minutes(suggested_time($o), (int) ($parts[2] ?? 0));
        set_status((int) $o['id'], 'accepted', ['ready_at' => $time]);
        $answer("Accettato da {$who}· pronto alle {$time}");
        break;
    case 'rej':
        if ($o['status'] !== 'new') { $answer('Già gestito'); break; }
        $rows = [];
        foreach (REJECT_REASONS as $i => $r) $rows[] = [['text' => $r, 'callback_data' => "rr:{$o['id']}:{$i}"]];
        $rows[] = [['text' => '↩︎ Indietro', 'callback_data' => "back:{$o['id']}"]];
        tg('editMessageReplyMarkup', ['chat_id' => $chat, 'message_id' => $cb['message']['message_id'], 'reply_markup' => ['inline_keyboard' => $rows]]);
        $answer('Scegli il motivo');
        break;
    case 'rr':
        if ($o['status'] !== 'new') { $answer('Già gestito'); break; }
        set_status((int) $o['id'], 'rejected', ['reject_reason' => REJECT_REASONS[(int) ($parts[2] ?? 0)] ?? 'Non disponibile']);
        $answer('Rifiutato: il cliente lo vede subito');
        break;
    case 'back':
        tg_refresh_order($o);
        $answer('');
        break;
    case 'del':
        if (!in_array($o['status'], ['out', 'ready'], true)) { $answer('Stato attuale: ' . status_label($o['status'])); break; }
        set_status((int) $o['id'], 'done');
        tg('editMessageReplyMarkup', ['chat_id' => $chat, 'message_id' => $cb['message']['message_id'], 'reply_markup' => ['inline_keyboard' => []]]);
        $answer("Consegnato · grazie {$who}");
        break;
    default:
        $answer('');
}
json_out(['ok' => true]);
