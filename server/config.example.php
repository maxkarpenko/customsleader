<?php
// Copy this file to config.php in the same folder on the server and fill in the values.
// config.php is never published with the site build, so the webhook stays on the server only.
return [
  // Bitrix24 → Разработчикам → Другое → Входящий вебхук, права: CRM (crm).
  // Looks like https://your-company.bitrix24.ru/rest/1/abc123def456/
  'bitrix24_webhook' => '',

  // If Bitrix24 does not answer, the lead is mailed here instead of being lost. Leave empty to turn off.
  'fallback_email' => 'info@customsleader.ru',
];
