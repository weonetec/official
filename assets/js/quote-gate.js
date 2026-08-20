// ================================================
// PRIVATE QUOTATION GATE — quote-dmdigitals.php only.
// Only loaded/run when the visitor is NOT yet verified (the PHP page
// itself decides whether to include this script). Collects name/phone/
// email, requests a code, verifies it, then reloads the page — the
// server re-checks the session flag on that reload and renders the real
// quotation content, which never touched this script or the DOM before
// that point.
// ================================================
(function () {
    function init() {
        var form = document.getElementById('quoteGateForm');
        if (!form) return;

        var submitBtn = document.getElementById('qgSubmitBtn');
        var submitLabel = submitBtn.querySelector('.pp-submit-label');
        var submitError = document.getElementById('qgSubmitError');

        var nameInput = form.querySelector('[name="name"]');
        var phoneInput = form.querySelector('[name="phone"]');
        var emailInput = form.querySelector('[name="email"]');
        var emailField = emailInput.closest('.pp-field');
        var verifyCodeRow = emailField.querySelector('.pp-verify-code-row');
        var verifyCodeInput = emailField.querySelector('.pp-verify-code-input');
        var verifyCodeBtn = emailField.querySelector('.pp-verify-code-btn');
        var verifyStatus = emailField.querySelector('.pp-verify-status');

        var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var codeSentFor = null; // the exact email the current code was sent to
        var resendCooldownTimer = null;

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

        form.addEventListener('input', function (e) {
            if (e.target.matches('input')) clearError(e.target);
        });

        function setVerifyStatus(text, mode) {
            verifyStatus.textContent = text;
            verifyStatus.classList.toggle('is-error', mode === 'error');
            verifyStatus.classList.toggle('is-success', mode === 'success');
        }

        // Editing name/phone/email after a code was sent invalidates it —
        // the code step re-appears once fresh details are submitted again.
        [nameInput, phoneInput, emailInput].forEach(function (el) {
            el.addEventListener('input', function () {
                if (codeSentFor) {
                    codeSentFor = null;
                    verifyCodeRow.style.display = 'none';
                    verifyCodeInput.value = '';
                    setVerifyStatus('');
                    if (resendCooldownTimer) clearInterval(resendCooldownTimer);
                    submitBtn.style.display = '';
                }
            });
        });

        function startResendCooldown() {
            var seconds = 45;
            submitBtn.disabled = true;
            if (resendCooldownTimer) clearInterval(resendCooldownTimer);
            resendCooldownTimer = setInterval(function () {
                seconds--;
                if (seconds <= 0) {
                    clearInterval(resendCooldownTimer);
                    submitBtn.disabled = false;
                } else {
                    setVerifyStatus('You can request another code in ' + seconds + 's.');
                }
            }, 1000);
        }

        function validate() {
            clearErrors();
            var ok = true;

            if (!nameInput.value.trim()) { showError(nameInput, 'Please enter your name.'); ok = false; }
            if (!phoneInput.value.trim()) { showError(phoneInput, 'Please enter your phone number.'); ok = false; }

            var emailVal = emailInput.value.trim();
            if (!emailVal) { showError(emailInput, 'Please enter your email.'); ok = false; }
            else if (!EMAIL_RE.test(emailVal)) { showError(emailInput, 'Enter a valid email address.'); ok = false; }

            return ok;
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (submitBtn.disabled) return;
            if (!validate()) return;

            var email = emailInput.value.trim();
            submitBtn.disabled = true;
            if (submitLabel) submitLabel.textContent = 'Sending...';
            if (submitError) submitError.textContent = '';
            setVerifyStatus('');

            var data = new FormData(form);
            fetch('assets/php/quote-request.php', { method: 'POST', body: data })
                .then(function (res) { return res.json(); })
                .catch(function () { return { success: false, error: 'Could not reach the server. Please check your connection and try again.' }; })
                .then(function (result) {
                    if (submitLabel) submitLabel.textContent = 'Send Me The Code';

                    if (!result || !result.success) {
                        submitBtn.disabled = false;
                        if (submitError) submitError.textContent = (result && result.error) || 'Something went wrong. Please try again.';
                        return;
                    }

                    codeSentFor = email;
                    verifyCodeRow.style.display = 'flex';
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

            fetch('assets/php/quote-verify.php', { method: 'POST', body: new URLSearchParams({ email: email, code: code }) })
                .then(function (res) { return res.json(); })
                .catch(function () { return { success: false, error: 'Could not reach the server.' }; })
                .then(function (result) {
                    verifyCodeBtn.disabled = false;
                    verifyCodeBtn.textContent = 'Confirm';
                    if (!result || !result.success) {
                        setVerifyStatus((result && result.error) || 'Invalid code.', 'error');
                        return;
                    }
                    setVerifyStatus('Verified — loading your quotation...', 'success');
                    window.location.reload();
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
