document.addEventListener('DOMContentLoaded', function() {
    // Initialize State
    state.currentScenes = [...playData.scenes];

    // Render UI Elements
    generateDynamicTags();
    renderCharacters();

    // Attach Global Listeners
    attachEventListeners();

    // Initialize Visuals
    updateAllDimensions();

    // Initialize Controls
    initializeVideoControls();

    document.querySelectorAll('.speak-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panelId = btn.dataset.panel;
            const lang = btn.dataset.lang;
            tts.speakFromElement(panelId, lang, btn);
        });
    });
    initializeKeyboardShortcuts();
    sparqlLineNavigator.init();
});
