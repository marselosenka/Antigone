// SPARQL LINE NAVIGATOR  (Page 2)
const sparqlLineNavigator = (() => {
    const state = {
        endpoint:        'http://localhost:3030/antigone/query',
        lines:           [],
        currentIndex:    -1,
        lineIndexByNumber: new Map()
    };

    const sparqlQuery = `
PREFIX : <http://example.org/antigone#>
SELECT ?line ?n ?ancient
       (SAMPLE(?modernRaw)  AS ?modern)
       (SAMPLE(?englishRaw) AS ?english)
WHERE {
  ?line a :Line ;
        :lineNumber ?n ;
        :text ?ancient .

  OPTIONAL {
    ?tvModern a :TranslationVariant ;
              :relatedTo ?line ;
              :text ?modernRaw .
    FILTER(CONTAINS(STR(?tvModern), "_GR"))
  }

  OPTIONAL {
    ?tvEnglish a :TranslationVariant ;
               :relatedTo ?line ;
               :text ?englishRaw .
    FILTER(CONTAINS(STR(?tvEnglish), "_EN"))
  }
}
GROUP BY ?line ?n ?ancient
ORDER BY ?n
`;


    function setStatus(message) {
        const el = document.getElementById('sparql-status');
        if (el) el.textContent = message;
    }

    function setCurrentLineTag(lineNumber) {
        const tag = document.getElementById('current-line-tag');
        if (!tag) return;
        tag.textContent = lineNumber ? `Line ${lineNumber}` : 'Line --';
    }

    function canDisplay(line) {
        return Boolean(line && (line.ancient || line.modern || line.english));
    }

    function findNextDisplayableIndex(startIndex) {
        for (let i = startIndex + 1; i < state.lines.length; i++) {
            if (canDisplay(state.lines[i])) return i;
        }
        return -1;
    }

    function findPreviousDisplayableIndex(startIndex) {
        for (let i = startIndex - 1; i >= 0; i--) {
            if (canDisplay(state.lines[i])) return i;
        }
        return -1;
    }

    function showLineByIndex(index) {
        const line = state.lines[index];
        if (!line) return;

        state.currentIndex = index;
        setCurrentLineTag(line.lineNumber);

        // Always update page 2 text panels
        updateTextPanels({
            ancient: line.ancient || '(not available)',
            modern:  line.modern  || '(not available)',
            english: line.english || '(not available)'
        }, '-page2');

        updateNavigationControls();

        // Notify any external listener (e.g. context sidebar, scene reader highlight)
        if (typeof api.onLineChange === 'function') {
            try { api.onLineChange(line.lineNumber); } catch (_) {}
        }
    }


    async function loadLines() {
        setStatus('Loading lines from SPARQL...');
        const nextButton = document.getElementById('next-line-btn');
        const prevButton = document.getElementById('prev-line-btn');
        const goButton   = document.getElementById('go-line-btn');
        if (nextButton) nextButton.disabled = true;
        if (prevButton) prevButton.disabled = true;
        if (goButton)   goButton.disabled   = true;

        try {
            const response = await runSparqlRequest(sparqlQuery);
            if (!response.ok) throw new Error(`SPARQL request failed (${response.status})`);

            const json     = await response.json();
            const bindings = (json.results && json.results.bindings) ? json.results.bindings : [];

            state.lines = bindings
                .map(binding => ({
                    lineNumber: binding.n ? Number(binding.n.value) : null,
                    ancient:    binding.ancient ? binding.ancient.value : '',
                    modern:     binding.modern  ? binding.modern.value  : '',
                    english:    binding.english ? binding.english.value : ''
                }))
                .filter(item => Number.isFinite(item.lineNumber))
                .sort((a, b) => a.lineNumber - b.lineNumber);

            state.lineIndexByNumber = new Map(
                state.lines.map((line, index) => [line.lineNumber, index])
            );

            const firstIndex = findNextDisplayableIndex(-1);
            if (firstIndex === -1) {
                setCurrentLineTag(null);
                setStatus('No displayable lines found in SPARQL results.');
                return;
            }

            showLineByIndex(firstIndex);
            setStatus(`Loaded ${state.lines.length} lines. Ready to navigate.`);
            if (goButton) goButton.disabled = false;
        } catch (error) {
            setStatus(`SPARQL error: ${error.message}`);
            setCurrentLineTag(null);
        }
    }

    async function runSparqlRequest(query) {
        return fetch(state.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-query',
                'Accept':       'application/sparql-results+json'
            },
            body: query
        });
    }

    // navigation
    function showNextLine() {
        if (!state.lines.length) return;
        const nextIndex = findNextDisplayableIndex(state.currentIndex);
        if (nextIndex === -1) {
            setStatus('End of available corpus lines reached.');
            updateNavigationControls();
            return;
        }
        showLineByIndex(nextIndex);
        setStatus(`Showing line ${state.lines[nextIndex].lineNumber}.`);
    }

    function showPreviousLine() {
        if (!state.lines.length) return;
        const prevIndex = findPreviousDisplayableIndex(state.currentIndex);
        if (prevIndex === -1) {
            setStatus('Already at the first available corpus line.');
            updateNavigationControls();
            return;
        }
        showLineByIndex(prevIndex);
        setStatus(`Showing line ${state.lines[prevIndex].lineNumber}.`);
    }

    function goToLineFromInput() {
        if (!state.lines.length) return;
        const input = document.getElementById('line-search-input');
        if (!input) return;

        const rawValue      = input.value.trim();
        const requestedLine = Number(rawValue);

        if (!rawValue || !Number.isInteger(requestedLine) || requestedLine <= 0) {
            setStatus('Please type a valid positive line number.');
            return;
        }

        const firstLine = state.lines[0].lineNumber;
        const lastLine  = state.lines[state.lines.length - 1].lineNumber;

        if (requestedLine < firstLine || requestedLine > lastLine) {
            setStatus(`Line ${requestedLine} is out of range (${firstLine}–${lastLine}).`);
            return;
        }

        const exactIndex = state.lineIndexByNumber.get(requestedLine);
        if (exactIndex === undefined) {
            setStatus(`Line ${requestedLine} does not exist in the loaded corpus.`);
            return;
        }

        if (!canDisplay(state.lines[exactIndex])) {
            setStatus(`Line ${requestedLine} exists but has no displayable text.`);
            return;
        }

        showLineByIndex(exactIndex);
        setStatus(`Showing line ${requestedLine}.`);
    }

    function updateNavigationControls() {
        const nextButton = document.getElementById('next-line-btn');
        const prevButton = document.getElementById('prev-line-btn');
        const goButton   = document.getElementById('go-line-btn');

        if (!state.lines.length || state.currentIndex < 0) {
            if (nextButton) nextButton.disabled = true;
            if (prevButton) prevButton.disabled = true;
            if (goButton)   goButton.disabled   = true;
            return;
        }

        if (nextButton) nextButton.disabled = findNextDisplayableIndex(state.currentIndex) === -1;
        if (prevButton) prevButton.disabled = findPreviousDisplayableIndex(state.currentIndex) === -1;
        if (goButton)   goButton.disabled   = false;
    }

    // init
    function init() {
        const loadButton = document.getElementById('load-lines-btn');
        const nextButton = document.getElementById('next-line-btn');
        const prevButton = document.getElementById('prev-line-btn');
        const goButton   = document.getElementById('go-line-btn');
        const input      = document.getElementById('line-search-input');

        if (!loadButton || !nextButton || !prevButton || !goButton || !input) return;

        loadButton.addEventListener('click', loadLines);
        nextButton.addEventListener('click', showNextLine);
        prevButton.addEventListener('click', showPreviousLine);
        goButton.addEventListener('click',   goToLineFromInput);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); goToLineFromInput(); }
        });
    }

    /* Public API.  External listeners can assign:
         sparqlLineNavigator.onLineChange = (lineNumber) => { ... }
       and it will be called whenever the current line changes. */
    const api = { init, onLineChange: null };
    return api;
})();