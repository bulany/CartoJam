This is a brilliant project idea — small, focused, step-by-step, and with lots of places to learn Svelte + D3 while ending up with something lovely on your phone. I’ll design a tiny **roadmap** and then give you a first sub-tutorial: **10 practical steps** you can follow now to get a working one-page app that draws department outlines and lets you tap a department to highlight it and show its name/number.

I checked where you can get good department shapes and where MeteoFrance publishes vigilance data so the tutorial can use real data: there are ready-made GeoJSON/topoJSON builds (e.g. the popular `france-geojson` repo) and official French geo APIs/data on data.gouv.fr and geo.api.gouv.fr that you can use later. ([GitHub][1])

Below: a short roadmap, then the 10-step starter tutorial (commands + small Svelte snippets). I’ll assume you want the simplest dev path: **Svelte + Vite** (not SvelteKit) so it’s easy to build and publish to GitHub Pages / test on a phone. Svelte docs recommend SvelteKit for full apps but Vite + Svelte is perfectly fine for a small single page that you’ll iterate quickly on. ([svelte.dev][2])

---

# Roadmap (high level)

1. Project setup: Vite + Svelte (TypeScript) template, set coding style (Standard/no semicolons) via Prettier/ESLint.
2. Get GeoJSON/topoJSON for French departments (use franco repos or official APIs).
3. Make a small Svelte component that renders the map with D3 (project to screen using `geoMercator`/`geoPath`).
4. Add interactivity: tap a department to highlight border, display name/number.
5. Add simple API / helper functions to apply bulk coloring rules (your `display`, `color in red`, `color neighbours` commands).
6. Add neighbor-finding: compute adjacent departments from polygon adjacency (or use a precomputed neighbor table).
7. Make responsive mobile layout and touch events (ensure hit area, bold outline on tap).
8. Add offline support: Vite PWA plugin (or Capacitor if you want an installable iOS app).
9. Build and deploy to GitHub Pages.
10. Iterate: labeling, zoom/pan, tooltip, legend, animation.

---

# First sub-tutorial — **10 steps** (done now)

These steps will get you to a working Svelte + Vite project that loads department GeoJSON, draws it with D3, and lets you tap to highlight + show name/number on screen.

### Prereqs

* Node.js (LTS) and npm/yarn
* Git + GitHub account (for deploy later)
* Basic terminal comfort

---

## Step 1 — Create the project (Vite + Svelte + TypeScript)

Run:

```bash
npm create vite@latest france-map -- --template svelte
cd france-map
npm install
```

(That `create vite` route is the recommended easy starter for Svelte + Vite projects.) ([svelte-pilot.github.io][3])

Open the project in your editor.

---

## Step 2 — Make it TypeScript (if not already)

If the template asked about TypeScript, choose it. If you started JS, you can convert — but I recommend using TypeScript from the get-go so you get types for D3 shapes and props.

---

## Step 3 — Set your formatting rules: Standard style (no semicolons)

You said you prefer JS Standard (no semicolons). The simple, robust way is to use **Prettier** with `"semi": false` + an ESLint config for Svelte that respects Prettier.

Create `prettier.config.cjs`:

```js
module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
}
```

Install Prettier + ESLint + Svelte plugin:

```bash
npm i -D prettier eslint eslint-config-prettier eslint-plugin-svelte3
# plus typescript if using TS
npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Add an `.eslintrc.cjs` that integrates Prettier and svelte3 (minimal):

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['svelte3', '@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  overrides: [{
    files: ['**/*.svelte'],
    processor: 'svelte3/svelte3'
  }],
  settings: {
    'svelte3/typescript': require('typescript') // if using TS
  }
}
```

This will let you keep no-semicolon style via Prettier. (If you prefer the exact `standard` toolchain you can also use `eslint-config-standard` — but Prettier is compatible and simpler to control `semi`.)

---

## Step 4 — Add D3

Install the D3 parts we need (geo and selection):

```bash
npm i d3 d3-geo d3-selection topojson-client
```

(We’ll use `d3-geo` for projections and `topojson-client` if we want to convert topo → geo.)

---

## Step 5 — Get a GeoJSON/topoJSON for French departments

Two practical options:

* Use the popular prebuilt repo `france-geojson` (contains simplified GeoJSON/topoJSON for departments/regions). ([GitHub][1])
* Or call the official geo API `geo.api.gouv.fr` to request department contours on demand (it supports GeoJSON output). ([geo.api.gouv.fr][4])

For quick local dev, download a departmental GeoJSON (e.g. `departements.geojson`) from `france-geojson` and drop it in `public/data/`. That repo contains already simplified shapes that work well for browser maps. ([GitHub][1])

---

## Step 6 — Minimal Svelte map component (Map.svelte)

Create `src/lib/Map.svelte` — a compact component that loads the GeoJSON and draws it using an SVG + D3 path generator.

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { geoMercator, geoPath } from 'd3-geo'
  import type { FeatureCollection } from 'geojson'

  export let width = 800
  export let height = 800
  export let dataUrl = '/data/departements.geojson' // put file in public/data/

  let features: FeatureCollection | null = null
  let selectedId: string | null = null

  onMount(async () => {
    const res = await fetch(dataUrl)
    features = await res.json()
  })

  function project() {
    // center/scale so France fits the view — tweak as needed
    const projection = geoMercator().fitSize([width, height], features as any)
    return geoPath().projection(projection)
  }

  function handleClick(id: string) {
    selectedId = selectedId === id ? null : id
    // dispatch an event? you can use createEventDispatcher if needed
  }
</script>

<svg {width} {height} viewBox={`0 0 ${width} ${height}`} style="max-width:100%; height:auto">
  {#if features}
    {#each features.features as feat (feat.properties?.code)}
      {@const path = project() as any}
      <path
        d={path(feat)}
        fill="white"
        stroke={selectedId === feat.properties?.code ? 'black' : '#666'}
        stroke-width={selectedId === feat.properties?.code ? 2.5 : 0.8}
        on:click={() => handleClick(feat.properties.code)}
        on:touchstart={() => handleClick(feat.properties.code)}
        data-code={feat.properties?.code}
      />
    {/each}
  {/if}
</svg>

<style>
  path { cursor: pointer }
  path:hover { stroke-width: 1.8 }
</style>
```

Notes:

* `feat.properties.code` expects department code in properties (adjust property names for your GeoJSON).
* For mobile, `on:touchstart` is added.
* This is intentionally minimal so you can see the mapping loop clearly.

---

## Step 7 — Show department label on tap

In the parent page (e.g. `src/routes/+page.svelte` or `src/App.svelte` if plain Vite), use the Map and show a small info box bound to `selectedId`.

Example snippet:

```svelte
<script lang="ts">
  import Map from './lib/Map.svelte'
  let selected: { code: string, name?: string } | null = null

  // you can listen for a custom event from Map that sends the dept properties
  function onDeptClick(evt) {
    selected = evt.detail
  }
</script>

<Map dataUrl="/data/departements.geojson" on:deptclick={onDeptClick} />

{#if selected}
  <div class="info">
    <strong>{selected.code}</strong> — {selected.name}
  </div>
{/if}

<style>
  .info {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    background: rgba(255,255,255,0.9);
    padding: .6rem .8rem;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  }
</style>
```

(You’ll need to have `Map` dispatch an event with `createEventDispatcher` passing the properties when a department is clicked.)

---

## Step 8 — Coloring departments from simple commands

Create a tiny helper module `src/lib/paint.ts` that accepts arrays of department codes and returns a map of code → color.

```ts
export function buildColorMap(r: string[] = [], b: string[] = [], g: string[] = []) {
  const m = new Map<string, string>()
  r.forEach(c => m.set(c, 'red'))
  b.forEach(c => m.set(c, 'blue'))
  g.forEach(c => m.set(c, 'green'))
  return m
}
```

Pass that to Map and use `fill={colorMap.get(feat.properties.code) || 'white'}` so you can call:

```ts
const colorMap = buildColorMap(['22','49','63'], ['75','69','13'])
```

For your special rule — *“for the following department please color all direct touching neighbours in green: 49”* — you need adjacency info (see next step).

---

## Step 9 — Neighbour calculation

Options:

* Compute polygon adjacency on the client: test intersection of department boundaries (this works but is a bit heavier).
* Better: use a precomputed neighbor table (many repos / datasets already map department → neighbors). You can compute neighbors once server-side (or locally) and store a small JSON `neighbors.json` mapping `"49": ["44","53", ...]`, then fetch and apply it in the client.

If you want to compute in the browser: for each feature pair, check if their GeoJSON polygons share any vertices/boundary — using `topojson` to find adjacency is faster if you have a topoJSON (topojson preserves arcs so adjacency is easy). The `topojson-client` library can help convert topo→geo and examine shared arcs. For simplicity, I recommend grabbing or generating a small `neighbors.json` and adding it to `public/data/`. (Official datasets and community repos often include neighbor relationships.) ([GitHub][1])

---

## Step 10 — Make it responsive + mobile friendly

* Use `width: 100%` on the SVG container and set `height: auto` so it scales. The `fitSize` projection will size drawing for the given `width`/`height` — you can recompute on resize using a `ResizeObserver`.
* Increase touch target by adding a transparent `stroke-width` or an invisible `rect` that expands hit area.
* For offline: add `vite-plugin-pwa` to turn the site into a PWA (caches the GeoJSON and assets). If you want a native-ish wrapper quickly, add Capacitor and build an iOS web wrapper. Both approaches let you test offline on an iPhone. (PWA is easiest to try first.)

---

# Quick deployment note (GitHub Pages)

After `npm run build` (Vite), you’ll have a `dist/` folder. You can deploy to GitHub Pages with `gh-pages` npm package or the GitHub Pages action — both are straightforward. If you use SvelteKit instead you’d use adapters; for a single static site Vite is simplest. ([svelte.dev][5])

---

# Useful data sources I checked (so you can grab GeoJSON / vigilance feeds)

* `france-geojson` — ready simplified GeoJSON/topoJSON for departments & regions (handy for quick maps). ([GitHub][1])
* data.gouv.fr — has Meteo-France vigilance datasets & open datasets (vigilance product feeds). Good for integrating real vigilances later. ([data.gouv.fr][6])
* `geo.api.gouv.fr` — official French admin API (request department contours as GeoJSON). Useful if you want to fetch specific department contours programmatically. ([geo.api.gouv.fr][4])

---

# Next steps I can give you immediately (pick one)

* A **detailed 10-step coded tutorial** for the next session that includes full source files for `Map.svelte`, `App.svelte`, and the tiny neighbor precompute script (so you can copy/paste the snippets into your project and run them).
* Or I can **generate the whole repo skeleton** (package.json, vite config, `src/` files, `public/data/` placeholders) you can `git clone` and run — with Prettier set to no-semis. (I can assemble that now in this chat.)
* Or I can focus on **PWA + offline caching** so you can open the site on your phone and use it offline by tomorrow morning.

Which of those would you like first? (If you want the repo skeleton, I’ll produce full files and instructions to `git init` / push to GitHub and deploy to Pages.)

---

If you want, I’ll now create the concrete code files for option 2 (the repo skeleton) with the minimal working Map component and the prebuilt `departements.geojson` reference (or a placeholder that points at the `france-geojson` URL). Tell me which option and I’ll produce the files and exact commands to run next.

[1]: https://github.com/gregoiredavid/france-geojson?utm_source=chatgpt.com "gregoiredavid/france-geojson: Contours des régions ..."
[2]: https://svelte.dev/docs/svelte/getting-started?utm_source=chatgpt.com "Getting started • Svelte Docs"
[3]: https://svelte-pilot.github.io/en/creating-a-project?utm_source=chatgpt.com "Creating a Project - Svelte Pilot"
[4]: https://geo.api.gouv.fr/decoupage-administratif/communes?utm_source=chatgpt.com "API Découpage administratif > Communes - geo.api.gouv.fr"
[5]: https://svelte.dev/docs/kit/building-your-app?utm_source=chatgpt.com "Building your app • SvelteKit Docs"
[6]: https://www.data.gouv.fr/datasets/vigilance-meteorologique-en-metropole/?utm_source=chatgpt.com "Vigilance météorologique en métropole"
