document.addEventListener('DOMContentLoaded', () => {
    state.currentScenes = [...playData.scenes];

    renderAllSemanticTags();
    renderCharacters();

    initializeVideoControls();
    initVideoSceneSync();
    initializeKeyboardShortcuts();

    attachEventListeners();
    updateAllDimensions();
});

function renderAllSemanticTags() {
    const meta = collectPlayMeta();
    renderTags('emotions-container', [...meta.emotions], 'emotion', handleTagClick);
    renderTags('themes-container',   [...meta.themes],   'theme',   handleTagClick);
    renderTags('events-container',   [...meta.events],   'event',   handleTagClick);
    renderSceneTags('scenes-container', meta.scenes, (sceneId, tag) => handleTagClick(tag));
}

/**
 * CHARACTER INITIALIZATION
 */
function renderCharacters() {
    const container = document.getElementById('characters-container');
    if (!container) return;
    container.innerHTML = '';
    playData.characters.forEach(char => {
        const bubble             = document.createElement('div');
        bubble.className         = 'character-bubble';
        bubble.dataset.character = char.id;
        bubble.tabIndex          = 0;
        bubble.dataset.color     = char.color;
        bubble.textContent       = char.name;

        const size = Math.round(50 + char.importance * 1.3);
        bubble.style.width  = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.setProperty('--char-color', char.color);

        container.appendChild(bubble);
    });
}
