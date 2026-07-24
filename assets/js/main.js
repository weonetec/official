gsap.registerPlugin(ScrollTrigger);


// ================================================
// STUDIO BANNER — Badge Scroll Animations
// Badges fly in from sides on enter + bob float.
// Fly back out when scrolling back up.
// ================================================
(function () {

    var LEFT_SELS  = ['.badge--exp', '.badge--flex', '.badge--speed-l', '.badge--omni-l'];
    var RIGHT_SELS = ['.badge--speed-r', '.badge--omni-r', '.badge--brand', '.badge--result'];

    if (!document.querySelector('.studio-banner')) return;

    // Resolve selectors to actual DOM elements
    var leftEls  = LEFT_SELS.map(function (s) { return document.querySelector(s); });
    var rightEls = RIGHT_SELS.map(function (s) { return document.querySelector(s); });
    var allEls   = leftEls.concat(rightEls);

    // ── Set initial hidden state immediately ──────────────────────────────────
    gsap.set(leftEls,  { x: -320, opacity: 0 });
    gsap.set(rightEls, { x:  320, opacity: 0 });

    // ── Ambient bob float ─────────────────────────────────────────────────────
    var floatTweens = [], floatActive = false;

    function startFloat() {
        if (floatActive) return;
        floatActive = true;
        floatTweens = allEls.map(function (el, i) {
            return gsap.to(el, {
                y: -10,
                duration: 2.2 + i * 0.3,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                delay: i * 0.1
            });
        });
    }

    function stopFloat() {
        if (!floatActive) return;
        floatActive = false;
        floatTweens.forEach(function (tw) { tw.kill(); });
        floatTweens = [];
        gsap.set(allEls, { y: 0 });
    }

    // ── Build the fly-in timeline (paused) ────────────────────────────────────
    var tl = gsap.timeline({
        paused: true,
        onComplete: function () {
            startFloat();
            // Badges only have their real, on-screen position once this
            // finishes — the index.html script that nudges a badge aside if
            // it overlaps the center title text needs to check AFTER this,
            // not on page load (which almost always runs before the user
            // has even scrolled this section into view).
            if (window.resolveStudioBadgeOverlaps) window.resolveStudioBadgeOverlaps();
        },
        onReverseComplete: stopFloat
    });

    // Interleaved left/right/left/right… — each badge gets its own time
    // slot (step * 0.17s) instead of the left and right groups running as
    // two parallel i*0.17 sequences (which had left[i] and right[i] flying
    // in at the exact same moment, reading as simultaneous pairs rather
    // than genuinely "one after another").
    var step = 0;
    for (var i = 0; i < 4; i++) {
        tl.fromTo(leftEls[i],
            { x: -320, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.78, ease: 'back.out(1.4)' },
            step++ * 0.17
        );
        tl.fromTo(rightEls[i],
            { x: 320, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.78, ease: 'back.out(1.4)' },
            step++ * 0.17
        );
    }

    // ── IntersectionObserver — fires when the section reaches the viewport's
    // middle band. Uses rootMargin (not a height-ratio threshold) so it works
    // whether the section is a short 100vh block (desktop) or a much taller
    // stacked grid (mobile/tablet responsive layout) — a ratio threshold like
    // 0.5 can become unreachable once the section is far taller than the
    // viewport, since that much of it can never be visible at once. ──
    var section = document.querySelector('.studio-banner');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                // Section overlaps the viewport's middle band
                tl.play();
                if (window.playStudioBannerIcons) window.playStudioBannerIcons();
            } else {
                // Section left the middle band — fly badges back out
                stopFloat();
                tl.reverse();
            }
        });
    }, { threshold: 0, rootMargin: '-20% 0px -20% 0px' });

    observer.observe(section);

})();


// Nav BTN
document.querySelectorAll('.cta-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        btn.style.setProperty('--x', `${x}%`);
        btn.style.setProperty('--y', `${y}%`);
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.removeProperty('--x');
        btn.style.removeProperty('--y');
    });
});


const header = document.querySelector('.site-header');

window.addEventListener('scroll', function () {
    const currentScroll = window.scrollY;
    if (currentScroll <= 50) {
        header.classList.remove('scrolled');
    } else {
        header.classList.add('scrolled');
    }
});

// Header: visible ONLY while the hero section or the footer is on screen —
// hidden for every section in between. Different from a typical
// hide-on-scroll-down/show-on-scroll-up pattern (which would flicker the
// header back in on any upward scroll, even mid-page); this is purely
// position-based, checked continuously via rAF so it works the same
// whether the user scrolls, the pinned hero's own scrub animation moves
// things, or Lenis smooth-scrolling is involved.
(function () {
    if (!header) return;

    // Index.html's hero is GSAP-pinned (ScrollTrigger wraps it in a
    // .pin-spacer that reserves its full scroll range) — checking the
    // spacer covers that page. Every other page has a plain, unpinned
    // hero section, so its own class is checked directly as a fallback.
    var heroEl = document.querySelector(
        '.pin-spacer, .hero-banner, .about-hero, .work-hero, .blog-page-hero, .detail-hero, .hero-coming-soonn'
    );
    var footerEl = document.querySelector('.site-footer');

    function inView(el) {
        if (!el) return false;
        var r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
    }

    function tick() {
        var show = inView(heroEl) || inView(footerEl);
        header.classList.toggle('header-hidden', !show);
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();


// ================================================
// NAVBAR AUTO-COLOR
// Watches the two white-background sections.
// Uses getBoundingClientRect (works with Lenis).
// nav-light added when either overlaps the header.
// ================================================
(function () {
    var header       = document.querySelector('.site-header');
    var lightSections = Array.from(document.querySelectorAll('.testi-section, .blog-section'));
    if (!header || !lightSections.length) return;

    var isLight = false;

    function tick() {
        var navH      = header.offsetHeight;
        var overLight = lightSections.some(function (el) {
            var r = el.getBoundingClientRect();
            return r.top < navH && r.bottom > 0;
        });

        if (overLight !== isLight) {
            isLight = overLight;
            header.classList.toggle('nav-light', isLight);
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();


// ================================================
// DESIGN FUTURE — card stack ↔ spread animation (desktop only)
// Uses rAF + getBoundingClientRect (same as badges)
// so it works correctly despite GSAP's hero-banner
// pin shifting ScrollTrigger positions by 1500px.
//
// On tablet/phone the 5×300px horizontal fan this drives doesn't fit any
// real screen width, so below 992px this whole animation is skipped in
// favor of a separate vertical-stack reveal (see next block) — plain CSS
// transitions + IntersectionObserver, not GSAP, so it can't get stuck on
// a frozen ticker the way this rAF loop can.
// ================================================
(function () {
    var section = document.querySelector('.designFuture');
    if (!section) return;

    var cards     = Array.from(section.querySelectorAll('.cards-wrapper .card'));
    var rotations = [-8, 8, 0, 18, -11];
    var stackX    = [540, 270, 0, -270, -540];
    var mq        = window.matchMedia('(min-width: 992px)');

    // 'collapsed' | 'spreading' | 'spread' | 'collapsing'
    var state  = 'collapsed';
    var active = false;

    function spread() {
        if (state === 'spread' || state === 'spreading') return;
        state = 'spreading';
        gsap.killTweensOf(cards);
        cards.forEach(function (card, i) {
            gsap.to(card, {
                x: 0, rotation: rotations[i],
                duration: 0.75, ease: 'back.out(1.5)',
                delay: i * 0.09,
                onComplete: i === cards.length - 1 ? function () { state = 'spread'; } : undefined
            });
        });
    }

    function collapse() {
        if (state === 'collapsed' || state === 'collapsing') return;
        state = 'collapsing';
        gsap.killTweensOf(cards);
        // Outside-in delay: outermost cards (0,4) lead, center (2) last
        var collapseDelay = [0, 0.08, 0.16, 0.08, 0];
        cards.forEach(function (card, i) {
            gsap.to(card, {
                x: stackX[i], rotation: 0,
                duration: 0.85, ease: 'power2.inOut',
                delay: collapseDelay[i],
                onComplete: i === 2 ? function () { state = 'collapsed'; } : undefined
            });
        });
    }

    function tick() {
        if (!active) return;
        var r  = section.getBoundingClientRect();
        var vh = window.innerHeight;
        // Trigger when section top crosses 55% down the viewport
        var inView = r.top < vh * 0.55 && r.bottom > 0;

        if (inView  && (state === 'collapsed'  || state === 'collapsing')) spread();
        if (!inView && (state === 'spread'     || state === 'spreading'))  collapse();

        requestAnimationFrame(tick);
    }

    // matchMedia was previously checked once at load, so on a page that
    // *starts* ≥992px, gsap.set() below pins each card at its fanned-out
    // stackX (up to ±540px) via an inline transform. If the viewport is
    // then resized/rotated narrower without a full reload — a phone or
    // tablet rotating, or just a dev testing "mobile view" by shrinking
    // the window — nothing ever cleared that inline transform, and inline
    // styles beat the ≤991px CSS column-stack rule, leaving cards pinned
    // hundreds of px off-canvas and the page horizontally scrollable.
    // Reacting to the same matchMedia's change event (not just its
    // initial value) keeps this in sync with whatever width the page
    // actually ends up at, in either direction.
    function enable() {
        if (active) return;
        active = true;
        state = 'collapsed';
        cards.forEach(function (card, i) {
            gsap.set(card, { x: stackX[i], rotation: 0 });
        });
        requestAnimationFrame(tick);
    }

    function disable() {
        if (!active) return;
        active = false;
        gsap.killTweensOf(cards);
        // Hand full control back to the ≤991px CSS (column-stack + the
        // separate reveal IIFE below) by clearing every inline style
        // property GSAP touched here.
        cards.forEach(function (card) { gsap.set(card, { clearProps: 'all' }); });
        state = 'collapsed';
    }

    mq.addEventListener('change', function (e) {
        if (e.matches) enable(); else disable();
    });

    if (mq.matches) enable();
})();


// ================================================
// DESIGN FUTURE — vertical stack reveal (tablet/phone only)
// Cards are hidden (see responsive.css .card / .is-visible), then reveal
// one at a time, alternating left/right entrance, once the section
// scrolls into view. rootMargin-based (not a height-ratio threshold) so
// it works regardless of how tall the stacked cards end up — same fix
// applied to the studio-banner badges earlier for the same reason.
// ================================================
(function () {
    var section = document.querySelector('.designFuture');
    if (!section) return;
    if (window.matchMedia('(min-width: 992px)').matches) return;

    var cards = Array.from(section.querySelectorAll('.cards-wrapper .card'));
    var revealed = false;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && !revealed) {
                revealed = true;
                cards.forEach(function (card, i) {
                    setTimeout(function () { card.classList.add('is-visible'); }, i * 150);
                });
            }
        });
    }, { threshold: 0, rootMargin: '-20% 0px -20% 0px' });

    observer.observe(section);
})();


// ================================================
// TESTIMONIAL SLIDER — Swiper
// ================================================
(function () {
    var prevBtn = document.getElementById('testiPrev');
    var nextBtn = document.getElementById('testiNext');

    if (!document.querySelector('.testi-swiper')) return;

    var testiSwiper = new Swiper('.testi-swiper', {
        slidesPerView: 2.5,
        spaceBetween: 0,
        speed: 580,
        grabCursor: true,
        touchRatio: 1,
        resistance: true,
        resistanceRatio: 0.85,
        loop: true,

        autoplay: {
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
        },

        // Custom nav buttons (in header)
        navigation: {
            prevEl: '#testiPrev',
            nextEl: '#testiNext',
            disabledClass: 'testi-disabled',
        },

        // Pagination dots
        pagination: {
            el: '.testi-swiper-pagination',
            clickable: true,
            bulletClass: 'testi-dot',
            bulletActiveClass: 'active',
            renderBullet: function (index, className) {
                return '<button class="' + className + '" type="button"></button>';
            },
        },

        breakpoints: {
            0:   { slidesPerView: 1.2 },
            576: { slidesPerView: 1.6 },
            768: { slidesPerView: 2   },
            992: { slidesPerView: 2.5 },
        },
    });

    if (testiSwiper.autoplay && !testiSwiper.autoplay.running) {
        testiSwiper.autoplay.start();
    }
})();

// ================================================
// MOBILE NAV — hamburger toggle
// ================================================
(function () {
    var toggle  = document.querySelector('.mob-nav-toggle');
    var overlay = document.querySelector('.mob-nav-overlay');
    var drawer  = document.querySelector('.mob-nav-drawer');
    var closeBtn = document.querySelector('.mob-nav-close');
    if (!toggle || !overlay || !drawer) return;

    function openNav() {
        toggle.classList.add('open');
        overlay.style.display = 'block';
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () { overlay.classList.add('active'); });
    }

    function closeNav() {
        toggle.classList.remove('open');
        overlay.classList.remove('active');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
        overlay.addEventListener('transitionend', function handler() {
            overlay.style.display = 'none';
            overlay.removeEventListener('transitionend', handler);
        });
    }

    toggle.addEventListener('click', function () {
        if (drawer.classList.contains('open')) { closeNav(); } else { openNav(); }
    });
    overlay.addEventListener('click', closeNav);
    if (closeBtn) closeBtn.addEventListener('click', closeNav);

    // Close on nav link click
    drawer.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeNav);
    });
})();


// Recalculate all ScrollTrigger positions after images/fonts load
// (avoids wrong positions caused by unloaded images collapsing section heights)
window.addEventListener('load', function () {
    ScrollTrigger.refresh();
});
