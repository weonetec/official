// ================================================
// PROJECT POPUP — shared across every page.
// The markup lives here as a single template (injected into the page on
// load) instead of being copy-pasted into all six HTML files, so there's
// one place to edit when the form itself needs to change.
//
// Any element anywhere on the page with class="js-open-popup" opens it —
// no per-button wiring needed, new CTAs just need that one class.
//
// Submission is simulated (submitLead() below) since there's no SMTP
// backend yet. Swap submitLead()'s body for a real fetch() POST once
// that's ready; the rest of the flow (validation, loading state, success
// screen) won't need to change.
// ================================================
(function () {
    var POPUP_HTML = '' +
        '<div id="projectPopupOverlay" class="pp-overlay">' +
        '  <div class="pp-modal" data-lenis-prevent>' +
        '    <button type="button" class="pp-close" id="closeProjectPopup" aria-label="Close">&times;</button>' +
        '    <div class="pp-header">' +
        '      <span class="pp-tag">LET\'S WORK TOGETHER</span>' +
        '      <h2 class="pp-title">Got A <span class="pp-accent">Project?</span></h2>' +
        '      <p class="pp-sub">Tell us about your vision — we\'ll take it from here.</p>' +
        '    </div>' +
        '    <form class="pp-form" id="projectForm" novalidate>' +
        '      <input type="text" name="website" class="pp-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">' +
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
        '      <div class="pp-row">' +
        '        <div class="pp-field">' +
        '          <label>Project Budget</label>' +
        '          <div class="pp-slider-wrap">' +
        '            <div class="pp-slider-value" id="ppBudgetValue"></div>' +
        '            <input type="range" class="pp-slider" id="ppBudgetSlider" min="0" max="3" step="1" value="0" aria-label="Project budget range">' +
        '            <div class="pp-slider-labels"><span>Under 50K</span><span>50K–1L</span><span>1L–3L</span><span>3L+</span></div>' +
        '          </div>' +
        '          <input type="hidden" name="budget">' +
        '        </div>' +
        '        <div class="pp-field">' +
        '          <label>Timeline</label>' +
        '          <select name="timeline">' +
        '            <option value="" disabled selected>When do you need it?</option>' +
        '            <option>ASAP</option>' +
        '            <option>Within 1 month</option>' +
        '            <option>1 – 3 months</option>' +
        '            <option>3+ months</option>' +
        '          </select>' +
        '        </div>' +
        '      </div>' +
        '      <div class="pp-field pp-full">' +
        '        <label>Project Brief <span>*</span></label>' +
        '        <textarea name="brief" rows="4" placeholder="Describe your project, goals, and any references you love..." required></textarea>' +
        '        <span class="pp-error-msg"></span>' +
        '      </div>' +
        '      <div class="pp-field pp-full">' +
        '        <label>How did you hear about us?</label>' +
        '        <input type="text" name="source" placeholder="Instagram, Google, Referral...">' +
        '      </div>' +
        '      <span class="pp-submit-error" id="ppSubmitError"></span>' +
        '      <button type="submit" class="pp-submit">' +
        '        <span class="pp-submit-label">Send My Brief</span>' +
        '        <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#ppClip)"><path d="M6.99999 13.4178C7.52032 13.4178 8.03482 13.4085 8.54232 13.391C11.172 13.2982 13.2977 11.1726 13.3904 8.54292C13.4085 8.03542 13.4172 7.52092 13.4172 7.00058C13.4172 6.48025 13.4079 5.96575 13.3904 5.45825C13.2977 2.82858 11.172 0.702914 8.54232 0.610165C8.03482 0.592081 7.52032 0.583331 6.99999 0.583331C6.47965 0.583331 5.96515 0.592665 5.45765 0.610165C2.8274 0.702914 0.701737 2.82858 0.608987 5.45883C0.590903 5.96633 0.582153 6.48083 0.582153 7.00116C0.582153 7.5215 0.591487 8.036 0.608987 8.5435C0.701737 11.1726 2.8274 13.2982 5.45765 13.3904C5.96515 13.4085 6.47965 13.4178 6.99999 13.4178ZM4.30499 9.49725C4.07515 9.24933 4.08974 8.86142 4.33824 8.63217L7.87557 5.35442L5.76099 5.138C5.60699 5.12225 5.47165 5.0505 5.37424 4.94491C5.25874 4.82067 5.19515 4.64858 5.2144 4.466C5.24882 4.13 5.54924 3.885 5.88582 3.92L9.15132 4.256C9.36015 4.26242 9.55324 4.34991 9.69499 4.50333C9.83615 4.65558 9.90907 4.8545 9.90032 5.02075L9.98607 8.34575C9.9954 8.68408 9.72765 8.96525 9.39049 8.974C9.20674 8.97866 9.04049 8.90225 8.92499 8.778C8.82757 8.673 8.76632 8.533 8.76224 8.37783L8.70857 6.25275L5.17065 9.5305C4.92274 9.76033 4.53482 9.74517 4.30499 9.49725Z" fill="#111"/></g><defs><clipPath id="ppClip"><rect width="14" height="14" fill="white" transform="translate(0 14) rotate(-90)"/></clipPath></defs></svg>' +
        '      </button>' +
        '    </form>' +
        '    <div class="pp-success" id="ppSuccess">' +
        '      <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#B2DF4820"/><path d="M16 28l8 8 16-16" stroke="#B2DF48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '      <h3>We\'ve got your brief!</h3>' +
        '      <p>Our team will reach out within 24 hours. Meanwhile, follow us on Instagram for inspiration.</p>' +
        '    </div>' +
        '  </div>' +
        '</div>';

    function init() {
        document.body.insertAdjacentHTML('beforeend', POPUP_HTML);

        var overlay = document.getElementById('projectPopupOverlay');
        var closeBtn = document.getElementById('closeProjectPopup');
        var form = document.getElementById('projectForm');
        var success = document.getElementById('ppSuccess');
        var submitBtn = form.querySelector('.pp-submit');
        var submitLabel = submitBtn.querySelector('.pp-submit-label');
        var serviceGrid = form.querySelector('.pp-service-grid');

        // ---- Budget slider ----
        // Native range input (real keyboard/touch/drag support for free)
        // styled to match the rest of the form, stepping through the same
        // four brackets the old <select> offered. The slider's own value
        // is just an index (0-3) — the actual bracket label it maps to is
        // what's written to the hidden "budget" input that submits with
        // the form, so the backend still gets a plain, human-readable
        // string exactly like before.
        var BUDGET_LABELS = ['Under ₹50,000', '₹50,000 – ₹1,00,000', '₹1,00,000 – ₹3,00,000', '₹3,00,000+'];
        var budgetSlider = form.querySelector('#ppBudgetSlider');
        var budgetValue = form.querySelector('#ppBudgetValue');
        var budgetInput = form.querySelector('[name="budget"]');

        function syncBudgetSlider() {
            var label = BUDGET_LABELS[budgetSlider.value];
            budgetValue.textContent = label;
            budgetInput.value = label;
            var pct = (budgetSlider.value / (budgetSlider.max - budgetSlider.min)) * 100;
            budgetSlider.style.setProperty('--pp-slider-pct', pct + '%');
        }
        budgetSlider.addEventListener('input', syncBudgetSlider);
        syncBudgetSlider();

        // On pages that run Lenis (index.html), it drives scrolling itself
        // via intercepted wheel/touch events, so body.style.overflow alone
        // doesn't stop the page behind the popup from scrolling — it has to
        // be paused directly. `typeof lenis` (not `window.lenis`) is the
        // correct check here since Lenis is declared with `const` further
        // down index.html's own inline script, which never becomes a
        // window property; on every other page `lenis` was never declared
        // at all, and `typeof` on an undeclared name is safely 'undefined'
        // rather than throwing.
        function pauseLenis() {
            if (typeof lenis !== 'undefined' && lenis) lenis.stop();
        }
        function resumeLenis() {
            if (typeof lenis !== 'undefined' && lenis) lenis.start();
        }

        function openPopup() {
            form.style.display = '';
            success.style.display = 'none';
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

        // Delegated on document, not the buttons themselves — works for
        // every current and future ".js-open-popup" element on the page.
        document.addEventListener('click', function (e) {
            var trigger = e.target.closest('.js-open-popup');
            if (trigger) {
                e.preventDefault();
                openPopup();
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
            el.closest('.pp-field').classList.remove('has-error');
        }

        function clearErrors() {
            form.querySelectorAll('.has-error').forEach(function (w) { w.classList.remove('has-error'); });
        }

        var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // ---- Email verification ----
        var emailInput = form.querySelector('[name="email"]');
        var verifyBtn = form.querySelector('.pp-verify-btn');
        var verifyCodeRow = form.querySelector('.pp-verify-code-row');
        var verifyCodeInput = form.querySelector('.pp-verify-code-input');
        var verifyCodeBtn = form.querySelector('.pp-verify-code-btn');
        var verifyStatus = form.querySelector('.pp-verify-status');
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
            if (!briefEl.value.trim()) { showError(briefEl, 'Tell us a little about your project.'); ok = false; }

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
        // Posts to assets/php/send-mail.php, which relays the lead via
        // SMTP through PHPMailer. Always resolves with {success, error} -
        // network failures are caught and normalized to the same shape so
        // the caller only has one branch to handle.
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

        var submitError = form.querySelector('#ppSubmitError');

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
                if (submitLabel) submitLabel.textContent = 'Send My Brief';

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
