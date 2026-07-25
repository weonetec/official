<?php
/**
 * Step 2 of email verification: check the code the visitor typed back in
 * against the hash stored in send-verification.php's session entry. On
 * a match, marks that email verified for the rest of this session -
 * send-mail.php re-checks that flag itself before it'll actually send a
 * lead, so this can't be bypassed by skipping the JS and posting to it
 * directly.
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

$entry = isset($_SESSION['pp_verify'][$email]) ? $_SESSION['pp_verify'][$email] : null;

if (!$entry) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Request a code for this email first.']);
    exit;
}

if (time() > $entry['expires']) {
    unset($_SESSION['pp_verify'][$email]);
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'That code has expired. Request a new one.']);
    exit;
}

if ($entry['attempts'] >= 5) {
    unset($_SESSION['pp_verify'][$email]);
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Too many attempts. Request a new code.']);
    exit;
}

$_SESSION['pp_verify'][$email]['attempts']++;

if (!password_verify($code, $entry['code_hash'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'That code isn\'t right. Please try again.']);
    exit;
}

$_SESSION['pp_verify'][$email]['verified'] = true;
echo json_encode(['success' => true]);
