 
// INTERACTIONS  –  Event listeners & filter logic

/**
 * GLOBAL EVENT LISTENERS  (Page 3 – character bubbles)
 */
function attachEventListeners() {
    document.querySelectorAll('.character-bubble').forEach(bubble => {
        bubble.addEventListener('click',      () => handleCharacterClick(bubble));
        bubble.addEventListener('mouseenter', () => showTooltip(bubble));
        bubble.addEventListener('mouseleave', hideTooltip);
    });
}

/**
 * CHARACTER SELECTION LOGIC  (Page 3)
 */
function handleCharacterClick(bubble) {
    const character = bubble.dataset.character;

    document.querySelectorAll('.character-bubble').forEach(b => b.classList.remove('active'));

    if (state.selectedCharacter === character) {
        state.selectedCharacter = null;
    } else {
        state.selectedCharacter = character;
        bubble.classList.add('active');
    }

    applyFilters();
    updateAllDimensions();
}

/**
 * TAG CLICK HANDLER  (Page 3 – emotions / themes / events / scenes)
 */
function handleTagClick(tag) {
    const type  = tag.dataset.type;
    const value = tag.dataset.value;

    tag.classList.toggle('active');

    const filterKey = type + 's';
    if (state.activeFilters[filterKey]) {
        tag.classList.contains('active')
            ? state.activeFilters[filterKey].add(value)
            : state.activeFilters[filterKey].delete(value);
    }

    if (type === 'scene') handleSceneTagClickPage3(value);

    applyFilters();
    updateAllDimensions();
}

/**
 * PAGE 2  –  Scene tag click: update text panels ONLY (no video seek)
 * Also deactivates all other scene tags on page 2 and activates this one.
 */
function handleSceneTagClickPage2(sceneId, clickedTag) {
    const scene = playData.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Toggle active state visually
    const allPage2Tags = document.querySelectorAll('#scenes-container-page2 .tag');
    allPage2Tags.forEach(t => t.classList.remove('active'));
    if (clickedTag) clickedTag.classList.add('active');

    // Update the page 2 text panels
    updateTextPanels(scene.text, '-page2');
}

/**
 * PAGE 3  –  Scene tag click: seek video + update page 3 text panels
 */
function handleSceneTagClickPage3(sceneId) {
    const scene = playData.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const video = document.getElementById('video-element');
    if (video && video.duration) video.currentTime = scene.start;

    updateTextPanels(scene.text, '');
    highlightRelatedItems(scene);
    state.lastActiveSceneId = sceneId;
}

/**
 * FILTERING ENGINE  (Page 3)
 */
function applyFilters() {
    let filteredScenes = [...playData.scenes];

    if (state.selectedCharacter) {
        filteredScenes = filteredScenes.filter(scene =>
            scene.characters.includes(state.selectedCharacter)
        );
    }

    ['emotions', 'themes', 'events', 'scenes'].forEach(filterType => {
        const activeSet = state.activeFilters[filterType];
        if (activeSet && activeSet.size > 0) {
            filteredScenes = filteredScenes.filter(scene => {
                if (filterType === 'scenes') return activeSet.has(scene.id);
                return scene[filterType] && scene[filterType].some(val => activeSet.has(val));
            });
        }
    });

    state.currentScenes = filteredScenes;

    if (filteredScenes.length > 0) {
        updateTextPanels(filteredScenes[0].text, '');
    }
}

/**
 * UI REFRESH COORDINATOR  (Page 3 – tag size/opacity)
 */
function updateAllDimensions() {
    ['emotions', 'themes', 'events'].forEach(type => {
        const counts = {};
        state.currentScenes.forEach(scene => {
            scene[type].forEach(item => counts[item] = (counts[item] || 0) + 1);
        });
        updateTagsDisplay(`${type}-container`, counts, type.slice(0, -1));
    });

    // Scene tags on page 3
    const sceneCounts = {};
    state.currentScenes.forEach(scene => sceneCounts[scene.id] = 1);
    updateTagsDisplay('scenes-container', sceneCounts, 'scene');

}
