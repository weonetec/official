<?php
/**
 * Shared HTML wrapper for every outbound email (lead notification,
 * sender confirmation, verification code) so they all look like they
 * came from the same place. Table-based layout + inline CSS throughout,
 * on purpose — that's still the most reliable way to get consistent
 * rendering across Gmail/Outlook/Apple Mail, which don't support modern
 * CSS (flexbox, grid, external stylesheets, custom @font-face) the way
 * browsers do.
 */

/**
 * @param string $preheader Short hidden preview text (what shows next to
 *                           the subject line in an inbox list).
 * @param string $heading    Big title inside the card.
 * @param string $bodyHtml   Already-escaped/built inner HTML for the card body.
 */
function pp_email_html($preheader, $heading, $bodyHtml) {
    $logoUrl = 'https://weone.tech/assets/images/logo/weone-logo.svg';
    $accent = '#B2DF48';
    $ink = '#111318';
    $muted = '#6b7280';
    $border = '#e8e8ea';

    ob_start();
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo htmlspecialchars($heading); ?></title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f2; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        <?php echo htmlspecialchars($preheader); ?>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f2; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#0d0d0d; border-radius:20px 20px 0 0; overflow:hidden;">
                    <tr>
                        <td style="padding:28px 40px; background-color:#0d0d0d;">
                            <img src="<?php echo $logoUrl; ?>" alt="WeOne" height="28" style="display:block; height:28px; width:auto; border:0;">
                        </td>
                    </tr>
                </table>

                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid <?php echo $border; ?>; border-top:none;">
                    <tr>
                        <td style="padding:8px 0; background-color:<?php echo $accent; ?>;"></td>
                    </tr>
                    <tr>
                        <td style="padding:40px 40px 8px;">
                            <h1 style="margin:0; font-size:24px; line-height:1.3; color:<?php echo $ink; ?>; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
                                <?php echo htmlspecialchars($heading); ?>
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 40px 40px; color:<?php echo $ink; ?>; font-size:15px; line-height:1.65;">
                            <?php echo $bodyHtml; ?>
                        </td>
                    </tr>
                </table>

                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
                    <tr>
                        <td style="padding:24px 40px; text-align:center; color:<?php echo $muted; ?>; font-size:12px; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
                            WeOne &middot; Spcenex, 361, Purbachal, Kalitala Road, Kolkata 700078<br>
                            <a href="https://weone.tech" style="color:<?php echo $muted; ?>; text-decoration:underline;">weone.tech</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    <?php
    return ob_get_clean();
}

/** A labeled row inside the details table used by the notification email. */
function pp_email_row($label, $value) {
    if ($value === '' || $value === null) return '';
    return '<tr>'
        . '<td style="padding:10px 0; border-bottom:1px solid #eee; width:140px; color:#6b7280; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; vertical-align:top;">' . htmlspecialchars($label) . '</td>'
        . '<td style="padding:10px 0; border-bottom:1px solid #eee; color:#111318; font-size:15px; vertical-align:top;">' . nl2br(htmlspecialchars($value)) . '</td>'
        . '</tr>';
}

/** A pill/tag, used for the selected services list. */
function pp_email_tag($text) {
    return '<span style="display:inline-block; background:#eef7d9; color:#4a6b12; border-radius:999px; padding:4px 12px; font-size:13px; margin:0 6px 6px 0;">' . htmlspecialchars($text) . '</span>';
}
