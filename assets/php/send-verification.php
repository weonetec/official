<?php
/**
 * Step 1 of email verification: generate a 6-digit code, remember it in
 * the visitor's session (hashed, not plaintext — cheap extra safety, no
 * real cost since PHP sessions are already server-side only), and email
 * it to the address they typed in. No database — a session is exactly
 * "state tied to this one visitor filling out this one form," which is
 * all this needs.
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

$email = isset($_POST['email']) ? trim((string) $_POST['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Enter a valid email address first.']);
    exit;
}

if (!isset($_SESSION['pp_verify']) || !is_array($_SESSION['pp_verify'])) {
    $_SESSION['pp_verify'] = [];
}

$existing = isset($_SESSION['pp_verify'][$email]) ? $_SESSION['pp_verify'][$email] : null;
if ($existing && (time() - $existing['last_sent']) < 45) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Please wait a moment before requesting another code.']);
    exit;
}

$code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

$_SESSION['pp_verify'][$email] = [
    'code_hash' => password_hash($code, PASSWORD_DEFAULT),
    'expires'   => time() + 600, // 10 minutes
    'attempts'  => 0,
    'verified'  => false,
    'last_sent' => time(),
];

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';
require __DIR__ . '/email-template.php';

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

    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($email);

    $mail->Subject = 'Your WeOne verification code: ' . $code;

    $body = ''
        . '<p style="margin:0 0 20px;">Use the code below to verify your email address on the WeOne project inquiry form.</p>'
        . '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">'
        . '<tr><td style="background:#f3f4f2; border-radius:12px; padding:20px 32px; font-size:32px; font-weight:700; letter-spacing:8px; color:#111318; font-family:\'Segoe UI\', Helvetica, Arial, sans-serif;">' . htmlspecialchars($code) . '</td></tr>'
        . '</table>'
        . '<p style="margin:0; color:#6b7280; font-size:13px;">This code expires in 10 minutes. If you didn\'t request this, you can safely ignore it.</p>';

    $mail->isHTML(true);
    $mail->Body = pp_email_html('Your WeOne verification code', 'Verify your email', $body);
    $mail->AltBody = "Your WeOne verification code is: $code\nThis code expires in 10 minutes.";

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Could not send the verification code. Please try again shortly.']);
}
