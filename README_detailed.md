# Antigone Web Application

An interactive, browser-based exploration of Sophocles’ *Antigone*, backed by a custom RDF ontology and a multi-lingual Turtle corpus. The app combines static narrative UI (characters, themes, video sync) with live **SPARQL** queries against an **Apache Jena Fuseki** triple store.

There is **no build step** ,  the front end is plain HTML, CSS, and JavaScript served over HTTP.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Fuseki Installation & Configuration](#fuseki-installation--configuration)
- [Loading Triples into Fuseki](#loading-triples-into-fuseki)
- [Starting the Web Application](#starting-the-web-application)
- [Optional: Performance Video](#optional-performance-video)
- [Application Pages](#application-pages)
- [RDF Corpus & Ontology](#rdf-corpus--ontology)
- [SPARQL Integration](#sparql-integration)
- [Project Structure](#project-structure)
- [Configuration & Troubleshooting](#configuration--troubleshooting)
- [Technology Stack](#technology-stack)
- [License & Attribution](#license--attribution)

---

## Overview

This repository contains two main parts:

| Component | Role |
|-----------|------|
| **`Antigone-Layout/`** | RDF knowledge base: OWL ontology, canonical play structure, per-line translations (Greek, English, Chinese), and semantic annotations (themes, emotions, conflicts, myths, motivations). |
| **`webapp/`** | Four-page static web UI that reads scene metadata locally and queries Fuseki for line-level text and semantics. |

The play is modeled as roughly **1,350+ lines** across **13 dramatic sections** (prologue through exodus). The ontology aligns with **FRBRoo** (work / expression / line structure) and **CIDOC CRM** (characters, concepts, events) while keeping a project-specific vocabulary at `http://example.org/antigone#`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser  (http://localhost:8000/webapp/...)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ playData     │  │ Page 1,3,4   │  │ Page 2: SPARQL client  │ │
│  │ (data.js)    │  │ static UI    │  │ scene-reader.js        │ │
│  └──────────────┘  └──────────────┘  │ sparql-lines.js        │ │
│                                       └───────────┬────────────┘ │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │ POST /antigone/query
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Apache Jena Fuseki  (http://localhost:3030)                    │
│  Dataset: `antigone`  (TDB2, read/write graph store)            │
│  Data loaded from Antigone-Layout/**/*.ttl                      │
└─────────────────────────────────────────────────────────────────┘
```

- **Page 1** and much of **Page 3–4** use embedded JavaScript metadata in `webapp/shared/js/data.js` (scenes, characters, emotions, themes, video timestamps).
- **Page 2** and parts of **Page 4** require Fuseki for line text, scene reader tables, context sidebar, and live triple counts.

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Java 11+** | Required to run Fuseki (`fuseki-server.bat` / `fuseki-server`). |
| **Python 3** | For `python -m http.server` (or any static file server). |
| **Modern browser** | Chrome, Edge, or Firefox recommended (Web Speech API on Page 2). |
| **PowerShell** (Windows) | For the bulk TTL upload script below. |

---

## Quick Start

From the repository root (`antigone-webapp`):

1. **Start Fuseki** (see [Fuseki Installation](#fuseki-installation--configuration)).
2. **Load all `.ttl` files** into the `antigone` dataset (see [Loading Triples](#loading-triples-into-fuseki)) ,  skip if the database is already populated.
3. **Serve the webapp** and open Page 1:

```powershell
cd path\to\antigone-webapp\webapp
python -m http.server 8000
```

Open: **http://localhost:8000/page1/page1.html**

4. On **Page 2 (Scenes + Lines)**, click **Load SPARQL Lines** after Fuseki is running.

---

## Fuseki Installation & Configuration

### Download & install

1. Download **Apache Jena Fuseki** from the [Apache Jena download page](https://jena.apache.org/download/index.cgi).
2. Recommended version: **`apache-jena-fuseki-6.0.0`** or newer (this repo may include **`apache-jena-fuseki-6.1.0`** as an untracked local install).
3. Extract the archive. The server launcher is:

   ```text
   apache-jena-fuseki-<version>/fuseki-server.bat   (Windows)
   apache-jena-fuseki-<version>/fuseki-server       (Linux/macOS)
   ```

4. Start the server from that folder:

   ```powershell
   .\fuseki-server.bat
   ```

   Default UI: **http://localhost:3030/**

### Dataset name

The webapp expects a dataset named **`antigone`** with:

| Endpoint | URL |
|----------|-----|
| SPARQL query | `http://localhost:3030/antigone/query` |
| Graph store (upload) | `http://localhost:3030/antigone/data` |

Example service configuration (from `apache-jena-fuseki-6.1.0/run/configuration/antigone.ttl`):

```turtle
fuseki:name "antigone" ;
fuseki:serviceQuery "query", "sparql", "" ;
fuseki:serviceReadWriteGraphStore "data" .
```

If you create the dataset manually in the Fuseki UI, use the name **`antigone`** and a **TDB2** persistent store.

> **Note:** A checked-in `antigone.ttl` may contain an absolute `tdb2:location` path from another machine. If Fuseki fails to start or cannot find the database, edit `run/configuration/antigone.ttl` so `tdb2:location` points to your local `run/databases/antigone` directory, or recreate the dataset via the Fuseki admin UI.

---

## Loading Triples into Fuseki

After Fuseki is running, upload every Turtle file under `Antigone-Layout` into the `antigone` dataset.

### Windows (PowerShell)

From the **repository root**:

```powershell
cd C:\path\to\antigone-webapp

Get-ChildItem -Path .\Antigone-Layout -Recurse -Filter *.ttl | ForEach-Object {
  Invoke-RestMethod `
    -Uri "http://localhost:3030/antigone/data" `
    -Method Post `
    -ContentType "text/turtle" `
    -InFile $_.FullName
}
```

There are **~185** `.ttl` files (ontology, canonical structure, semantics, and translation chunks).

### Linux / macOS (curl)

```bash
cd /path/to/antigone-webapp
find Antigone-Layout -name '*.ttl' -print0 | while IFS= read -r -d '' f; do
  curl -X POST \
    -H "Content-Type: text/turtle" \
    --data-binary @"$f" \
    "http://localhost:3030/antigone/data"
done
```

### Verify load

- Fuseki UI → dataset **antigone** → query tab, or
- Open **Page 4 (Statistics)** ,  the **Triples** counter queries Fuseki live (falls back to ~6,789 if the endpoint is unreachable).

---

## Starting the Web Application

Serve the `webapp` directory over HTTP (required for `fetch()` to Fuseki and for multi-page navigation):

```powershell
cd path\to\antigone-webapp\webapp
python -m http.server 8000
```

Then open:

| Page | URL |
|------|-----|
| Entry (redirect) | http://localhost:8000/ → `page1/page1.html` |
| Information | http://localhost:8000/page1/page1.html |
| Scenes + Lines | http://localhost:8000/page2/page2.html |
| Semantics / Video | http://localhost:8000/page3/page3.html |
| Statistics | http://localhost:8000/page4/page4.html |

> Do **not** rely on opening HTML files via `file://` ,  cross-origin SPARQL requests to Fuseki will fail.

---

## Optional: Performance Video

Page 3 embeds a performance video:

- Place your file at: **`webapp/antigone.mp4`**
- The file is **gitignored** (not in the repo). Scene tags seek to timestamps defined in `data.js` (`start` / `end` in seconds).

Without the video, the rest of Page 3 (filtering, text panels) still works.

---

## Application Pages

### Page 1 ,  Information

Static editorial content: play summary, Sophocles, historical context, dramatic structure (13 parts), character bios, and interactive theme blurbs. No Fuseki required.

### Page 2 ,  Scenes + Lines (SPARQL)

Primary corpus interface:

- **Scene list** ,  selects a section; loads a **scene reader** table (Ancient Greek, Modern Greek, English, optional Chinese) via SPARQL line-range queries.
- **SPARQL line navigator** ,  loads all lines from Fuseki; previous/next/go-to-line controls; three translation panels with **text-to-speech** (Web Speech API).
- **Context sidebar** ,  speaker, scene, themes, conflicts, myths, motivations for the current line (SPARQL over semantics in the graph).

Workflow: start Fuseki → open Page 2 → **Load SPARQL Lines** → pick a scene and/or navigate by line number.

### Page 3 ,  Semantics / Video

Exploratory UI driven by `playData`:

- Filter by **character** (bubble chart), **emotion**, **theme**, **event**, or **scene** tags.
- **Video player** synced to scene timestamps.
- Trilingual excerpt panels for the active scene.

Uses static metadata; does not require Fuseki unless you extend it.

### Page 4 ,  Statistics

- **KPI cards**: triple count (from Fuseki), sections, characters, emotions, line count.
- **Emotion × section heatmap** (SVG).
- **Knowledge network** (characters, emotions, themes) with drag and filter controls.

---

## RDF Corpus & Ontology

### Namespace

All project resources use:

```text
http://example.org/antigone#
```

Prefix in Turtle: `@prefix : <http://example.org/antigone#> .`

### Ontology files

| File | Description |
|------|-------------|
| `Antigone-Layout/Ontology/1.Antigone-Ontology.ttl` | Core OWL classes and properties (`:Line`, `:Speech`, `:Character`, `:Theme`, `:TranslationVariant`, etc.). |
| `Antigone-Layout/Ontology/2.Antigone-Ontology-With-Example.ttl` | Ontology plus illustrative individuals. |

### Corpus layout (`Antigone-Layout/corpus/`)

Each of the **13 sections** follows the same pattern:

```text
NN_<section_name>/
├── <section>.ttl              # Section-level metadata
├── canonical/
│   ├── structure.ttl          # Scenes, speeches, canonical :Line_* with :text (Ancient Greek)
│   └── semantics.ttl          # Characters, emotions, themes, conflicts, myths, motivations
└── translations/
    ├── greek/                 # Modern Greek :TranslationVariant (suffix _gr)
    ├── english/               # English variants (_en)
    └── chinese/               # Chinese variants (_zh)
```

| # | Folder | Dramatic part |
|---|--------|----------------|
| 01 | `01_prologue` | Prologue |
| 02 | `02_parodos` | Parodos |
| 03 | `03_episode_01` | Episode I |
| 04 | `04_stasimon_01` | Stasimon I |
| 05 | `05_episode_02` | Episode II |
| 06 | `06_stasimon_02` | Stasimon II |
| 07 | `07_episode_03` | Episode III |
| 08 | `08_stasimon_03` | Stasimon III |
| 09 | `09_episode_04` | Episode IV |
| 10 | `10_stasimon_04` | Stasimon IV |
| 11 | `11_episode_05` | Episode V |
| 12 | `12_hyporchema` | Hyporchema |
| 13 | `13_exodus` | Exodos |

### Modeling rules (translations)

Documented in `Antigone-Layout/demo/demo_*.ttl`:

1. **Ancient Greek** is canonical ,  `:Line_NNN` individuals are defined once in `canonical/structure.ttl`.
2. Translations only add `:TranslationVariant` nodes linked with `:relatedTo` to the canonical line.
3. Do not duplicate `:Scene`, `:Speech`, or `:Character` URIs in translation files.
4. Variant URIs encode language, e.g. `:TV_Line_020_en`, `:TV_Line_020_gr`, `:TV_Line_020_zh`.

### Demo snippets

`Antigone-Layout/demo/` contains small example TTL files (`demo_grc.ttl`, `demo_ell.ttl`, etc.) for extraction and linking patterns.

---

## SPARQL Integration

Default endpoint (hardcoded in `sparql-lines.js` and `scene-reader.js`):

```text
http://localhost:3030/antigone/query
```

### Example: all lines with Modern Greek and English variants

```sparql
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
    FILTER(CONTAINS(STR(?tvModern), "_gr"))
  }
  OPTIONAL {
    ?tvEnglish a :TranslationVariant ;
               :relatedTo ?line ;
               :text ?englishRaw .
    FILTER(CONTAINS(STR(?tvEnglish), "_en"))
  }
}
GROUP BY ?line ?n ?ancient
ORDER BY ?n
```

To point at another host or dataset, change the `endpoint` / `ENDPOINT` constants in:

- `webapp/page2/sparql-lines.js`
- `webapp/page2/scene-reader.js`
- `webapp/page4/page4.js` (triple count only)

---

## Project Structure

```text
antigone-webapp/
├── README.md
├── Antigone-Layout/
│   ├── Ontology/                 # OWL ontology definitions
│   ├── corpus/                   # 13 play sections (structure + semantics + translations)
│   └── demo/                     # Small TTL examples
├── webapp/
│   ├── index.html                # Redirect → page1
│   ├── antigone.mp4              # Optional video (gitignored)
│   ├── page1/                    # Information (static)
│   ├── page2/                    # Scenes + Lines (SPARQL)
│   │   ├── page2.html
│   │   ├── page2.js
│   │   ├── page2.css
│   │   ├── sparql-lines.js       # Line-by-line navigator
│   │   └── scene-reader.js       # Per-scene table + context queries
│   ├── page3/                    # Semantics / Video
│   │   ├── page3.html
│   │   ├── page3.js
│   │   ├── interactions.js       # Filter engine
│   │   └── video-controls.js
│   ├── page4/                    # Statistics & visualizations
│   │   ├── page4.html
│   │   ├── page4.js
│   │   └── page4.css
│   └── shared/
│       ├── css/                  # variables, nav, frame, components, utilities
│       └── js/
│           ├── data.js           # Master playData (scenes, characters, tags)
│           ├── state.js          # Shared UI state (filters, selection)
│           ├── nav.js            # Top navigation across pages
│           ├── render-helpers.js # Tags, bubbles, text panels
│           └── tts.js            # Web Speech API wrapper
└── apache-jena-fuseki-*/         # Local Fuseki install (optional, often gitignored)
```

### Script load order (Page 2)

`data.js` → `state.js` → `tts.js` → `render-helpers.js` → `nav.js` → `scene-reader.js` → `sparql-lines.js` → `page2.js`

---

## Configuration & Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| “SPARQL not loaded” / fetch errors | Fuseki not running or wrong dataset name | Start `fuseki-server.bat`; confirm `http://localhost:3030/antigone/query` |
| CORS or network errors | Page opened as `file://` | Use `python -m http.server` from `webapp/` |
| Empty line navigator | TTL not uploaded | Re-run the PowerShell/curl load script |
| Scene reader shows endpoint message | Same as above | Load corpus; check Fuseki logs |
| Triple count shows fallback number | Fuseki unreachable on Page 4 | Start Fuseki; reload page |
| Video missing | No `antigone.mp4` | Add file under `webapp/` (optional) |
| TTS sounds wrong for Ancient Greek | No `grc` voice in browser | App falls back to Modern Greek (`el`) |
| Fuseki won’t start | Bad `tdb2:location` in config | Edit `run/configuration/antigone.ttl` or recreate dataset |

### Changing the SPARQL endpoint

Edit the endpoint URL in `sparql-lines.js`, `scene-reader.js`, and optionally `page4.js`, then reload the browser.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| RDF / OWL | Turtle (`.ttl`), custom Antigone ontology |
| Triple store | Apache Jena Fuseki 6.x, TDB2 |
| Query language | SPARQL 1.1 |
| Front end | HTML5, CSS3, vanilla ES6+ JavaScript |
| Speech | Web Speech API (`speechSynthesis`) |
| Charts (Page 4) | SVG (hand-built, no chart library) |
| Server | Any static HTTP server (Python `http.server` documented) |

---

## License & Attribution

- **Play content**: Sophocles’ *Antigone* (classical text; translations as provided in the corpus files).
- **Ontology**: Described in `1.Antigone-Ontology.ttl` (generated with GPT assistance and human extension, per ontology metadata).
- **Apache Jena / Fuseki**: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) ,  see Fuseki `LICENSE` and `NOTICE` in the Fuseki distribution.

For course or research use, cite this repository and the underlying Antigone RDF layout as appropriate for your institution.
