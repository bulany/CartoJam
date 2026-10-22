
# CARTO JAM // Weekly Context & Architecture Spec

## 1. Overview & Live URLs
- **Project:** CartoJam — a weekly Thursday rapid-prototyping jam for 3D cartography, D3/Three.js/MapLibre spatial visualizations, and creative data experiments.
- **GitHub Repo:** `https://github.com/bulany/CartoJam` (Served via GitHub Pages from `/` root).
- **Live Portfolio URL:** `https://bulany.github.io/CartoJam/`
- **Developer Environment:** M1 MacBook Air, Obsidian (voice-transcribed prompts with start/end timestamps), VS Code, `uv` Python toolbox scripts (`dir_tree.py` copies `.gitignore`-aware ASCII file trees to clipboard).

## 2. Repository Structure & No-Build Offline Rules
Every Thursday experiment lives in its own date-prefixed folder (`YYYY_MM_DD_topic_name/`) at the root of `CartoJam/`:
```text
CartoJam/
├── index.html                           # Shadertoy-style portfolio grid + AI Provenance Waterfall
├── jams.js                              # Global `window.CARTOJAM_DATA` registry of all jams
├── NEXT_THURSDAY_CONTEXT.md             # This context file for starting new Thursday sessions
├── lib/                                 # Shared offline datasets (france-departments.geojson, airports.json, ne_110m_coastline.geojson)
├── archive_2026_10_21/                  # Legacy 2025 experiments
└── 2026_10_22_french_departments/       # Example self-contained Thursday Jam
    ├── index.html                       # Must work offline via double-click (`file://`) AND on GitHub Pages
    ├── style.css
    ├── app.js
    ├── data.js                          # Wraps GeoJSON/data in `window.DATA = ...` to avoid `file://` CORS errors
    ├── AI_USAGE.md                      # Human-readable AI disclaimer & methodology
    ├── ai_log.json                      # Machine-readable parallel timeline of Human, Architect LLM & Builder LLM turns
    ├── thumb.jpg                        # 16:9 static card thumbnail
    └── preview.gif                      # Optional 16:9 animated hover preview
```

### Crucial Technical Rules for Every Jam:
1. **100% No-Build Vanilla HTML/CSS/JS:** When generating prompts for **Google AI Studio Build (`Gemini 3.8 Flash` in Max Mode)**, explicitly instruct it to write all application code in root `index.html`, `style.css`, `app.js`, and `data.js` (and only use dummy 100-byte `src/App.tsx` files if needed to satisfy AI Studio's internal preview server).
2. **Offline-First (`file://` Double-Click Safe):** Never rely solely on `fetch('./local.json')` or `<script type="module">` because browsers block them on `file://`. Always embed local datasets in `.js` globals (`data.js`) and provide an offline pure-Three.js/Canvas layer (e.g. "WarGames Hologram" vector mode) alongside online MapLibre GL tile layers.
3. **Google Maps-Style 3D Navigation & UI:**
   - Bottom-left: Layer switcher (Hologram Offline, Topo, Satellite with overzoom fix `maxzoom: 22` on map / `18` on source).
   - Bottom-right: Zoom `+/-`, 2D/3D pitch toggle, rotating North compass reset, dynamic scale bar.
   - Top-right: `About / AI Usage` modal button + `Controls` drawer button.
4. **AI Provenance Tracking (`ai_log.json` + `jams.js`):**
   - Track every Human voice-recording window (`start`, `end`, `duration_sec`), every Architect LLM turn (`duration_sec`, `tokens`), and every AI Studio Build pass (`duration_sec`) so we can append them to `ai_log.json` and `jams.js` at the end of the session.

---

## 3. Today's Thursday Jam Request
*(Paste or voice-transcribe today's date, timestamp window, any feedback from last week, and the new visualization idea below!)*
