 
// MAIN  –  Application entry point
document.addEventListener('DOMContentLoaded', () => {

    // Initialise global state
    state.currentScenes = [...playData.scenes];

    // Generate all dynamic tags (both pages share the same data)
    generateDynamicTags();

    // Render character bubbles (page 3)
    renderCharacters();

    // Global keyboard shortcuts (works across all pages)
    initializeKeyboardShortcuts();

    // Boot the page manager – this triggers first-visit init for whichever page is shown first
    pageManager.init();
});
