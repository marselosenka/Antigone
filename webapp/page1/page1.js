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
});
