// ================================================
// ANIMATED HEADER LOGO — bouncing-ball W reveal + idle blink/glance loop.
// Source: "weone counter/logo-embed" deliverable. Reuses the gsap already
// loaded by this page instead of bundling its own copy.
// ================================================
(function () {
    var instanceCounter = 0;

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Directions the "pupil" (the e-mark) can glance, relative to center.
    var LOOK_DIRS = [
        { x: -2.4, y: 0 },
        { x: 2.4, y: 0 },
        { x: 0, y: -2.1 },
        { x: 0, y: 2.1 },
        { x: -1.7, y: -1.6 },
        { x: 1.7, y: -1.6 },
        { x: -1.7, y: 1.6 },
        { x: 1.7, y: 1.6 }
    ];

    function initLogoAnimation(root) {
        if (!root || typeof gsap === 'undefined') return null;

        var eye = root.querySelector('.logo-eye');
        var ball = root.querySelector('.logo-ball');
        var w = root.querySelector('.logo-w');
        var maskEl = root.querySelector('.w-reveal-mask');
        var maskRect = root.querySelector('.w-reveal-rect');
        var emark = root.querySelector('.logo-emark');
        var o = root.querySelector('.logo-o');
        var n = root.querySelector('.logo-n');
        var e2 = root.querySelector('.logo-e2');

        // o/n/e2 ("one") are optional — the avatar-sized copy of this logo
        // omits them on purpose (see .avatar-logo), so it plays the W-reveal
        // + "We" settle + idle blink/glance loop and simply skips the "one"
        // slide-in beats below instead of bailing out entirely.
        if (!eye || !ball || !w || !maskEl || !maskRect || !emark) return null;

        instanceCounter++;
        var maskId = 'wl-w-reveal-' + instanceCounter;
        maskEl.setAttribute('id', maskId);
        w.setAttribute('mask', 'url(#' + maskId + ')');

        var REST_X = 72.824;
        var REST_Y = 38.43;
        var W_RIGHT_EDGE = 66.5;
        var MASK_MARGIN = 6;

        // Key points the ball bounces through, tracing the W's silhouette,
        // then travelling on to settle as the dot of "We".
        var P0 = { x: 2, y: -16 };
        var P1 = { x: 15, y: 40 };
        var P2 = { x: 30, y: 16 };
        var P3 = { x: 44, y: 40 };
        var P4 = { x: 58, y: 2 };

        function off(p) {
            return { x: p.x - REST_X, y: p.y - REST_Y };
        }

        gsap.set(ball, { transformOrigin: '50% 50%' });
        gsap.set(eye, { transformOrigin: '50% 50%' });
        gsap.set(w, { opacity: 1 });

        function buildIntro() {
            var tl = gsap.timeline();

            tl.set(ball, { x: off(P0).x, y: off(P0).y, scaleX: 1, scaleY: 1, opacity: 1 }, 0)
                .set(eye, { scaleY: 1 }, 0)
                .set(w, { opacity: 1 }, 0)
                .set(maskRect, { attr: { width: 0 } }, 0)
                .set(emark, { opacity: 0, x: 0, y: 0 }, 0);
            if (o && n && e2) tl.set([o, n, e2], { opacity: 0, x: -18 }, 0);

            // Hop 1: fall into the first valley — the mask wipes open to match,
            // so the ball's motion is what "draws" the W into view.
            tl.to(ball, { x: off(P1).x, y: off(P1).y, duration: 0.34, ease: 'power2.in' }, 0)
                .to(maskRect, { attr: { width: P1.x + MASK_MARGIN }, duration: 0.34, ease: 'power2.in' }, 0)
                .to(ball, { scaleY: 0.62, scaleX: 1.32, duration: 0.07, ease: 'power1.out' }, 0.30)
                .to(ball, { scaleY: 1, scaleX: 1, duration: 0.16, ease: 'power1.out' }, 0.37);

            // Hop 2: rise to the shorter middle peak.
            tl.to(ball, { x: off(P2).x, y: off(P2).y, duration: 0.30, ease: 'power2.out' }, 0.34)
                .to(maskRect, { attr: { width: P2.x + MASK_MARGIN }, duration: 0.30, ease: 'power2.out' }, 0.34)
                .to(ball, { scaleY: 1.1, scaleX: 0.93, duration: 0.14, ease: 'power1.inOut' }, 0.5);

            // Hop 3: fall into the second valley.
            tl.to(ball, { x: off(P3).x, y: off(P3).y, duration: 0.30, ease: 'power2.in' }, 0.64)
                .to(maskRect, { attr: { width: P3.x + MASK_MARGIN }, duration: 0.30, ease: 'power2.in' }, 0.64)
                .to(ball, { scaleY: 0.62, scaleX: 1.32, duration: 0.07, ease: 'power1.out' }, 0.90)
                .to(ball, { scaleY: 1, scaleX: 1, duration: 0.16, ease: 'power1.out' }, 0.97);

            // Hop 4: rise to the W's top-right corner — the mask finishes wiping
            // open here too, so the W is fully drawn right as the bounce ends.
            tl.to(ball, { x: off(P4).x, y: off(P4).y, duration: 0.34, ease: 'power2.out' }, 0.94)
                .to(maskRect, { attr: { width: W_RIGHT_EDGE + MASK_MARGIN }, duration: 0.34, ease: 'power2.out' }, 0.94)
                .to(ball, { scaleY: 1.1, scaleX: 0.93, duration: 0.14, ease: 'power1.inOut' }, 1.12);

            // Final travel down into resting position, with a settling bounce.
            tl.to(ball, { x: 0, y: 0, duration: 0.34, ease: 'power1.in' }, 1.28)
                .to(ball, { scaleY: 0.58, scaleX: 1.35, duration: 0.09, ease: 'power1.out' }, 1.62)
                .to(ball, { scaleY: 1, scaleX: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }, 1.70);

            // "We" completes: the e-mark lands on the settled ball.
            tl.to(emark, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 2.05);

            // "one" slides in left to right, letter by letter — only when
            // present (see the optional-elements note above).
            if (o && n && e2) {
                tl.to(o, { opacity: 1, x: 0, duration: 0.4, ease: 'back.out(1.8)' }, 2.35)
                    .to(n, { opacity: 1, x: 0, duration: 0.4, ease: 'back.out(1.8)' }, 2.5)
                    .to(e2, { opacity: 1, x: 0, duration: 0.4, ease: 'back.out(1.8)' }, 2.65);
            }

            return tl;
        }

        // Adds one random beat (a glance or a blink, occasionally a double
        // blink) to the idle timeline, each separated by an irregular pause
        // so the sequence doesn't feel metronomic.
        function addIdleBeat(tl, gapRange) {
            var gap = rand(gapRange[0], gapRange[1]);

            if (Math.random() < 0.4) {
                var double = Math.random() < 0.35;
                tl.to(eye, { scaleY: 0.12, duration: 0.07, ease: 'power1.in' }, '+=' + gap.toFixed(2))
                    .to(eye, { scaleY: 1, duration: 0.09, ease: 'power1.out' });
                if (double) {
                    tl.to(eye, { scaleY: 0.12, duration: 0.07, ease: 'power1.in' }, '+=0.12')
                        .to(eye, { scaleY: 1, duration: 0.09, ease: 'power1.out' });
                }
            } else {
                var dir = pick(LOOK_DIRS);
                var hold = rand(0.25, 0.7);
                tl.to(emark, { x: dir.x, y: dir.y, duration: rand(0.22, 0.36), ease: 'power2.out' }, '+=' + gap.toFixed(2))
                    .to(emark, { x: 0, y: 0, duration: rand(0.22, 0.34), ease: 'power2.inOut' }, '+=' + hold.toFixed(2));
            }
        }

        function buildIdle() {
            var tl = gsap.timeline();
            var beats = Math.floor(rand(2, 6)); // 2 to 5 random beats

            for (var i = 0; i < beats; i++) {
                // The first beat waits noticeably longer, so the logo settles
                // before it "notices" and starts reacting.
                var gapRange = i === 0 ? [0.6, 1.5] : [0.2, 0.6];
                addIdleBeat(tl, gapRange);
            }

            tl.to({}, { duration: rand(0.3, 0.7) });
            return tl;
        }

        function playCycle() {
            buildIntro().eventCallback('onComplete', function () {
                buildIdle().eventCallback('onComplete', function () {
                    gsap.to([w, ball, emark, o, n, e2].filter(Boolean), {
                        opacity: 0,
                        duration: 0.4,
                        ease: 'power1.in',
                        onComplete: function () {
                            gsap.delayedCall(0.35, playCycle);
                        }
                    });
                });
            });
        }

        playCycle();

        return null;
    }

    window.initLogoAnimation = initLogoAnimation;

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.wl-logo').forEach(initLogoAnimation);
    });
})();
