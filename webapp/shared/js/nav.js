(function () {
    const PAGES = [
        { id: 'page1', label: 'Information',         href: '../page1/page1.html' },
        { id: 'page2', label: 'Scenes + Lines',      href: '../page2/page2.html' },
        { id: 'page3', label: 'Semantics / Video',   href: '../page3/page3.html' },
        { id: 'page4', label: 'Statistics',          href: '../page4/page4.html' }
    ];

    function renderNav() {
        const root = document.getElementById('nav-root');
        if (!root) return;

        const current = document.body.dataset.page;
        root.classList.add('nav-bar');
        root.innerHTML = PAGES.map(p => {
            const isActive = p.id === current ? ' active' : '';
            return `<button class="nav-btn${isActive}" data-page="${p.id}" data-href="${p.href}">${p.label}</button>`;
        }).join('');

        root.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = btn.dataset.href;
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }
})();
