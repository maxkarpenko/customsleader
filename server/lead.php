<?php
// Receives a request form from the site and creates a lead in Bitrix24.
// The webhook address lives only on the server, in config.php next to this file (see config.example.php).
// Answers {"ok":true} on success; the site shows its own error text otherwise.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply($status, $body){
  http_response_code($status);
  echo json_encode($body, JSON_UNESCAPED_UNICODE);
  exit;
}
function clean($v, $max){
  if(is_array($v)) $v = implode(', ', array_map('strval', $v));
  $v = trim(preg_replace('/\s+/u', ' ', strip_tags((string)$v)));
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

if($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['ok' => false, 'error' => 'method']);

$configFile = __DIR__ . '/config.php';
if(!is_file($configFile)) reply(500, ['ok' => false, 'error' => 'config.php not found next to lead.php']);
$config = require $configFile;
if(!is_array($config)) reply(500, ['ok' => false, 'error' => 'config.php does not return the settings array']);
$webhook = trim(isset($config['bitrix24_webhook']) ? (string)$config['bitrix24_webhook'] : '');
if($webhook === '') reply(500, ['ok' => false, 'error' => 'bitrix24_webhook is empty in config.php']);
// Bitrix24 often shows the address with a sample method after it (…/profile/, …/crm.lead.add.json): keep the base only
if(!preg_match('#^(https://[^/\s]+/rest/\d+/[A-Za-z0-9_]+)(/|$)#', $webhook, $m)) reply(500, ['ok' => false, 'error' => 'bitrix24_webhook must look like https://<portal>/rest/<user id>/<code>/']);
$webhook = $m[1];

// Only the site's own pages may post here: a browser on another site sends its own Origin
if(!empty($_SERVER['HTTP_ORIGIN']) && parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST) !== parse_url('http://' . $_SERVER['HTTP_HOST'], PHP_URL_HOST))
  reply(403, ['ok' => false, 'error' => 'origin']);

$raw = file_get_contents('php://input', false, null, 0, 65536);
$in = json_decode($raw, true);
if(!is_array($in)) reply(400, ['ok' => false, 'error' => 'bad request']);

// Bots fill the hidden "website" field; pretend success so they do not retry
if(!empty($in['website'])) reply(200, ['ok' => true]);

// A few requests per address are plenty for a person; more is a script
$limitFile = __DIR__ . '/.lead-limits.json';
$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
$now = time();
$limits = is_file($limitFile) ? json_decode((string)file_get_contents($limitFile), true) : [];
if(!is_array($limits)) $limits = [];
foreach($limits as $k => $times) $limits[$k] = array_values(array_filter((array)$times, function($t) use ($now){ return $t > $now - 600; }));
$limits = array_filter($limits);
$key = md5($ip);
if(count(isset($limits[$key]) ? $limits[$key] : []) >= 5) reply(429, ['ok' => false, 'error' => 'too many requests']);

$forms = [
  'hero' => 'Расчёт стоимости (первый экран)',
  'hero-modal' => 'Расчёт стоимости (кнопка «Получить расчёт»)',
  'detailed' => 'Подробный расчёт',
  'final' => 'Расчёт стоимости (внизу страницы)',
  'callback' => 'Обратный звонок',
  'russia' => 'Перевозка по России',
];
$form = isset($in['form']) ? (string)$in['form'] : '';
if(!isset($forms[$form])) reply(400, ['ok' => false, 'error' => 'form']);

$phone = clean(isset($in['phone']) ? $in['phone'] : '', 40);
$digits = preg_replace('/\D/', '', $phone);
if(strlen($digits) < 10 || strlen($digits) > 15) reply(400, ['ok' => false, 'error' => 'phone']);
if(!isset($in['consent']) || $in['consent'] !== 'on') reply(400, ['ok' => false, 'error' => 'consent']);

$name = clean(isset($in['name']) ? $in['name'] : '', 200);
$email = clean(isset($in['email']) ? $in['email'] : '', 200);
if($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $email = '';
if(in_array($form, ['detailed', 'callback', 'russia'], true) && $name === '') reply(400, ['ok' => false, 'error' => 'name']);
if($form === 'detailed' && $email === '') reply(400, ['ok' => false, 'error' => 'email']);

$labels = [
  'services' => 'Услуга',
  'transport' => 'Тип перевозки',
  'message' => 'Задача',
  'cargo' => 'Груз',
  'oversized' => 'Негабарит',
  'weight' => 'Вес',
  'packaging' => 'Упаковка',
  'origin' => 'Откуда',
  'destination' => 'Куда',
  'company' => 'Компания',
  'inn' => 'ИНН',
];
$values = ['international' => 'Международная', 'russia' => 'По России'];
$lines = [];
foreach($labels as $k => $label){
  if(!isset($in[$k]) || $in[$k] === '' || $in[$k] === []) continue;
  $v = clean($in[$k], 3000);
  if(isset($values[$v])) $v = $values[$v];
  $lines[] = $label . ': ' . $v;
}
if(!empty($in['page'])) $lines[] = 'Страница: ' . clean($in['page'], 500);

$fields = [
  'TITLE' => 'Заявка с сайта: ' . $forms[$form],
  'NAME' => $name,
  'COMPANY_TITLE' => clean(isset($in['company']) ? $in['company'] : '', 300),
  'PHONE' => [['VALUE' => $phone, 'VALUE_TYPE' => 'WORK']],
  'COMMENTS' => implode('<br>', array_map('htmlspecialchars', $lines)),
  'SOURCE_ID' => 'WEB',
  'SOURCE_DESCRIPTION' => $forms[$form],
];
if($email !== '') $fields['EMAIL'] = [['VALUE' => $email, 'VALUE_TYPE' => 'WORK']];
// Responsible employee: their user ID in Bitrix24. 40 unless config.php sets assigned_by_id ('' there: the webhook's owner)
$assigned = array_key_exists('assigned_by_id', $config) ? (string)$config['assigned_by_id'] : '40';
if(ctype_digit($assigned) && (int)$assigned > 0) $fields['ASSIGNED_BY_ID'] = (int)$assigned;
foreach(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $u)
  if(!empty($in[$u])) $fields[strtoupper($u)] = clean($in[$u], 200);

$url = rtrim($webhook, '/') . '/crm.lead.add.json';
$body = json_encode(['fields' => $fields, 'params' => ['REGISTER_SONET_EVENT' => 'Y']], JSON_UNESCAPED_UNICODE);

$result = null;
if(function_exists('curl_init')){
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
  ]);
  $result = curl_exec($ch);
  curl_close($ch);
} else {
  $result = @file_get_contents($url, false, stream_context_create(['http' => [
    'method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $body, 'timeout' => 15, 'ignore_errors' => true,
  ]]));
}
$data = is_string($result) ? json_decode($result, true) : null;

if(!is_array($data) || empty($data['result'])){
  // The lead must not be lost: mail it if an address is set, and keep the reason for the site owner
  $reason = is_array($data) && isset($data['error_description']) ? $data['error_description'] : 'no answer from Bitrix24';
  error_log('lead.php: Bitrix24 failed: ' . $reason);
  $mailed = false;
  // analitik@customsleader.ru unless config.php sets fallback_email ('' there turns the mail off)
  $fallback = array_key_exists('fallback_email', $config) ? (string)$config['fallback_email'] : 'analitik@customsleader.ru';
  if($fallback !== ''){
    $text = $fields['TITLE'] . "\nИмя: " . $name . "\nТелефон: " . $phone . ($email !== '' ? "\nПочта: " . $email : '') . "\n" . implode("\n", $lines);
    // From the site's own address: the hosting server is in customsleader.ru's SPF record, so the mail passes the check;
    // a reply goes straight to the client when they left an e-mail
    $from = array_key_exists('mail_from', $config) ? (string)$config['mail_from'] : 'leads@customsleader.ru';
    $headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: 8bit\r\n"
      . 'From: =?UTF-8?B?' . base64_encode('Сайт КАСТОМС ЛИДЕР') . "?= <$from>"
      . ($email !== '' ? "\r\nReply-To: $email" : '');
    $mailed = @mail($fallback, '=?UTF-8?B?' . base64_encode($fields['TITLE']) . '?=', $text, $headers, '-f' . $from);
  }
  if(!$mailed) reply(502, ['ok' => false, 'error' => 'crm']);
}

$limits[$key][] = $now;
@file_put_contents($limitFile, json_encode($limits), LOCK_EX);
reply(200, ['ok' => true]);
