document.addEventListener('DOMContentLoaded', () => {

    const btn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const tags   = document.querySelectorAll('.theme-tag');
    const panels = document.querySelectorAll('.theme-panel-text');

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            const key = tag.dataset.theme;
            tags.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.add('hidden'));
            tag.classList.add('active');
            document.querySelector(`.theme-panel-text[data-theme="${key}"]`).classList.remove('hidden');
        });
    });

    const pages = document.querySelectorAll('.char-page');
    const dots  = document.querySelectorAll('.char-dot');
    const prev  = document.querySelector('.char-prev');
    const next  = document.querySelector('.char-next');
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
});
