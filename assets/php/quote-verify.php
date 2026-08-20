<?php
/**
 * Step 2 of the private quotation gate: checks the code against the hash
 * stored by quote-request.php. On a match, sets
 * $_SESSION['quote_access']['dmdigitals'] = true — the ONLY thing
 * quote-dmdigitals.php checks before it will echo any pricing content, so
 * this is the actual access-control decision, not just a UI unlock.
 *
 * Also sends the team lead-notification email here (once per email,
 * guarded by the same 'notified' flag quote-request.php initializes) —
 * deliberately AFTER the code check succeeds, not on the earlier request
 * step, so the team only hears about visitors who've actually proven they
 * control the email address they typed.
 */

header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

$email = isset($_POST['email']) ? trim((string) $_POST['email']) : '';
$code  = isset($_POST['code']) ? trim((string) $_POST['code']) : '';

if ($email === '' || $code === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Enter the code sent to your email.']);
    exit;
}

$entry = isset($_SESSION['quote_verify'][$email]) ? $_SESSION['quote_verify'][$email] : null;

if (!$entry) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Request a code for this email first.']);
    exit;
}

if (time() > $entry['expires']) {
    unset($_SESSION['quote_verify'][$email]);
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'That code has expired. Request a new one.']);
    exit;
}

if ($entry['attempts'] >= 5) {
    unset($_SESSION['quote_verify'][$email]);
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Too many attempts. Request a new code.']);
    exit;
}

$_SESSION['quote_verify'][$email]['attempts']++;

if (!password_verify($code, $entry['code_hash'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'That code isn\'t right. Please try again.']);
    exit;
}

if (!isset($_SESSION['quote_access']) || !is_array($_SESSION['quote_access'])) {
    $_SESSION['quote_access'] = [];
}
$_SESSION['quote_access']['dmdigitals'] = true;

// Best-effort team notification — wrapped separately so a transient SMTP
// failure here never blocks the access grant above; the visitor already
// proved ownership of the email and should not be locked out over a mail
// error on our side.
if (empty($entry['notified'])) {
    try {
        require __DIR__ . '/config-loader.php';
        $config = pp_load_mail_config();
        if ($config) {
            require __DIR__ . '/PHPMailer/Exception.php';
            require __DIR__ . '/PHPMailer/PHPMailer.php';
            require __DIR__ . '/PHPMailer/SMTP.php';
            require __DIR__ . '/email-template.php';

            $name  = isset($entry['name']) ? $entry['name'] : '';
            $phone = isset($entry['phone']) ? $entry['phone'] : '';

            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $config['smtp_host'];
            $mail->Port       = $config['smtp_port'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $config['smtp_username'];
            $mail->Password   = $config['smtp_password'];
            $mail->SMTPSecure = $config['smtp_secure'] === 'ssl'
                ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->CharSet = 'UTF-8';
            $mail->isHTML(true);

            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addAddress($config['to_email'], $config['to_name']);
            $mail->addReplyTo($email, $name);
            $mail->Subject = 'Quotation viewed — DM Digitals (' . $name . ')';

            $detailsRows = ''
                . pp_email_row('Name', $name)
                . pp_email_row('Email', $email)
                . pp_email_row('Phone', $phone)
                . pp_email_row('Quotation', 'Photography Website - DM Digitals');

            $notifyBody = ''
                . '<p style="margin:0 0 24px;">A visitor verified their email and is now viewing the private DM Digitals photography quotation.</p>'
                . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $detailsRows . '</table>';

            $mail->Body = pp_email_html('Quotation viewed', 'Quotation Viewed', $notifyBody);
            $mail->AltBody = "A visitor verified their email and is viewing the DM Digitals photography quotation.\nName: $name\nEmail: $email\nPhone: $phone";

            $mail->send();
            $_SESSION['quote_verify'][$email]['notified'] = true;
        }
    } catch (Exception $e) {
        // Swallow — the access grant above already succeeded and must stand.
    }
}

echo json_encode(['success' => true]);
