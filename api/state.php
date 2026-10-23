<?php
/* GET api/state.php — public: is the site in maintenance, are online orders paused? */

declare(strict_types=1);
require __DIR__ . '/lib.php';

if (!configured()) json_out(['ok' => true, 'maintenance' => false, 'paused' => false, 'message' => '']);
json_out(['ok' => true] + site_state());
