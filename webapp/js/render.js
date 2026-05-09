/**
 * DATA PARSING
 * Loops through the master playData to find every unique emotion, theme, and event.
 * This ensures filter buttons match the content of the play automatically.
 */
function generateDynamicTags() {
    const uniqueData = {
        emotions: new Set(), themes: new Set(), events: new Set(), scenes: []
    };

    playData.scenes.forEach(scene => {
        uniqueData.scenes.push({ id: scene.id, name: scene.name });
        scene.emotions.forEach(e => uniqueData.emotions.add(e));
        scene.themes.forEach(t => uniqueData.themes.add(t));
        scene.events.forEach(e => uniqueData.events.add(e));
    });

    renderTagsToContainer('emotions-container', uniqueData.emotions, 'emotion');
    renderTagsToContainer('themes-container', uniqueData.themes, 'theme');
    renderTagsToContainer('events-container', uniqueData.events, 'event');
    renderSceneTags('scenes-container', uniqueData.scenes);
}

/**
 * TAG GROUP RENDERING
 * Clears a specific sidebar container and fills it with new tag elements
 * based on the unique data found in the play.
 */
function renderTagsToContainer(containerId, dataSet, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    dataSet.forEach(value => createTagElement(container, value, type));
}

/**
 * SCENE TAG RENDERING
 * A specialized version of the tag renderer specifically for the 'Scenes'
 * section at the bottom of the app.
 */
function renderSceneTags(containerId, scenes) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    scenes.forEach(scene => createTagElement(container, scene.id, 'scene', scene.name));
}

/**
 * ELEMENT CREATION
 * Creates the actual HTML <span> for a tag,
 * assigns its data attributes, and attaches the click listener.
 */
function createTagElement(container, value, type, label = null) {
    const span = document.createElement('span');
    span.className = 'tag';
    span.tabIndex = 0;
    span.dataset.type = type;
    span.dataset.value = value;
    span.textContent = label || formatLabel(value);
    span.addEventListener('click', () => handleTagClick(span));
    container.appendChild(span);
}

/**
 * CHARACTER INITIALIZATION
 * Creates the circular bubble for each character. It calculates their
 * size based on their 'importance' and sets their unique ancient CSS color.
 */
function renderCharacters() {
    const container = document.getElementById('characters-container');
    container.innerHTML = '';
    playData.characters.forEach(char => {
        const bubble = document.createElement('div');
        bubble.className = 'character-bubble';
        bubble.dataset.character = char.id;
        bubble.tabIndex = 0;
        bubble.dataset.color = char.color;
        bubble.textContent = char.name;

        const size = 100 + (char.importance * 2);
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.setProperty('--char-color', char.color);

        container.appendChild(bubble);
    });
}

/**
 * DYNAMIC UI UPDATES
 * Refreshes the look of tags based on the current search. It highlights tags
 * that are "active" and fades out those that don't exist in the current filtered scenes.
 */
function updateTagsDisplay(containerId, counts, type) {
    const container = document.getElementById(containerId);
    const tags = container.querySelectorAll('.tag');
    let visibleCount = 0;

    const tagArray = Array.from(tags).map(tag => ({
        element: tag,
        value: tag.dataset.value,
        count: counts[tag.dataset.value] || 0
    })).sort((a, b) => b.count - a.count);

    tagArray.forEach((tagData) => {
        const tag = tagData.element;
        const count = tagData.count;
        const isActive = state.activeFilters[type + 's'].has(tagData.value);

        if (count > 0 || isActive) {
            tag.style.opacity = '1';
            tag.style.pointerEvents = 'auto';
            tag.style.display = 'inline-block';

            tag.classList.remove('large', 'medium');
            if (count >= 4) tag.classList.add('large');
            else if (count >= 2) tag.classList.add('medium');

            if (isActive) tag.classList.add('active');
            else tag.classList.remove('active');

            visibleCount++;
        } else {
            tag.style.opacity = '0.3';
            tag.style.pointerEvents = 'none';
            tag.classList.remove('active');
        }
    });
}

/**
 * TEXT FORMATTING
 * Converts IDs from the data into "Clean Capitalized" labels
 * for the user to read (e.g., 'divine-law' becomes 'Divine Law').
 */
function formatLabel(slug) {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * SCRIPT PANEL UPDATES
 * Swaps the text inside the Ancient Greek, Modern Greek, and English
 * panels whenever a new scene is selected.
 */
function updateTextPanels(text) {
    document.getElementById('ancient-text').textContent = text.ancient;
    document.getElementById('modern-text').textContent = text.modern;
    document.getElementById('english-text').textContent = text.english;
}


/**
 * HOVER INFO
 * Creates and positions a popup box when hovering over a character bubble
 * to show their stats (importance and scene count).
 */
function showTooltip(bubble) {
    const character = bubble.dataset.character;
    const charData = playData.characters.find(c => c.id === character);
    if (!charData) return;

    let tooltip = document.getElementById('character-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'character-tooltip';
        tooltip.className = 'character-tooltip';
        document.body.appendChild(tooltip);
    }

    const sceneCount = playData.scenes.filter(s => s.characters.includes(character)).length;
    tooltip.innerHTML = `<strong>${charData.name}</strong><br>Speaking time: ${charData.importance}%<br>Appears in: ${sceneCount} scenes`;

    const rect = bubble.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
    tooltip.style.top = (rect.top - 10) + 'px';
    tooltip.style.opacity = '1';
}

/**
 * HOVER CLEANUP
 * Hides the info box when the mouse leaves a character bubble.
 */
function hideTooltip() {
    const tooltip = document.getElementById('character-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
    }
}