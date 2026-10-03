// ================================================
// FLOATING WHATSAPP BUTTON — shared across every page.
// Self-contained (injects its own styles + markup) so adding it
// site-wide only needs one <script> tag per page, no HTML duplication —
// same pattern as popup.js. Fixed bottom-right on every screen size;
// .mobile-sticky-cta (the "Get A Call Back" pill) is centered at the
// bottom on mobile, so the two never overlap.
// ================================================
(function () {
    var PHONE = '916289224534'; // +91 6289 224 534, no spaces/plus (wa.me format)
    var MESSAGE = "Hi WeOne! I'd like to know more about your services.";

    var STYLE = '' +
        '.wa-float-btn {' +
        '  position: fixed;' +
        '  right: 20px;' +
        '  bottom: calc(20px + env(safe-area-inset-bottom));' +
        '  z-index: 850;' +
        '  width: 58px;' +
        '  height: 58px;' +
        '  border-radius: 50%;' +
        '  background: #25D366;' +
        '  display: flex;' +
        '  align-items: center;' +
        '  justify-content: center;' +
        '  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35), 0 0 0 0 rgba(37, 211, 102, 0.6);' +
        '  text-decoration: none;' +
        '  transition: transform 0.2s ease, box-shadow 0.2s ease;' +
        '  animation: wa-pulse 2.6s ease-out infinite;' +
        '}' +
        '.wa-float-btn:hover { transform: scale(1.08); }' +
        '.wa-float-btn svg { width: 30px; height: 30px; display: block; }' +
        '@keyframes wa-pulse {' +
        '  0% { box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35), 0 0 0 0 rgba(37, 211, 102, 0.55); }' +
        '  70% { box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35), 0 0 0 14px rgba(37, 211, 102, 0); }' +
        '  100% { box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35), 0 0 0 0 rgba(37, 211, 102, 0); }' +
        '}' +
        '@media (prefers-reduced-motion: reduce) { .wa-float-btn { animation: none; } }' +
        '@media (max-width: 575px) {' +
        '  .wa-float-btn { width: 52px; height: 52px; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); }' +
        '  .wa-float-btn svg { width: 27px; height: 27px; }' +
        '}';

    var ICON_SVG = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#fff" aria-hidden="true">' +
        '<path d="M16.004 3C9.096 3 3.5 8.596 3.5 15.504c0 2.37.664 4.65 1.92 6.645L3 29l7.02-2.383a12.44 12.44 0 0 0 5.984 1.527h.005c6.907 0 12.503-5.596 12.503-12.504C28.512 8.732 22.912 3 16.004 3zm0 22.73h-.004a10.39 10.39 0 0 1-5.3-1.452l-.38-.226-3.934 1.335 1.355-3.834-.248-.393a10.37 10.37 0 0 1-1.588-5.556c0-5.752 4.684-10.436 10.44-10.436 2.79 0 5.412 1.088 7.384 3.063a10.37 10.37 0 0 1 3.058 7.386c0 5.752-4.684 10.113-10.783 10.113zm5.723-7.81c-.313-.157-1.853-.914-2.14-1.018-.287-.105-.497-.157-.706.157-.21.313-.81 1.018-.994 1.227-.183.21-.366.236-.679.079-.313-.157-1.322-.487-2.518-1.553-.931-.83-1.56-1.856-1.744-2.169-.183-.314-.02-.483.138-.64.142-.14.313-.366.47-.549.157-.183.209-.314.313-.523.105-.21.052-.393-.026-.55-.079-.157-.706-1.701-.967-2.33-.254-.612-.512-.53-.706-.54-.183-.01-.393-.012-.602-.012-.21 0-.55.079-.838.393-.287.314-1.096 1.072-1.096 2.615s1.122 3.033 1.279 3.243c.157.21 2.207 3.37 5.35 4.726.747.323 1.33.515 1.784.659.75.238 1.432.205 1.972.124.6-.09 1.853-.757 2.115-1.489.262-.73.262-1.357.183-1.488-.078-.132-.288-.21-.6-.366z"/>' +
        '</svg>';

    function init() {
        if (document.getElementById('waFloatBtn')) return; // never double-inject

        var style = document.createElement('style');
        style.textContent = STYLE;
        document.head.appendChild(style);

        var link = document.createElement('a');
        link.id = 'waFloatBtn';
        link.className = 'wa-float-btn';
        link.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(MESSAGE);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Chat with WeOne on WhatsApp');
        link.innerHTML = ICON_SVG;

        document.body.appendChild(link);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
