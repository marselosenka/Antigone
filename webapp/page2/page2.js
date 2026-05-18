document.addEventListener('DOMContentLoaded', () => {
    renderSceneList();
    wireSpeakButtons();
    sparqlLineNavigator.init();
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

    updateTextPanels(scene.text, '-page2');
}

function wireSpeakButtons() {
    document.querySelectorAll('.speak-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tts.speakFromElement(btn.dataset.panel, btn.dataset.lang, btn);
        });
    });
}
