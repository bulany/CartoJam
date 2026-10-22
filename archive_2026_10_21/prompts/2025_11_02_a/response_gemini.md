Svelte + D3 Map Tutorial - Part 1: Rendering a Map of FranceThis tutorial will guide you through setting up a Svelte and D3 project to render a beautiful, responsive map of France's departments.Step 1: Create your projectFirst, let's create a new Svelte + Vite project. Open your terminal and run the following commands. We'll use TypeScript (which is great for D3) and select the "Standard" code style you prefer.# Create a new Vite project
npm create vite@latest france-map -- --template svelte-ts

# Navigate into your new project
cd france-map

# Install the default dependencies
npm install

# Open the project in your code editor
code .
Explanation:The npm create vite command is the standard way to start a new Svelte project. We pass a few flags:france-map is the name of our project directory.--template svelte-ts tells Vite to use the Svelte framework with TypeScript.npm install downloads the basic Svelte and Vite packages listed in package.json.Step 2: Hello, Map!Let's clear out the default demo code from src/App.svelte and replace it with a simple "Hello Map" message. We'll also remove the style block and the import at the top for now.File: src/App.svelte<script lang="ts">
  // We'll add our logic here soon
</script>

<main>
  <h1>Hello, Map!</h1>
</main>

<style>
  /* We'll add styles later */
</style>
After you save, you can run npm run dev in your terminal to see your "Hello, Map!" page in the browser.Explanation:Every Svelte component is broken into three parts:A <script> block for your JavaScript/TypeScript logic.Your HTML (or markup) for the component's structure.A <style> block for component-scoped CSS.We've just reset this to a minimal, clean starting point.Step 3: Install D3 and TopoJSONTo draw a map, we need D3's geographic tools. We also need topojson-client to read the special map data format that will let us find neighbors later.In your terminal (you can stop the dev server with Ctrl+C), run this:npm install d3-geo topojson-client
npm install @types/d3-geo @types/topojson-client --save-dev
Explanation:We aren't installing all of d3 (which is huge!). We only need d3-geo, the package for map projections.topojson-client is a tiny library that helps convert TopoJSON (a compressed format) into GeoJSON (a format D3 can read).The @types/... packages are development dependencies (--save-dev). They don't run in the browser; they just provide type information to help TypeScript understand D3 and TopoJSON, which prevents typos and bugs.Step 4: Fetch the Map DataWe need data to draw! We'll use a high-quality TopoJSON file of French departments. Let's load this file when our component first mounts to the page.Update src/App.svelte:File: src/App.svelte<script lang="ts">
  import { onMount } from 'svelte'

  // This is the URL for our map data
  const MAP_URL = '[https://unpkg.com/fr-atlas/dist/departements-100m.json](https://unpkg.com/fr-atlas/dist/departements-100m.json)'
  
  let franceTopology = null

  onMount(async () => {
    const response = await fetch(MAP_URL)
    franceTopology = await response.json()
    console.log(franceTopology) // Check your browser's console!
  })
</script>

<main>
  <h1>Hello, Map!</h1>
</main>

<style>
  /* We'll add styles later */
</style>
Explanation:import { onMount } from 'svelte': We import Svelte's onMount lifecycle function. This function runs exactly once, right after the component is first rendered to the DOM. It's the perfect place to fetch data.We use the native browser fetch API to get the data. Because fetch is asynchronous (it takes time), we make our onMount function async and await the response.let franceTopology = null: We create a state variable. When you assign a new value to a top-level let variable in Svelte, Svelte "reacts" and will automatically update any parts of the HTML that depend on it.Step 5: Handle the Loading StateWhat does the user see before the map data has loaded? Svelte has a special, easy way to handle this called an await block.Update src/App.svelte:File: src/App.svelte<script lang="ts">
  import { onMount } from 'svelte'

  const MAP_URL = '[https://unpkg.com/fr-atlas/dist/departements-100m.json](https://unpkg.com/fr-atlas/dist/departements-100m.json)'
  
  // This helper function will be our "promise"
  async function loadMapData() {
    const response = await fetch(MAP_URL)
    return await response.json()
  }
  
  let mapDataPromise = loadMapData()
</script>

<main>
  {#await mapDataPromise}
    <p>Loading map...</p>
  {:then franceTopology}
    <!-- We will render the map here soon -->
    <pre>{JSON.stringify(franceTopology.objects.departements.geometries.length, null, 2)}</pre>
  {:catch error}
    <p class="error">Error loading map: {error.message}</p>
  {/await}
</main>

<style>
  .error {
    color: red;
  }
</style>
Explanation:This is a powerful Svelte pattern!Instead of storing the result in franceTopology, we store the promise itself in mapDataPromise.The {#await ...} block reacts to the promise's state:{#await...}: Shows this part while the promise is pending.{:then ...}: When the promise resolves, this part renders. The resolved value (our JSON) is put into the franceTopology variable, which only exists inside this block.{:catch ...}: If the fetch fails (e.g., no internet), this part renders.Step 6: Convert TopoJSON to GeoJSONThe data we loaded is a Topology. We need to convert it into a FeatureCollection (a list of shapes) that D3 can draw. The topojson-client library does this.Update src/App.svelte:File: src/App.svelte<script lang="ts">
  import { onMount } from 'svelte'
  import * as topojson from 'topojson-client'
  
  const MAP_URL = '[https://unpkg.com/fr-atlas/dist/departements-100m.json](https://unpkg.com/fr-atlas/dist/departements-100m.json)'
  
  async function loadMapData() {
    const response = await fetch(MAP_URL)
    return await response.json()
  }
  
  let mapDataPromise = loadMapData()

  // This helper function will convert the topology
  function getDepartments(topology) {
    // The TopoJSON file contains *all* regions. We only want 'departements'.
    const geoJson = topojson.feature(topology, topology.objects.departements)
    return geoJson.features
  }
</script>

<main>
  {#await mapDataPromise}
    <p>Loading map...</p>
  {:then franceTopology}
    <!-- We'll get the departments from the topology -->
    {@const departments = getDepartments(franceTopology)}
    <pre>{departments.length} departments loaded.</pre>
  {:catch error}
    <p class="error">Error loading map: {error.message}</p>
  {/await}
</main>

<style>
  .error {
    color: red;
  }
</style>
Explanation:import * as topojson from 'topojson-client': We import the library we installed.topojson.feature(topology, object): This is the key function. It pulls a specific set of shapes out of the TopoJSON file. The file we're using contains shapes for regions, cantons, and departments. We tell it we only want topology.objects.departements.This gives us a standard GeoJSON FeatureCollection, and we return its .features array.{@const departments = ...}: This is a handy Svelte tag to create a temporary variable right inside your HTML.Step 7: Define the D3 Map ProjectionA projection is a function from D3 that translates (lon, lat) coordinates from the map data into (x, y) pixel coordinates on your screen.Update src/App.svelte:File: src/App.svelte<script lang="ts">
  import { onMount } from 'svelte'
  import * as topojson from 'topojson-client'
  import { geoConicConformal, geoPath } from 'd3-geo'

  // --- Constants ---
  const MAP_URL = '[https://unpkg.com/fr-atlas/dist/departements-100m.json](https://unpkg.com/fr-atlas/dist/departements-100m.json)'
  const WIDTH = 800
  const HEIGHT = 800

  // --- State ---
  let mapDataPromise = loadMapData()

  // --- D3 Setup ---
  // 1. The Projection: (lon, lat) -> (x, y)
  const projection = geoConicConformal()
    .center([2.454071, 46.279229]) // Center of France
    .scale(3600)
    .translate([WIDTH / 2, HEIGHT / 2])

  // 2. The Path Generator: (GeoJSON) -> "d" attribute string
  const pathGenerator = geoPath().projection(projection)

  // --- Data Loading ---
  async function loadMapData() {
    const response = await fetch(MAP_URL)
    return await response.json()
  }
  
  function getDepartments(topology) {
    const geoJson = topojson.feature(topology, topology.objects.departements)
    return geoJson.features
  }
</script>

<main>
  {#await mapDataPromise}
    <p>Loading map...</p>
  {:then franceTopology}
    {@const departments = getDepartments(franceTopology)}
    <pre>{departments.length} departments loaded.</pre>
  {:catch error}
    <p class="error">Error loading map: {error.message}</p>
  {/await}
</main>

<style>
  .error {
    color: red;
  }
</style>
Explanation:This is the core of D3's mapping power.geoConicConformal(): This is a projection type that works very well for mid-latitude countries like France, preserving shape nicely..center(): We tell it where to center the map (lon, lat)..scale(): This is like the "zoom" level..translate(): This moves the center of the map to the center of our <svg> element (which will be 800x800).geoPath(): This is a helper function that takes a GeoJSON feature (from our departments array) and our projection, and does all the math to create the long d="..." string for an SVG <path> element.Step 8: Render the SVG Map!Now we combine Svelte's {#each} loop with D3's pathGenerator to draw the map.Update the <main> block in src/App.svelte:File: src/App.svelte<script lang="ts">
  import { onMount } from 'svelte'
  import * as topojson from 'topojson-client'
  import { geoConicConformal, geoPath } from 'd3-geo'

  // --- Constants ---
  const MAP_URL = '[https://unpkg.com/fr-atlas/dist/departements-100m.json](https://unpkg.com/fr-atlas/dist/departements-100m.json)'
  const WIDTH = 800
  const HEIGHT = 800

  // --- State ---
  let mapDataPromise = loadMapData()

  // --- D3 Setup ---
  const projection = geoConicConformal()
    .center([2.454071, 46.279229])
    .scale(3600)
    .translate([WIDTH / 2, HEIGHT / 2])

  const pathGenerator = geoPath().projection(projection)

  // --- Data Loading ---
  async function loadMapData() {
    const response = await fetch(MAP_URL)
    return await response.json()
  }
  
  function getDepartments(topology) {
    const geoJson = topojson.feature(topology, topology.objects.departements)
    return geoJson.features
  }
</script>

<main>
  {#await mapDataPromise}
    <p>Loading map...</p>
  {:then franceTopology}
    {@const departments = getDepartments(franceTopology)}
    
    <svg viewBox="0 0 {WIDTH} {HEIGHT}" class="map-svg">
      <g class="departments">
        {#each departments as d}
          <path
            class="department"
            d={pathGenerator(d)}
          />
        {/each}
      </g>
    </svg>

  {:catch error}
    <p class="error">Error loading map: {error.message}</p>
  {/await}
</main>

<style>
  .error {
    color: red;
  }
</style>
Explanation:This is the magic of Svelte + D3!<svg viewBox="0 0 {WIDTH} {HEIGHT}">: We create an SVG "canvas". Using viewBox instead of width and height attributes is the key to making it responsive later.{#each departments as d}: This is Svelte's loop. It creates one <path> element for each department in our departments array.d={pathGenerator(d)}: Here we finally use our D3 function. For each department (d), pathGenerator calculates the SVG path string and Svelte plugs it into the d attribute.You should now see a big black map of France!Step 9: Style the MapLet's make it look less like a blob and more like the Météo-France map with a blue fill and white outlines.Update the <style> block in src/App.svelte:File: src/App.svelte<!-- ... script and main blocks are the same as Step 8 ... -->

<style>
  .error {
    color: red;
  }

  .map-svg {
    display: block;
    width: 100%;
    height: 100%;
    max-height: 90vh;
    margin: auto;
  }

  .department {
    fill: #bde0fe;
    stroke: #ffffff;
    stroke-width: 0.5px;
  }
</style>
Explanation:Svelte's <style> blocks are scoped by default. This means the .department style only applies to elements with class="department" inside this component. This is fantastic for avoiding CSS conflicts.fill: The (light blue) inner color of the shape.stroke: The (white) outline of the shape.The .map-svg styles make the SVG responsive. width: 100% and max-height: 90vh (90% of the viewport height) ensure it scales down nicely on mobile.Step 10: Tidy up main.tsFinally, the Svelte template comes with a default index.css that applies some app-wide styles (like centering the text) that we don't want. Let's remove it.File: src/main.tsimport './app.css'
// import './index.css'  <-- Remove or comment out this line
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app
And with that, you should have a beautiful, responsive map of France!Explanation:The main.ts file is the entry point of your whole application. It's the file that "boots up" Svelte and tells it to render the App component into the <div id="app"> in your index.html.By removing the global index.css, we let our App.svelte component take full control of the styling, which is what we want for a full-screen map app.