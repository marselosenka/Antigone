// for the controls icons : svg
const createIcon = (type) => {
    const svg = {
        play: `<svg viewBox="0 0 24 24" width="20" height="20"
                fill="none" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round">
                <polygon points="8,5 19,12 8,19" />
              </svg>`,

        pause: `<svg viewBox="0 0 24 24" width="20" height="20"
                 fill="none" stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round">
                 <rect x="6" y="5" width="2.5" height="14" rx="0.8" />
                 <rect x="15.5" y="5" width="2.5" height="14" rx="0.8" />
               </svg>`,

        volumeHigh: `<svg viewBox="0 0 24 24" width="20" height="20"
                      fill="none" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 9l3-3h1.5v12H9l-3-3H3V9h3z" />
                      <path d="M15 10c1 1 1.8 2.2 1.8 3.5S16 16.5 15 17.5" />
                      <path d="M18 8c2 1.8 3.5 4.5 3.5 7.5S20 22.2 18 24" />
                    </svg>`,

        volumeMute: `<svg viewBox="0 0 24 24" width="20" height="20"
                       fill="none" stroke="currentColor" stroke-width="1.5"
                       stroke-linecap="round" stroke-linejoin="round">
                       <path d="M6 9l3-3h1.5v12H9l-3-3H3V9h3z" />
                       <line x1="16" y1="9" x2="22" y2="15" />
                       <line x1="22" y1="9" x2="16" y2="15" />
                     </svg>`
    };
    return svg[type] || '';
};

/**
 * SETTING UP THE PLAYER
 * Initializes video controls. Timeline-related behavior has been removed.
 */
function initializeVideoControls() {
    const videoElement = document.getElementById('video-element');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const progressBar = document.getElementById('video-progress');
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.innerHTML = createIcon('volumeHigh');
    const volumeControl = document.getElementById('volume-control');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const videoWrapper = document.getElementById('video-player');
    const overlayIcon = document.querySelector('.video-overlay-icon');

    videoElement.style.display = 'block';

    videoElement.addEventListener('loadedmetadata', () => {
        document.getElementById('duration').textContent = formatTime(videoElement.duration);
        progressBar.max = videoElement.duration;
    });

    function togglePlay() {
        if (videoElement.paused) videoElement.play();
        else videoElement.pause();
    }

    function updatePlayState() {
        if (videoElement.paused) {
            playIcon.innerHTML = createIcon('play');
            if (overlayIcon) overlayIcon.innerHTML = createIcon('play');
            videoWrapper.classList.remove('playing');
            videoWrapper.classList.add('paused');
        } else {
            playIcon.innerHTML = createIcon('pause');
            if (overlayIcon) overlayIcon.innerHTML = createIcon('pause');
            videoWrapper.classList.add('playing');
            videoWrapper.classList.remove('paused');
        }
    }

    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    videoWrapper.addEventListener('click', togglePlay);
    videoElement.addEventListener('play', updatePlayState);
    videoElement.addEventListener('pause', updatePlayState);

    videoElement.addEventListener('timeupdate', () => {
        document.getElementById('current-time').textContent = formatTime(videoElement.currentTime);
        progressBar.value = videoElement.currentTime;
    });

    progressBar.addEventListener('input', (e) => {
        videoElement.currentTime = parseFloat(e.target.value);
    });

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        videoElement.muted = !videoElement.muted;
        muteBtn.innerHTML = videoElement.muted
            ? createIcon('volumeMute')
            : createIcon('volumeHigh');
    });

    volumeControl.addEventListener('input', (e) => {
        e.stopPropagation();
        videoElement.volume = e.target.value / 100;
    });
    volumeControl.addEventListener('click', (e) => e.stopPropagation());

    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (videoElement.requestFullscreen) videoElement.requestFullscreen();
        else if (videoElement.webkitRequestFullscreen) videoElement.webkitRequestFullscreen();
    });

    updatePlayState();
}


// automated sync: tracks video progress and auto-activate scenes
const videoElementForSync = document.getElementById('video-element');

videoElementForSync.addEventListener('timeupdate', () => {
    const currentTime = videoElementForSync.currentTime;

    const activeScene = playData.scenes.find(
        s => currentTime >= s.start && currentTime <= s.end
    );

    if (activeScene && activeScene.id !== state.lastActiveSceneId) {
        state.lastActiveSceneId = activeScene.id;
        updateTextPanels(activeScene.text);
        highlightRelatedItems(activeScene);
        document.querySelectorAll('#scenes-container .tag').forEach(tag => {
            tag.classList.remove('active');
            if (tag.dataset.value === activeScene.id) {
                tag.classList.add('active');
            }
        });
        state.currentScenes = [activeScene];
        updateAllDimensions();
    }

    if (!activeScene && state.lastActiveSceneId) {
        state.lastActiveSceneId = null;
        state.activeFilters.scenes.clear();
        document.querySelectorAll('#scenes-container .tag').forEach(tag => {
            tag.classList.remove('active');
        });
        applyFilters();
        updateAllDimensions();
    }
});
/**
 * When a user clicks a scene tag, update text and semantic highlights only.
 */
function handleSceneTagClick(sceneId) {
    const scene = playData.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const video = document.getElementById('video-element');
    if (video && video.duration) {
        video.currentTime = scene.start;
    }

    updateTextPanels(scene.text);
    highlightRelatedItems(scene);

    state.lastActiveSceneId = sceneId;
}

/**
 * VISUAL SYNC
 * Takes all the metadata for a scene and makes the corresponding
 * tags in the sidebars "pulse" or highlight.
 */
function highlightRelatedItems(scene) {
    scene.emotions.forEach(emotion => highlightTag(emotion));
    scene.themes.forEach(theme => highlightTag(theme));
    scene.events.forEach(event => highlightTag(event));
}

/**
 * TAG HIGHLIGHTING
 * Temporarily adds a CSS class to a tag to grab the user's attention.
 */
function highlightTag(value) {
    const tag = document.querySelector(`.tag[data-value="${value}"]`);
    if (tag) {
        tag.classList.add('highlight');
        setTimeout(() => tag.classList.remove('highlight'), 1500);
    }
}

/**
 * TIME FORMATTER
 * Converts raw seconds (e.g., 125) into readable strings (e.g., "02:05").
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


/**
 * USER TOOLS
 * Listens for key presses so the user can control the play without a mouse.
 */
function initializeKeyboardShortcuts() {
    const helpButton = document.getElementById('help-button');
    const helpDialog = document.getElementById('keyboard-help');

    helpButton.addEventListener('click', () => helpDialog.classList.toggle('show'));

    document.addEventListener('click', (e) => {
        if (!helpDialog.contains(e.target) && !helpButton.contains(e.target)) {
            helpDialog.classList.remove('show');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const videoElement = document.getElementById('video-element');

        switch(e.key) {
            case ' ':
                e.preventDefault();
                if (videoElement.paused) videoElement.play();
                else videoElement.pause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                videoElement.currentTime = Math.min(videoElement.currentTime + 5, videoElement.duration);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                videoElement.currentTime = Math.max(videoElement.currentTime - 5, 0);
                break;
            case '1': case '2': case '3': case '4': case '5': case '6':
                e.preventDefault();
                const bubbles = document.querySelectorAll('.character-bubble');
                if (bubbles[parseInt(e.key) - 1]) bubbles[parseInt(e.key) - 1].click();
                break;
            case 'f': case 'F':
                e.preventDefault();
                document.getElementById('fullscreen-btn').click();
                break;
            case 'm': case 'M':
                e.preventDefault();
                document.getElementById('mute-btn').click();
                break;
            case '?':
                e.preventDefault();
                helpDialog.classList.toggle('show');
                break;
        }
    });
}

