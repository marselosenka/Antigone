# antigone-webapp


## Project Structure

```
webapp/
├── index.html              # Single HTML file – all 4 pages here
│
├── css/
│   ├── variables.css       # CSS custom properties (colors, fonts, shadows)
│   ├── nav.css             # Navigation bar + page show/hide logic
│   ├── layout.css          # Page-level grid layouts (Page 2 & Page 3)
│   ├── components.css      # Tags, character bubbles, speak buttons
│   ├── video.css           # Video player, SPARQL toolbar, text panels
│   └── utilities.css       # Tooltips, keyboard-help overlay
│
├── js/
│   ├── data.js             # Master play data (scenes, characters)
│   ├── state.js            # Global application state object
│   ├── tts.js              # Text-to-speech (Web Speech API)
│   ├── render.js           # DOM builders: tags, bubbles, text panels
│   ├── interactions.js     # Click handlers, filtering engine
│   ├── sparql-lines.js     # SPARQL line navigator (Page 2)
│   ├── video-controls.js   # Video player + scene-sync (Page 3)
│   ├── page-manager.js     # SPA routing (show/hide pages)
│   └── main.js             # Entry point (DOMContentLoaded)
│
└── antigone.mp4            # ← add your video file here (git-ignored),
                            # placed in Drive 
```


No build step required — open `index.html` directly in a browser, for now 



