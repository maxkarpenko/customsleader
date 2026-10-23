<?php
// Consent journal: records each choice made in the site's cookie notice, so the operator can show that and when
// consent to analytics was given or withdrawn (part 3 of article 9 of 152-FZ puts the burden of proof on the operator).
// One line per choice in a monthly file next to this script, e.g. .consent-2026-10.php. The file is PHP whose first
// line stops it, so even a server that ignores .htaccess shows nothing when the file is requested from outside:
//   time (UTC); visitor's random consent ID; document version; action; site
// No IP address, name or browser details are stored. Files older than 3 years are removed automatically.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply($status, $body){
  http_response_code($status);
  echo json_encode($body);
  exit;
}

if($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['ok' => false, 'error' => 'method']);
if(!empty($_SERVER['HTTP_ORIGIN']) && parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST) !== parse_url('http://' . $_SERVER['HTTP_HOST'], PHP_URL_HOST))
  reply(403, ['ok' => false, 'error' => 'origin']);

$in = json_decode((string)file_get_contents('php://input', false, null, 0, 2048), true);
if(!is_array($in)) reply(400, ['ok' => false, 'error' => 'bad request']);

$id = isset($in['id']) ? (string)$in['id'] : '';
$version = isset($in['version']) ? (string)$in['version'] : '';
$choice = isset($in['choice']) ? (string)$in['choice'] : '';
$previous = isset($in['previous']) ? (string)$in['previous'] : '';
if(!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $id)) reply(400, ['ok' => false, 'error' => 'id']);
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/', $version)) reply(400, ['ok' => false, 'error' => 'version']);
if(!in_array($choice, ['all', 'necessary'], true)) reply(400, ['ok' => false, 'error' => 'choice']);

// accept / reject on the first choice; withdraw / accept again when a visitor changes it in "Настройки cookie"
if($choice === 'all') $action = 'accept';
else $action = $previous === 'all' ? 'withdraw' : 'reject';

// A person makes a choice or two; dozens a minute from one address is a script
$limitFile = __DIR__ . '/.consent-limits.json';
$now = time();
$key = md5(isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
$limits = is_file($limitFile) ? json_decode((string)file_get_contents($limitFile), true) : [];
if(!is_array($limits)) $limits = [];
foreach($limits as $k => $times) $limits[$k] = array_values(array_filter((array)$times, function($t) use ($now){ return $t > $now - 600; }));
$limits = array_filter($limits);
if(count(isset($limits[$key]) ? $limits[$key] : []) >= 20) reply(429, ['ok' => false, 'error' => 'too many requests']);
$limits[$key][] = $now;
@file_put_contents($limitFile, json_encode($limits), LOCK_EX);

// Monthly file with a hard size cap, so nothing can fill the disk
$log = __DIR__ . '/.consent-' . gmdate('Y-m') . '.php';
if(is_file($log) && filesize($log) > 20 * 1024 * 1024) reply(507, ['ok' => false, 'error' => 'journal full']);
$host = preg_replace('/[^a-z0-9.:\-]/', '', strtolower(isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ''));
if(!is_file($log)) @file_put_contents($log, "<?php http_response_code(404); exit; ?>\ntime_utc;consent_id;version;action;site\n", LOCK_EX);
$line = gmdate('Y-m-d\TH:i:s\Z') . ';' . $id . ';' . $version . ';' . $action . ';' . $host . "\n";
if(@file_put_contents($log, $line, FILE_APPEND | LOCK_EX) === false) reply(500, ['ok' => false, 'error' => 'write']);

// Keep 3 years of journal (the limitation period), drop older months
$oldest = gmdate('Y-m', strtotime('-36 months', $now));
foreach(glob(__DIR__ . '/.consent-*.php') ?: [] as $file)
  if(preg_match('/\.consent-(\d{4}-\d{2})\.php$/', $file, $m) && $m[1] < $oldest) @unlink($file);

reply(200, ['ok' => true]);
