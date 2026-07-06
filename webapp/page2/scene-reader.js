
const sceneReader = (() => {

    const ENDPOINT = 'http://localhost:3030/antigone/query';

    /* Cache so we don't re-query when the user re-clicks the same scene */
    const cache = new Map();   // sceneId → { lines: [...], speakers: Map<lineNum,charId> }
    const semanticsCache = new Map(); // sceneId → { themes, conflicts, myths, motivations, lineThemes Map }

    let currentSceneId = null;
    let currentActiveLineNumber = null;
    let lineClickHandler = null;   // page2.js wires this

    /* Map raw character names from Speech URIs to playData character ids */
    const CHAR_ID_MAP = {
        'Antigone': 'antigone',
        'Ismene':   'ismene',
        'Creon':    'creon',
        'Haemon':   'haemon',
        'Tiresias': 'teiresias',
        'Teiresias':'teiresias',
        'Chorus':   'chorus',
        'Guard':    'guard',
        'Messenger':'messenger',
        'Eurydice': 'eurydice',
        'Leader':   'chorus'
    };

    /* Fallback colors for characters not in playData */
    const FALLBACK_COLORS = {
        guard:     '#6b5b3c',
        messenger: '#5a4a2a',
        eurydice:  '#7a3a5a',
        unknown:   '#999999'
    };

    function characterDisplay(charId) {
        if (!charId) return { name: 'Unknown', color: FALLBACK_COLORS.unknown };
        const fromData = (typeof playData !== 'undefined')
            ? playData.characters.find(c => c.id === charId)
            : null;
        if (fromData) return { name: fromData.name, color: fromData.color };
        const fallback = FALLBACK_COLORS[charId] || FALLBACK_COLORS.unknown;
        const cap = charId.charAt(0).toUpperCase() + charId.slice(1);
        return { name: cap, color: fallback };
    }

    /*   SPARQL helpers   */

    async function sparql(query) {
        const r = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-query',
                'Accept':       'application/sparql-results+json'
            },
            body: query
        });
        if (!r.ok) throw new Error(`SPARQL request failed (${r.status})`);
        return r.json();
    }

    /* Query 1: lines in a number range, with all 3 translations */
    async function fetchLinesInRange(startLine, endLine) {
        const q = `
PREFIX : <http://example.org/antigone#>
SELECT ?n ?ancient
       (SAMPLE(?modernRaw)  AS ?modern)
       (SAMPLE(?englishRaw) AS ?english)
       (SAMPLE(?chineseRaw) AS ?chinese)
WHERE {
  ?line a :Line ;
        :lineNumber ?n ;
        :text ?ancient .
  FILTER(?n >= ${startLine} && ?n <= ${endLine})

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
  OPTIONAL {
    ?tvChinese a :TranslationVariant ;
               :relatedTo ?line ;
               :text ?chineseRaw .
    FILTER(CONTAINS(STR(?tvChinese), "_ZH"))
  }
}
GROUP BY ?n ?ancient
ORDER BY ?n
`;
        const json = await sparql(q);
        return (json.results?.bindings || [])
            .map(b => ({
                lineNumber: Number(b.n.value),
                ancient:    b.ancient?.value || '',
                modern:     b.modern?.value  || '',
                english:    b.english?.value || '',
                chinese:    b.chinese?.value || ''
            }))
            .filter(l => Number.isFinite(l.lineNumber))
            .sort((a, b) => a.lineNumber - b.lineNumber);
    }

    /* Query 2: All speeches that hold lines via :containsLine
       Returns array of { speechURI, charId, lineNumbers: [...] } */
    async function fetchSpeechesWithLines() {
        const q = `
PREFIX : <http://example.org/antigone#>
SELECT ?speech ?character ?lineNum
WHERE {
  ?speech a :Speech ;
          :speechBy ?character ;
          :containsLine ?line .
  ?line :lineNumber ?lineNum .
}
ORDER BY ?lineNum
`;
        const json = await sparql(q);
        const map = new Map(); // speechURI → { charId, lineNumbers: Set }
        (json.results?.bindings || []).forEach(b => {
            const speech = b.speech.value;
            const charURI = b.character.value;
            const lineNum = Number(b.lineNum.value);
            /* Character URI looks like ".../Antigone_Character_Creon" → "creon" */
            const charKey = (charURI.split('_Character_')[1] || '').trim();
            const charId  = CHAR_ID_MAP[charKey] || charKey.toLowerCase() || null;
            if (!map.has(speech)) map.set(speech, { charId, lineNumbers: new Set() });
            map.get(speech).lineNumbers.add(lineNum);
        });
        return Array.from(map.entries()).map(([speech, info]) => ({
            speechURI: speech,
            charId: info.charId,
            lineNumbers: Array.from(info.lineNumbers).sort((a, b) => a - b)
        }));
    }

    /* Query 3: All speeches whose URI encodes the line range
       (e.g. :Speech_Chorus_211_214 → Chorus, lines 211..214)
       For sections that lack :containsLine */
    async function fetchSpeechesByURI() {
        const q = `
PREFIX : <http://example.org/antigone#>
SELECT ?speech ?character WHERE {
  ?speech a :Speech ; :speechBy ?character .
}
`;
        const json = await sparql(q);
        const result = [];
        (json.results?.bindings || []).forEach(b => {
            const speechURI = b.speech.value;
            const charURI = b.character.value;
            const charKey = (charURI.split('_Character_')[1] || '').trim();
            const charId  = CHAR_ID_MAP[charKey] || charKey.toLowerCase() || null;
            const local = speechURI.split('#').pop() || speechURI.split('/').pop();
            /* parse trailing numbers: Speech_Creon_211_214  or  Speech_Creon_215 */
            const nums = local.match(/(\d+)(?:_(\d+))?$/);
            if (!nums) return;
            const from = Number(nums[1]);
            const to   = nums[2] ? Number(nums[2]) : from;
            if (!Number.isFinite(from) || !Number.isFinite(to)) return;
            result.push({ charId, from, to });
        });
        return result;
    }

    /* Build a lookup: lineNumber → charId by combining both speech sources */
    async function buildSpeakerMap() {
        if (cache.has('__speakers__')) return cache.get('__speakers__');

        const map = new Map(); // lineNum → charId

        try {
            const withLines = await fetchSpeechesWithLines();
            withLines.forEach(s => {
                s.lineNumbers.forEach(n => {
                    if (!map.has(n)) map.set(n, s.charId);
                });
            });
        } catch (_) {/* tolerate */}

        try {
            const byURI = await fetchSpeechesByURI();
            byURI.forEach(s => {
                for (let n = s.from; n <= s.to; n++) {
                    if (!map.has(n)) map.set(n, s.charId);
                }
            });
        } catch (_) {/* tolerate */}

        cache.set('__speakers__', map);
        return map;
    }

    /* Query 4: scene-level semantics (themes / conflicts).
       Strategy: get ALL :Scene objects with their themes/conflicts and the line numbers
       reachable via :hasSpeech → :containsLine. Filter client-side by overlap with our range.
       For sections without :containsLine we fall back to keep all themes of every Scene
       (rare; only 2 sections). This avoids fragile SPARQL casts. */
    async function fetchSceneSemantics(sceneStart, sceneEnd) {
        const q = `
PREFIX : <http://example.org/antigone#>
SELECT ?scene ?theme ?conflict ?lineNum WHERE {
  ?scene a :Scene .
  OPTIONAL { ?scene :developsTheme ?theme }
  OPTIONAL { ?scene :hasConflict   ?conflict }
  OPTIONAL {
    ?scene :hasSpeech ?speech .
    ?speech :containsLine ?line .
    ?line :lineNumber ?lineNum .
  }
}
`;
        let json;
        try { json = await sparql(q); }
        catch { return { themes: [], conflicts: [] }; }

        /* Group rows by scene URI, then keep only scenes whose lineNumbers overlap our range */
        const byScene = new Map();
        (json.results?.bindings || []).forEach(b => {
            const k = b.scene.value;
            if (!byScene.has(k)) byScene.set(k, { themes: new Set(), conflicts: new Set(), lines: new Set() });
            const e = byScene.get(k);
            if (b.theme)    e.themes.add(prettyURI(b.theme.value));
            if (b.conflict) e.conflicts.add(prettyURI(b.conflict.value));
            if (b.lineNum)  e.lines.add(Number(b.lineNum.value));
        });

        const themes = new Set(), conflicts = new Set();
        byScene.forEach(e => {
            let overlap = false;
            if (e.lines.size === 0) {
                /* Scene has no :containsLine annotations — skip; we can't be sure */
            } else {
                for (const n of e.lines) {
                    if (n >= sceneStart && n <= sceneEnd) { overlap = true; break; }
                }
            }
            if (overlap) {
                e.themes.forEach(t => themes.add(t));
                e.conflicts.forEach(c => conflicts.add(c));
            }
        });

        return { themes: Array.from(themes), conflicts: Array.from(conflicts) };
    }

    /* Query 5: per-line themes (from structure.ttl :hasTheme), myths, motivations */
    async function fetchLineDetails(sceneStart, sceneEnd) {
        const q = `
PREFIX : <http://example.org/antigone#>
SELECT ?n ?theme ?related WHERE {
  ?line a :Line ;
        :lineNumber ?n .
  OPTIONAL { ?line :hasTheme  ?theme }
  OPTIONAL { ?line :relatedTo ?related }
  FILTER(?n >= ${sceneStart} && ?n <= ${sceneEnd})
}
`;
        const json = await sparql(q);
        const themesByLine = new Map();
        const refsByLine = new Map();
        (json.results?.bindings || []).forEach(b => {
            const n = Number(b.n.value);
            if (b.theme) {
                if (!themesByLine.has(n)) themesByLine.set(n, new Set());
                themesByLine.get(n).add(prettyURI(b.theme.value));
            }
            if (b.related) {
                if (!refsByLine.has(n)) refsByLine.set(n, new Set());
                refsByLine.get(n).add(prettyURI(b.related.value));
            }
        });
        return { themesByLine, refsByLine };
    }

    /* Query 6: speech-level themes & myths for the lines of a scene */
    async function fetchSpeechDetails(sceneStart, sceneEnd) {
        const q = `
PREFIX : <http://example.org/antigone#>
SELECT DISTINCT ?speech ?theme ?myth ?motivation ?n WHERE {
  ?speech a :Speech ;
          :containsLine ?line .
  ?line :lineNumber ?n .
  OPTIONAL { ?speech :developsTheme   ?theme }
  OPTIONAL { ?speech :referencesMyth  ?myth }
  OPTIONAL { ?speech :hasMotivation   ?motivation }
  FILTER(?n >= ${sceneStart} && ?n <= ${sceneEnd})
}
`;
        const json = await sparql(q);
        /* For each line we collected, gather themes/myths/motivations of the speech that contains it */
        const themesByLine = new Map();
        const mythsByLine  = new Map();
        const motivByLine  = new Map();
        (json.results?.bindings || []).forEach(b => {
            const n = Number(b.n.value);
            if (b.theme) {
                if (!themesByLine.has(n)) themesByLine.set(n, new Set());
                themesByLine.get(n).add(prettyURI(b.theme.value));
            }
            if (b.myth) {
                if (!mythsByLine.has(n)) mythsByLine.set(n, new Set());
                mythsByLine.get(n).add(prettyURI(b.myth.value));
            }
            if (b.motivation) {
                if (!motivByLine.has(n)) motivByLine.set(n, new Set());
                motivByLine.get(n).add(prettyURI(b.motivation.value));
            }
        });
        return { themesByLine, mythsByLine, motivByLine };
    }

    function prettyURI(uri) {
        const local = uri.split('#').pop() || uri.split('/').pop() || uri;
        /* Trim known prefixes & turn CamelCase / snake_case to spaced text */
        return local
            .replace(/^(Theme|Conflict|Myth|Motivation|Event)_/, '')
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .toLowerCase();
    }

    /*  Public API  */

    async function loadScene(sceneId) {
        currentSceneId = sceneId;
        const scene = playData.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        showFrame();
        setStatus(`Loading "${scene.name}" (lines ${scene.lineStart}–${scene.lineEnd})...`);

        /* Use cache when possible */
        let bundle = cache.get(sceneId);
        if (bundle) {
            renderTable(bundle);
            setStatus(`${scene.name} — ${bundle.lines.length} lines loaded (cached).`);
            return;
        }

        /* Each query is independent. If one fails, we still render what we have. */
        const safe = async (label, promise) => {
            try { return await promise; }
            catch (err) {
                console.warn(`[scene-reader] ${label} failed:`, err.message);
                return null;
            }
        };

        /* The MOST important query: the actual lines. Run it first and bail if it fails. */
        let lines;
        try {
            lines = await fetchLinesInRange(scene.lineStart, scene.lineEnd);
        } catch (err) {
            setStatus(`Could not load lines: ${err.message}. Is the SPARQL endpoint running?`);
            document.getElementById('reader-container').innerHTML =
                `<div class="reader-empty">SPARQL endpoint not available.<br>Start Fuseki at <code>localhost:3030/antigone</code>.</div>`;
            return;
        }

        if (!lines || lines.length === 0) {
            document.getElementById('reader-container').innerHTML =
                `<div class="reader-empty">No lines found for this scene in the corpus.<br><small>Lines ${scene.lineStart}–${scene.lineEnd}</small></div>`;
            setStatus(`${scene.name} — no lines found in corpus.`);
            return;
        }

        /* Optional enrichments — failure is non-fatal */
        const [speakerMap, sceneSem, lineDetails, speechDetails] = await Promise.all([
            safe('buildSpeakerMap',     buildSpeakerMap()),
            safe('fetchSceneSemantics', fetchSceneSemantics(scene.lineStart, scene.lineEnd)),
            safe('fetchLineDetails',    fetchLineDetails(scene.lineStart, scene.lineEnd)),
            safe('fetchSpeechDetails',  fetchSpeechDetails(scene.lineStart, scene.lineEnd))
        ]);

        bundle = {
            scene,
            lines,
            speakerMap:    speakerMap    || new Map(),
            sceneSem:      sceneSem      || { themes: [], conflicts: [] },
            lineDetails:   lineDetails   || { themesByLine: new Map(), refsByLine: new Map() },
            speechDetails: speechDetails || { themesByLine: new Map(), mythsByLine: new Map(), motivByLine: new Map() }
        };
        cache.set(sceneId, bundle);

        renderTable(bundle);
        setStatus(`${scene.name} — ${lines.length} line${lines.length === 1 ? '' : 's'} loaded.`);
    }

    function showFrame() {
        const frame = document.getElementById('scene-reader-frame');
        if (frame) frame.style.display = '';
    }

    function setStatus(msg) {
        const el = document.getElementById('reader-status');
        if (el) el.textContent = msg;
    }

    function renderTable(bundle) {
        const cont = document.getElementById('reader-container');
        const title = document.getElementById('scene-reader-title');
        if (title) title.textContent = `Scene Reader — ${bundle.scene.name}`;

        if (bundle.lines.length === 0) {
            cont.innerHTML = `<div class="reader-empty">No lines found for this scene in the corpus.</div>`;
            return;
        }

        const table = document.createElement('table');
        table.className = 'reader-table';
        const hideZh = !document.getElementById('toggle-chinese')?.checked;
        if (hideZh) table.classList.add('hide-zh');

        table.innerHTML = `
            <thead>
                <tr>
                    <th class="col-num">#</th>
                    <th class="col-speaker">Speaker</th>
                    <th>Ancient Greek</th>
                    <th>Modern Greek</th>
                    <th>English</th>
                    <th class="col-zh">中文</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        bundle.lines.forEach(line => {
            const charId = bundle.speakerMap.get(line.lineNumber);
            const { name, color } = characterDisplay(charId);

            const tr = document.createElement('tr');
            tr.className = 'reader-row';
            tr.dataset.line = line.lineNumber;
            tr.innerHTML = `
                <td class="cell-num">${line.lineNumber}</td>
                <td class="cell-speaker">
                    <span class="speaker-badge" style="background:${color}">${name}</span>
                </td>
                <td class="cell-ancient">${escapeHTML(line.ancient)}</td>
                <td>${escapeHTML(line.modern) || '<em style="color:#aaa;">—</em>'}</td>
                <td>${escapeHTML(line.english) || '<em style="color:#aaa;">—</em>'}</td>
                <td class="cell-zh">${escapeHTML(line.chinese) || '<em style="color:#aaa;">—</em>'}</td>
            `;
            tr.addEventListener('click', () => {
                if (typeof lineClickHandler === 'function') {
                    lineClickHandler(line.lineNumber);
                }
                highlightLine(line.lineNumber);
            });
            tbody.appendChild(tr);
        });

        cont.innerHTML = '';
        cont.appendChild(table);

        /* If a line was active from previous state, keep its highlight */
        if (currentActiveLineNumber) highlightLine(currentActiveLineNumber);
    }

    function highlightLine(lineNumber) {
        currentActiveLineNumber = lineNumber;
        const rows = document.querySelectorAll('#reader-container .reader-row');
        let target = null;
        rows.forEach(r => {
            const match = Number(r.dataset.line) === lineNumber;
            r.classList.toggle('active', match);
            if (match) target = r;
        });
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function escapeHTML(s) {
        if (!s) return '';
        return s.replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function onLineClick(handler) {
        lineClickHandler = handler;
    }

    /*  Context lookup for the sidebar  */
    /* Given a line number, return the bundle of info to display. */
    async function getContextForLine(lineNumber) {
        /* Find the scene containing this line via playData */
        const scene = playData.scenes.find(s => lineNumber >= s.lineStart && lineNumber <= s.lineEnd);

        /* Speaker */
        const speakerMap = await buildSpeakerMap();
        const charId = speakerMap.get(lineNumber);

        /* Themes/myths/motivations for this line: prefer speech-level, then line-level */
        let bundle = scene ? cache.get(scene.id) : null;
        if (!bundle && scene) {
            /* Fetch on-the-fly the per-line + per-speech details (no full re-render) */
            try {
                const [lineDetails, speechDetails, sceneSem] = await Promise.all([
                    fetchLineDetails(scene.lineStart, scene.lineEnd),
                    fetchSpeechDetails(scene.lineStart, scene.lineEnd),
                    fetchSceneSemantics(scene.lineStart, scene.lineEnd)
                ]);
                bundle = { scene, lineDetails, speechDetails, sceneSem };
                /* Don't pollute the main cache (no lines / speakerMap here) */
            } catch (_) {/* ignore */}
        }

        const themes = new Set();
        const myths  = new Set();
        const motivs = new Set();
        const conflicts = new Set();

        if (bundle) {
            (bundle.lineDetails?.themesByLine.get(lineNumber)   || []).forEach(t => themes.add(t));
            (bundle.speechDetails?.themesByLine.get(lineNumber) || []).forEach(t => themes.add(t));
            (bundle.speechDetails?.mythsByLine.get(lineNumber)  || []).forEach(m => myths.add(m));
            (bundle.speechDetails?.motivByLine.get(lineNumber)  || []).forEach(m => motivs.add(m));
            /* relatedTo can be event/motivation — surface as motivations */
            (bundle.lineDetails?.refsByLine.get(lineNumber)     || []).forEach(r => motivs.add(r));
            (bundle.sceneSem?.conflicts || []).forEach(c => conflicts.add(c));
        }

        return {
            scene,
            charId,
            themes: Array.from(themes),
            myths:  Array.from(myths),
            motivations: Array.from(motivs),
            conflicts: Array.from(conflicts)
        };
    }

    return { loadScene, onLineClick, highlightLine, getContextForLine, characterDisplay };
})();