
(function () {
    const PAGES = [
        { id: 'page1', label: 'Information',         href: '../page1/page1.html' },
        { id: 'page2', label: 'Scenes + Lines',      href: '../page2/page2.html' },
        { id: 'page3', label: 'Semantics / Video',   href: '../page3/page3.html' },
        { id: 'page4', label: 'Statistics',          href: '../page4/page4.html' }
    ];

    /* Paths resolved from the current page's location (each page is in webapp/pageX/) */
    const USE_PAGE_PATH    = '../shared/use.html';
    const FOOTER_HTML_PATH = '../shared/footer.html';

    function renderNav() {
        const root = document.getElementById('nav-root');
        if (!root) return;

        const current = document.body.dataset.page;
        root.classList.add('nav-bar');

        const pageBtns = PAGES.map(p => {
            const isActive = p.id === current ? ' active' : '';
            return `<button class="nav-btn${isActive}" data-href="${p.href}">${p.label}</button>`;
        }).join('');

        root.innerHTML = `
            <div class="nav-left">${pageBtns}</div>
            <div class="nav-right">
                <a class="nav-btn nav-help-btn" id="nav-help-btn"
                   href="${USE_PAGE_PATH}" target="_blank" rel="noopener"
                   title="How to use this app (opens in a new tab)">
                    How to use
                </a>
            </div>
        `;

        root.querySelectorAll('.nav-btn[data-href]').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = btn.dataset.href;
            });
        });
    }

    async function renderFooter() {
        if (document.querySelector('footer.site-footer')) return;
        if (document.location.pathname.includes('page3')) return;
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
    
        document.body.appendChild(footer);

        try {
            const r = await fetch(FOOTER_HTML_PATH);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            footer.innerHTML = await r.text();
        } catch (err) {
            footer.innerHTML = `<p class="footer-error">Could not load footer (${err.message}).</p>`;
        }
    }

    function init() {
        renderNav();
        renderFooter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();