<?php
/**
 * Locates mail-config.php. Hostinger's Git auto-deploy does a clean
 * re-sync of the deployed folder on every deploy, which wipes out any
 * file that isn't tracked by git — including a config file placed
 * directly alongside send-mail.php the way the very first version of
 * this did. So this looks OUTSIDE the deployed folder first (a location
 * auto-deploy never touches), and only falls back to the old in-repo
 * location for local dev convenience.
 *
 * Checked in order:
 *   1. Three levels above assets/php - i.e. one level above wherever the
 *      site itself is deployed (works whether that's public_html/ or a
 *      subfolder like public_html/test/). This is the recommended spot;
 *      it survives every redeploy since auto-deploy only touches the
 *      folder it's scoped to, not its parent.
 *   2. Two levels above assets/php - the site's own root, sibling to
 *      index.html. Still inside the deployed folder, so only a fallback.
 *   3. Right next to this file (assets/php/mail-config.php) - the
 *      original location, kept for local dev with the built-in PHP
 *      server where "outside the deployed folder" doesn't really apply.
 */
function pp_load_mail_config() {
    $candidates = [
        dirname(__DIR__, 3) . '/mail-config.php',
        dirname(__DIR__, 2) . '/mail-config.php',
        __DIR__ . '/mail-config.php',
    ];
    foreach ($candidates as $path) {
        if (file_exists($path)) return require $path;
    }
    return null;
}
