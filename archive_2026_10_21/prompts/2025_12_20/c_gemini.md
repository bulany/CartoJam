# Prompt

Have a look at the one page html app below which shows a nice retro futurisitic globe of the world and allows the user to enter a list of airport codes and have the route between them animated when the slider is moved.
It is basically working at the moment but there are a few things I would like to fix up which are the following:
1. The globe and airport list resources are loaded from local files but this still takes a little while. Could you add in code that shows an in theme message like "Initialising uplink..." while these are loading?
2. When the route is unitialised sometimes I see a dot (I think its the progress dot) in the very center of the globe (because the globe is semi transparent). It would be great to hide this dot until a valid route is established.
3. It would be great if the airport list box was more responsive: when the user presses enter after typing some airport codes it should try and establish the route immediately. If there are some airport codes that are not recognised maybe it could change the text colour of the ones that aren't recognised to red and just ignore them from the itinerary. I would love it so that as soon as it recognises a code it transforms it into all upper case (if it was lower case) and plots a dot on the globe which stays there, maybe this dot could be a nice blue 'archive' colour - hopefully that still fits in with the theme. That way as people type in airport codes its like they turn little lights on around the globe - yes maybe as the dot appears it does a little glowy flash thing to draw a little bit of attention. If the user deletes all of the text in the box and presses enter it should immeditely reset the route. The list of the airports should be able to handle white space between the comma separated airport codes, but it would be great if this whitespace gets filtered out to make a nice clean URL... you can even filter it out maybe when the last typed airport code is recognised as valid? I would love it if the URL could be nice and clean, maybe with the airport codes separated by dashes.
4. I noticed when I press the 'reset route' button it doesn't seem to clear any route lines that were previously drawn... it would be great if this could work, clearing all the route lines and airport dots and even text in the box.
5. How hard would it be to add the text of the airport code underneath the dot in an appropriate size font? Or would it be possible to have the text appear under the dot when the mouse hovers over the airport dot?
This is probably enough for now... thanks for your help!

# Response
Here is the updated and enhanced single-file HTML solution.

I have made the following major changes to address your requests:

1.  **Loading Screen**: Added a "System Boot" style overlay that displays "Initialising Uplink..." and hides only when both the globe and airport data are fully loaded.
2.  **Input & Validation**: Replaced the standard input with a "Syntax Highlighting" mechanism (a transparent textarea over a formatted display).
    *   Valid codes turn **Green**.
    *   Invalid codes turn **Red**.
    *   Valid codes immediately spawn a **Blue "Archive" Dot** on the globe.
    *   Newly added dots have a "flash" animation effect.
3.  **Route Logic**:
    *   Pressing **Enter** triggers the route.
    *   If the input is empty and you press Enter, it resets everything.
    *   The URL hash now uses dashes (`JFK-LHR-HND`) for a cleaner look.
    *   The "Progress Dot" is hidden until a valid route exists.
4.  **Reset**: The reset function now properly clears all lines, dots, and internal arrays using a dedicated `THREE.Group`.
5.  **Hover Labels**: Added a raycaster system. When you hover over an airport dot (blue or green), the airport code appears floating above it.

**Note:** You will still need your `airports.json` and `ne_110m_coastline.geojson` files in the same folder for this to work.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Global Flight Route Viewer v2.0</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
/* --- CORE STYLES --- */
body {
    margin: 0;
    overflow: hidden;
    background: black;
    font-family: "Courier New", monospace;
    color: #0f0;
}

/* --- CRT & SCANLINE EFFECTS --- */
#crt {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 100;
    background:
        linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
        radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%);
    background-size: 100% 3px, 100% 100%;
}

/* --- UI PANELS --- */
.panel {
    position: absolute;
    background: rgba(0, 15, 0, 0.9);
    border: 1px solid #0f0;
    padding: 12px;
    z-index: 20;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}

#input-panel { top: 20px; left: 20px; width: 300px; }
#timeline-panel { bottom: 30px; left: 50%; transform: translateX(-50%); width: 60%; display: none; }

/* --- BUTTONS & SLIDERS --- */
button {
    width: 100%;
    margin-top: 8px;
    background: #0f0;
    color: black;
    border: 1px solid #0f0;
    padding: 8px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
    text-transform: uppercase;
}
button:hover { background: #cfc; }
button:active { background: #0a0; color: white; }

button.secondary {
    background: transparent;
    color: #0f0;
    font-size: 0.8em;
    margin-top: 5px;
}
button.secondary:hover { background: rgba(0, 255, 0, 0.1); }

input[type=range] { 
    width: 100%; 
    accent-color: #0f0; 
    cursor: ew-resize;
}

/* --- LOADING SCREEN --- */
#loader {
    position: absolute;
    inset: 0;
    background: black;
    z-index: 200;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #0f0;
    font-size: 1.5em;
}
.blink { animation: blinker 1s linear infinite; }
@keyframes blinker { 50% { opacity: 0; } }

/* --- INPUT HIGHLIGHTER SYSTEM --- */
.input-container {
    position: relative;
    width: 100%;
    height: 60px; /* Multi-line capability */
    margin-top: 6px;
    background: black;
    border: 1px solid #0f0;
}

/* The backdrop handles the coloring */
.input-backdrop {
    position: absolute;
    inset: 0;
    padding: 6px;
    z-index: 1;
    color: transparent; /* Text is usually transparent here, but we use spans for color */
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 14px;
    pointer-events: none;
    overflow: hidden;
}

/* The actual textarea is transparent and sits on top */
textarea#codes-input {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: transparent;
    color: transparent; /* Hide text, show caret */
    caret-color: #0f0;
    border: none;
    resize: none;
    padding: 6px;
    font-family: inherit;
    font-size: 14px;
    outline: none;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* Syntax Highlighting Colors */
.hl-valid { color: #0f0; text-shadow: 0 0 5px #0f0; }
.hl-invalid { color: #f00; text-shadow: 0 0 2px #f00; text-decoration: line-through; }
.hl-sep { color: #555; }

/* --- HOVER TOOLTIP --- */
#tooltip {
    position: absolute;
    display: none;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #0f0;
    color: #0f0;
    padding: 4px 8px;
    font-size: 12px;
    pointer-events: none;
    z-index: 50;
    transform: translate(-50%, -150%); /* Center above cursor */
    box-shadow: 0 0 5px #0f0;
}
</style>

<!-- Import Maps -->
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
</head>
<body>

<!-- Retro Overlay -->
<div id="crt"></div>

<!-- Loading Screen -->
<div id="loader">
    <div>SYSTEM BOOT_</div>
    <div style="margin-top:10px; font-size: 0.8em">INITIALISING UPLINK<span class="blink">...</span></div>
</div>

<!-- Hover Tooltip -->
<div id="tooltip"></div>

<!-- Control Panel -->
<div id="input-panel" class="panel">
    <div>FLIGHT PLAN [ENTER to EXEC]</div>
    
    <div class="input-container">
        <div id="input-highlights" class="input-backdrop"></div>
        <textarea id="codes-input" spellcheck="false" placeholder="TYP: JFK-LHR-HND"></textarea>
    </div>

    <button id="init">ESTABLISH ROUTE</button>
    <button id="reset" class="secondary">RESET SYSTEM</button>
    <button id="share" class="secondary">COPY UPLINK LINK</button>
</div>

<!-- Timeline Slider -->
<div id="timeline-panel" class="panel">
    <input type="range" id="scrubber" min="0" max="1000" value="0">
    <div style="text-align:center; font-size:0.8em; margin-top:5px">ROUTE PROGRESS</div>
</div>

<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// --- CONFIGURATION ---
const GLOBE_RADIUS = 20;
const COLOR_LAND = 0x00ff22;
const COLOR_ROUTE = 0x00ffaa;
const COLOR_DOT_ROUTE = 0xffffff;
const COLOR_DOT_ARCHIVE = 0x0088ff; // Blue for recognised inputs
const COLOR_DOT_ERROR = 0xff0000;

// --- STATE ---
let AIRPORTS = {};
let routePoints = [];
let routeLengths = [];
let totalDistance = 0;
// We use a map to track dots created by typing: Code -> Mesh
let archiveDots = new Map(); 

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(40,30,50);

const renderer = new THREE.WebGLRenderer({antialias:false});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// Post Processing for Glow
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.2, 0.4, 0.85));

// --- GROUPS ---
const globeGroup = new THREE.Group();
const routeGroup = new THREE.Group(); // Stores lines and the white route dot
const archiveGroup = new THREE.Group(); // Stores the blue airport dots
scene.add(globeGroup);
scene.add(routeGroup);
scene.add(archiveGroup);

// The moving white dot
const progressDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshBasicMaterial({color: COLOR_DOT_ROUTE})
);
progressDot.visible = false; // Hidden by default
routeGroup.add(progressDot);

// --- UTILS ---
function latLonToVec(lat, lon, r) {
    const phi = (90-lat)*Math.PI/180;
    const theta = (lon+180)*Math.PI/180;
    return new THREE.Vector3(
        -r*Math.sin(phi)*Math.cos(theta),
        r*Math.cos(phi),
        r*Math.sin(phi)*Math.sin(theta)
    );
}

function greatCirclePoints(a, b, steps=64) {
    const pts=[];
    for(let i=0;i<=steps;i++){
        const v=a.clone().lerp(b,i/steps).normalize().multiplyScalar(GLOBE_RADIUS);
        pts.push(v);
    }
    return pts;
}

// --- DATA LOADING ---
async function loadData() {
    try {
        const [coastRes, airportRes] = await Promise.all([
            fetch("./ne_110m_coastline.geojson"),
            fetch("./airports.json")
        ]);

        const coastData = await coastRes.json();
        AIRPORTS = await airportRes.json();
        window.AIRPORTS = AIRPORTS;

        // Build Globe
        const pts=[];
        coastData.features.forEach(f=>{
            const lines = f.geometry.type==="LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
            lines.forEach(l=>{
                for(let i=0;i<l.length-1;i++){
                    pts.push(
                        latLonToVec(l[i][1],l[i][0], GLOBE_RADIUS),
                        latLonToVec(l[i+1][1],l[i+1][0], GLOBE_RADIUS)
                    );
                }
            });
        });
        
        globeGroup.add(new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: COLOR_LAND, transparent: true, opacity: 0.6 })
        ));

        // Inner black sphere to block lines behind
        globeGroup.add(new THREE.Mesh(
            new THREE.SphereGeometry(GLOBE_RADIUS*0.98, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x000500 })
        ));

        // Hide Loader
        document.getElementById("loader").style.display = "none";

        // Check URL for initial route
        if(location.hash){
            const cleanHash = location.hash.substring(1).replace(/,/g, '-');
            document.getElementById("codes-input").value = cleanHash;
            handleInput(); // Trigger visuals
            initRoute(cleanHash.split("-"));
        }

    } catch (e) {
        document.getElementById("loader").innerHTML = `<div style="color:red">UPLINK FAILED<br>MISSING DATA FILES</div>`;
        console.error(e);
    }
}

// --- LOGIC: ARCHIVE DOTS (BLUE LIGHTS) ---
function updateArchiveDots(codes) {
    // 1. Identify valid codes currently in input
    const validCodes = new Set();
    codes.forEach(c => {
        if(AIRPORTS[c]) validCodes.add(c);
    });

    // 2. Remove dots that are no longer in input
    for (const [code, mesh] of archiveDots) {
        if (!validCodes.has(code)) {
            archiveGroup.remove(mesh);
            archiveDots.delete(code);
        }
    }

    // 3. Add new dots
    validCodes.forEach(code => {
        if (!archiveDots.has(code)) {
            const data = AIRPORTS[code];
            const pos = latLonToVec(data.lat, data.lon, GLOBE_RADIUS);
            
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8),
                new THREE.MeshBasicMaterial({ color: COLOR_DOT_ARCHIVE })
            );
            mesh.position.copy(pos);
            mesh.userData = { code: code, type: 'airport' }; // For Raycaster
            
            // "Flash" animation data
            mesh.scale.set(0.1, 0.1, 0.1);
            mesh.userData.flash = 0; 
            
            archiveGroup.add(mesh);
            archiveDots.set(code, mesh);
        }
    });
}

// --- LOGIC: INPUT HANDLING & HIGHLIGHTING ---
const inputArea = document.getElementById("codes-input");
const highlightArea = document.getElementById("input-highlights");

function handleInput() {
    const raw = inputArea.value.toUpperCase(); // Force display uppercase logic in processing
    
    // Split by non-alphanumeric to find tokens, but keep separators for display
    // Regex matches: ([A-Z0-9]+) OR ([^A-Z0-9]+)
    const tokens = raw.split(/([A-Z0-9]+)/gi);
    
    let html = "";
    let cleanCodes = [];

    tokens.forEach(token => {
        if(!token) return;
        
        // If it looks like an airport code (3-4 letters)
        if(/^[A-Z0-9]{3,4}$/i.test(token)) {
            const up = token.toUpperCase();
            if(AIRPORTS[up]) {
                html += `<span class="hl-valid">${up}</span>`;
                cleanCodes.push(up);
            } else {
                html += `<span class="hl-invalid">${up}</span>`;
            }
        } else {
            // Separators/Whitespace
            html += `<span class="hl-sep">${token}</span>`;
        }
    });

    highlightArea.innerHTML = html;
    updateArchiveDots(cleanCodes);
    return cleanCodes;
}

// Event Listeners for Input
inputArea.addEventListener("input", handleInput);
inputArea.addEventListener("scroll", () => {
    highlightArea.scrollTop = inputArea.scrollTop;
});
inputArea.addEventListener("keydown", (e) => {
    if(e.key === "Enter") {
        e.preventDefault(); // Don't add newline
        const codes = handleInput();
        if(codes.length === 0) {
            resetRoute();
        } else {
            initRoute(codes);
        }
    }
});

// --- LOGIC: ROUTE GENERATION ---
function resetRoute() {
    // Clear Lines
    // Note: looping backwards or using clear() is safer
    for(let i = routeGroup.children.length - 1; i >= 0; i--) {
        const child = routeGroup.children[i];
        if(child !== progressDot) {
            routeGroup.remove(child);
            if(child.geometry) child.geometry.dispose();
        }
    }
    
    // Reset State
    routePoints = [];
    routeLengths = [];
    totalDistance = 0;
    progressDot.visible = false;
    
    // Clear Input
    inputArea.value = "";
    highlightArea.innerHTML = "";
    
    // Clear Archive Dots
    archiveGroup.clear();
    archiveDots.clear();

    // UI Updates
    document.getElementById("timeline-panel").style.display = "none";
    history.replaceState(null, "", location.pathname);
}

function initRoute(codes) {
    // 1. Clean previous lines (but keep archive dots)
    for(let i = routeGroup.children.length - 1; i >= 0; i--) {
        const child = routeGroup.children[i];
        if(child !== progressDot) routeGroup.remove(child);
    }
    routePoints = [];
    routeLengths = [];
    totalDistance = 0;

    // 2. Filter Valid Codes
    const validList = codes.filter(c => AIRPORTS[c]);
    
    if(validList.length < 2) {
        progressDot.visible = false;
        return; 
    }

    // 3. Build Route
    for(let i=0; i<validList.length-1; i++){
        const a = AIRPORTS[validList[i]];
        const b = AIRPORTS[validList[i+1]];
        
        const v1 = latLonToVec(a.lat, a.lon, GLOBE_RADIUS);
        const v2 = latLonToVec(b.lat, b.lon, GLOBE_RADIUS);
        
        const pts = greatCirclePoints(v1, v2);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        
        // Add Line
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color: COLOR_ROUTE}));
        routeGroup.add(line);
        
        // Calculate Distance
        const dist = v1.angleTo(v2) * 6371;
        routePoints.push(pts);
        routeLengths.push(dist);
        totalDistance += dist;
    }

    // 4. Finalize
    progressDot.visible = true;
    document.getElementById("timeline-panel").style.display = "block";
    document.getElementById("scrubber").value = 0;
    
    // Update URL with clean dashes
    const newHash = validList.join("-");
    history.replaceState(null, "", "#" + newHash);
    
    // Ensure input matches clean URL format if user triggered via button
    inputArea.value = newHash;
    handleInput(); 
}

// --- BUTTON HANDLERS ---
document.getElementById("init").onclick = () => {
    const codes = handleInput();
    initRoute(codes);
};

document.getElementById("reset").onclick = resetRoute;

document.getElementById("share").onclick = () => {
    navigator.clipboard.writeText(location.href);
    const btn = document.getElementById("share");
    const orig = btn.innerText;
    btn.innerText = "COPIED TO CLIPBOARD";
    setTimeout(() => btn.innerText = orig, 2000);
};

// --- SCRUBBER LOGIC ---
document.getElementById("scrubber").oninput = e => {
    if(!totalDistance) return;
    let t = e.target.value / 1000;
    let d = t * totalDistance;
    
    for(let i=0; i<routePoints.length; i++){
        if(d <= routeLengths[i]){
            const local = d / routeLengths[i];
            const idx = Math.floor(local * (routePoints[i].length - 1));
            // Safety check for index
            if(routePoints[i][idx]) {
                progressDot.position.copy(routePoints[i][idx]);
            }
            break;
        }
        d -= routeLengths[i];
    }
};

// --- HOVER / INTERACTION LOGIC ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById("tooltip");

window.addEventListener('mousemove', (event) => {
    // Normalize mouse coords
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Move tooltip
    tooltip.style.left = event.clientX + 'px';
    tooltip.style.top = event.clientY + 'px';
});

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // 1. Raycasting for Labels
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(archiveGroup.children);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if(obj.userData.code) {
            tooltip.style.display = 'block';
            tooltip.innerText = obj.userData.code;
            document.body.style.cursor = 'pointer';
        }
    } else {
        tooltip.style.display = 'none';
        document.body.style.cursor = 'default';
    }

    // 2. Animate Dots (Flash Effect)
    archiveGroup.children.forEach(dot => {
        if(dot.userData.flash < 1) {
            dot.userData.flash += 0.05;
            const s = THREE.MathUtils.lerp(0.1, 1.0, dot.userData.flash);
            // Add a little elastic bounce
            const scale = s + Math.sin(dot.userData.flash * Math.PI) * 0.5;
            dot.scale.setScalar(Math.max(0.1, scale));
        } else {
            dot.scale.setScalar(1);
        }
    });

    composer.render();
}

// Start
loadData();
animate();

window.onresize = () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
};

</script>
</body>
</html>
```

# Prompt
This is looking fantastic!
Could you make a few minor changes:
1. Take out the raycaster airport code rollover code... there is no need for this and I would rather keep things simple than adding something complicated like this.
2. There is a constant slow spin or rotation to the globe - please take this out so that the globe is stationary to start with and if the user gives it a bit of momentum it just stays with that instead of going back to the orbit it is doing now.
3. Could you make it so that when the user is typing an airport and it recognises it, the globe does a beautiful movement around to put that airport at the center, that way when they are typing the codes they almost get the feeling of navigating to the next airport. Oh and I think the line between the airports should be plotted immediately as an airport is recognised. 
4. I think it might look good if the ploted flight line is in the same colour as the airport dots (the blue colour that you chose is perfect)
5. I noticed if I was halfway through a route (with the white 'flight' dot) and then I reset and did another route, the white dot appears at the same spot where I was (and then immediately resets when I start dragging the slider) - if you could work out why that's happening and make it so when a new route is recognised the white dot is put at the first airport (to match the progress slider being at zero).
6. Finally it would be amazing to have a data display in the top right hand side showing, as you drag the slider: the total distance covered, and the total hours of flight time (assuming a standard international jet liner flight speed).
Thanks again, this is looking amazing!

# Response

Here is the updated code. I have integrated all your requests:

1.  **Raycaster Removed**: The tooltip and mouse-over logic are gone for a cleaner code base.
2.  **Stationary Globe**: Auto-rotation is disabled; it now relies entirely on user interaction (momentum is preserved).
3.  **Smart Navigation**:
    *   **Auto-Focus**: As soon as you type a valid airport code (e.g., finishing "LHR"), the camera smoothly rotates to center that airport.
    *   **Instant Plotting**: The blue flight line appears immediately upon recognition.
4.  **Visual Unification**: The flight path lines are now the same **Electric Blue** as the airport dots.
5.  **Dot Reset Fix**: The white progress dot now immediately snaps to the start of the new route when a route changes or resets.
6.  **Flight Data Panel**: Added a top-right panel showing **Distance** (km) and estimated **Flight Time** (assuming 900km/h cruise speed).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Global Flight Route Viewer v2.1</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
/* --- CORE STYLES --- */
body {
    margin: 0;
    overflow: hidden;
    background: black;
    font-family: "Courier New", monospace;
    color: #0f0;
}

/* --- CRT & SCANLINE EFFECTS --- */
#crt {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 100;
    background:
        linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
        radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%);
    background-size: 100% 3px, 100% 100%;
}

/* --- UI PANELS --- */
.panel {
    position: absolute;
    background: rgba(0, 15, 0, 0.9);
    border: 1px solid #0f0;
    padding: 12px;
    z-index: 20;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}

#input-panel { top: 20px; left: 20px; width: 300px; }
#stats-panel { top: 20px; right: 20px; width: 220px; text-align: right; display: none; }
#timeline-panel { bottom: 30px; left: 50%; transform: translateX(-50%); width: 60%; display: none; }

/* --- BUTTONS & SLIDERS --- */
button {
    width: 100%;
    margin-top: 8px;
    background: #0f0;
    color: black;
    border: 1px solid #0f0;
    padding: 8px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
    text-transform: uppercase;
}
button:hover { background: #cfc; }
button:active { background: #0a0; color: white; }

button.secondary {
    background: transparent;
    color: #0f0;
    font-size: 0.8em;
    margin-top: 5px;
}
button.secondary:hover { background: rgba(0, 255, 0, 0.1); }

input[type=range] { 
    width: 100%; 
    accent-color: #0f0; 
    cursor: ew-resize;
}

/* --- DATA DISPLAYS --- */
.stat-row { margin-bottom: 5px; }
.stat-label { font-size: 0.7em; opacity: 0.7; }
.stat-value { font-size: 1.2em; font-weight: bold; color: #fff; text-shadow: 0 0 5px #fff; }

/* --- LOADING SCREEN --- */
#loader {
    position: absolute;
    inset: 0;
    background: black;
    z-index: 200;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #0f0;
    font-size: 1.5em;
}
.blink { animation: blinker 1s linear infinite; }
@keyframes blinker { 50% { opacity: 0; } }

/* --- INPUT HIGHLIGHTER SYSTEM --- */
.input-container {
    position: relative;
    width: 100%;
    height: 60px;
    margin-top: 6px;
    background: black;
    border: 1px solid #0f0;
}

.input-backdrop {
    position: absolute;
    inset: 0;
    padding: 6px;
    z-index: 1;
    color: transparent;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 14px;
    pointer-events: none;
    overflow: hidden;
}

textarea#codes-input {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: transparent;
    color: transparent;
    caret-color: #0f0;
    border: none;
    resize: none;
    padding: 6px;
    font-family: inherit;
    font-size: 14px;
    outline: none;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.hl-valid { color: #0f0; text-shadow: 0 0 5px #0f0; }
.hl-invalid { color: #f00; text-shadow: 0 0 2px #f00; text-decoration: line-through; }
.hl-sep { color: #555; }

</style>

<!-- Import Maps -->
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
</head>
<body>

<!-- Retro Overlay -->
<div id="crt"></div>

<!-- Loading Screen -->
<div id="loader">
    <div>SYSTEM BOOT_</div>
    <div style="margin-top:10px; font-size: 0.8em">INITIALISING UPLINK<span class="blink">...</span></div>
</div>

<!-- Control Panel -->
<div id="input-panel" class="panel">
    <div>FLIGHT PLAN</div>
    
    <div class="input-container">
        <div id="input-highlights" class="input-backdrop"></div>
        <textarea id="codes-input" spellcheck="false" placeholder="TYP: JFK-LHR-HND"></textarea>
    </div>

    <!-- Buttons mostly for explicit actions, though typing does most work now -->
    <button id="reset" class="secondary">RESET SYSTEM</button>
    <button id="share" class="secondary">COPY UPLINK LINK</button>
</div>

<!-- Stats Panel -->
<div id="stats-panel" class="panel">
    <div class="stat-row">
        <div class="stat-label">DISTANCE TRAVERSED</div>
        <div class="stat-value" id="val-dist">0 KM</div>
    </div>
    <div class="stat-row">
        <div class="stat-label">EST. FLIGHT TIME</div>
        <div class="stat-value" id="val-time">00H 00M</div>
    </div>
</div>

<!-- Timeline Slider -->
<div id="timeline-panel" class="panel">
    <input type="range" id="scrubber" min="0" max="1000" value="0">
</div>

<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// --- CONFIGURATION ---
const GLOBE_RADIUS = 20;
const SPEED_KMPH = 900; // Average jet speed
const COLOR_LAND = 0x00ff22;
// Combined color for Routes and Airport Dots (Electric Blue)
const COLOR_THEME_BLUE = 0x0088ff; 
const COLOR_DOT_ROUTE = 0xffffff;

// --- STATE ---
let AIRPORTS = {};
let routePoints = [];
let routeLengths = [];
let totalDistance = 0;
let archiveDots = new Map(); 
let lastValidCodeCount = 0; // To track when to trigger camera move

// Camera Target for smooth movement
let targetCameraPos = null;

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
// Initial Position
camera.position.set(40,30,50);

const renderer = new THREE.WebGLRenderer({antialias:false});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false; // Stopped auto rotation
controls.enablePan = false;

// Post Processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.2, 0.4, 0.85));

// --- GROUPS ---
const globeGroup = new THREE.Group();
const routeGroup = new THREE.Group(); 
const archiveGroup = new THREE.Group(); 
scene.add(globeGroup);
scene.add(routeGroup);
scene.add(archiveGroup);

// The moving white dot
const progressDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshBasicMaterial({color: COLOR_DOT_ROUTE})
);
progressDot.visible = false;
routeGroup.add(progressDot);

// --- UTILS ---
function latLonToVec(lat, lon, r) {
    const phi = (90-lat)*Math.PI/180;
    const theta = (lon+180)*Math.PI/180;
    return new THREE.Vector3(
        -r*Math.sin(phi)*Math.cos(theta),
        r*Math.cos(phi),
        r*Math.sin(phi)*Math.sin(theta)
    );
}

function greatCirclePoints(a, b, steps=64) {
    const pts=[];
    for(let i=0;i<=steps;i++){
        const v=a.clone().lerp(b,i/steps).normalize().multiplyScalar(GLOBE_RADIUS);
        pts.push(v);
    }
    return pts;
}

function updateStats(dist) {
    document.getElementById("val-dist").innerText = Math.floor(dist).toLocaleString() + " KM";
    const hoursTotal = dist / SPEED_KMPH;
    const h = Math.floor(hoursTotal);
    const m = Math.round((hoursTotal - h) * 60);
    document.getElementById("val-time").innerText = 
        h.toString().padStart(2,'0') + "H " + m.toString().padStart(2,'0') + "M";
}

// --- DATA LOADING ---
async function loadData() {
    try {
        const [coastRes, airportRes] = await Promise.all([
            fetch("./ne_110m_coastline.geojson"),
            fetch("./airports.json")
        ]);

        const coastData = await coastRes.json();
        AIRPORTS = await airportRes.json();
        window.AIRPORTS = AIRPORTS;

        // Build Globe
        const pts=[];
        coastData.features.forEach(f=>{
            const lines = f.geometry.type==="LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
            lines.forEach(l=>{
                for(let i=0;i<l.length-1;i++){
                    pts.push(
                        latLonToVec(l[i][1],l[i][0], GLOBE_RADIUS),
                        latLonToVec(l[i+1][1],l[i+1][0], GLOBE_RADIUS)
                    );
                }
            });
        });
        
        globeGroup.add(new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: COLOR_LAND, transparent: true, opacity: 0.6 })
        ));

        // Inner black sphere
        globeGroup.add(new THREE.Mesh(
            new THREE.SphereGeometry(GLOBE_RADIUS*0.98, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x000500 })
        ));

        // Hide Loader
        document.getElementById("loader").style.display = "none";

        // Check URL
        if(location.hash){
            const cleanHash = location.hash.substring(1).replace(/,/g, '-');
            document.getElementById("codes-input").value = cleanHash;
            handleInput(); 
        }

    } catch (e) {
        document.getElementById("loader").innerHTML = `<div style="color:red">UPLINK FAILED<br>MISSING DATA FILES</div>`;
        console.error(e);
    }
}

// --- LOGIC: ARCHIVE DOTS ---
function updateArchiveDots(codes) {
    const validCodes = new Set();
    codes.forEach(c => {
        if(AIRPORTS[c]) validCodes.add(c);
    });

    // Remove old
    for (const [code, mesh] of archiveDots) {
        if (!validCodes.has(code)) {
            archiveGroup.remove(mesh);
            archiveDots.delete(code);
        }
    }

    // Add new
    validCodes.forEach(code => {
        if (!archiveDots.has(code)) {
            const data = AIRPORTS[code];
            const pos = latLonToVec(data.lat, data.lon, GLOBE_RADIUS);
            
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8),
                new THREE.MeshBasicMaterial({ color: COLOR_THEME_BLUE })
            );
            mesh.position.copy(pos);
            mesh.userData = { flash: 0 }; 
            
            archiveGroup.add(mesh);
            archiveDots.set(code, mesh);
        }
    });
}

// --- LOGIC: CAMERA FOCUS ---
function focusCameraOn(code) {
    if(!AIRPORTS[code]) return;
    const a = AIRPORTS[code];
    // Get the vector of the airport
    const targetVec = latLonToVec(a.lat, a.lon, GLOBE_RADIUS);
    
    // We want the camera to be at a certain distance from the center, 
    // aligned with this airport vector.
    // Current camera distance:
    const dist = camera.position.length();
    
    // Target position is the normalized airport vector * distance
    targetCameraPos = targetVec.normalize().multiplyScalar(dist);
}

// --- LOGIC: INPUT HANDLING ---
const inputArea = document.getElementById("codes-input");
const highlightArea = document.getElementById("input-highlights");

function handleInput() {
    const raw = inputArea.value.toUpperCase(); 
    const tokens = raw.split(/([A-Z0-9]+)/gi);
    
    let html = "";
    let cleanCodes = [];

    tokens.forEach(token => {
        if(!token) return;
        if(/^[A-Z0-9]{3,4}$/i.test(token)) {
            const up = token.toUpperCase();
            if(AIRPORTS[up]) {
                html += `<span class="hl-valid">${up}</span>`;
                cleanCodes.push(up);
            } else {
                html += `<span class="hl-invalid">${up}</span>`;
            }
        } else {
            html += `<span class="hl-sep">${token}</span>`;
        }
    });

    highlightArea.innerHTML = html;
    updateArchiveDots(cleanCodes);

    // Logic: If list of valid airports changed
    if(cleanCodes.length !== lastValidCodeCount) {
        
        // If we ADDED a valid airport, move camera to it
        if(cleanCodes.length > lastValidCodeCount) {
            const newest = cleanCodes[cleanCodes.length-1];
            focusCameraOn(newest);
        }

        // Always update route immediately
        initRoute(cleanCodes);
        lastValidCodeCount = cleanCodes.length;
        
        // Update URL
        if(cleanCodes.length > 0) {
            history.replaceState(null, "", "#" + cleanCodes.join("-"));
        } else {
            history.replaceState(null, "", location.pathname);
        }
    }
    
    return cleanCodes;
}

inputArea.addEventListener("input", handleInput);
inputArea.addEventListener("scroll", () => {
    highlightArea.scrollTop = inputArea.scrollTop;
});

// --- LOGIC: ROUTE GENERATION ---
function resetRoute() {
    // Clear Lines
    for(let i = routeGroup.children.length - 1; i >= 0; i--) {
        const child = routeGroup.children[i];
        if(child !== progressDot) {
            routeGroup.remove(child);
            if(child.geometry) child.geometry.dispose();
        }
    }
    
    routePoints = [];
    routeLengths = [];
    totalDistance = 0;
    progressDot.visible = false;
    lastValidCodeCount = 0;
    
    inputArea.value = "";
    highlightArea.innerHTML = "";
    
    archiveGroup.clear();
    archiveDots.clear();

    document.getElementById("timeline-panel").style.display = "none";
    document.getElementById("stats-panel").style.display = "none";
    
    // Update Stats to 0
    updateStats(0);
    
    history.replaceState(null, "", location.pathname);
}

function initRoute(codes) {
    // 1. Clean previous lines (keep archive dots)
    for(let i = routeGroup.children.length - 1; i >= 0; i--) {
        const child = routeGroup.children[i];
        if(child !== progressDot) routeGroup.remove(child);
    }
    routePoints = [];
    routeLengths = [];
    totalDistance = 0;

    const validList = codes.filter(c => AIRPORTS[c]);
    
    if(validList.length < 2) {
        progressDot.visible = false;
        document.getElementById("timeline-panel").style.display = "none";
        document.getElementById("stats-panel").style.display = "none";
        updateStats(0);
        return; 
    }

    // 2. Build Route
    for(let i=0; i<validList.length-1; i++){
        const a = AIRPORTS[validList[i]];
        const b = AIRPORTS[validList[i+1]];
        
        const v1 = latLonToVec(a.lat, a.lon, GLOBE_RADIUS);
        const v2 = latLonToVec(b.lat, b.lon, GLOBE_RADIUS);
        
        const pts = greatCirclePoints(v1, v2);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        
        // Add Line (Now uses COLOR_THEME_BLUE)
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color: COLOR_THEME_BLUE}));
        routeGroup.add(line);
        
        const dist = v1.angleTo(v2) * 6371;
        routePoints.push(pts);
        routeLengths.push(dist);
        totalDistance += dist;
    }

    // 3. Finalize
    document.getElementById("timeline-panel").style.display = "block";
    document.getElementById("stats-panel").style.display = "block";
    
    // Reset Scrubber UI
    const scrubber = document.getElementById("scrubber");
    scrubber.value = 0;
    
    // Reset Stats
    updateStats(0);

    // Position Dot at start immediately
    if(routePoints.length > 0 && routePoints[0].length > 0) {
        progressDot.visible = true;
        progressDot.position.copy(routePoints[0][0]);
    }
}

document.getElementById("reset").onclick = resetRoute;

document.getElementById("share").onclick = () => {
    navigator.clipboard.writeText(location.href);
    const btn = document.getElementById("share");
    const orig = btn.innerText;
    btn.innerText = "COPIED TO CLIPBOARD";
    setTimeout(() => btn.innerText = orig, 2000);
};

// --- SCRUBBER LOGIC ---
document.getElementById("scrubber").oninput = e => {
    if(!totalDistance) return;
    let t = e.target.value / 1000;
    let d = t * totalDistance;
    
    // Update Stats Display
    updateStats(d);

    for(let i=0; i<routePoints.length; i++){
        if(d <= routeLengths[i]){
            const local = d / routeLengths[i];
            const idx = Math.floor(local * (routePoints[i].length - 1));
            if(routePoints[i][idx]) {
                progressDot.position.copy(routePoints[i][idx]);
            }
            break;
        }
        d -= routeLengths[i];
    }
};

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Camera Interpolation Logic
    if(targetCameraPos) {
        // Smoothly lerp current position to target
        camera.position.lerp(targetCameraPos, 0.05);
        
        // Stop interpolating if close enough
        if(camera.position.distanceTo(targetCameraPos) < 0.1) {
            targetCameraPos = null;
        }
    }

    // Dot Flash Effect
    archiveGroup.children.forEach(dot => {
        if(dot.userData.flash < 1) {
            dot.userData.flash += 0.05;
            const s = THREE.MathUtils.lerp(0.1, 1.0, dot.userData.flash);
            const scale = s + Math.sin(dot.userData.flash * Math.PI) * 0.5;
            dot.scale.setScalar(Math.max(0.1, scale));
        } else {
            dot.scale.setScalar(1);
        }
    });

    composer.