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
    fetch('http://localhost:3030/antigone/query?query=' +
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
    (function buildNetwork() {
        const cont = document.getElementById('network-container');

        const charColor = id => {
            const c = playData.characters.find(c => c.id === id);
            return c ? c.color : '#0e4d92';
        };
        const EMOTION_COLOR = '#a83a20';
        const THEME_COLOR   = '#445820';

        /* Build nodes & links */
        const nodes = [];
        const seen = new Set();
        const add = (id, kind, label, color, size) => {
            if (seen.has(id)) return;
            seen.add(id);
            nodes.push({ id, kind, label, color, size });
        };

        playData.characters.forEach(c => {
            add(`c:${c.id}`, 'character', c.name, c.color, 12 + c.importance * 0.25);
        });

        const emoCount = {}, themeCount = {};
        playData.scenes.forEach(sc => {
            sc.emotions.forEach(e => emoCount[e] = (emoCount[e] || 0) + 1);
            sc.themes.forEach(t => themeCount[t] = (themeCount[t] || 0) + 1);
        });
        Object.entries(emoCount).forEach(([e, n]) => {
            add(`e:${e}`, 'emotion', e, EMOTION_COLOR, 7 + n * 1.2);
        });
        Object.entries(themeCount).forEach(([t, n]) => {
            /* Show all themes but make rare ones smaller — keeps the graph rich
               while letting recurring themes (e.g. divine-law, authority) stand out. */
            add(`t:${t}`, 'theme', t.replace(/-/g, ' '), THEME_COLOR, 7 + n * 1.2);
        });

        /* Links: characters ↔ emotions and characters ↔ themes per scene.
           We only add links for nodes that actually exist (rare themes are filtered). */
        const linkMap = new Map();
        const addLink = (a, b) => {
            if (!seen.has(a) || !seen.has(b)) return;
            const key = a < b ? `${a}|${b}` : `${b}|${a}`;
            linkMap.set(key, (linkMap.get(key) || 0) + 1);
        };
        playData.scenes.forEach(sc => {
            sc.characters.forEach(c => {
                sc.emotions.forEach(e => addLink(`c:${c}`, `e:${e}`));
                sc.themes.forEach(t   => addLink(`c:${c}`, `t:${t}`));
            });
        });
        const links = Array.from(linkMap.entries()).map(([key, w]) => {
            const [source, target] = key.split('|');
            return { source, target, weight: w };
        });

        /* Layout: simple force-directed relaxation that fills the container */
        const W = cont.clientWidth || 900;
        const H = cont.clientHeight || 520;
        const byId = new Map();
        nodes.forEach(n => {
            /* spread initial positions across the full container */
            n.x = 60 + Math.random() * (W - 120);
            n.y = 60 + Math.random() * (H - 120);
            n.vx = 0; n.vy = 0;
            byId.set(n.id, n);
        });

        const ITER = 360;
        const k_rep = 4200, k_spring = 0.010, k_center = 0.0018;
        const damping = 0.80, ideal = 145;

        for (let it = 0; it < ITER; it++) {
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                    if (dist > 400) continue;
                    const force = k_rep / (dist * dist);
                    a.vx += (dx / dist) * force; a.vy += (dy / dist) * force;
                    b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force;
                }
            }
            links.forEach(l => {
                const a = byId.get(l.source), b = byId.get(l.target);
                if (!a || !b) return;
                const dx = b.x - a.x, dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const force = (dist - ideal) * k_spring * (1 + Math.log(l.weight || 1));
                a.vx += (dx / dist) * force; a.vy += (dy / dist) * force;
                b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force;
            });
            nodes.forEach(n => {
                n.vx += (W / 2 - n.x) * k_center;
                n.vy += (H / 2 - n.y) * k_center;
                n.vx *= damping; n.vy *= damping;
                n.x += n.vx; n.y += n.vy;
                n.x = Math.max(40, Math.min(W - 40, n.x));
                n.y = Math.max(40, Math.min(H - 40, n.y));
            });
        }

        /* Render */
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
        nodes.forEach(n => {
            const g = svgEl('g', {
                transform: `translate(${n.x},${n.y})`,
                'data-id': n.id,
                'data-kind': n.kind
            });
            const circ = svgEl('circle', {
                class: 'net-node',
                r: n.size,
                fill: n.color
            });
            g.appendChild(circ);

            const label = svgEl('text', { class: 'net-label', y: n.size + 12 });
            label.textContent = n.label;
            g.appendChild(label);

            /* hover: tooltip + highlight edges */
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

            /* drag */
            let dragging = false, startX, startY, origX, origY;
            g.addEventListener('mousedown', evt => {
                dragging = true;
                startX = evt.clientX; startY = evt.clientY;
                origX = n.x; origY = n.y;
                evt.preventDefault();
            });
            window.addEventListener('mousemove', evt => {
                if (!dragging) return;
                const sb = svg.getBoundingClientRect();
                const scaleX = W / sb.width, scaleY = H / sb.height;
                n.x = origX + (evt.clientX - startX) * scaleX;
                n.y = origY + (evt.clientY - startY) * scaleY;
                g.setAttribute('transform', `translate(${n.x},${n.y})`);
                linkEls.forEach(le => {
                    if (le.getAttribute('data-source') === n.id) {
                        le.setAttribute('x1', n.x); le.setAttribute('y1', n.y);
                    }
                    if (le.getAttribute('data-target') === n.id) {
                        le.setAttribute('x2', n.x); le.setAttribute('y2', n.y);
                    }
                });
            });
            window.addEventListener('mouseup', () => { dragging = false; });

            svg.appendChild(g);
            nodeEls.push(g);
        });

        cont.appendChild(svg);

        /* Filter buttons */
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const f = btn.dataset.filter;
                nodeEls.forEach(g => {
                    const kind = g.getAttribute('data-kind');
                    const show = (f === 'all') || (kind === f);
                    g.querySelector('.net-node').classList.toggle('faded', !show);
                    g.querySelector('.net-label').classList.toggle('faded', !show);
                });
                linkEls.forEach(le => {
                    if (f === 'all') { le.style.opacity = ''; return; }
                    const sn = byId.get(le.getAttribute('data-source'));
                    const tn = byId.get(le.getAttribute('data-target'));
                    const visible = sn && tn && (sn.kind === f || tn.kind === f);
                    le.style.opacity = visible ? '' : '0.05';
                });
            });
        });
    })();
});