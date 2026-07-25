<?php
/**
 * Copy this file to mail-config.php (same folder) and fill in the real
 * password — do NOT commit mail-config.php to git, it's already listed
 * in .gitignore. Create it directly on the server via Hostinger's File
 * Manager (or SFTP), never through a commit, so the password never ends
 * up in the repo history or in anyone else's local clone.
 */

return [
    'smtp_host'       => 'smtp.hostinger.com',
    'smtp_port'       => 465,
    'smtp_secure'     => 'ssl', // implicit SSL, matches port 465
    'smtp_username'   => 'info@weone.tech',
    'smtp_password'   => 'REPLACE_WITH_REAL_MAILBOX_PASSWORD',
    'from_email'      => 'info@weone.tech',
    'from_name'       => 'WeOne Website',
    'to_email'        => 'info@weone.tech',
    'to_name'         => 'WeOne Team',
];
