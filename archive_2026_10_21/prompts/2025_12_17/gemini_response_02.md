Here is the updated **Oscilloscope Earth** version.

I have removed Tailwind completely, reverted to the simpler "raw" HTML/CSS structure, and implemented the specific requests:
1.  **Title:** Kept as "Oscilloscope Earth".
2.  **Buttons:** Used your exact CSS styling.
3.  **Reveal Mode:** Locked to **Top-to-Bottom (North Pole)** only.
4.  **Themes:** Restricted to **TAC-OPS** and **ARCHIVE**.
5.  **Glitch:** Modified the logic to force "Wild Mode" during glitches, ensuring they are always the heavy, full-screen distortion type rather than small flickers.

Save this code as a single `.html` file.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Oscilloscope Earth</title>
    <style>
        body { 
            margin: 0; 
            overflow: hidden; 
            background-color: #000; 
            font-family: 'Courier New', Courier, monospace;
        }

        /* The CRT Monitor Overlay Effect */
        #crt-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            z-index: 10;
            background: 
                linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%);
            background-size: 100% 4px, 100% 100%;
        }

        #loading {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            color: #00ffaa;
            text-shadow: 0 0 10px #00ffaa;
            font-size: 1.2rem;
            z-index: 5;
            text-align: center;
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
            outline: none;
        }

        .hud-btn:hover {
            background: rgba(0, 255, 170, 0.1); /* JS will override color but this is fallback */
            box-shadow: 0 0 10px currentColor;
        }

        .hud-btn:active {
            transform: translateY(2px);
        }

        /* Positioning */
        #btn-zoom {
            bottom: 30px;
            left: 30px;
        }

        #btn-theme {
            bottom: 30px;
            right: 170px; /* Positioned to the left of Restart */
        }

        #btn-restart {
            bottom: 30px;
            right: 30px;
        }

        /* Optional: Data readout styling */
        #data-readout {
            position: absolute;
            top: 30px;
            left: 30px;
            color: currentColor; /* Inherits from body */
            font-size: 12px;
            opacity: 0.7;
            pointer-events: none;
            z-index: 5;
            border-left: 2px solid currentColor;
            padding-left: 10px;
        }

    </style>

    <!-- Import Map -->
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
    
    <div id="loading">INITIALIZING UPLINK...<br><span style="font-size:0.8em; opacity:0.7">ESTABLISHING CONNECTION</span></div>

    <!-- UI Elements -->
    <div id="data-readout" style="display:none;">
        SYS: ONLINE<br>
        TGT: GLOBAL<br>
        LAT: <span id="lat-val">00.00</span>
    </div>

    <button id="btn-zoom" class="hud-btn">ZOOM: STD</button>
    <button id="btn-theme" class="hud-btn">THEME: TAC-OPS</button>
    <button id="btn-restart" class="hud-btn">INIT REVEAL</button>

    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';

        // --- CONFIGURATION ---
        const GLOBE_RADIUS = 20;
        
        // Themes
        const themes = [
            {
                name: "TAC-OPS", 
                color: 0x00ffaa, // Classic Green
                bg: 0x000000,
                bloomStrength: 1.2,
                uiColor: '#00ffaa'
            },
            {
                name: "ARCHIVE", 
                color: 0x88ccff, // Washed Blue
                bg: 0x05101a,
                bloomStrength: 2.8, // Heavy bloom for fuzziness
                uiColor: '#88ccff'
            }
        ];
        let currentThemeIndex = 0;

        // Zoom Settings
        const zoomLevels = [70, 40, 110]; // Std, Close, Far
        const zoomLabels = ["STD", "NEAR", "FAR"];
        let currentZoomIndex = 0;
        let targetCamZ = 70;

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.02);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 70;
        camera.position.y = 20;

        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;

        // --- POST-PROCESSING ---
        const composer = new EffectComposer(renderer);
        
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.radius = 0.5;
        composer.addPass(bloomPass);

        const glitchPass = new GlitchPass();
        glitchPass.enabled = false; 
        glitchPass.goWild = false;
        composer.addPass(glitchPass);

        // --- GLOBAL REFERENCES ---
        let globeMesh;
        let coreMesh;
        let revealProgress = 0.0;
        let isOpening = true;

        // --- DATA LOADING ---
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_coastline.geojson')
            .then(res => res.json())
            .then(data => {
                createHologramGlobe(data);
                applyTheme(0); // Init Theme
                document.getElementById('loading').style.display = 'none';
                document.getElementById('data-readout').style.display = 'block';
                document.body.style.color = themes[0].uiColor; // Init Text Color
            })
            .catch(err => {
                document.getElementById('loading').innerText = "DATA CORRUPTION.";
                console.error(err);
            });

        // --- GEOMETRY & SHADER ---

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
                        const p1 = line[i];
                        const p2 = line[i+1];
                        const v1 = latLonToVector3(p1[1], p1[0], GLOBE_RADIUS);
                        const v2 = latLonToVector3(p2[1], p2[0], GLOBE_RADIUS);
                        points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
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

                        // TOP TO BOTTOM REVEAL LOGIC
                        // Y = +Radius (Top) -> Y = -Radius (Bottom)
                        // We map this range to 0.0 -> 1.0
                        
                        float pct = (uGlobeRadius - position.y) / (2.0 * uGlobeRadius);
                        
                        // uReveal goes 0->1. 
                        // If pct < uReveal, show vertex.
                        // Smoothstep creates the trailing fade edge.
                        vVisible = smoothstep(uReveal, uReveal - 0.15, pct);
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

            // Core sphere
            const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            coreMesh = new THREE.Mesh(coreGeo, coreMat);
            scene.add(coreMesh);
        }

        // --- BUTTON HANDLERS ---

        // 1. RESTART (And force top-down)
        document.getElementById('btn-restart').addEventListener('click', () => {
            revealProgress = 0.0;
            isOpening = true;
        });

        // 2. ZOOM TOGGLE
        document.getElementById('btn-zoom').addEventListener('click', () => {
            currentZoomIndex = (currentZoomIndex + 1) % zoomLevels.length;
            targetCamZ = zoomLevels[currentZoomIndex];
            document.getElementById('btn-zoom').innerText = "ZOOM: " + zoomLabels[currentZoomIndex];
        });

        // 3. THEME TOGGLE
        document.getElementById('btn-theme').addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            applyTheme(currentThemeIndex);
        });

        function applyTheme(idx) {
            const t = themes[idx];
            
            // UI
            document.getElementById('btn-theme').innerText = "THEME: " + t.name;
            document.body.style.color = t.uiColor;
            document.getElementById('loading').style.color = t.uiColor;
            document.getElementById('loading').style.textShadow = `0 0 10px ${t.uiColor}`;
            
            // Buttons color override
            document.querySelectorAll('.hud-btn').forEach(btn => {
                btn.style.color = t.uiColor;
                // We change the box shadow via JS or rely on currentColor CSS
            });

            // Scene
            scene.background = new THREE.Color(t.bg);
            scene.fog.color.setHex(t.bg);
            if(coreMesh) coreMesh.material.color.setHex(t.bg);
            if(globeMesh) globeMesh.material.uniforms.color.value.setHex(t.color);
            bloomPass.strength = t.bloomStrength;
        }

        // --- GLITCH LOGIC (Forced Wild) ---
        let glitchTimer = 0;
        let nextGlitchTime = 200; // Frames
        let glitchDuration = 0;
        let isGlitching = false;

        function updateGlitch() {
            glitchTimer++;

            if (!isGlitching && glitchTimer > nextGlitchTime) {
                // START GLITCH
                isGlitching = true;
                glitchPass.enabled = true;
                // FORCE WILD: This ensures big tearing effects
                glitchPass.goWild = true; 
                
                // Short duration for wild glitch (5-15 frames)
                glitchDuration = Math.random() * 10 + 5; 
                glitchTimer = 0;
            } 
            else if (isGlitching) {
                if (glitchTimer > glitchDuration) {
                    // STOP GLITCH
                    isGlitching = false;
                    glitchPass.enabled = false;
                    glitchPass.goWild = false;
                    
                    glitchTimer = 0;
                    // Random time until next glitch (100 - 400 frames)
                    nextGlitchTime = Math.random() * 300 + 100;
                }
            }
        }

        // --- ANIMATION LOOP ---

        function animate() {
            requestAnimationFrame(animate);

            controls.update();
            updateGlitch();

            // Reveal Animation
            if (globeMesh && isOpening) {
                revealProgress += 0.008; // Speed
                globeMesh.material.uniforms.uReveal.value = revealProgress;
                if (revealProgress >= 1.2) isOpening = false;
            }

            // Smooth Zoom
            if (Math.abs(camera.position.z - targetCamZ) > 0.1) {
                camera.position.z += (targetCamZ - camera.position.z) * 0.05;
            }

            // Random Data Flavor
            if(Math.random() > 0.9) {
               document.getElementById('lat-val').innerText = (Math.random()*180-90).toFixed(2);
            }

            composer.render();
        }

        // Resize
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