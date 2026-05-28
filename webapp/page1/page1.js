document.addEventListener('DOMContentLoaded', () => {

    function matchIllustrationToNav() {
        const nav = document.querySelector('.hero-nav');
        const illustration = document.querySelector('.scene-illustration');
        if (!nav || !illustration) return;
        const buttons = nav.querySelectorAll('.hero-nav-btn');
        if (!buttons.length) return;
        const first = buttons[0].getBoundingClientRect();
        const last  = buttons[buttons.length - 1].getBoundingClientRect();
        illustration.style.maxWidth = (last.right - first.left) + 'px';
    }

    matchIllustrationToNav();
    window.addEventListener('resize', matchIllustrationToNav);

    const btn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function makeCarousel(pageSelector, dotSelector, prevSelector, nextSelector) {
        const pages = document.querySelectorAll(pageSelector);
        const dots  = document.querySelectorAll(dotSelector);
        const prev  = document.querySelector(prevSelector);
        const next  = document.querySelector(nextSelector);
        let current = 0;

        function showPage(idx) {
            pages[current].classList.remove('active');
            dots[current].classList.remove('active');
            current = idx;
            pages[current].classList.add('active');
            dots[current].classList.add('active');
            prev.disabled = current === 0;
            next.disabled = current === pages.length - 1;
        }

        prev.disabled = true;
        next.addEventListener('click', () => { if (current < pages.length - 1) showPage(current + 1); });
        prev.addEventListener('click', () => { if (current > 0) showPage(current - 1); });
        dots.forEach((dot, i) => dot.addEventListener('click', () => showPage(i)));
    }

    makeCarousel('.char-page', '.char-dot:not(.theme-dot)', '.char-prev', '.char-next');
    makeCarousel('.theme-page', '.theme-dot', '.theme-prev', '.theme-next');
});
