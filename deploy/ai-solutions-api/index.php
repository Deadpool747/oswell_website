<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const CRM_WEBHOOK_URL = 'https://sales.oswelltechnologies.com/api/public/leads/';
const MAX_BODY_BYTES = 64000;
const ALLOWED_ORIGINS = [
    'https://oswelltechnologies.com',
    'https://www.oswelltechnologies.com',
];

function respond(int $status, array $payload)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_value($value, int $limit = 500): string
{
    $text = trim((string)($value ?? ''));
    $text = preg_replace('/[<>\x00-\x1F]+/u', ' ', $text) ?? '';
    $text = preg_replace('/\s+/u', ' ', $text) ?? '';
    return function_exists('mb_substr') ? mb_substr($text, 0, $limit) : substr($text, 0, $limit);
}

function is_rate_limited(string $client): bool
{
    $path = sys_get_temp_dir() . '/oswell-lead-' . hash('sha256', $client) . '.json';
    $handle = fopen($path, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        return false;
    }

    $raw = stream_get_contents($handle);
    $now = time();
    $attempts = is_string($raw) ? json_decode($raw, true) : [];
    $attempts = is_array($attempts) ? array_values(array_filter($attempts, fn($time) => is_int($time) && $now - $time < 900)) : [];
    $attempts[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($attempts));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    return count($attempts) > 5;
}

function uuid_v4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(200, ['status' => 'ready', 'destination' => 'Oswell Sales Agent']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['message' => 'Method not allowed.']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ALLOWED_ORIGINS, true)) {
    respond(403, ['message' => 'This request could not be verified.']);
}

if (($_SERVER['HTTP_X_OSWELL_FORM'] ?? '') !== 'ai-consultation') {
    respond(403, ['message' => 'This request could not be verified.']);
}

if (is_rate_limited($_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
    respond(429, ['message' => 'Too many attempts. Please wait before trying again.']);
}

$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > MAX_BODY_BYTES) {
    respond(413, ['message' => 'Request too large.']);
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody ?: '', true);
if (!is_array($body)) {
    respond(400, ['message' => 'Invalid request.']);
}

if (clean_value($body['companyAddress'] ?? '', 200) !== '' || (int)($body['formElapsedMs'] ?? 0) < 1200) {
    respond(201, ['leadId' => uuid_v4(), 'accepted' => true]);
}

$fullName = clean_value($body['fullName'] ?? '', 120);
$email = strtolower(clean_value($body['email'] ?? '', 180));
$company = clean_value($body['company'] ?? '', 180);
$industry = clean_value($body['industry'] ?? '', 100);
$objective = clean_value($body['objective'] ?? '', 180);
$website = clean_value($body['website'] ?? '', 300);

if (mb_strlen($fullName) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($company) < 2 || $industry === '' || $objective === '' || ($body['consent'] ?? false) !== true) {
    respond(400, ['message' => 'Please complete all required fields with valid information.']);
}

if ($website !== '' && !filter_var($website, FILTER_VALIDATE_URL)) {
    respond(400, ['message' => 'Please enter a complete website URL.']);
}

$secretFile = '/home/u944630721/.oswell-secrets/landing-lead.php';
if (!is_readable($secretFile)) {
    respond(503, ['message' => 'Lead delivery is temporarily unavailable.']);
}
require $secretFile;
if (!isset($CRM_WEBHOOK_TOKEN) || !is_string($CRM_WEBHOOK_TOKEN)) $CRM_WEBHOOK_TOKEN = '';
if (!isset($CRM_USERNAME) || !is_string($CRM_USERNAME)) $CRM_USERNAME = '';
if (!isset($CRM_PASSWORD) || !is_string($CRM_PASSWORD)) $CRM_PASSWORD = '';
if ($CRM_WEBHOOK_TOKEN === '' && ($CRM_USERNAME === '' || $CRM_PASSWORD === '')) {
    respond(503, ['message' => 'Lead delivery is temporarily unavailable.']);
}

$utm = is_array($body['utm'] ?? null) ? $body['utm'] : [];
$clickIds = is_array($body['clickIds'] ?? null) ? $body['clickIds'] : [];
$leadId = uuid_v4();
$lead = [
    'leadId' => $leadId,
    'name' => $fullName,
    'email' => $email,
    'company' => $company,
    'industry' => $industry,
    'phone' => clean_value($body['phone'] ?? '', 80),
    'website' => $website,
    'businessRequirement' => $objective,
    'projectDetails' => clean_value($body['details'] ?? '', 3000),
    'sourcePlatform' => clean_value($body['sourcePlatform'] ?? 'direct', 100),
    'campaign' => clean_value($body['campaign'] ?? '', 180),
    'landingPageVariant' => clean_value($body['campaignVariant'] ?? 'general', 100),
    'landingPageUrl' => clean_value($body['landingPage'] ?? '', 600),
    'attribution' => [
        'utmSource' => clean_value($utm['source'] ?? '', 160),
        'utmMedium' => clean_value($utm['medium'] ?? '', 160),
        'utmCampaign' => clean_value($utm['campaign'] ?? '', 180),
        'utmContent' => clean_value($utm['content'] ?? '', 180),
        'utmTerm' => clean_value($utm['term'] ?? '', 180),
        'gclid' => clean_value($clickIds['gclid'] ?? '', 300),
        'fbclid' => clean_value($clickIds['fbclid'] ?? '', 300),
        'liFatId' => clean_value($clickIds['liFatId'] ?? '', 300),
    ],
    'leadStatus' => 'New',
    'assignedSalesRepresentative' => '',
    'followUpStatus' => 'Pending',
    'submittedAt' => gmdate('c'),
];

function post_json(string $url, array $payload, array $headers = [], ?string &$cookie = null): array
{
    $responseHeaders = [];
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => array_merge(['Accept: application/json', 'Content-Type: application/json'], $headers),
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
        CURLOPT_HEADERFUNCTION => function ($curl, string $line) use (&$responseHeaders): int {
            $length = strlen($line);
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) $responseHeaders[strtolower(trim($parts[0]))][] = trim($parts[1]);
            return $length;
        },
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_errno($ch);
    curl_close($ch);
    if (isset($responseHeaders['set-cookie'][0])) $cookie = explode(';', $responseHeaders['set-cookie'][0], 2)[0];
    return ['status' => $status, 'error' => $error, 'body' => $body];
}

$delivery = ['status' => 0, 'error' => 0];
if ($CRM_WEBHOOK_TOKEN !== '') {
    $delivery = post_json(CRM_WEBHOOK_URL, $lead, ['Authorization: Bearer ' . $CRM_WEBHOOK_TOKEN]);
}

if (($delivery['status'] < 200 || $delivery['status'] >= 300) && $CRM_USERNAME !== '' && $CRM_PASSWORD !== '') {
    $sessionCookie = null;
    $login = post_json('https://sales.oswelltechnologies.com/api/auth/login', [
        'username' => $CRM_USERNAME,
        'password' => $CRM_PASSWORD,
    ], [], $sessionCookie);

    if ($login['error'] === 0 && $login['status'] >= 200 && $login['status'] < 300 && is_string($sessionCookie) && $sessionCookie !== '') {
        $nameParts = preg_split('/\s+/u', $fullName, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $firstName = array_shift($nameParts) ?: 'Website';
        $lastName = implode(' ', $nameParts) ?: 'Lead';
        $notes = implode("\n", array_filter([
            'Inbound AI consultation request',
            'Objective: ' . $objective,
            clean_value($body['details'] ?? '', 3000) !== '' ? 'Details: ' . clean_value($body['details'] ?? '', 3000) : '',
            clean_value($body['campaign'] ?? '', 180) !== '' ? 'Campaign: ' . clean_value($body['campaign'] ?? '', 180) : '',
            'Variant: ' . clean_value($body['campaignVariant'] ?? 'general', 100),
            'Landing page: ' . clean_value($body['landingPage'] ?? '', 600),
        ]));
        $delivery = post_json('https://sales.oswelltechnologies.com/api/leads', [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'job_title' => 'Business decision-maker',
            'company_name' => $company,
            'industry' => $industry,
            'website' => $website,
            'work_email' => $email,
            'phone' => clean_value($body['phone'] ?? '', 80),
            'email_status' => 'Provided',
            'stage' => 'New Lead',
            'source' => 'Lead from Website',
            'priority' => 'High',
            'next_action' => 'Review inbound website enquiry',
            'notes' => $notes,
            'potential_pain_points' => clean_value($body['details'] ?? '', 1500),
            'ai_opportunities' => $objective,
            'recommended_solution' => $objective,
            'personalization_notes' => 'Inbound request from ' . $fullName . ' at ' . $company,
        ], ['Cookie: ' . $sessionCookie]);
    } else {
        $delivery = $login;
    }
}

if ($delivery['error'] !== 0 || $delivery['status'] < 200 || $delivery['status'] >= 300) {
    error_log('Oswell lead delivery failed with CRM status ' . (int)$delivery['status']);
    respond(503, ['message' => 'We could not securely deliver your request. Please try again or book a call.']);
}

respond(201, ['leadId' => $leadId, 'accepted' => true]);
