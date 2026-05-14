/**
 * Simple Text-to-Speech using the Web Speech API.
 */
const tts = (() => {

    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            // voices are now available
        };
    }

    let currentUtterance = null;
    let currentButton = null;

    function speak(text, lang, buttonElement) {
        // cancel any ongoing speech
        window.speechSynthesis.cancel();

        // ff the same button was clicked while speaking, just stop
        if (buttonElement && buttonElement.classList.contains('speaking')) {
            buttonElement.classList.remove('speaking');
            currentUtterance = null;
            currentButton = null;
            return;
        }

        // remove speaking indicator from any other button
        if (currentButton) {
            currentButton.classList.remove('speaking');
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;   // slightly slower for clarity

        // get available voices and try to find one matching the language
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.startsWith(lang));
        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        // for Ancient Greek, there are no voices, fallback to modern Greek
        if (lang === 'grc') {
            utterance.lang = 'el';
        }


        if (buttonElement) {
            buttonElement.classList.add('speaking');
        }

        utterance.onend = () => {
            if (buttonElement) buttonElement.classList.remove('speaking');
            currentUtterance = null;
            currentButton = null;
        };

        utterance.onerror = () => {
            if (buttonElement) buttonElement.classList.remove('speaking');
            currentUtterance = null;
            currentButton = null;
        };

        window.speechSynthesis.speak(utterance);
        currentUtterance = utterance;
        currentButton = buttonElement || null;
    }

    // public API speak text from a DOM element's text content
    function speakFromElement(elementId, lang, buttonElement) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const text = el.textContent.trim();
        if (text) {
            speak(text, lang, buttonElement);
        }
    }

    return { speak, speakFromElement };
})();