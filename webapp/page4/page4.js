/*  PAGE 4 — STATISTICS
 *  KPIs, heatmap, interactive knowledge network.
 */

document.addEventListener('DOMContentLoaded', () => {

    const svgEl = (tag, attrs = {}) => {
        const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    };

    /* shared tooltip */
    const tooltip = document.createElement('div');
    tooltip.className = 'p4-tooltip';
    document.body.appendChild(tooltip);
    const showTip = (html, evt) => {
        tooltip.innerHTML = html;
        tooltip.classList.add('show');
        tooltip.style.left = (evt.clientX + 14) + 'px';
        tooltip.style.top  = (evt.clientY + 14) + 'px';
    };
    const moveTip = evt => {
        tooltip.style.left = (evt.clientX + 14) + 'px';
        tooltip.style.top  = (evt.clientY + 14) + 'px';
    };
    const hideTip = () => tooltip.classList.remove('show');

    /*   KEY NUMBERS   */
    const allEmotions = new Set();
    let totalLines = 0;
    playData.scenes.forEach(s => {
        s.emotions.forEach(e => allEmotions.add(e));
        totalLines += (s.lineEnd - s.lineStart + 1);
    });

    document.getElementById('stat-sections').textContent   = playData.scenes.length;
    document.getElementById('stat-characters').textContent = playData.characters.length;
    document.getElementById('stat-emotions').textContent   = allEmotions.size;
    document.getElementById('stat-lines').textContent      = totalLines.toLocaleString();

    /* Triples: try Fuseki, fall back to corpus count */
    const FALLBACK_TRIPLES = 6789;
    fetch('/antigone_kb/query?query=' +
        encodeURIComponent('SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o }'),
        { headers: { 'Accept': 'application/sparql-results+json' } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(j => {
            const n = parseInt(j.results.bindings[0].n.value, 10);
            document.getElementById('stat-triples').textContent = n.toLocaleString();
        })
        .catch(() => {
            document.getElementById('stat-triples').textContent = FALLBACK_TRIPLES.toLocaleString();
        });

    /*   HEATMAP   */
    const emotions = Array.from(allEmotions);
    const TERRACOTTA = '#a83a20';

    (function buildHeatmap() {
        const cont = document.getElementById('heatmap-container');
        const margin = { top: 90, right: 20, bottom: 20, left: 130 };
        const cellW = 48, cellH = 28;
        const w = margin.left + cellW * emotions.length + margin.right;
        const h = margin.top + cellH * playData.scenes.length + margin.bottom;

        const svg = svgEl('svg', {
            class: 'heatmap-svg',
            viewBox: `0 0 ${w} ${h}`,
            width: w, height: h
        });

        /* column labels (emotions) */
        emotions.forEach((emo, j) => {
            const x = margin.left + j * cellW + cellW / 2;
            const y = margin.top - 8;
            const t = svgEl('text', {
                class: 'axis-label',
                x, y,
                transform: `rotate(-50, ${x}, ${y})`,
                'text-anchor': 'start'
            });
            t.textContent = emo;
            svg.appendChild(t);
        });

        /* row labels (sections) */
        playData.scenes.forEach((sc, i) => {
            const t = svgEl('text', {
                class: 'axis-label',
                x: margin.left - 10,
                y: margin.top + i * cellH + cellH / 2 + 4,
                'text-anchor': 'end'
            });
            t.textContent = sc.name;
            svg.appendChild(t);
        });

        /* cells */
        playData.scenes.forEach((sc, i) => {
            emotions.forEach((emo, j) => {
                const present = sc.emotions.includes(emo);
                svg.appendChild(svgEl('rect', {
                    class: 'cell',
                    x: margin.left + j * cellW,
                    y: margin.top + i * cellH,
                    width: cellW,
                    height: cellH,
                    fill: present ? TERRACOTTA : 'rgba(122, 80, 16, 0.06)',
                    'fill-opacity': present ? 0.85 : 1
                }));
            });
        });

        cont.appendChild(svg);
    })();

    /*   NETWORK GRAPH   */

    (function setupNetwork() {
        const cont = document.getElementById('network-container');
        const legendEl = document.getElementById('network-legend');
        const infoEl   = document.getElementById('network-info');

        const EMOTION_COLOR = '#a83a20';
        const THEME_COLOR   = '#445820';
        const EVENT_COLOR   = '#7a5010';
        const SCENE_COLOR   = '#082444';



        /* ----- Pre-compute counts (used to size nodes consistently) ----- */
        const emoCount = {}, themeCount = {}, eventCount = {};
        playData.scenes.forEach(sc => {
            sc.emotions.forEach(e => emoCount[e]   = (emoCount[e]   || 0) + 1);
            sc.themes.forEach(t   => themeCount[t] = (themeCount[t] || 0) + 1);
            sc.events.forEach(ev  => eventCount[ev] = (eventCount[ev] || 0) + 1);
        });

        /* ----- Build the (nodes, links) for a given level -----
           Level 1: characters only
           Level 2: + emotions
           Level 3: + themes
           Level 4: + events
           Level 5: + scenes (= full graph, scenes act as hubs) */
        function buildGraphForLevel(level) {
            const nodes = [];
            const seen = new Set();
            const add = (id, kind, label, color, size) => {
                if (seen.has(id)) return;
                seen.add(id);
                nodes.push({ id, kind, label, color, size });
            };

            /* Characters — always shown */
            playData.characters.forEach(c => {
                add(`c:${c.id}`, 'character', c.name, c.color, 14 + c.importance * 0.28);
            });

            /* Level 2+: emotions */
            if (level >= 2) {
                Object.entries(emoCount).forEach(([e, n]) => {
                    add(`e:${e}`, 'emotion', e, EMOTION_COLOR, 7 + n * 1.2);
                });
            }

            /* Level 3+: themes */
            if (level >= 3) {
                Object.entries(themeCount).forEach(([t, n]) => {
                    add(`t:${t}`, 'theme', t.replace(/-/g, ' '), THEME_COLOR, 7 + n * 1.2);
                });
            }

            /* Level 4+: events */
            if (level >= 4) {
                Object.entries(eventCount).forEach(([ev, n]) => {
                    add(`ev:${ev}`, 'event', ev.replace(/-/g, ' '), EVENT_COLOR, 6 + n * 1.5);
                });
            }

            /* Level 5: scenes act as hubs */
            if (level >= 5) {
                playData.scenes.forEach(sc => {
                    add(`s:${sc.id}`, 'scene', sc.name, SCENE_COLOR, 11);
                });
            }

            /* Links — what gets connected depends on the level */
            const linkMap = new Map();
            const addLink = (a, b) => {
                if (!seen.has(a) || !seen.has(b)) return;
                const key = a < b ? `${a}|${b}` : `${b}|${a}`;
                linkMap.set(key, (linkMap.get(key) || 0) + 1);
            };

            if (level === 1) {
                /* Characters co-appearing in scenes */
                playData.scenes.forEach(sc => {
                    for (let i = 0; i < sc.characters.length; i++) {
                        for (let j = i + 1; j < sc.characters.length; j++) {
                            addLink(`c:${sc.characters[i]}`, `c:${sc.characters[j]}`);
                        }
                    }
                });
            } else if (level === 2) {
                /* Characters ↔ emotions */
                playData.scenes.forEach(sc => {
                    sc.characters.forEach(c => {
                        sc.emotions.forEach(e => addLink(`c:${c}`, `e:${e}`));
                    });
                });
            } else if (level === 3) {
                /* + themes */
                playData.scenes.forEach(sc => {
                    sc.characters.forEach(c => {
                        sc.emotions.forEach(e => addLink(`c:${c}`, `e:${e}`));
                        sc.themes.forEach(t   => addLink(`c:${c}`, `t:${t}`));
                    });
                });
            } else if (level === 4) {
                /* + events (characters ↔ events too) */
                playData.scenes.forEach(sc => {
                    sc.characters.forEach(c => {
                        sc.emotions.forEach(e  => addLink(`c:${c}`, `e:${e}`));
                        sc.themes.forEach(t    => addLink(`c:${c}`, `t:${t}`));
                        sc.events.forEach(ev   => addLink(`c:${c}`, `ev:${ev}`));
                    });
                });
            } else if (level === 5) {
                /* Full: scene is the hub for everything */
                playData.scenes.forEach(sc => {
                    const sid = `s:${sc.id}`;
                    sc.characters.forEach(c  => addLink(sid, `c:${c}`));
                    sc.emotions.forEach(e    => addLink(sid, `e:${e}`));
                    sc.themes.forEach(t      => addLink(sid, `t:${t}`));
                    sc.events.forEach(ev     => addLink(sid, `ev:${ev}`));
                });
            }

            const links = Array.from(linkMap.entries()).map(([key, w]) => {
                const [source, target] = key.split('|');
                return { source, target, weight: w };
            });

            return { nodes, links };
        }

        /* ----- Force-directed layout — params adapt to level ----- */
        function layout(nodes, links, W, H, level) {
            const params = {
                1: { ITER: 360, k_rep: 6500, k_spring: 0.012, k_center: 0.0025, damping: 0.80, ideal: 200, cutoff: 600 },
                2: { ITER: 360, k_rep: 5000, k_spring: 0.011, k_center: 0.0020, damping: 0.80, ideal: 165, cutoff: 480 },
                3: { ITER: 360, k_rep: 4200, k_spring: 0.010, k_center: 0.0018, damping: 0.80, ideal: 145, cutoff: 400 },
                4: { ITER: 400, k_rep: 3500, k_spring: 0.009, k_center: 0.0016, damping: 0.81, ideal: 125, cutoff: 360 },
                5: { ITER: 420, k_rep: 3000, k_spring: 0.008, k_center: 0.0015, damping: 0.82, ideal: 110, cutoff: 320 }
            }[level];

            const byId = new Map();
            nodes.forEach(n => {
                n.x = 60 + Math.random() * (W - 120);
                n.y = 60 + Math.random() * (H - 120);
                n.vx = 0; n.vy = 0;
                byId.set(n.id, n);
            });

            for (let it = 0; it < params.ITER; it++) {
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const a = nodes[i], b = nodes[j];
                        const dx = a.x - b.x, dy = a.y - b.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                        if (dist > params.cutoff) continue;
                        const force = params.k_rep / (dist * dist);
                        a.vx += (dx / dist) * force; a.vy += (dy / dist) * force;
                        b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force;
                    }
                }
                links.forEach(l => {
                    const a = byId.get(l.source), b = byId.get(l.target);
                    if (!a || !b) return;
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                    const force = (dist - params.ideal) * params.k_spring * (1 + Math.log(l.weight || 1));
                    a.vx += (dx / dist) * force; a.vy += (dy / dist) * force;
                    b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force;
                });
                nodes.forEach(n => {
                    n.vx += (W / 2 - n.x) * params.k_center;
                    n.vy += (H / 2 - n.y) * params.k_center;
                    n.vx *= params.damping; n.vy *= params.damping;
                    n.x += n.vx; n.y += n.vy;
                    n.x = Math.max(40, Math.min(W - 40, n.x));
                    n.y = Math.max(40, Math.min(H - 40, n.y));
                });
            }
            return byId;
        }

        /* ----- Render the graph in the container; returns refs for filtering ----- */
        function renderGraph(nodes, links, byId, W, H) {
            cont.innerHTML = '';
            const svg = svgEl('svg', { class: 'network-svg', viewBox: `0 0 ${W} ${H}` });

            const linkEls = [];
            links.forEach(l => {
                const a = byId.get(l.source), b = byId.get(l.target);
                if (!a || !b) return;
                const line = svgEl('line', {
                    class: 'net-link',
                    x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                    'stroke-width': Math.min(0.6 + l.weight * 0.18, 2.5),
                    'data-source': l.source,
                    'data-target': l.target
                });
                svg.appendChild(line);
                linkEls.push(line);
            });

            const nodeEls = [];

            /* Shared drag state — one set of window listeners for the whole graph,
               instead of one pair per node (which would leak on every re-render). */
            let dragNode = null, dragNodeEl = null;
            let dragStartX, dragStartY, dragOrigX, dragOrigY;

            nodes.forEach(n => {
                const g = svgEl('g', {
                    transform: `translate(${n.x},${n.y})`,
                    'data-id': n.id,
                    'data-kind': n.kind
                });
                g.appendChild(svgEl('circle', { class: 'net-node', r: n.size, fill: n.color }));

                /* Truncate long labels so they don't overlap neighbouring nodes.
                   The full text is shown in the hover tooltip. */
                const MAX_LABEL_CHARS = 18;
                const displayLabel = n.label.length > MAX_LABEL_CHARS
                    ? n.label.slice(0, MAX_LABEL_CHARS - 1) + '…'
                    : n.label;
                const label = svgEl('text', { class: 'net-label', y: n.size + 12 });
                label.textContent = displayLabel;
                g.appendChild(label);

                /* hover */
                g.addEventListener('mouseenter', evt => {
                    const conns = links.filter(l => l.source === n.id || l.target === n.id);
                    showTip(`<strong>${n.kind}</strong>${n.label}<br>${conns.length} connections`, evt);
                    linkEls.forEach(le => {
                        const mine = le.getAttribute('data-source') === n.id ||
                            le.getAttribute('data-target') === n.id;
                        le.classList.toggle('hover-edge', mine);
                    });
                });
                g.addEventListener('mousemove', moveTip);
                g.addEventListener('mouseleave', () => {
                    hideTip();
                    linkEls.forEach(le => le.classList.remove('hover-edge'));
                });

                /* drag — only the mousedown is per-node */
                g.addEventListener('mousedown', evt => {
                    dragNode = n;
                    dragNodeEl = g;
                    dragStartX = evt.clientX; dragStartY = evt.clientY;
                    dragOrigX = n.x; dragOrigY = n.y;
                    evt.preventDefault();
                });

                svg.appendChild(g);
                nodeEls.push(g);
            });

            /* The mousemove/mouseup pair runs on window once per renderGraph call.
               Previous listeners from earlier renders are detached because the
               functions reference SVG/links that were replaced; but we still
               remove them explicitly via cleanup to be safe across many re-renders. */
            function onWinMove(evt) {
                if (!dragNode) return;
                const sb = svg.getBoundingClientRect();
                const scaleX = W / sb.width, scaleY = H / sb.height;
                const n = dragNode;
                n.x = dragOrigX + (evt.clientX - dragStartX) * scaleX;
                n.y = dragOrigY + (evt.clientY - dragStartY) * scaleY;
                dragNodeEl.setAttribute('transform', `translate(${n.x},${n.y})`);
                linkEls.forEach(le => {
                    if (le.getAttribute('data-source') === n.id) {
                        le.setAttribute('x1', n.x); le.setAttribute('y1', n.y);
                    }
                    if (le.getAttribute('data-target') === n.id) {
                        le.setAttribute('x2', n.x); le.setAttribute('y2', n.y);
                    }
                });
            }
            function onWinUp() { dragNode = null; dragNodeEl = null; }

            /* Clean up previous render's listeners before adding ours */
            if (renderGraph._cleanup) renderGraph._cleanup();
            window.addEventListener('mousemove', onWinMove);
            window.addEventListener('mouseup',   onWinUp);
            renderGraph._cleanup = () => {
                window.removeEventListener('mousemove', onWinMove);
                window.removeEventListener('mouseup',   onWinUp);
            };

            cont.appendChild(svg);
            return { nodeEls, linkEls };
        }

        /* ----- Legend + info panel content per level ----- */
        const LEVEL_META = {
            1: {
                title: 'Characters',
                desc:  'How the 9 characters relate. An edge means they share at least one scene.',
                legend: [
                    { color: '#0e4d92', label: 'Characters' }
                ]
            },
            2: {
                title: 'Characters + Emotions',
                desc:  'Each character linked to the emotions they carry across the play.',
                legend: [
                    { color: '#0e4d92', label: 'Characters' },
                    { color: EMOTION_COLOR, label: 'Emotions' }
                ]
            },
            3: {
                title: 'Characters + Emotions + Themes',
                desc:  'Themes added — what each character stands for, alongside what they feel.',
                legend: [
                    { color: '#0e4d92', label: 'Characters' },
                    { color: EMOTION_COLOR, label: 'Emotions' },
                    { color: THEME_COLOR,   label: 'Themes' }
                ]
            },
            4: {
                title: 'Characters + Emotions + Themes + Events',
                desc:  'Events added — what actually happens, and who is involved.',
                legend: [
                    { color: '#0e4d92', label: 'Characters' },
                    { color: EMOTION_COLOR, label: 'Emotions' },
                    { color: THEME_COLOR,   label: 'Themes' },
                    { color: EVENT_COLOR,   label: 'Events' }
                ]
            },
            5: {
                title: 'Full detail',
                desc:  'Everything in the corpus. Scenes act as central hubs. Use the filters above to focus.',
                legend: [
                    { color: '#0e4d92', label: 'Characters' },
                    { color: EMOTION_COLOR, label: 'Emotions' },
                    { color: THEME_COLOR,   label: 'Themes' },
                    { color: EVENT_COLOR,   label: 'Events' },
                    { color: SCENE_COLOR,   label: 'Scenes' }
                ]
            }
        };

        function updateLegendAndInfo(level, nodes, links) {
            const meta = LEVEL_META[level];

            /* legend */
            legendEl.innerHTML = meta.legend.map(l =>
                `<span class="legend-item"><span class="legend-dot" style="background:${l.color}"></span>${l.label}</span>`
            ).join('');

            /* info panel */
            const counts = {};
            nodes.forEach(n => { counts[n.kind] = (counts[n.kind] || 0) + 1; });
            const order = ['character', 'emotion', 'theme', 'event', 'scene'];
            const countText = order
                .filter(k => counts[k])
                .map(k => `${counts[k]} ${k}${counts[k] === 1 ? '' : 's'}`)
                .join(' · ');

            infoEl.innerHTML = `
                <strong>Level ${level} · ${meta.title}</strong>
                ${meta.desc}
                <span class="info-counts">${countText} · ${links.length} connections</span>
            `;
        }

        /* ----- Current render state — used by the kind filter ----- */
        let currentNodeEls = [];
        let currentLinkEls = [];
        let currentById    = new Map();
        let currentFilter  = 'all';

        function applyFilter(kind) {
            currentFilter = kind;
            currentNodeEls.forEach(g => {
                const k = g.getAttribute('data-kind');
                const show = (kind === 'all') || (k === kind);
                g.querySelector('.net-node').classList.toggle('faded', !show);
                g.querySelector('.net-label').classList.toggle('faded', !show);
            });
            currentLinkEls.forEach(le => {
                if (kind === 'all') { le.style.opacity = ''; return; }
                const sn = currentById.get(le.getAttribute('data-source'));
                const tn = currentById.get(le.getAttribute('data-target'));
                const visible = sn && tn && (sn.kind === kind || tn.kind === kind);
                le.style.opacity = visible ? '' : '0.05';
            });
        }

        /* ----- Render a specific level ----- */
        function render(level) {
            const { nodes, links } = buildGraphForLevel(level);
            const W = cont.clientWidth || 900;
            const H = cont.clientHeight || 680;
            const byId = layout(nodes, links, W, H, level);
            const { nodeEls, linkEls } = renderGraph(nodes, links, byId, W, H);

            currentNodeEls = nodeEls;
            currentLinkEls = linkEls;
            currentById    = byId;

            updateLegendAndInfo(level, nodes, links);

            /* Show the filter row only on Level 5, and reset to 'all' */
            const filtersEl = document.getElementById('network-filters');
            if (level === 5) {
                filtersEl.style.display = '';
                document.querySelectorAll('.filter-chip').forEach(c => {
                    c.classList.toggle('active', c.dataset.filter === 'all');
                });
                currentFilter = 'all';
            } else {
                filtersEl.style.display = 'none';
            }
        }

        /* ----- Level switcher buttons ----- */
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const lvl = parseInt(btn.dataset.level, 10);
                render(lvl);
            });
        });

        /* ----- Filter chips (only effective on Level 5) ----- */
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                applyFilter(chip.dataset.filter);
            });
        });

        /* ----- Fullscreen toggle ----- */
        const frame = document.getElementById('network-frame');
        const fsBtn = document.getElementById('fullscreen-btn');

        function currentLevel() {
            const active = document.querySelector('.level-btn.active');
            return active ? parseInt(active.dataset.level, 10) : 1;
        }

        function toggleFullscreen() {
            frame.classList.toggle('fullscreen');
            /* Re-render after the layout box has changed so the force-directed
               graph fills the new dimensions. requestAnimationFrame ensures the
               CSS has applied before we measure clientWidth / clientHeight. */
            requestAnimationFrame(() => {
                requestAnimationFrame(() => render(currentLevel()));
            });
        }

        fsBtn.addEventListener('click', toggleFullscreen);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && frame.classList.contains('fullscreen')) {
                toggleFullscreen();
            }
        });

        /* Initial render — Level 1 by default (clean overview) */
        render(1);
    })();
});