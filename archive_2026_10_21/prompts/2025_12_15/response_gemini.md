This is a great direction. You are moving from "displaying data" to "designing an experience."

Here is the updated, single-file solution. I have refactored it to be more modular so you can see exactly where the **Zoom**, **Physics**, and **Colors** are handled.

### Key Changes Explained

1.  **The Camera/Zoom (`camera.position.z`)**:
    *   In 3D, "Zoom" is often just moving the camera closer or further away.
    *   I added a `targetZoom` variable. The animation loop smoothly slides the camera to this value.
    *   **Mobile Fix:** I added a snippet that detects if the screen is portrait (tall/narrow). If so, it pushes the camera back further by default so the globe fits comfortably.

2.  **Physics (Momentum)**:
    *   I disabled `autoRotate`.
    *   I kept `enableDamping = true`. This creates the friction. If you "throw" the globe with your mouse/finger, `OrbitControls` automatically calculates the momentum and slows it down gradually.

3.  **Color Themes & Light Mode**:
    *   I created a `themes` array.
    *   **Light Mode Challenge:** "Holograms" (additive light) don't work on white backgrounds (because adding light to white just stays white).
    *   **The Fix:** When switching to the "Light Mode" (Blueprint style), I drastically reduce the "Bloom" (glow) strength and switch the line blending mode so dark lines appear on the light background.

### The Code

Save this as `index.html`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Global Defense Network</title>
    <style>
        body { 
            margin: 0; 
            overflow: hidden; 
            background-color: #000; 
            font-family: 'Courier New', Courier, monospace;
            user-select: none; /* Prevent text selection while dragging */
        }

        /* --- UI OVERLAY --- */
        #crt-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            z-index: 10;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
            background-size: 100% 4px;
        }
        
        /* Vignette specifically */
        #vignette {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            z-index: 11;
            background: radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%);
        }

        /* --- CONTROLS --- */
        .hud-btn {
            position: absolute;
            z-index: 20;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid currentColor;
            color: #00ffaa; /* Default color, updated by JS */
            padding: 10px 15px;
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            backdrop-filter: blur(2px);
            transition: all 0.2s;
        }

        .hud-btn:hover {
            background: rgba(0, 255, 170, 0.1);
            box-shadow: 0 0 10px currentColor;
        }

        .hud-btn:active {
            transform: translateY(2px);
        }

        #btn-zoom { bottom: 30px; left: 30px; }
        #btn-theme { bottom: 30px; right: 30px; }

        #loading {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            color: #00ffaa;
            z-index: 5;
        }
    </style>

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

    <div id="crt-overlay"></div>
    <div id="vignette"></div>
    <div id="loading">ESTABLISHING UPLINK...</div>

    <!-- CONTROLS -->
    <button id="btn-zoom" class="hud-btn">ZOOM: MED</button>
    <button id="btn-theme" class="hud-btn">MODE: TAC-OPS</button>

    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

        // --- CONFIGURATION ---
        const GLOBE_RADIUS = 20;
        
        // --- THEMES ---
        const themes = [
            {
                name: "TAC-OPS", // Classic Green
                color: 0x00ffaa,
                bg: 0x000000,
                bloomStrength: 1.2,
                blending: THREE.AdditiveBlending
            },
            {
                name: "RED-ALERT", // Red
                color: 0xff3333,
                bg: 0x1a0000,
                bloomStrength: 1.5,
                blending: THREE.AdditiveBlending
            },
            {
                name: "ARCHIVE", // Washed out blue (Film style)
                color: 0x88ccff,
                bg: 0x05101a,
                bloomStrength: 2.0, // Very high bloom for that "washed out" fuzzy look
                blending: THREE.AdditiveBlending
            },
            {
                name: "BLUEPRINT", // Light Mode
                color: 0x003366, // Dark Blue lines
                bg: 0xe0e6ed,    // Off-white paper background
                bloomStrength: 0.0, // No glow on light mode
                blending: THREE.NormalBlending // Normal mixing so dark lines show on light bg
            }
        ];

        let currentThemeIndex = 0;

        // --- ZOOM SETTINGS ---
        // We define 3 distances. 
        // Note: We multiply these by a factor for mobile in the init function.
        const zoomLevels = [
            { label: "CLOSE", dist: 40 },
            { label: "MED", dist: 70 },
            { label: "ORBIT", dist: 110 }
        ];
        let currentZoomIndex = 1; // Start at Medium
        let targetCameraZ = zoomLevels[1].dist; 

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.02);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.y = 20;
        // Initial Z set via logic below

        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // --- CONTROLS (PHYSICS) ---
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; 
        controls.dampingFactor = 0.05; // Friction: Lower = slippery, Higher = stops fast
        controls.rotateSpeed = 0.6;
        controls.autoRotate = false; // DISABLED: We want user momentum only
        controls.enablePan = false;  // Keep globe centered

        // --- POST-PROCESSING ---
        const renderScene = new RenderPass(scene, camera);
        
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.5;

        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        // --- MOBILE ADJUSTMENT ---
        // If screen is taller than wide (Portrait), push camera back
        const isPortrait = window.innerHeight > window.innerWidth;
        const mobileModifier = isPortrait ? 1.5 : 1.0;
        
        // Apply modifier to zoom levels
        zoomLevels.forEach(z => z.dist *= mobileModifier);
        targetCameraZ = zoomLevels[currentZoomIndex].dist;
        camera.position.z = targetCameraZ; // Set initial immediately

        // --- GLOBE CREATION ---
        let globeMesh; // Reference to animate uniforms

        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_coastline.geojson')
            .then(res => res.json())
            .then(data => {
                createHologramGlobe(data);
                document.getElementById('loading').style.display = 'none';
            });

        function latLonToVector3(lat, lon, radius) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(radius * Math.sin(phi) * Math.cos(theta));
            const z = (radius * Math.sin(phi) * Math.sin(theta));
            const y = (radius * Math.cos(phi));
            return new THREE.Vector3(x, y, z);
        }

        function createHologramGlobe(geoJson) {
            const points = [];
            
            geoJson.features.forEach(feature => {
                const type = feature.geometry.type;
                let coordsList = type === 'LineString' ? [feature.geometry.coordinates] : feature.geometry.coordinates;

                coordsList.forEach(line => {
                    for (let i = 0; i < line.length - 1; i++) {
                        const v1 = latLonToVector3(line[i][1], line[i][0], GLOBE_RADIUS);
                        const v2 = latLonToVector3(line[i+1][1], line[i+1][0], GLOBE_RADIUS);
                        points.push(v1.x, v1.y, v1.z);
                        points.push(v2.x, v2.y, v2.z);
                    }
                });
            });

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(themes[0].color) },
                    uReveal: { value: 0.0 },
                    uGlobeRadius: { value: GLOBE_RADIUS }
                },
                vertexShader: `
                    uniform float uReveal;
                    uniform float uGlobeRadius;
                    varying float vVisible;
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                        float heightPct = abs(position.y) / uGlobeRadius;
                        vVisible = smoothstep(uReveal, uReveal - 0.1, heightPct);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    varying float vVisible;
                    void main() {
                        if (vVisible <= 0.01) discard;
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
                transparent: true,
                depthTest: false,
                blending: THREE.AdditiveBlending
            });

            globeMesh = new THREE.LineSegments(geometry, material);
            scene.add(globeMesh);

            // Add faint core sphere to block view slightly
            const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.99, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            scene.add(new THREE.Mesh(coreGeo, coreMat));
            
            applyTheme(0); // Apply initial theme colors
        }

        // --- INTERACTION LOGIC ---

        function updateZoom() {
            // Cycle zoom level
            currentZoomIndex = (currentZoomIndex + 1) % zoomLevels.length;
            const level = zoomLevels[currentZoomIndex];
            
            // Set target (animation loop handles the smoothing)
            targetCameraZ = level.dist;
            
            // Update Button Text
            document.getElementById('btn-zoom').innerText = `ZOOM: ${level.label}`;
        }

        function updateTheme() {
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            applyTheme(currentThemeIndex);
        }

        function applyTheme(index) {
            const theme = themes[index];
            
            // 1. Update UI Button Text & Color
            const btnColor = '#' + theme.color.toString(16).padStart(6, '0');
            const btns = document.querySelectorAll('.hud-btn');
            btns.forEach(b => {
                b.style.color = btnColor;
                b.style.boxShadow = 'none'; 
            });
            document.getElementById('btn-theme').innerText = `MODE: ${theme.name}`;
            document.getElementById('loading').style.color = btnColor;

            // 2. Update Scene Background & Fog
            scene.background = new THREE.Color(theme.bg);
            scene.fog.color = new THREE.Color(theme.bg);
            
            // 3. Update Globe Material
            if (globeMesh) {
                globeMesh.material.uniforms.color.value.setHex(theme.color);
                globeMesh.material.blending = theme.blending;
                globeMesh.material.needsUpdate = true;
            }

            // 4. Update Post-Processing (Bloom)
            bloomPass.strength = theme.bloomStrength;

            // 5. Special case for Light Mode: Vignette should be inverted or subtle?
            // For now we just keep the dark vignette as it adds contrast, 
            // but for "Blueprint" we might want the core sphere to be white, not black.
            const core = scene.children.find(c => c.type === 'Mesh');
            if(core) {
                // If Light mode, core should be same as BG so lines look drawn on paper
                core.material.color.setHex(theme.bg); 
            }
        }

        // Attach listeners
        document.getElementById('btn-zoom').addEventListener('click', updateZoom);
        document.getElementById('btn-theme').addEventListener('click', updateTheme);


        // --- ANIMATION LOOP ---
        let revealProgress = 0.0;
        let isOpening = true;

        function animate() {
            requestAnimationFrame(animate);

            // 1. Physics & Controls
            controls.update();

            // 2. Smooth Zoom Animation
            // Smoothly interpolate current Z towards target Z
            // 0.05 is the speed factor (lower is slower/smoother)
            camera.position.z += (targetCameraZ - camera.position.z) * 0.05;

            // 3. Reveal Animation
            if (globeMesh && isOpening) {
                revealProgress += 0.005;
                globeMesh.material.uniforms.uReveal.value = revealProgress;
                if (revealProgress >= 1.2) isOpening = false;
            }

            composer.render();
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        });

        animate();
    </script>
</body>
</html>
```