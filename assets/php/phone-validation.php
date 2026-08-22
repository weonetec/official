<?php
/**
 * Rejects obviously-fake phone numbers (all-repeated-digit, simple runs
 * like the "12345678901" pattern that's been getting submitted) without
 * needing real SMS/OTP verification, which isn't set up yet — that's a
 * paid service and deliberately deferred. Validates against the actual
 * Indian mobile numbering rule (10 digits, first digit 6-9) since that's
 * this business's real audience; accepts the number with or without a
 * leading +91/91/0.
 *
 * This is a format/sanity check, not proof the number is reachable — a
 * genuine but wrong number can still pass. It exists to stop the cheap,
 * obviously-fake submissions, not to replace real verification later.
 */
function pp_is_valid_phone($raw) {
    $digits = preg_replace('/\D/', '', (string) $raw);
    $local = $digits;

    if (strlen($local) === 12 && substr($local, 0, 2) === '91') {
        $local = substr($local, 2);
    } elseif (strlen($local) === 11 && substr($local, 0, 1) === '0') {
        $local = substr($local, 1);
    }

    if (strlen($local) !== 10) return false;
    if (!preg_match('/^[6-9]\d{9}$/', $local)) return false;
    if (preg_match('/^(\d)\1{9}$/', $local)) return false; // 6666666666, 9999999999, ...
    if ($local === '0123456789' || $local === '1234567890' || $local === '9876543210') return false;

    return true;
}
