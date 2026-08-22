// ================================================
// LEAD POPUPS — shared across every page.
//
// One implementation, configured twice:
//   • "project" — the general Got A Project? form, opened by anything
//     with class="js-open-popup". Present on every page.
//   • "plan" — the pricing-page form, opened by class="js-open-plan-popup".
//     Same fields minus Project Budget, plus Industry, and it echoes the
//     plan the visitor clicked back at them before they submit.
//
// Both are built by createPopup() below so validation, email verification
// and submission live in exactly one place. Every id inside the template
// is namespaced with the instance prefix — two popups coexist in the DOM,
// so a bare id like "ppSuccess" would collide and getElementById would
// silently return whichever came first. Lookups are scoped to the popup
// root for the same reason.
//
// Submission posts to assets/php/send-mail.php. Both popups use the same
// endpoint; the plan popup just carries extra fields (plan, billing).
// ================================================
(function () {

    // The lime arrow that rides along in the submit button. Takes the
    // instance prefix so its clipPath id stays unique per popup.
    function submitIcon(prefix) {
        var clip = prefix + 'Clip';
        return '<span class="cta-icon"><svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<g clip-path="url(#' + clip + ')"><path d="M6.99999 13.4178C7.52032 13.4178 8.03482 13.4085 8.54232 13.391C11.172 13.2982 13.2977 11.1726 13.3904 8.54292C13.4085 8.03542 13.4172 7.52092 13.4172 7.00058C13.4172 6.48025 13.4079 5.96575 13.3904 5.45825C13.2977 2.82858 11.172 0.702914 8.54232 0.610165C8.03482 0.592081 7.52032 0.583331 6.99999 0.583331C6.47965 0.583331 5.96515 0.592665 5.45765 0.610165C2.8274 0.702914 0.701737 2.82858 0.608987 5.45883C0.590903 5.96633 0.582153 6.48083 0.582153 7.00116C0.582153 7.5215 0.591487 8.036 0.608987 8.5435C0.701737 11.1726 2.8274 13.2982 5.45765 13.3904C5.96515 13.4085 6.47965 13.4178 6.99999 13.4178ZM4.30499 9.49725C4.07515 9.24933 4.08974 8.86142 4.33824 8.63217L7.87557 5.35442L5.76099 5.138C5.60699 5.12225 5.47165 5.0505 5.37424 4.94491C5.25874 4.82067 5.19515 4.64858 5.2144 4.466C5.24882 4.13 5.54924 3.885 5.88582 3.92L9.15132 4.256C9.36015 4.26242 9.55324 4.34991 9.69499 4.50333C9.83615 4.65558 9.90907 4.8545 9.90032 5.02075L9.98607 8.34575C9.9954 8.68408 9.72765 8.96525 9.39049 8.974C9.20674 8.97866 9.04049 8.90225 8.92499 8.778C8.82757 8.673 8.76632 8.533 8.76224 8.37783L8.70857 6.25275L5.17065 9.5305C4.92274 9.76033 4.53482 9.74517 4.30499 9.49725Z" fill="#B2DF48"/></g>' +
            '<defs><clipPath id="' + clip + '"><rect width="14" height="14" fill="white" transform="translate(0 14) rotate(-90)"/></clipPath></defs></svg></span>';
    }

    function buildMarkup(cfg) {
        var p = cfg.prefix;
        return '' +
            '<div id="' + p + 'Overlay" class="pp-overlay">' +
            '  <div class="pp-modal" data-lenis-prevent>' +
            '    <button type="button" class="pp-close" aria-label="Close">&times;</button>' +
            '    <div class="pp-header">' +
            '      <span class="pp-tag">' + cfg.tag + '</span>' +
            '      <h2 class="pp-title">' + cfg.title + '</h2>' +
            '      <p class="pp-sub">' + cfg.sub + '</p>' +
            '    </div>' +
            (cfg.planBadge
                ? '    <div class="pp-plan-badge" hidden>' +
                  '      <span class="pp-plan-badge-label">Selected plan</span>' +
                  '      <span class="pp-plan-badge-value"></span>' +
                  '    </div>'
                : '') +
            '    <form class="pp-form" id="' + p + 'Form" novalidate>' +
            '      <input type="text" name="website" class="pp-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            (cfg.planBadge
                ? '      <input type="hidden" name="plan">' +
                  '      <input type="hidden" name="billing">'
                : '') +
            '      <div class="pp-row">' +
            '        <div class="pp-field">' +
            '          <label>Your Name <span>*</span></label>' +
            '          <input type="text" name="name" placeholder="John Doe" required>' +
            '          <span class="pp-error-msg"></span>' +
            '        </div>' +
            '        <div class="pp-field">' +
            '          <label>Email Address <span>*</span></label>' +
            '          <div class="pp-email-row">' +
            '            <input type="email" name="email" placeholder="john@company.com" required>' +
            '            <button type="button" class="pp-verify-btn">Verify</button>' +
            '          </div>' +
            '          <span class="pp-error-msg"></span>' +
            '          <div class="pp-verify-code-row" style="display:none;">' +
            '            <input type="text" class="pp-verify-code-input" placeholder="6-digit code" maxlength="6" inputmode="numeric" autocomplete="one-time-code">' +
            '            <button type="button" class="pp-verify-code-btn">Confirm</button>' +
            '          </div>' +
            '          <span class="pp-verify-status"></span>' +
            '        </div>' +
            '      </div>' +
            '      <div class="pp-row">' +
            '        <div class="pp-field">' +
            '          <label>Phone Number</label>' +
            '          <input type="tel" name="phone" placeholder="+91 00000 00000">' +
            '        </div>' +
            '        <div class="pp-field">' +
            '          <label>Company / Brand Name</label>' +
            '          <input type="text" name="company" placeholder="Your Company">' +
            '        </div>' +
            '      </div>' +
            (cfg.industry
                ? '      <div class="pp-field pp-full">' +
                  '        <label>Industry</label>' +
                  '        <input type="text" name="industry" placeholder="E-commerce, Healthcare, Real Estate...">' +
                  '      </div>'
                : '') +
            '      <div class="pp-field pp-full">' +
            '        <label>Service Required <span>*</span></label>' +
            '        <div class="pp-service-grid">' +
            '          <label class="pp-chip"><input type="checkbox" name="service[]" value="ui-ux"> UI/UX Design</label>' +
            '          <label class="pp-chip"><input type="checkbox" name="service[]" value="branding"> Logo &amp; Branding</label>' +
            '          <label class="pp-chip"><input type="checkbox" name="service[]" value="web-dev"> Web Development</label>' +
            '          <label class="pp-chip"><input type="checkbox" name="service[]" value="motion"> Motion &amp; Animation</label>' +
            '          <label class="pp-chip"><input type="checkbox" name="service[]" value="social"> Social Media Design</label>' +
            '          <label class="pp-chip"><input type="checkbox" name="service[]" value="other"> Other</label>' +
            '        </div>' +
            '        <span class="pp-error-msg"></span>' +
            '      </div>' +
            (cfg.budget
                ? '      <div class="pp-field pp-full">' +
                  '        <label>Project Budget</label>' +
                  '        <div class="pp-slider-wrap">' +
                  '          <div class="pp-slider-value"></div>' +
                  '          <input type="range" class="pp-slider" min="0" max="6" step="1" value="0" aria-label="Project budget range">' +
                  '          <div class="pp-slider-labels"><span>Under 7-12K</span><span>15-20K</span><span>30-50K</span><span>70-1L</span><span>1L+</span><span>2L+</span><span>3L+</span></div>' +
                  '        </div>' +
                  '        <input type="hidden" name="budget">' +
                  '      </div>'
                : '') +
            '      <div class="pp-field pp-full">' +
            '        <label>Timeline</label>' +
            '        <div class="pp-pill-row">' +
            '          <label class="pp-chip"><input type="radio" name="timeline" value="ASAP"> ASAP</label>' +
            '          <label class="pp-chip"><input type="radio" name="timeline" value="Within 1 month"> Within 1 month</label>' +
            '          <label class="pp-chip"><input type="radio" name="timeline" value="1-3 months"> 1-3 months</label>' +
            '          <label class="pp-chip"><input type="radio" name="timeline" value="3+ months"> 3+ months</label>' +
            '        </div>' +
            '      </div>' +
            '      <div class="pp-field pp-full">' +
            '        <label>' + cfg.briefLabel + ' <span>*</span></label>' +
            '        <textarea name="brief" rows="4" placeholder="' + cfg.briefPlaceholder + '" required></textarea>' +
            '        <span class="pp-error-msg"></span>' +
            '      </div>' +
            '      <div class="pp-field pp-full">' +
            '        <label>How did you hear about us?</label>' +
            '        <input type="text" name="source" placeholder="Instagram, Google, Referral...">' +
            '      </div>' +
            '      <span class="pp-submit-error"></span>' +
            '      <button type="submit" class="pp-submit">' +
            '        <span class="pp-submit-label">' + cfg.submitLabel + '</span>' +
            submitIcon(p) +
            '        <span class="btn-glow-layer"></span>' +
            '        <div class="btn-inner-shadow mini"></div>' +
            '      </button>' +
            '    </form>' +
            '    <div class="pp-success">' +
            '      <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#B2DF4820"/><path d="M16 28l8 8 16-16" stroke="#B2DF48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '      <h3>' + cfg.successTitle + '</h3>' +
            '      <p>' + cfg.successBody + '</p>' +
            '    </div>' +
            '  </div>' +
            '</div>';
    }

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var BUDGET_LABELS = ['Under 7-12K', '15-20K', '30-50K', '70-1L', '1L+', '2L+', '3L+'];

    // On pages that run Lenis (index.html), it drives scrolling itself via
    // intercepted wheel/touch events, so body.style.overflow alone doesn't
    // stop the page behind the popup from scrolling — it has to be paused
    // directly. `typeof lenis` (not `window.lenis`) is the correct check:
    // Lenis is declared with `const` in index.html's own inline script,
    // which never becomes a window property; on every other page `lenis`
    // was never declared at all, and `typeof` on an undeclared name is
    // safely 'undefined' rather than throwing.
    function pauseLenis() { if (typeof lenis !== 'undefined' && lenis) lenis.stop(); }
    function resumeLenis() { if (typeof lenis !== 'undefined' && lenis) lenis.start(); }

    function createPopup(cfg) {
        document.body.insertAdjacentHTML('beforeend', buildMarkup(cfg));

        var overlay = document.getElementById(cfg.prefix + 'Overlay');
        var form = overlay.querySelector('.pp-form');
        var success = overlay.querySelector('.pp-success');
        var closeBtn = overlay.querySelector('.pp-close');
        var submitBtn = overlay.querySelector('.pp-submit');
        var submitLabel = submitBtn.querySelector('.pp-submit-label');
        var submitError = overlay.querySelector('.pp-submit-error');
        var serviceGrid = overlay.querySelector('.pp-service-grid');

        // Mouse-follow glow — same --x/--y recipe main.js wires up for every
        // .cta-btn, repeated here because main.js's querySelectorAll runs at
        // parse time, before this button is injected.
        submitBtn.addEventListener('mousemove', function (e) {
            var rect = submitBtn.getBoundingClientRect();
            submitBtn.style.setProperty('--x', ((e.clientX - rect.left) / rect.width) * 100 + '%');
            submitBtn.style.setProperty('--y', ((e.clientY - rect.top) / rect.height) * 100 + '%');
        });
        submitBtn.addEventListener('mouseleave', function () {
            submitBtn.style.removeProperty('--x');
            submitBtn.style.removeProperty('--y');
        });

        // ---- Budget slider (project popup only) ----
        // Native range input styled to match the form, stepping through the
        // same seven brackets the labels display. The slider's value is just
        // an index (0-6); the bracket label it maps to is written to the
        // hidden "budget" input, so the backend gets a readable string.
        var budgetSlider = overlay.querySelector('.pp-slider');
        var budgetValue = overlay.querySelector('.pp-slider-value');
        var budgetInput = form.querySelector('[name="budget"]');

        function syncBudgetSlider() {
            if (!budgetSlider) return;
            var label = BUDGET_LABELS[budgetSlider.value];
            budgetValue.textContent = label;
            budgetInput.value = label;
            var pct = (budgetSlider.value / (budgetSlider.max - budgetSlider.min)) * 100;
            budgetSlider.style.setProperty('--pp-slider-pct', pct + '%');
        }
        if (budgetSlider) {
            budgetSlider.addEventListener('input', syncBudgetSlider);
            syncBudgetSlider();
        }

        // ---- Selected-plan badge (plan popup only) ----
        var planBadge = overlay.querySelector('.pp-plan-badge');
        var planBadgeValue = overlay.querySelector('.pp-plan-badge-value');
        var planInput = form.querySelector('[name="plan"]');
        var billingInput = form.querySelector('[name="billing"]');

        // Reads the plan off the clicked card button. Billing mode comes from
        // the pricing grid's data-active, so "Basic" submitted from the
        // Monthly tab is distinguishable from the same card on One-time.
        function applyPlanFrom(trigger) {
            if (!planBadge) return;
            var plan = trigger && trigger.getAttribute('data-plan');
            if (!plan) {
                planBadge.hidden = true;
                if (planInput) planInput.value = '';
                if (billingInput) billingInput.value = '';
                return;
            }
            var grid = document.querySelector('.pricing-grid');
            var mode = grid && grid.getAttribute('data-active') === 'monthly' ? 'Monthly' : 'One-time';
            planBadge.hidden = false;
            planBadgeValue.textContent = plan + ' · ' + mode;
            if (planInput) planInput.value = plan;
            if (billingInput) billingInput.value = mode;
        }

        function openPopup(trigger) {
            form.style.display = '';
            success.style.display = 'none';
            applyPlanFrom(trigger);
            overlay.classList.add('pp-open');
            document.body.style.overflow = 'hidden';
            pauseLenis();
        }

        function closePopup() {
            overlay.classList.remove('pp-open');
            document.body.style.overflow = '';
            resumeLenis();
        }

        function resetForm() {
            form.reset();
            clearErrors();
            resetVerification();
            syncBudgetSlider();
        }

        // Delegated on document, not the buttons themselves — works for every
        // current and future trigger element on the page.
        document.addEventListener('click', function (e) {
            var trigger = e.target.closest(cfg.trigger);
            if (trigger) {
                e.preventDefault();
                openPopup(trigger);
            }
        });

        closeBtn.addEventListener('click', closePopup);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closePopup();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('pp-open')) closePopup();
        });

        // ---- Validation ----
        function showError(el, message) {
            var wrap = el.closest('.pp-field');
            wrap.classList.add('has-error');
            var msg = wrap.querySelector('.pp-error-msg');
            if (msg) msg.textContent = message;
        }

        function clearError(el) {
            var wrap = el.closest('.pp-field');
            if (wrap) wrap.classList.remove('has-error');
        }

        function clearErrors() {
            form.querySelectorAll('.has-error').forEach(function (w) { w.classList.remove('has-error'); });
        }

        // ---- Email verification ----
        var emailInput = form.querySelector('[name="email"]');
        var verifyBtn = overlay.querySelector('.pp-verify-btn');
        var verifyCodeRow = overlay.querySelector('.pp-verify-code-row');
        var verifyCodeInput = overlay.querySelector('.pp-verify-code-input');
        var verifyCodeBtn = overlay.querySelector('.pp-verify-code-btn');
        var verifyStatus = overlay.querySelector('.pp-verify-status');
        var verifiedEmail = null; // the exact address currently confirmed verified
        var resendCooldownTimer = null;

        function setVerifyStatus(text, mode) {
            verifyStatus.textContent = text;
            verifyStatus.classList.toggle('is-error', mode === 'error');
            verifyStatus.classList.toggle('is-success', mode === 'success');
        }

        function resetVerification() {
            verifiedEmail = null;
            if (resendCooldownTimer) clearInterval(resendCooldownTimer);
            verifyCodeRow.style.display = 'none';
            verifyCodeInput.value = '';
            verifyBtn.style.display = '';
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify';
            setVerifyStatus('');
            emailInput.classList.remove('pp-email-verified');
        }

        // Editing the email after verifying invalidates that verification —
        // otherwise someone could verify their own address, then swap in a
        // different one and still get the form through.
        emailInput.addEventListener('input', function () {
            if (verifiedEmail && emailInput.value.trim() !== verifiedEmail) resetVerification();
        });

        function startResendCooldown() {
            var seconds = 45;
            verifyBtn.disabled = true;
            if (resendCooldownTimer) clearInterval(resendCooldownTimer);
            resendCooldownTimer = setInterval(function () {
                seconds--;
                if (seconds <= 0) {
                    clearInterval(resendCooldownTimer);
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Resend code';
                } else {
                    verifyBtn.textContent = 'Resend (' + seconds + 's)';
                }
            }, 1000);
        }

        verifyBtn.addEventListener('click', function () {
            var email = emailInput.value.trim();
            if (!EMAIL_RE.test(email)) {
                showError(emailInput, 'Enter a valid email address first.');
                return;
            }
            clearError(emailInput);
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Sending...';
            setVerifyStatus('');

            fetch('assets/php/send-verification.php', { method: 'POST', body: new URLSearchParams({ email: email }) })
                .then(function (res) { return res.json(); })
                .catch(function () { return { success: false, error: 'Could not reach the server.' }; })
                .then(function (result) {
                    if (!result || !result.success) {
                        verifyBtn.disabled = false;
                        verifyBtn.textContent = 'Verify';
                        setVerifyStatus((result && result.error) || 'Could not send the code.', 'error');
                        return;
                    }
                    verifyCodeRow.style.display = 'flex';
                    verifyBtn.textContent = 'Resend code';
                    setVerifyStatus('Code sent to ' + email + '.');
                    startResendCooldown();
                    verifyCodeInput.focus();
                });
        });

        verifyCodeBtn.addEventListener('click', function () {
            var email = emailInput.value.trim();
            var code = verifyCodeInput.value.trim();
            if (!code) { setVerifyStatus('Enter the code sent to your email.', 'error'); return; }

            verifyCodeBtn.disabled = true;
            verifyCodeBtn.textContent = 'Checking...';

            fetch('assets/php/verify-code.php', { method: 'POST', body: new URLSearchParams({ email: email, code: code }) })
                .then(function (res) { return res.json(); })
                .catch(function () { return { success: false, error: 'Could not reach the server.' }; })
                .then(function (result) {
                    verifyCodeBtn.disabled = false;
                    verifyCodeBtn.textContent = 'Confirm';
                    if (!result || !result.success) {
                        setVerifyStatus((result && result.error) || 'Invalid code.', 'error');
                        return;
                    }
                    verifiedEmail = email;
                    if (resendCooldownTimer) clearInterval(resendCooldownTimer);
                    verifyCodeRow.style.display = 'none';
                    verifyBtn.style.display = 'none';
                    emailInput.classList.add('pp-email-verified');
                    setVerifyStatus('Email verified', 'success');
                });
        });

        function validate() {
            clearErrors();
            var ok = true;

            var nameEl = form.querySelector('[name="name"]');
            if (!nameEl.value.trim()) { showError(nameEl, 'Please enter your name.'); ok = false; }

            var emailEl = form.querySelector('[name="email"]');
            var emailVal = emailEl.value.trim();
            if (!emailVal) { showError(emailEl, 'Please enter your email.'); ok = false; }
            else if (!EMAIL_RE.test(emailVal)) { showError(emailEl, 'Enter a valid email address.'); ok = false; }
            else if (verifiedEmail !== emailVal) { showError(emailEl, 'Please verify your email address.'); ok = false; }

            if (form.querySelectorAll('[name="service[]"]:checked').length === 0) {
                var svcWrap = serviceGrid.closest('.pp-field');
                svcWrap.classList.add('has-error');
                var svcMsg = svcWrap.querySelector('.pp-error-msg');
                if (svcMsg) svcMsg.textContent = 'Pick at least one service.';
                ok = false;
            }

            var briefEl = form.querySelector('[name="brief"]');
            if (!briefEl.value.trim()) { showError(briefEl, cfg.briefError); ok = false; }

            return ok;
        }

        // Clear a field's error the moment the visitor starts fixing it
        form.addEventListener('input', function (e) {
            if (e.target.matches('input, textarea, select')) clearError(e.target);
        });
        form.addEventListener('change', function (e) {
            if (e.target.name === 'service[]') {
                serviceGrid.closest('.pp-field').classList.remove('has-error');
            }
        });

        // ---- Submit ----
        // Posts to assets/php/send-mail.php, which relays the lead via SMTP
        // through PHPMailer. Always resolves with {success, error} — network
        // failures are caught and normalized to the same shape so the caller
        // only has one branch to handle.
        function submitLead(formData) {
            return fetch('assets/php/send-mail.php', {
                method: 'POST',
                body: formData
            })
                .then(function (res) { return res.json(); })
                .catch(function () {
                    return { success: false, error: 'Could not reach the server. Please check your connection and try again.' };
                });
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validate()) {
                var firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea, .has-error .pp-service-grid');
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            var data = new FormData(form);
            submitBtn.disabled = true;
            if (submitLabel) submitLabel.textContent = 'Sending...';
            if (submitError) submitError.textContent = '';

            submitLead(data).then(function (result) {
                submitBtn.disabled = false;
                if (submitLabel) submitLabel.textContent = cfg.submitLabel;

                if (!result || !result.success) {
                    if (submitError) submitError.textContent = (result && result.error) || 'Something went wrong. Please try again or email us at info@weone.tech.';
                    return;
                }

                form.style.display = 'none';
                success.style.display = 'flex';
                setTimeout(function () {
                    closePopup();
                    setTimeout(resetForm, 400);
                }, 3500);
            });
        });
    }

    function init() {
        // The general enquiry form — every page.
        createPopup({
            prefix: 'projectPopup',
            trigger: '.js-open-popup',
            tag: 'LET\'S WORK TOGETHER',
            title: 'Got A <span class="pp-accent">Project?</span>',
            sub: 'Tell us about your vision — we\'ll take it from here.',
            budget: true,
            industry: false,
            planBadge: false,
            briefLabel: 'Project Brief',
            briefPlaceholder: 'Describe your project, goals, and any references you love...',
            briefError: 'Tell us a little about your project.',
            submitLabel: 'Send My Brief',
            successTitle: 'We\'ve got your brief!',
            successBody: 'Our team will reach out within 24 hours. Meanwhile, follow us on Instagram for inspiration.'
        });

        // The pricing-plan form. Built only on pages that actually have a
        // trigger for it — otherwise every page would carry a second, dead
        // copy of the form (a spare email input and honeypot that browser
        // autofill can trip over). Any new page wanting this popup just
        // needs a .js-open-plan-popup element present at DOMContentLoaded.
        if (!document.querySelector('.js-open-plan-popup')) return;

        createPopup({
            prefix: 'planPopup',
            trigger: '.js-open-plan-popup',
            tag: 'LET\'S GET YOU STARTED',
            title: 'Start Your <span class="pp-accent">Plan</span>',
            sub: 'Tell us a little about your business and we\'ll set it up.',
            budget: false,
            industry: true,
            planBadge: true,
            briefLabel: 'What do you need?',
            briefPlaceholder: 'Tell us about your business, the pages you need, and anything specific...',
            briefError: 'Tell us a little about what you need.',
            submitLabel: 'Send My Request',
            successTitle: 'We\'ve got your request!',
            successBody: 'Our team will reach out within 24 hours to confirm your plan and get things moving.'
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
