 
// RENDER  –  Builds dynamic UI elements from playData

/**
 * DATA PARSING
 * Loops through playData to find every unique emotion, theme, and event.
 * Renders tags to both page2 and page3 scene containers.
 */
function generateDynamicTags() {
    const uniqueData = {
        emotions: new Set(),
        themes:   new Set(),
        events:   new Set(),
        scenes:   []
    };

    playData.scenes.forEach(scene => {
        uniqueData.scenes.push({ id: scene.id, name: scene.name });
        scene.emotions.forEach(e => uniqueData.emotions.add(e));
        scene.themes.forEach(t  => uniqueData.themes.add(t));
        scene.events.forEach(e  => uniqueData.events.add(e));
    });

    // Page 3 semantic tags
    renderTagsToContainer('emotions-container', uniqueData.emotions, 'emotion');
    renderTagsToContainer('themes-container',   uniqueData.themes,   'theme');
    renderTagsToContainer('events-container',   uniqueData.events,   'event');

    // Scene tags – page 2 (no video seek) and page 3 (with video seek)
    renderSceneTags('scenes-container-page2', uniqueData.scenes, /* seekVideo */ false);
    renderSceneTags('scenes-container',       uniqueData.scenes, /* seekVideo */ true);
}

/**
 * TAG GROUP RENDERING
 */
function renderTagsToContainer(containerId, dataSet, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    dataSet.forEach(value => createTagElement(container, value, type));
}

/**
 * SCENE TAG RENDERING
 * seekVideo=false → page 2 only updates text panels
 * seekVideo=true  → page 3 also seeks the video
 */
function renderSceneTags(containerId, scenes, seekVideo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    scenes.forEach(scene => createSceneTagElement(container, scene.id, scene.name, seekVideo));
}

/**
 * ELEMENT CREATION  –  generic tag (emotion / theme / event)
 */
function createTagElement(container, value, type, label = null) {
    const span       = document.createElement('span');
    span.className   = 'tag';
    span.tabIndex    = 0;
    span.dataset.type  = type;
    span.dataset.value = value;
    span.textContent   = label || formatLabel(value);
    span.addEventListener('click', () => handleTagClick(span));
    container.appendChild(span);
}

/**
 * ELEMENT CREATION  –  scene tag (knows whether to seek video)
 */
function createSceneTagElement(container, sceneId, sceneName, seekVideo) {
    const span          = document.createElement('span');
    span.className      = 'tag';
    span.tabIndex       = 0;
    span.dataset.type   = 'scene';
    span.dataset.value  = sceneId;
    span.textContent    = sceneName;

    span.addEventListener('click', () => {
        if (seekVideo) {
            handleTagClick(span);          // page 3 path (video + filter)
        } else {
            handleSceneTagClickPage2(sceneId, span); // page 2 path (text only)
        }
    });

    container.appendChild(span);
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

        const size = 100 + (char.importance * 2);
        bubble.style.width  = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.setProperty('--char-color', char.color);

        container.appendChild(bubble);
    });
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
 * TEXT FORMATTING  –  'divine-law' → 'Divine Law'
 */
function formatLabel(slug) {
    return slug.split('-')
               .map(w => w.charAt(0).toUpperCase() + w.slice(1))
               .join(' ');
}

/**
 * SCRIPT PANEL UPDATES
 *  the three translation panels on whichever page is active.
 * Accepts an optional pageId suffix (e.g. '-page2'); defaults to page 3.
 */
function updateTextPanels(text, suffix) {
    const sfx = suffix || '';
    const ancient = document.getElementById(`ancient-text${sfx}`);
    const modern  = document.getElementById(`modern-text${sfx}`);
    const english = document.getElementById(`english-text${sfx}`);
    if (ancient) ancient.textContent = text.ancient;
    if (modern)  modern.textContent  = text.modern;
    if (english) english.textContent = text.english;
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
