/**
 * GLOBAL EVENT LISTENERS
 * This function triggers the character bubbles by telling them to listen
 * for mouse clicks and hovers.
 */
function attachEventListeners() {
    document.querySelectorAll('.character-bubble').forEach(bubble => {
        bubble.addEventListener('click', () => handleCharacterClick(bubble));
        bubble.addEventListener('mouseenter', () => showTooltip(bubble));
        bubble.addEventListener('mouseleave', hideTooltip);
    });
}

/**
 * CHARACTER SELECTION LOGIC
 * Manages what happens when you click a character medallion. It handles
 * both selecting a new character and deselecting the current one.
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
 * TAG INTERACTION HANDLER
 * Processes clicks on Emotions, Themes, or Events. It toggles the tag's active
 * state and updates the global filter list.
 */
function handleTagClick(tag) {
    const type = tag.dataset.type;
    const value = tag.dataset.value;

    tag.classList.toggle('active');

    if (tag.classList.contains('active')) {
        state.activeFilters[type + 's'].add(value);
    } else {
        state.activeFilters[type + 's'].delete(value);
    }

    if (type === 'scene') handleSceneTagClick(value);

    applyFilters();
    updateAllDimensions();
}

/**
 * THE FILTERING ENGINE
 * It looks at the selected character AND
 * all active tags to calculate exactly which scenes should be shown.
 */
function applyFilters() {
    let filteredScenes = [...playData.scenes];

    if (state.selectedCharacter) {
        filteredScenes = filteredScenes.filter(scene => scene.characters.includes(state.selectedCharacter));
    }

    // Logic Fix: Ensure we match the plural keys in state.activeFilters
    ['emotions', 'themes', 'events', 'scenes'].forEach(filterType => {
        const activeSet = state.activeFilters[filterType];

        if (activeSet && activeSet.size > 0) {
            filteredScenes = filteredScenes.filter(scene => {
                if (filterType === 'scenes') {
                    return activeSet.has(scene.id);
                }
                // Check if scene has the property and if any item in the scene's array is in our active filter set
                return scene[filterType] && scene[filterType].some(val => activeSet.has(val));
            });
        }
    });

    state.currentScenes = filteredScenes;

    // Update text panel to show the first scene in the filtered result
    if (filteredScenes.length > 0) {
        updateTextPanels(filteredScenes[0].text);
    }
}

/**
 * UI REFRESH COORDINATOR
 * Calculates how many times each tag appears in the current filtered list
 * of scenes and tells the tags to update their size/boldness.
 */
function updateAllDimensions() {
    const types = ['emotions', 'themes', 'events'];
    types.forEach(type => {
        const counts = {};
        state.currentScenes.forEach(scene => {
            scene[type].forEach(item => counts[item] = (counts[item] || 0) + 1);
        });
        updateTagsDisplay(`${type}-container`, counts, type.slice(0, -1)); // remove 's' for ID
    });

    // Scenes are special case
    const sceneCounts = {};
    state.currentScenes.forEach(scene => sceneCounts[scene.id] = 1);
    updateTagsDisplay('scenes-container', sceneCounts, 'scene');

    // Timeline visualization removed; scene filtering now drives only tags/text panels.
}
