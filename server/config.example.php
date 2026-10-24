<?php
// Copy this file to config.php in the same folder on the server and fill in the values.
// config.php is never published with the site build, so the webhook stays on the server only.
return [
  // Bitrix24 → Разработчикам → Другое → Входящий вебхук, права: CRM (crm).
  // Looks like https://your-company.bitrix24.ru/rest/1/abc123def456/
  'bitrix24_webhook' => '',

  // Responsible for new leads: the employee's user ID in Bitrix24 — the number in their profile address,
  // e.g. https://your-company.bitrix24.ru/company/personal/user/40/ → 40. Without this line: 40; empty: the webhook's owner.
  'assigned_by_id' => '40',

  // If Bitrix24 does not answer, the lead is mailed here instead of being lost. Leave empty to turn off.
  'fallback_email' => 'analitik@customsleader.ru',

  // Sender of that mail. The hosting server is allowed to send for customsleader.ru (SPF), so it should reach the inbox.
  'mail_from' => 'leads@customsleader.ru',
];
