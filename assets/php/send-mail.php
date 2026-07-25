<?php
/**
 * Receives the project popup form (assets/js/popup.js) and relays it via
 * SMTP through PHPMailer. Always responds with JSON so the frontend can
 * show a real success/error state instead of assuming success.
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

$configPath = __DIR__ . '/mail-config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mail is not configured yet on the server.']);
    exit;
}
$config = require $configPath;

// Honeypot — a hidden field real visitors never fill in. Any value here
// means a bot filled every field it could find; pretend success so it
// doesn't learn to look elsewhere, but skip actually sending.
if (!empty($_POST['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

function field($name) {
    return isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
}

$name    = field('name');
$email   = field('email');
$phone   = field('phone');
$company = field('company');
$budget  = field('budget');
$timeline = field('timeline');
$brief   = field('brief');
$source  = field('source');
$services = isset($_POST['service']) && is_array($_POST['service']) ? $_POST['service'] : [];

$errors = [];
if ($name === '') $errors[] = 'Name is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email is required.';
if (empty($services)) $errors[] = 'At least one service is required.';
if ($brief === '') $errors[] = 'Project brief is required.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

$mail = new PHPMailer\PHPMailer\PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->Port       = $config['smtp_port'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp_username'];
    $mail->Password   = $config['smtp_password'];
    $mail->SMTPSecure = $config['smtp_secure'] === 'ssl'
        ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet    = 'UTF-8';

    // From must be the authenticated mailbox — most SMTP providers (Hostinger
    // included) reject or flag mail whose From doesn't match the logged-in
    // account. Reply-To is the actual lead, so hitting "reply" in the inbox
    // goes straight to them, not back to yourself.
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email'], $config['to_name']);
    $mail->addReplyTo($email, $name);

    $mail->Subject = 'New project inquiry from ' . $name;

    $lines = [];
    $lines[] = 'Name: ' . $name;
    $lines[] = 'Email: ' . $email;
    if ($phone !== '') $lines[] = 'Phone: ' . $phone;
    if ($company !== '') $lines[] = 'Company: ' . $company;
    $lines[] = 'Service(s): ' . implode(', ', $services);
    if ($budget !== '') $lines[] = 'Budget: ' . $budget;
    if ($timeline !== '') $lines[] = 'Timeline: ' . $timeline;
    if ($source !== '') $lines[] = 'Heard about us via: ' . $source;
    $lines[] = '';
    $lines[] = 'Project brief:';
    $lines[] = $brief;

    $mail->isHTML(false);
    $mail->Body = implode("\n", $lines);

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Could not send the message. Please try again shortly.']);
}
