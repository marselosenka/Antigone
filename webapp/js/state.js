/**
 * STATE MANAGEMENT
 * If the timeline, tags, or text panels need to know what to show, they check here.
 */
const state = {
    selectedCharacter: null,
    lastActiveSceneId: null,
    activeFilters: {
        emotions: new Set(),
        themes: new Set(),
        events: new Set(),
        scenes: new Set()
    },
    currentScenes: []
};