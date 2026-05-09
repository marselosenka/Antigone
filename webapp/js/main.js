document.addEventListener('DOMContentLoaded', function() {
    // Initialize State
    state.currentScenes = [...playData.scenes];

    // 1Render UI Elements
    generateDynamicTags();
    renderCharacters();

    // Attach Global Listeners
    attachEventListeners();

    // Initialize Visuals
    updateAllDimensions();

    // Initialize Controls
    initializeVideoControls();
    initializeKeyboardShortcuts();
    sparqlLineNavigator.init();
});
