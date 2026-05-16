 
// PAGE MANAGER  –  Single-page navigation
const pageManager = (() => {

    const initialised = new Set();
    /**
     * Activate a page by its ID ('page1').
     * Hides all others, shows the chosen one, then runs first-visit setup.
     */
    function goTo(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));

        // Show the requested page
        const target = document.getElementById(pageId);
        if (!target) return;
        target.classList.add('active');

        // Update nav button states
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageId);
        });

        // Persist across refreshes
        history.pushState({ page: pageId }, '', `#${pageId}`);

        // Run first-time initialisation for the page
        if (!initialised.has(pageId)) {
            initialised.add(pageId);
            switch (pageId) {
                case 'page2': initPage2(); break;
                case 'page3': initPage3(); break;
                // page1 & page4 are static; add init calls here when ready
            }
        }
    }

    /**
     * PAGE 2  –  Scenes + Lines
     * Renders scene tags (no video seek) and sets up the SPARQL navigator.
     */
    function initPage2() {

        const container = document.getElementById('scenes-container-page2');
        if (container && container.children.length === 0) {
            playData.scenes.forEach(scene => {
                createSceneTagElement(container, scene.id, scene.name, false);
            });
        }

        // Activate TTS buttons scoped to page 2
        document.querySelectorAll('#page2 .speak-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tts.speakFromElement(btn.dataset.panel, btn.dataset.lang, btn);
            });
        });

        // Boot the SPARQL navigator (safe to call multiple times – init() checks IDs)
        sparqlLineNavigator.init();
    }

    /**
     * PAGE 3  –  Semantics / Video
     * Initialises video controls and scene-sync on first visit.
     */
    function initPage3() {
        initializeVideoControls();
        initVideoSceneSync();
        attachEventListeners();          // character bubble listeners
        updateAllDimensions();           // size tags based on current state
    }


    function init() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => goTo(btn.dataset.page));
        });


        const hashPage = location.hash.replace('#', '');
        const validPages = ['page1', 'page2', 'page3', 'page4'];
        goTo(validPages.includes(hashPage) ? hashPage : 'page1');

        // Browser back / forward
        window.addEventListener('popstate', e => {
            if (e.state && e.state.page) goTo(e.state.page);
        });
    }

    return { init, goTo };
})();
