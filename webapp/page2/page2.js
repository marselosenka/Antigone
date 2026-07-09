document.addEventListener('DOMContentLoaded', () => {
    renderSceneList();
    wireSpeakButtons();
    wireChineseToggle();
    wireSceneReaderToNavigator();
    sparqlLineNavigator.init();

    /* Whenever the navigator changes line, refresh context sidebar + reader highlight */
    sparqlLineNavigator.onLineChange = handleLineChange;

    /* Auto-restore the last opened scene (survives page navigation) */
    try {
        const savedScene = sessionStorage.getItem('antigone_scene');
        if (savedScene) {
            const tag = Array.from(document.querySelectorAll('#scenes-container-page2 .tag'))
                .find(t => {
                    const sc = playData.scenes.find(s => s.name === t.textContent.trim());
                    return sc && sc.id === savedScene;
                });
            if (tag) tag.click();
        }
    } catch (_) {}
});

function renderSceneList() {
    const sceneMeta = playData.scenes.map(s => ({ id: s.id, name: s.name }));
    renderSceneTags('scenes-container-page2', sceneMeta, onSceneTagClick);
}

function onSceneTagClick(sceneId, clickedTag) {
    const scene = playData.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    document.querySelectorAll('#scenes-container-page2 .tag').forEach(t => t.classList.remove('active'));
    clickedTag.classList.add('active');

    /* Load the full scene reader (new) */
    sceneReader.loadScene(sceneId);


    updateTextPanels(scene.text, '-page2');
}

function wireSpeakButtons() {
    document.querySelectorAll('.speak-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tts.speakFromElement(btn.dataset.panel, btn.dataset.lang, btn);
        });
    });
}

/* Toggle the Chinese column in the scene reader on/off */
function wireChineseToggle() {
    const checkbox = document.getElementById('toggle-chinese');
    if (!checkbox) return;
    checkbox.addEventListener('change', () => {
        const table = document.querySelector('#reader-container .reader-table');
        if (!table) return;
        table.classList.toggle('hide-zh', !checkbox.checked);
    });
}

/* Click on a reader row → jump the line navigator to that line */
function wireSceneReaderToNavigator() {
    sceneReader.onLineClick(lineNumber => {
        /* Set the input + trigger "Go" so the existing navigator handles everything */
        const input = document.getElementById('line-search-input');
        const goBtn = document.getElementById('go-line-btn');
        if (!input || !goBtn) return;

        if (goBtn.disabled) {
            /* Navigator not loaded yet — load it first, then jump */
            const loadBtn = document.getElementById('load-lines-btn');
            if (loadBtn) loadBtn.click();
            const waitAndJump = setInterval(() => {
                if (!goBtn.disabled) {
                    clearInterval(waitAndJump);
                    input.value = lineNumber;
                    goBtn.click();
                }
            }, 200);
            /* safety timeout */
            setTimeout(() => clearInterval(waitAndJump), 8000);
        } else {
            input.value = lineNumber;
            goBtn.click();
        }
    });
}

/* Called by sparqlLineNavigator when current line changes.
   Updates the reader's row highlight and fetches context. */
async function handleLineChange(lineNumber) {
    if (!Number.isFinite(lineNumber)) return;
    /* Highlight in reader (if matching scene is loaded) */
    sceneReader.highlightLine(lineNumber);

    /* Update context sidebar */
    try {
        const ctx = await sceneReader.getContextForLine(lineNumber);
        renderContext(ctx);
    } catch (e) {
        /* silent — context is a nice-to-have */
    }
}

function renderContext(ctx) {
    const empty = document.getElementById('context-empty');
    const body  = document.getElementById('context-body');
    if (!body || !empty) return;

    empty.style.display = 'none';
    body.style.display  = '';

    /* Speaker */
    const speakerEl = document.getElementById('ctx-speaker');
    if (speakerEl) {
        if (ctx.charId) {
            const { name, color } = sceneReader.characterDisplay(ctx.charId);
            speakerEl.innerHTML = `<span class="speaker-badge" style="background:${color}">${name}</span>`;
        } else {
            speakerEl.innerHTML = '<em style="color:#aaa;">Unknown</em>';
        }
    }

    /* Scene */
    const sceneEl = document.getElementById('ctx-scene');
    if (sceneEl) sceneEl.textContent = ctx.scene ? ctx.scene.name : '—';

    /* Themes */
    fillPills('ctx-themes', ctx.themes);
    /* Conflict */
    fillPills('ctx-conflict', ctx.conflicts);
    /* Myths */
    fillPills('ctx-myths', ctx.myths);
    /* Motivations */
    fillPills('ctx-motivations', ctx.motivations);
}

function fillPills(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!items || items.length === 0) {
        el.innerHTML = '<span class="context-pill-empty">—</span>';
        return;
    }
    el.innerHTML = items
        .slice(0, 8)
        .map(s => `<span class="context-pill">${escapeHTML(s)}</span>`)
        .join('');
}

function escapeHTML(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}