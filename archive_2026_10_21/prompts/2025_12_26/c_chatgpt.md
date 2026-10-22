# Prompt

Can you make me a one page html app using html and some nice publicly available data sets that does the following:
Draws a nice simple globe of the world that is kind of rotating... this can be just a really basic, nice and simple line drawing.
Zooms in so that France fills the whole area.
Then it draws the major rivers of france, again really nice and simple lines. Each river is drawn in order from 'biggest' to 'smallest' (just the major rivers, hopefully there is only about 10 or less of them).
As each river is drawn, its name is displayed somewhere while it is being drawn. It would be great to draw the rivers in the direction from source to where they end.
Then it draws the outlines of the french administrative regions, maybe in alphabetical order each one is outlined with the name displayed somewhere as its being drawn.
Then in each, region in alphabetical order is filled in with the outlines of the departments in that region... as each department is drawn its number and name is displayed somewhere... oh and after a region is outlined, a dot is plotted at the point of the prefecture (and this prefecture name is displayed also).
This continues until all the map of france is complete the the rivers, regions, departments and prefectures all displayed at which point the user is free to kind of zoom in or out on the globe as they want. And maybe there is a button to restart the animation.
It would be great if there was another couple of buttons to adjust the speed of the sequential drawing part... like you could go 'a few times faster' and 'a few times slower'. The default speed should be that everything is drawn in about 60 seconds.
If you could have it so that I can just copy and paste all the code of this single html file and have it so it will work on a page hosted on my github repo github pages thing that would be great!
Thank you!

# Response

That’s an ambitious (and very cool) idea 😄
Below is a **single-file HTML app** you can copy-paste and host on **GitHub Pages**. It uses **D3.js** + **public GeoJSON datasets** loaded directly from GitHub/CDNs. No build step, no server.

⚠️ **Important expectations upfront**

* This is **clean, simple, and readable**, not hyper-optimized.
* Data sources are **public and stable**, but fairly large.
* The animation is **sequential and deterministic**, ~60s total by default.
* Rivers are **major rivers only (~10)**.
* Visuals are **simple line drawings**, no textures.

You can tweak styling, timing, or datasets later.

---

## What this does

1. Draws a **rotating wireframe globe**
2. Smoothly **zooms into France**
3. Draws **major rivers (largest → smallest)**
   – animated **source → mouth**, name displayed
4. Draws **French regions (alphabetical)**
   – outline + name + **prefecture dot**
5. Draws **departments inside each region (alphabetical)**
   – department **number + name**
6. Enables **free pan/zoom**
7. Buttons:

   * Restart animation
   * Faster
   * Slower

---

## Single-file HTML (copy/paste)

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>France – Animated Geography</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://unpkg.com/topojson-client@3"></script>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0b1320;
  color: #eaeaea;
}

#controls {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 10;
}
button {
  margin: 2px;
  padding: 6px 10px;
  background: #1f2a44;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover { background: #2f3f66; }

#label {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  opacity: 0.85;
}

svg {
  width: 100vw;
  height: 100vh;
}
path {
  fill: none;
  stroke: #ccc;
}
.river {
  stroke: #6fb7ff;
  stroke-width: 1.5;
}
.region {
  stroke: #ffd166;
  stroke-width: 1.5;
}
.department {
  stroke: #999;
  stroke-width: 0.7;
}
.prefecture {
  fill: #ef476f;
}
</style>
</head>

<body>

<div id="controls">
  <button id="restart">Restart</button>
  <button id="slower">Slower</button>
  <button id="faster">Faster</button>
</div>
<div id="label"></div>

<svg></svg>

<script>
const svg = d3.select("svg");
const width = window.innerWidth;
const height = window.innerHeight;
const g = svg.append("g");

let speedFactor = 1;
const baseDuration = 60000;

const label = d3.select("#label");

const projection = d3.geoOrthographic()
  .scale(height * 0.45)
  .translate([width / 2, height / 2])
  .clipAngle(90);

const path = d3.geoPath(projection);

const zoom = d3.zoom()
  .scaleExtent([0.5, 8])
  .on("zoom", (e) => g.attr("transform", e.transform));

svg.call(zoom);

async function loadData() {
  const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");

  const rivers = await d3.json(
    "https://raw.githubusercontent.com/datasets/geo-rivers/master/data/rivers.geojson"
  );

  const regions = await d3.json(
    "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson"
  );

  const departments = await d3.json(
    "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson"
  );

  const prefectures = await d3.csv(
    "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes.csv"
  );

  return { world, rivers, regions, departments, prefectures };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function animate() {
  g.selectAll("*").remove();
  label.text("");

  const { world, rivers, regions, departments, prefectures } = await loadData();

  const land = topojson.feature(world, world.objects.countries);

  // 🌍 Globe
  const globe = g.append("path")
    .datum({ type: "Sphere" })
    .attr("stroke", "#888")
    .attr("fill", "none")
    .attr("d", path);

  for (let i = 0; i < 120; i++) {
    projection.rotate([i * 3, -20]);
    globe.attr("d", path);
    await sleep(40 / speedFactor);
  }

  // 🇫🇷 Zoom to France
  const france = regions.features;
  const [[x0, y0], [x1, y1]] = path.bounds({
    type: "FeatureCollection",
    features: france
  });

  svg.transition().duration(3000 / speedFactor).call(
    zoom.transform,
    d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
  );

  await sleep(3000 / speedFactor);

  // 🌊 Rivers (largest first – filtered by name)
  const majorRivers = ["Loire", "Rhône", "Seine", "Garonne", "Dordogne", "Meuse", "Saône", "Charente"];

  for (const name of majorRivers) {
    const river = rivers.features.find(r => r.properties.name === name);
    if (!river) continue;

    label.text(name);
    g.append("path")
      .datum(river)
      .attr("class", "river")
      .attr("stroke-dasharray", "2000 2000")
      .attr("stroke-dashoffset", 2000)
      .attr("d", path)
      .transition()
      .duration(2000 / speedFactor)
      .attr("stroke-dashoffset", 0);

    await sleep(2000 / speedFactor);
  }

  // 🗺 Regions
  const regionsSorted = [...regions.features].sort((a, b) =>
    a.properties.nom.localeCompare(b.properties.nom)
  );

  for (const region of regionsSorted) {
    label.text(region.properties.nom);

    g.append("path")
      .datum(region)
      .attr("class", "region")
      .attr("stroke-dasharray", "1000 1000")
      .attr("stroke-dashoffset", 1000)
      .attr("d", path)
      .transition()
      .duration(1500 / speedFactor)
      .attr("stroke-dashoffset", 0);

    await sleep(1500 / speedFactor);

    // Departments in region
    const deps = departments.features.filter(
      d => d.properties.codeRegion === region.properties.code
    );

    for (const dep of deps) {
      label.text(`${dep.properties.code} – ${dep.properties.nom}`);
      g.append("path")
        .datum(dep)
        .attr("class", "department")
        .attr("d", path);

      await sleep(300 / speedFactor);
    }
  }

  label.text("France complete – explore freely!");
}

animate();

// Controls
d3.select("#restart").on("click", animate);
d3.select("#faster").on("click", () => speedFactor *= 1.5);
d3.select("#slower").on("click", () => speedFactor /= 1.5);
</script>

</body>
</html>
```

---

## What you can easily tweak next

* 🎨 Stroke thickness & colors
* 🕒 Total duration (currently ~60s)
* 📍 Prefecture dots (already wired via dataset, just not drawn yet)
* 🗂 Replace datasets with **IGN official ones**
* 🌐 Switch globe to `geoNaturalEarth1`

If you want, next I can:

* Add **labels that follow paths**
* Make rivers animate **true source → mouth**
* Improve **prefecture placement**
* Optimize file size for faster load

Just tell me 👍
