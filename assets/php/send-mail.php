<?php
/**
 * Receives the project popup form (assets/js/popup.js) and relays it via
 * SMTP through PHPMailer. Always responds with JSON so the frontend can
 * show a real success/error state instead of assuming success.
 *
 * Requires the submitted email to already be verified (see
 * send-verification.php / verify-code.php) - re-checked here server-side
 * so it can't be skipped by posting straight to this endpoint.
 */

header('Content-Type: application/json');
session_start();

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

$verified = isset($_SESSION['pp_verify'][$email]['verified']) && $_SESSION['pp_verify'][$email]['verified'] === true;
if (!$verified) $errors[] = 'Please verify your email address first.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';
require __DIR__ . '/email-template.php';

$SERVICE_LABELS = [
    'ui-ux'     => 'UI/UX Design',
    'branding'  => 'Logo & Branding',
    'web-dev'   => 'Web Development',
    'motion'    => 'Motion & Animation',
    'social'    => 'Social Media Design',
    'other'     => 'Other',
];
$serviceLabels = array_map(function ($s) use ($SERVICE_LABELS) {
    return isset($SERVICE_LABELS[$s]) ? $SERVICE_LABELS[$s] : $s;
}, $services);

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
    $mail->isHTML(true);

    // ---- 1. Notify the team ----
    // From must be the authenticated mailbox — most SMTP providers (Hostinger
    // included) reject or flag mail whose From doesn't match the logged-in
    // account. Reply-To is the actual lead, so hitting "reply" in the inbox
    // goes straight to them, not back to yourself.
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email'], $config['to_name']);
    $mail->addReplyTo($email, $name);
    $mail->Subject = 'New project inquiry from ' . $name;

    $detailsRows = ''
        . pp_email_row('Name', $name)
        . pp_email_row('Email', $email)
        . pp_email_row('Phone', $phone)
        . pp_email_row('Company', $company)
        . pp_email_row('Budget', $budget)
        . pp_email_row('Timeline', $timeline)
        . pp_email_row('Heard via', $source);

    $tagsHtml = '';
    foreach ($serviceLabels as $label) $tagsHtml .= pp_email_tag($label);

    $notifyBody = ''
        . '<p style="margin:0 0 24px;">A new lead came in through the website. Reply to this email to answer them directly.</p>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">' . $detailsRows . '</table>'
        . '<p style="margin:0 0 8px; color:#6b7280; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Service(s)</p>'
        . '<div style="margin:0 0 24px;">' . $tagsHtml . '</div>'
        . '<p style="margin:0 0 8px; color:#6b7280; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Project brief</p>'
        . '<p style="margin:0; white-space:pre-wrap;">' . nl2br(htmlspecialchars($brief)) . '</p>';

    $mail->Body = pp_email_html('New project inquiry from ' . $name, 'New Project Inquiry', $notifyBody);
    $mail->AltBody = "New project inquiry from $name\nEmail: $email\nPhone: $phone\nCompany: $company\nService(s): " . implode(', ', $serviceLabels) . "\nBudget: $budget\nTimeline: $timeline\nHeard via: $source\n\nBrief:\n$brief";

    $mail->send();

    // ---- 2. Confirm to the sender ----
    // Same visual template, different content, reset addressing since
    // PHPMailer keeps whatever was set on the first send() otherwise.
    $mail->clearAddresses();
    $mail->clearReplyTos();
    $mail->addAddress($email, $name);
    $mail->Subject = 'We\'ve got your brief — WeOne';

    $confirmBody = ''
        . '<p style="margin:0 0 20px;">Hey ' . htmlspecialchars($name) . ',</p>'
        . '<p style="margin:0 0 20px;">Thanks for reaching out — we\'ve received your project brief and our team will get back to you within 24 hours.</p>'
        . '<p style="margin:0 0 20px;">In the meantime, feel free to follow us on Instagram for a look at recent work.</p>'
        . '<p style="margin:0;">Talk soon,<br>The WeOne Team</p>';

    $mail->Body = pp_email_html('We\'ve received your project brief', 'We\'ve Got Your Brief!', $confirmBody);
    $mail->AltBody = "Hey $name,\n\nThanks for reaching out - we've received your project brief and our team will get back to you within 24 hours.\n\nTalk soon,\nThe WeOne Team";

    $mail->send();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Could not send the message. Please try again shortly.']);
}
