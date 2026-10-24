<?php
/* GET api/state.php — public: is the site in maintenance, are online orders paused, can people pay online? */

declare(strict_types=1);
require __DIR__ . '/sumup.php';

if (!configured()) json_out(['ok' => true, 'maintenance' => false, 'paused' => false, 'message' => '', 'payOnline' => false]);
json_out(['ok' => true] + site_state() + ['payOnline' => pay_offered()]);
