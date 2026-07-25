<?php
/**
 * Copy this file to mail-config.php and fill in the real password — do
 * NOT commit mail-config.php to git, it's already listed in .gitignore.
 * Create it directly on the server via Hostinger's File Manager (or
 * SFTP), never through a commit, so the password never ends up in the
 * repo history or in anyone else's local clone.
 *
 * IMPORTANT — where to put it: Hostinger's Git auto-deploy re-syncs the
 * deployed folder on every deploy, which wipes out any file that isn't
 * tracked by git. So put mail-config.php ONE LEVEL ABOVE the folder this
 * site is deployed into (e.g. if the site lives in
 * public_html/test/, put it in public_html/ instead), not inside
 * assets/php/ alongside this sample. config-loader.php checks that
 * location first automatically. It only falls back to assets/php/ (this
 * folder) for local development with PHP's built-in server, where
 * "outside the deployed folder" doesn't apply.
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
