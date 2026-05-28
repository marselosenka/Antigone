
// VIDEO CONTROLS  (Page 3 only)
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
 * PLAYER SETUP  (called once on DOMContentLoaded)
 */
function initializeVideoControls() {
    const videoElement  = document.getElementById('video-element');
    const playPauseBtn  = document.getElementById('play-pause-btn');
    const playIcon      = document.getElementById('play-icon');
    const progressBar   = document.getElementById('video-progress');
    const muteBtn       = document.getElementById('mute-btn');
    const volumeControl = document.getElementById('volume-control');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const videoWrapper  = document.getElementById('video-player');
    const overlayIcon   = document.querySelector('.video-overlay-icon');

    if (!videoElement) return;   // page 3 DOM not present yet → bail

    muteBtn.innerHTML      = createIcon('volumeHigh');
    videoElement.style.display = 'block';

    videoElement.addEventListener('loadedmetadata', () => {
        document.getElementById('duration').textContent = formatTime(videoElement.duration);
        progressBar.max = videoElement.duration;
    });

    function togglePlay() {
        videoElement.paused ? videoElement.play() : videoElement.pause();
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

    playPauseBtn.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
    document.querySelector('.video-controls')?.addEventListener('click', e => e.stopPropagation());
    videoWrapper.addEventListener('click', togglePlay);
    videoElement.addEventListener('play',  updatePlayState);
    videoElement.addEventListener('pause', updatePlayState);

    videoElement.addEventListener('timeupdate', () => {
        document.getElementById('current-time').textContent = formatTime(videoElement.currentTime);
        progressBar.value = videoElement.currentTime;
    });

    progressBar.addEventListener('input', e => {
        videoElement.currentTime = parseFloat(e.target.value);
    });

    muteBtn.addEventListener('click', e => {
        e.stopPropagation();
        videoElement.muted  = !videoElement.muted;
        muteBtn.innerHTML   = videoElement.muted ? createIcon('volumeMute') : createIcon('volumeHigh');
    });

    volumeControl.addEventListener('input',  e => { e.stopPropagation(); videoElement.volume = e.target.value / 100; });
    volumeControl.addEventListener('click',  e => e.stopPropagation());

    fullscreenBtn.addEventListener('click', e => {
        e.stopPropagation();
        if      (videoElement.requestFullscreen)       videoElement.requestFullscreen();
        else if (videoElement.webkitRequestFullscreen) videoElement.webkitRequestFullscreen();
    });

    updatePlayState();
}

// Automated scene sync (Page 3 only)
function initVideoSceneSync() {
    const videoElement = document.getElementById('video-element');
    if (!videoElement) return;

    videoElement.addEventListener('timeupdate', () => {
        const currentTime = videoElement.currentTime;

        const activeScene = playData.scenes.find(
            s => currentTime >= s.start && currentTime <= s.end
        );

        if (activeScene && activeScene.id !== state.lastActiveSceneId) {
            state.lastActiveSceneId = activeScene.id;
            updateTextPanels(activeScene.text, '');
            highlightRelatedItems(activeScene);

            document.querySelectorAll('#scenes-container .tag').forEach(tag => {
                tag.classList.remove('active');
                if (tag.dataset.value === activeScene.id) tag.classList.add('active');
            });

            state.currentScenes = [activeScene];
            updateAllDimensions();
        }

        if (!activeScene && state.lastActiveSceneId) {
            state.lastActiveSceneId = null;
            state.activeFilters.scenes.clear();
            document.querySelectorAll('#scenes-container .tag').forEach(tag => tag.classList.remove('active'));
            applyFilters();
            updateAllDimensions();
        }
    });
}

// Visual highlighting helpers
function highlightRelatedItems(scene) {
    scene.emotions.forEach(e => highlightTag(e));
    scene.themes.forEach(t   => highlightTag(t));
    scene.events.forEach(e   => highlightTag(e));
}

function highlightTag(value) {
    const tag = document.querySelector(`.tag[data-value="${value}"]`);
    if (tag) {
        tag.classList.add('highlight');
        setTimeout(() => tag.classList.remove('highlight'), 1500);
    }
}

// Time formatter
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    const helpButton = document.getElementById('help-button');
    const helpDialog = document.getElementById('keyboard-help');

    helpButton.addEventListener('click', () => helpDialog.classList.toggle('show'));

    document.addEventListener('click', e => {
        if (!helpDialog.contains(e.target) && !helpButton.contains(e.target)) {
            helpDialog.classList.remove('show');
        }
    });

    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const videoElement = document.getElementById('video-element');

        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (videoElement) videoElement.paused ? videoElement.play() : videoElement.pause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (videoElement) videoElement.currentTime = Math.min(videoElement.currentTime + 5, videoElement.duration);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (videoElement) videoElement.currentTime = Math.max(videoElement.currentTime - 5, 0);
                break;
            case '1': case '2': case '3': case '4': case '5': case '6': {
                e.preventDefault();
                const bubbles = document.querySelectorAll('.character-bubble');
                if (bubbles[parseInt(e.key) - 1]) bubbles[parseInt(e.key) - 1].click();
                break;
            }
            case 'f': case 'F':
                e.preventDefault();
                document.getElementById('fullscreen-btn')?.click();
                break;
            case 'm': case 'M':
                e.preventDefault();
                document.getElementById('mute-btn')?.click();
                break;
            case '?':
                e.preventDefault();
                helpDialog.classList.toggle('show');
                break;
        }
    });
}
