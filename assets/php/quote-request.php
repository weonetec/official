<?php
/**
 * Step 1 of the private quotation gate (quote-dmdigitals.php): takes the
 * visitor's name/phone/email and sends a 6-digit verification code to the
 * address they typed, using the same branded template as every other
 * outbound email on the site.
 *
 * Deliberately its own session bucket ($_SESSION['quote_verify'] /
 * $_SESSION['quote_access']) rather than reusing pp_verify — verifying an
 * email here must not also verify it for the main contact popup, or vice
 * versa.
 *
 * The team lead-notification email is intentionally NOT sent here — this
 * endpoint runs before the visitor has proven they control the email they
 * typed, so gating the team notification on it would let anyone (no code,
 * no real inbox needed) trigger an email to the team on every POST. That
 * notification is sent from quote-verify.php instead, only once a code
 * has actually been confirmed.
 */

header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

require __DIR__ . '/config-loader.php';
$config = pp_load_mail_config();
if (!$config) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mail is not configured yet on the server.']);
    exit;
}

// Honeypot — same convention as send-mail.php. Pretend success, send nothing.
if (!empty($_POST['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

$name  = isset($_POST['name']) ? trim((string) $_POST['name']) : '';
$phone = isset($_POST['phone']) ? trim((string) $_POST['phone']) : '';
$email = isset($_POST['email']) ? trim((string) $_POST['email']) : '';

$errors = [];
if ($name === '') $errors[] = 'Name is required.';
if ($phone === '') $errors[] = 'Phone number is required.';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email is required.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

if (!isset($_SESSION['quote_verify']) || !is_array($_SESSION['quote_verify'])) {
    $_SESSION['quote_verify'] = [];
}

$existing = isset($_SESSION['quote_verify'][$email]) ? $_SESSION['quote_verify'][$email] : null;
if ($existing && (time() - $existing['last_sent']) < 45) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Please wait a moment before requesting another code.']);
    exit;
}

$code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$alreadyNotified = $existing && !empty($existing['notified']);

$_SESSION['quote_verify'][$email] = [
    'code_hash' => password_hash($code, PASSWORD_DEFAULT),
    'expires'   => time() + 600, // 10 minutes
    'attempts'  => 0,
    'last_sent' => time(),
    'notified'  => $alreadyNotified, // carried over — set true by quote-verify.php once sent
    'name'      => $name,
    'phone'     => $phone,
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
    $mail->isHTML(true);

    // Send the verification code to the visitor. The team is deliberately
    // NOT notified here — see the file header comment — that happens in
    // quote-verify.php once this address is actually confirmed.
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($email, $name);
    $mail->Subject = 'Your access code for the DM Digitals quotation';

    $body = ''
        . '<p style="margin:0 0 20px;">Hey ' . htmlspecialchars($name) . ',</p>'
        . '<p style="margin:0 0 20px;">Use the code below to view your photography website quotation from WeOne.</p>'
        . '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">'
        . '<tr><td style="background:#f3f4f2; border-radius:12px; padding:20px 32px; font-size:32px; font-weight:700; letter-spacing:8px; color:#111318; font-family:\'Segoe UI\', Helvetica, Arial, sans-serif;">' . htmlspecialchars($code) . '</td></tr>'
        . '</table>'
        . '<p style="margin:0; color:#6b7280; font-size:13px;">This code expires in 10 minutes. If you didn\'t request this, you can safely ignore it.</p>';

    $mail->isHTML(true);
    $mail->Body = pp_email_html('Your DM Digitals quotation access code', 'Your Quotation Access Code', $body);
    $mail->AltBody = "Hey $name,\n\nYour access code for the DM Digitals photography quotation is: $code\nThis code expires in 10 minutes.";

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Could not send the code. Please try again shortly.']);
}
