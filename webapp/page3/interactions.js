
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

/**
 * DYNAMIC UI UPDATES
 * Refreshes the look of tags based on current filtered scenes.
 */
function updateTagsDisplay(containerId, counts, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tags = container.querySelectorAll('.tag');
    if (!tags.length) return;

    const tagArray = Array.from(tags).map(tag => ({
        element: tag,
        value:   tag.dataset.value,
        count:   counts[tag.dataset.value] || 0
    })).sort((a, b) => b.count - a.count);

    tagArray.forEach(tagData => {
        const tag     = tagData.element;
        const count   = tagData.count;
        const isActive = state.activeFilters[type + 's']
            ? state.activeFilters[type + 's'].has(tagData.value)
            : false;

        if (count > 0 || isActive) {
            tag.style.opacity       = '1';
            tag.style.pointerEvents = 'auto';
            tag.style.display       = 'inline-block';

            tag.classList.remove('large', 'medium');
            if (count >= 4)      tag.classList.add('large');
            else if (count >= 2) tag.classList.add('medium');

            isActive ? tag.classList.add('active') : tag.classList.remove('active');
        } else {
            tag.style.opacity       = '0.3';
            tag.style.pointerEvents = 'none';
            tag.classList.remove('active');
        }
    });
}

/**
 * HOVER TOOLTIP for character bubbles
 */
function showTooltip(bubble) {
    const character = bubble.dataset.character;
    const charData  = playData.characters.find(c => c.id === character);
    if (!charData) return;

    let tooltip = document.getElementById('character-tooltip');
    if (!tooltip) {
        tooltip           = document.createElement('div');
        tooltip.id        = 'character-tooltip';
        tooltip.className = 'character-tooltip';
        document.body.appendChild(tooltip);
    }

    const sceneCount   = playData.scenes.filter(s => s.characters.includes(character)).length;
    tooltip.innerHTML  = `<strong>${charData.name}</strong><br>Speaking time: ${charData.importance}%<br>Appears in: ${sceneCount} scenes`;

    const rect          = bubble.getBoundingClientRect();
    tooltip.style.left  = (rect.left + rect.width / 2) + 'px';
    tooltip.style.top   = (rect.top - 10) + 'px';
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    const tooltip = document.getElementById('character-tooltip');
    if (tooltip) tooltip.style.opacity = '0';
}
