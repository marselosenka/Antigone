function collectPlayMeta() {
    const meta = { emotions: new Set(), themes: new Set(), events: new Set(), scenes: [] };
    playData.scenes.forEach(scene => {
        meta.scenes.push({ id: scene.id, name: scene.name });
        scene.emotions.forEach(e => meta.emotions.add(e));
        scene.themes.forEach(t  => meta.themes.add(t));
        scene.events.forEach(e  => meta.events.add(e));
    });
    return meta;
}

function renderTags(containerId, values, type, onClick) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    values.forEach(value => {
        const span = document.createElement('span');
        span.className     = 'tag';
        span.tabIndex      = 0;
        span.dataset.type  = type;
        span.dataset.value = value;
        span.textContent   = formatLabel(value);
        if (onClick) span.addEventListener('click', () => onClick(span));
        container.appendChild(span);
    });
}

function renderSceneTags(containerId, scenes, onClick) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    scenes.forEach(scene => {
        const span = document.createElement('span');
        span.className     = 'tag';
        span.tabIndex      = 0;
        span.dataset.type  = 'scene';
        span.dataset.value = scene.id;
        span.textContent   = scene.name;
        if (onClick) span.addEventListener('click', () => onClick(scene.id, span));
        container.appendChild(span);
    });
}

/* Text formatting ("divine-law" -> "Diveine Law") */
function formatLabel(slug) {
    return slug.split('-')
               .map(w => w.charAt(0).toUpperCase() + w.slice(1))
               .join(' ');
}

/**
 * SCRIPT PANEL UPDATES - the three translation panels on whichever page is active.
 * Accepts an optional pageId suffix (i.e. '-page2') defaults to page 
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
