/**
 * CartoJam: The Human Topography of France
 * Core 3D Visualization & Application Engine
 */

(function () {
  'use strict';

  // --- 1. Pure Spatial & Demographic Functions ---
  const CENTER_LON = 2.5;
  const CENTER_LAT = 46.5;
  const SCENE_SCALE = 5.5; // Scene coordinate scale factor calibrated for full-country viewport

  function projectLonLat(lon, lat) {
    const rad = Math.PI / 180;
    const x = (lon - CENTER_LON) * Math.cos(CENTER_LAT * rad) * SCENE_SCALE || 0;
    const z = -(lat - CENTER_LAT) * SCENE_SCALE || 0;
    return { x, z };
  }

  function unprojectXZ(x, z) {
    const rad = Math.PI / 180;
    const lat = CENTER_LAT - (z / SCENE_SCALE);
    const lon = CENTER_LON + (x / (Math.cos(CENTER_LAT * rad) * SCENE_SCALE));
    return { lon, lat };
  }

  function formatNumberFr(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  // --- 2. State & Settings ---
  const state = {
    regionScale: 1.0,
    deptScale: 1.0,
    elevationMultiplier: 1.0,
    showCapitals: true,
    showWireframe: true,
    currentLayer: 'hologram', // 'hologram' | 'topo' | 'satellite'
    is2D: false,
    selectedDeptCode: '75', // Paris default
    hoveredDeptCode: null,
    animation: {
      active: true,
      startTime: 0,
      duration: 2500, // ms
      progress: 0
    }
  };

  // Pre-calculate regional & departmental stats
  const departmentsData = window.DEPARTMENTS_DATA || {};
  const regionsData = window.REGIONS_DATA || [];
  const regionsMap = {};
  regionsData.forEach(r => { regionsMap[r.id] = r; });

  let totalNationalPop = 0;
  let maxDeptPop = 0;
  let maxRegionPop = 0;

  Object.values(departmentsData).forEach(d => {
    totalNationalPop += d.pop;
    if (d.pop > maxDeptPop) maxDeptPop = d.pop;
  });

  regionsData.forEach(r => {
    if (r.population > maxRegionPop) maxRegionPop = r.population;
  });

  // Base extrusion metrics (in scene units calibrated for SCENE_SCALE = 5.5)
  const BASE_REGION_HEIGHT = 1.6;
  const BASE_DEPT_HEIGHT = 3.8;

  // Software WebGL Detection for headless/low-end systems
  const isSoftwareGl = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch (e) {
      return true;
    }
  })();

  // --- 3. Three.js Scene Setup ---
  const container = document.getElementById('three-canvas-container');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050a0f);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Set optimal camera framing for mainland France + Corsica
  function applyOptimalCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1.0) {
      camera.position.set(-1.0, 96, 78);
    } else {
      camera.position.set(-1.0, 52, 42);
    }
    camera.lookAt(-1.0, 0, 1.5);
  }
  applyOptimalCamera();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: true
  });
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 6;
  controls.maxDistance = 180;
  controls.target.set(-1.0, 0, 1.5);
  controls.update();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
  keyLight.position.set(25, 45, 25);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
  fillLight.position.set(-30, 25, -20);
  scene.add(fillLight);

  const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 0.35);
  scene.add(hemiLight);

  // --- 4. WarGames Hologram Base Layer (100% Offline Pure Three.js) ---
  const hologramGroup = new THREE.Group();
  scene.add(hologramGroup);

  // 1980s Retro Glowing Vector Grid
  const gridHelper = new THREE.GridHelper(90, 45, 0x2dd4bf, 0x11293b);
  gridHelper.position.set(-1.0, -0.05, 1.5);
  hologramGroup.add(gridHelper);

  // Radar concentric rings
  [12, 24, 36, 48].forEach(r => {
    const ringGeo = new THREE.RingGeometry(r - 0.04, r, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(-1.0, -0.04, 1.5);
    hologramGroup.add(ringMesh);
  });

  // Crosshairs & Coordinate ticks
  const crosshairMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
  const crosshairGeo = new THREE.BufferGeometry();
  const crosshairPts = new Float32Array([
    -45, -0.03, 1.5, 45, -0.03, 1.5,
    -1.0, -0.03, -45, -1.0, -0.03, 45
  ]);
  crosshairGeo.setAttribute('position', new THREE.BufferAttribute(crosshairPts, 3));
  hologramGroup.add(new THREE.LineSegments(crosshairGeo, crosshairMat));

  // --- 5. MapLibre GL JS Synchronization ---
  let maplibreMap = null;
  const maplibreEl = document.getElementById('maplibre-container');

  function initMapLibre() {
    if (typeof maplibregl === 'undefined') return;
    try {
      maplibreMap = new maplibregl.Map({
        container: 'maplibre-container',
        style: {
          version: 8,
          sources: {
            'topo-tiles': {
              type: 'raster',
              tiles: ['https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'],
              tileSize: 256,
              maxzoom: 18,
              attribution: '&copy; Carto, OSM'
            },
            'sat-tiles': {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              maxzoom: 18,
              attribution: '&copy; Esri World Imagery'
            }
          },
          layers: [
            {
              id: 'layer-topo',
              type: 'raster',
              source: 'topo-tiles',
              minzoom: 0,
              maxzoom: 22,
              layout: { visibility: 'none' }
            },
            {
              id: 'layer-sat',
              type: 'raster',
              source: 'sat-tiles',
              minzoom: 0,
              maxzoom: 22,
              layout: { visibility: 'none' }
            }
          ]
        },
        center: [CENTER_LON, CENTER_LAT],
        zoom: 5.5,
        maxZoom: 22,
        interactive: false,
        attributionControl: false
      });
    } catch (e) {
      console.warn('MapLibre init fallback:', e);
    }
  }

  function syncMapLibreCamera() {
    if (!maplibreMap || state.currentLayer === 'hologram') return;

    // Convert controls.target (x, z) to [lon, lat]
    const targetGeo = unprojectXZ(controls.target.x, controls.target.z);
    
    // Compute distance and pitch from camera
    const dist = camera.position.distanceTo(controls.target);
    const zoom = Math.max(3, Math.min(16, 12.8 - Math.log2(dist / 4)));
    
    const polarAngle = controls.getPolarAngle();
    const pitch = Math.min(60, (polarAngle / (Math.PI / 2)) * 60);

    const azimuthAngle = controls.getAzimuthalAngle();
    const bearing = -(azimuthAngle * 180 / Math.PI);

    maplibreMap.jumpTo({
      center: [targetGeo.lon, targetGeo.lat],
      zoom: zoom,
      pitch: pitch,
      bearing: bearing
    });
  }

  function setBaseMapLayer(layerName) {
    state.currentLayer = layerName;
    document.querySelectorAll('.layer-option').forEach(el => {
      el.classList.toggle('active', el.dataset.layer === layerName);
    });

    if (layerName === 'hologram') {
      scene.background = new THREE.Color(0x050a0f);
      hologramGroup.visible = true;
      if (maplibreEl) maplibreEl.classList.remove('active');
      if (maplibreMap) {
        if (maplibreMap.getLayer('layer-topo')) maplibreMap.setLayoutProperty('layer-topo', 'visibility', 'none');
        if (maplibreMap.getLayer('layer-sat')) maplibreMap.setLayoutProperty('layer-sat', 'visibility', 'none');
      }
    } else {
      scene.background = null; // Transparent to reveal MapLibre
      hologramGroup.visible = false;
      if (maplibreEl) maplibreEl.classList.add('active');
      if (maplibreMap) {
        if (maplibreMap.getLayer('layer-topo')) {
          maplibreMap.setLayoutProperty('layer-topo', 'visibility', layerName === 'topo' ? 'visible' : 'none');
        }
        if (maplibreMap.getLayer('layer-sat')) {
          maplibreMap.setLayoutProperty('layer-sat', 'visibility', layerName === 'satellite' ? 'visible' : 'none');
        }
        syncMapLibreCamera();
      }
    }
  }

  // --- 6. 3D Department Meshes & Two-Tier Extrusion Structure ---
  const departmentsGroup = new THREE.Group();
  scene.add(departmentsGroup);

  const departmentMeshes = {}; // code -> { pedestalMesh, deptMesh, wireframe, pinMesh, targetHReg, targetHDept, ... }
  const interactivePickList = [];
  const capitalsPinsGroup = new THREE.Group();
  scene.add(capitalsPinsGroup);

  function buildDepartmentGeometry(feature) {
    const code = feature.properties.code;
    const info = departmentsData[code] || {
      nom: feature.properties.nom,
      reg: '11',
      pop: 500000,
      area: 5000,
      pref: 'Capital',
      coords: [CENTER_LON, CENTER_LAT],
      regionName: 'France',
      regionColor: '#38bdf8'
    };

    const region = regionsMap[info.reg] || { population: maxRegionPop, color: '#38bdf8' };

    // Calculate Target Heights
    const regionRatio = Math.max(0.08, region.population / maxRegionPop);
    const targetHReg = regionRatio * BASE_REGION_HEIGHT;

    const deptRatio = Math.max(0.05, info.pop / maxDeptPop);
    const targetHDept = deptRatio * BASE_DEPT_HEIGHT;

    // Modulate department top color by population density
    const density = Math.round(info.pop / (info.area || 1000));
    const densityFactor = Math.min(35, Math.max(-20, (density - 100) / 10));
    const modulatedColor = adjustBrightness(region.color || '#38bdf8', densityFactor);

    // Convert GeoJSON geometry to THREE.Shape
    const shapes = [];
    const geomType = feature.geometry.type;
    const coordsList = geomType === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;

    coordsList.forEach(polyCoords => {
      if (!polyCoords || polyCoords.length === 0) return;
      const outerRing = polyCoords[0];
      if (!outerRing || outerRing.length < 3) return;

      const shape = new THREE.Shape();
      const p0 = projectLonLat(outerRing[0][0], outerRing[0][1]);
      shape.moveTo(p0.x, -p0.z);

      for (let i = 1; i < outerRing.length; i++) {
        const pt = projectLonLat(outerRing[i][0], outerRing[i][1]);
        shape.lineTo(pt.x, -pt.z);
      }

      // Handle Holes
      for (let h = 1; h < polyCoords.length; h++) {
        const holeRing = polyCoords[h];
        if (holeRing.length < 3) continue;
        const holePath = new THREE.Path();
        const hp0 = projectLonLat(holeRing[0][0], holeRing[0][1]);
        holePath.moveTo(hp0.x, -hp0.z);
        for (let j = 1; j < holeRing.length; j++) {
          const hpt = projectLonLat(holeRing[j][0], holeRing[j][1]);
          holePath.lineTo(hpt.x, -hpt.z);
        }
        shape.holes.push(holePath);
      }

      shapes.push(shape);
    });

    if (shapes.length === 0) return;

    // Extrude 1 unit depth; we scale Y dynamically in real time
    const extrudeSettings = {
      depth: 1,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);

    // 1. Regional Foundation Pedestal Mesh (Deep Tinted Foundation)
    const pedestalColor = new THREE.Color(region.color).multiplyScalar(0.38);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: pedestalColor,
      roughness: 0.75,
      metalness: 0.15
    });
    const pedestalMesh = new THREE.Mesh(geometry, pedestalMat);
    pedestalMesh.rotation.x = -Math.PI / 2;
    pedestalMesh.scale.set(1, 1, 0.001); // Initial flat
    pedestalMesh.position.set(0, 0, 0);
    departmentsGroup.add(pedestalMesh);

    // Subtle edge for pedestal
    const pedestalEdgesGeo = new THREE.EdgesGeometry(geometry, 35);
    const pedestalWireMat = new THREE.LineBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.6
    });
    const pedestalWireframe = new THREE.LineSegments(pedestalEdgesGeo, pedestalWireMat);
    pedestalMesh.add(pedestalWireframe);

    // 2. Department Top Jigsaw Mesh (Vibrant Density-Modulated Top)
    const deptMat = new THREE.MeshStandardMaterial({
      color: modulatedColor,
      roughness: 0.28,
      metalness: 0.25
    });
    const deptMesh = new THREE.Mesh(geometry, deptMat);
    deptMesh.rotation.x = -Math.PI / 2;
    deptMesh.scale.set(1, 1, 0.001); // Initial flat
    deptMesh.position.set(0, 0.001, 0);
    deptMesh.userData = { code, info, region };
    departmentsGroup.add(deptMesh);
    interactivePickList.push(deptMesh);

    // 3. Crisp Glowing Wireframe Edges
    const edgesGeo = new THREE.EdgesGeometry(geometry, 28);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.9
    });
    const wireframe = new THREE.LineSegments(edgesGeo, wireframeMat);
    deptMesh.add(wireframe);

    // 4. Prefecture 3D Capital Marker Pin (Luminous Glowing Pin)
    const prefCoords = info.coords || [CENTER_LON, CENTER_LAT];
    const pinProj = projectLonLat(prefCoords[0], prefCoords[1]);

    const pinGroup = new THREE.Group();
    pinGroup.position.set(pinProj.x, 0.001, pinProj.z);

    const pinHeadGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const pinHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.4
    });
    const pinHead = new THREE.Mesh(pinHeadGeo, pinHeadMat);
    pinHead.position.y = 0.28;
    pinGroup.add(pinHead);

    const pinStalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8);
    const pinStalkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pinStalk = new THREE.Mesh(pinStalkGeo, pinStalkMat);
    pinStalk.position.y = 0.14;
    pinGroup.add(pinStalk);

    const pinBaseGeo = new THREE.RingGeometry(0.04, 0.1, 16);
    const pinBaseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const pinBase = new THREE.Mesh(pinBaseGeo, pinBaseMat);
    pinBase.rotation.x = -Math.PI / 2;
    pinBase.position.y = 0.01;
    pinGroup.add(pinBase);

    capitalsPinsGroup.add(pinGroup);

    departmentMeshes[code] = {
      code,
      info,
      region,
      geometry,
      pedestalMesh,
      deptMesh,
      wireframe,
      pinGroup,
      targetHReg,
      targetHDept,
      deptMat,
      baseColor: new THREE.Color(modulatedColor)
    };
  }

  // Populate France departments
  function loadAndBuildFrance() {
    // Check if embedded geojson or fetch
    if (window.EMBEDDED_GEOJSON && window.EMBEDDED_GEOJSON.features) {
      window.EMBEDDED_GEOJSON.features.forEach(buildDepartmentGeometry);
      replayAnimation();
    } else {
      fetch('france-departments.geojson')
        .then(r => r.json())
        .then(data => {
          data.features.forEach(buildDepartmentGeometry);
          replayAnimation();
        })
        .catch(err => {
          console.error('GeoJSON loading error:', err);
        });
    }
  }

  // --- 7. Two-Tier Animation System ---
  function replayAnimation() {
    state.animation.active = true;
    state.animation.startTime = performance.now();
    state.animation.progress = 0;
  }

  function updateDepartmentHeights(animProgress) {
    const mult = state.elevationMultiplier;
    const rScale = state.regionScale * mult;
    const dScale = state.deptScale * mult;

    // Stage 1 (0 -> 0.45): Region pedestals rise
    // Stage 2 (0.45 -> 1.0): Department tops extrude upwards on top of pedestals
    let tReg = 1.0;
    let tDept = 1.0;

    if (state.animation.active) {
      if (animProgress <= 0.45) {
        const p = animProgress / 0.45;
        tReg = 0.5 - 0.5 * Math.cos(p * Math.PI); // easeInOut
        tDept = 0.001;
      } else {
        tReg = 1.0;
        const p = (animProgress - 0.45) / 0.55;
        tDept = 0.5 - 0.5 * Math.cos(p * Math.PI); // easeInOut
      }
    }

    Object.values(departmentMeshes).forEach(d => {
      const hReg = Math.max(0.01, d.targetHReg * rScale * tReg);
      const hDept = Math.max(0.01, d.targetHDept * dScale * tDept);

      // Scale pedestal along Z (extruded along local Z, which is rotated to world Y)
      d.pedestalMesh.scale.z = hReg;
      d.pedestalMesh.position.y = 0;

      // Department sits on top of pedestal
      d.deptMesh.position.y = hReg;
      d.deptMesh.scale.z = hDept;

      // Pin sits at the summit
      d.pinGroup.position.y = hReg + hDept;

      // Visibility toggles
      d.wireframe.visible = state.showWireframe;
      d.pinGroup.visible = state.showCapitals;
    });
  }

  // --- 8. Raycasting & Interactive HUD Inspector ---
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tooltip = document.getElementById('capitals-tooltip');

  function updateInspectorHUD(code) {
    const d = departmentsData[code];
    if (!d) return;

    document.getElementById('hud-dept-code').textContent = code;
    document.getElementById('hud-dept-name').textContent = d.nom;
    document.getElementById('hud-dept-pref').textContent = d.pref;
    document.getElementById('hud-dept-pop').textContent = formatNumberFr(d.pop);

    const nationalPct = ((d.pop / totalNationalPop) * 100).toFixed(2);
    document.getElementById('hud-dept-pct').textContent = nationalPct + '%';

    const density = Math.round(d.pop / (d.area || 1000));
    document.getElementById('hud-dept-density').textContent = formatNumberFr(density) + ' hab/km²';

    const reg = regionsMap[d.reg] || { name: 'France', color: '#38bdf8', population: 0 };
    document.getElementById('hud-region-name').textContent = reg.name;
    document.getElementById('hud-region-pop').textContent = formatNumberFr(reg.population) + ' hab.';

    const swatch = document.getElementById('hud-region-swatch');
    if (swatch) swatch.style.backgroundColor = reg.color;
  }

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactivePickList, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const code = hit.userData.code;
      if (state.hoveredDeptCode !== code) {
        // Reset old hover
        if (state.hoveredDeptCode && departmentMeshes[state.hoveredDeptCode]) {
          const old = departmentMeshes[state.hoveredDeptCode];
          if (old.code !== state.selectedDeptCode) {
            old.deptMat.emissive.setHex(0x000000);
          }
        }
        state.hoveredDeptCode = code;
        hit.material.emissive.setHex(0x38bdf8);
        hit.material.emissiveIntensity = 0.35;
        updateInspectorHUD(code);
      }

      // Position tooltip for prefecture
      const info = hit.userData.info;
      if (info && tooltip) {
        tooltip.textContent = `${info.nom} (${code}) — Préfecture: ${info.pref}`;
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY - 14}px`;
        tooltip.style.display = 'block';
      }
    } else {
      if (state.hoveredDeptCode) {
        const old = departmentMeshes[state.hoveredDeptCode];
        if (old && old.code !== state.selectedDeptCode) {
          old.deptMat.emissive.setHex(0x000000);
        }
        state.hoveredDeptCode = null;
        if (tooltip) tooltip.style.display = 'none';
        updateInspectorHUD(state.selectedDeptCode);
      }
    }
  }

  function onPointerClick(e) {
    if (state.hoveredDeptCode) {
      // Highlight selected
      if (state.selectedDeptCode && departmentMeshes[state.selectedDeptCode]) {
        departmentMeshes[state.selectedDeptCode].deptMat.emissive.setHex(0x000000);
      }
      state.selectedDeptCode = state.hoveredDeptCode;
      const curr = departmentMeshes[state.selectedDeptCode];
      if (curr) {
        curr.deptMat.emissive.setHex(0x2dd4bf);
        curr.deptMat.emissiveIntensity = 0.5;
        updateInspectorHUD(state.selectedDeptCode);
      }
    }
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('click', onPointerClick);

  // Inspector Collapse / Expand Toggle
  const btnToggleInspector = document.getElementById('btn-toggle-inspector');
  const inspectorStatsBody = document.getElementById('inspector-stats-body');
  const inspectorChevron = document.getElementById('inspector-chevron');
  let inspectorCollapsed = false;

  btnToggleInspector?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('inspector-card')?.classList.toggle('collapsed');
  });

  // --- 9. Navigation & Camera Controls ---
  const compassIcon = document.getElementById('compass-icon');
  const scaleText = document.getElementById('scale-text');

  function updateNavigationUI() {
    // 1. Compass rotation
    if (compassIcon) {
      const azimuth = controls.getAzimuthalAngle();
      const deg = -(azimuth * 180 / Math.PI);
      compassIcon.style.transform = `rotate(${deg}deg)`;
    }

    // 2. Dynamic Distance Scale Bar
    if (scaleText) {
      const dist = camera.position.distanceTo(controls.target);
      const km = Math.round(dist * 18.5);
      scaleText.textContent = `${km} km`;
    }
  }

  // Camera Tweening for smooth transitions
  let cameraTween = null;

  function animateCameraTo(targetPos, targetLookAt, duration = 600) {
    cameraTween = {
      startPos: camera.position.clone(),
      endPos: targetPos.clone(),
      startTarget: controls.target.clone(),
      endTarget: targetLookAt.clone(),
      startTime: performance.now(),
      duration: duration
    };
  }

  function updateCameraTween() {
    if (!cameraTween) return;
    const elapsed = performance.now() - cameraTween.startTime;
    const p = Math.min(1.0, elapsed / cameraTween.duration);
    const ease = 0.5 - 0.5 * Math.cos(p * Math.PI); // easeInOut

    camera.position.lerpVectors(cameraTween.startPos, cameraTween.endPos, ease);
    controls.target.lerpVectors(cameraTween.startTarget, cameraTween.endTarget, ease);
    controls.update();

    if (p >= 1.0) {
      cameraTween = null;
    }
  }

  // Zoom In / Out
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    controls.dollyIn(1.25);
    controls.update();
  });

  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    controls.dollyOut(1.25);
    controls.update();
  });

  // Reset to North
  document.getElementById('btn-compass')?.addEventListener('click', () => {
    const dist = camera.position.distanceTo(controls.target);
    const polar = controls.getPolarAngle();
    const newY = dist * Math.cos(polar);
    const newZ = dist * Math.sin(polar);
    animateCameraTo(
      new THREE.Vector3(controls.target.x, controls.target.y + newY, controls.target.z + newZ),
      controls.target,
      500
    );
  });

  // 2D / 3D Pitch Toggle
  const btn2D3D = document.getElementById('btn-2d-3d');
  btn2D3D?.addEventListener('click', () => {
    state.is2D = !state.is2D;
    btn2D3D.textContent = state.is2D ? '3D' : '2D';
    const dist = camera.position.distanceTo(controls.target);
    if (state.is2D) {
      animateCameraTo(
        new THREE.Vector3(controls.target.x, controls.target.y + dist, controls.target.z + 0.01),
        controls.target,
        600
      );
    } else {
      animateCameraTo(
        new THREE.Vector3(controls.target.x, controls.target.y + dist * 0.72, controls.target.z + dist * 0.65),
        controls.target,
        600
      );
    }
  });

  // --- 10. Drawer & Modal Management ---
  const controlsDrawer = document.getElementById('controls-drawer');
  const btnOpenControls = document.getElementById('btn-open-controls');
  const btnCloseControls = document.getElementById('btn-close-controls');

  btnOpenControls?.addEventListener('click', () => {
    controlsDrawer?.classList.toggle('open');
  });

  btnCloseControls?.addEventListener('click', () => {
    controlsDrawer?.classList.remove('open');
  });

  // Sliders
  const sliderReg = document.getElementById('slider-region-scale');
  const valReg = document.getElementById('val-region-scale');
  sliderReg?.addEventListener('input', e => {
    state.regionScale = parseFloat(e.target.value);
    if (valReg) valReg.textContent = `${state.regionScale.toFixed(1)}x`;
    updateDepartmentHeights(1.0);
  });

  const sliderDept = document.getElementById('slider-dept-scale');
  const valDept = document.getElementById('val-dept-scale');
  sliderDept?.addEventListener('input', e => {
    state.deptScale = parseFloat(e.target.value);
    if (valDept) valDept.textContent = `${state.deptScale.toFixed(1)}x`;
    updateDepartmentHeights(1.0);
  });

  const sliderElev = document.getElementById('slider-elevation-mult');
  const valElev = document.getElementById('val-elevation-mult');
  sliderElev?.addEventListener('input', e => {
    state.elevationMultiplier = parseFloat(e.target.value);
    if (valElev) valElev.textContent = `${state.elevationMultiplier.toFixed(1)}x`;
    updateDepartmentHeights(1.0);
  });

  document.getElementById('btn-replay-anim')?.addEventListener('click', () => {
    replayAnimation();
  });

  document.getElementById('toggle-capitals')?.addEventListener('change', e => {
    state.showCapitals = e.target.checked;
    capitalsPinsGroup.visible = state.showCapitals;
  });

  document.getElementById('toggle-wireframe')?.addEventListener('change', e => {
    state.showWireframe = e.target.checked;
    Object.values(departmentMeshes).forEach(d => {
      d.wireframe.visible = state.showWireframe;
    });
  });

  // Layer Switchers
  document.querySelectorAll('.layer-option').forEach(btn => {
    btn.addEventListener('click', () => {
      setBaseMapLayer(btn.dataset.layer);
    });
  });

  // About / AI Log Modal
  const aboutModal = document.getElementById('about-modal');
  const btnOpenAbout = document.getElementById('btn-open-about');
  const btnCloseAbout = document.getElementById('btn-close-about');
  const modalBody = document.getElementById('modal-body-content');

  btnOpenAbout?.addEventListener('click', () => {
    aboutModal?.classList.add('open');
    showModalTab('overview');
  });

  btnCloseAbout?.addEventListener('click', () => {
    aboutModal?.classList.remove('open');
  });

  aboutModal?.addEventListener('click', e => {
    if (e.target === aboutModal) aboutModal.classList.remove('open');
  });

  function showModalTab(tabId) {
    document.querySelectorAll('.modal-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });

    if (!modalBody) return;

    if (tabId === 'overview') {
      modalBody.innerHTML = `
        <h2>CartoJam: The Human Topography of France</h2>
        <p><strong>CartoJam</strong> is an interactive 3D geospatial visualization presenting mainland France and Corsica's 96 metropolitan departments as topographic monoliths extruded atop their 13 parent regional pedestals.</p>
        <h3>How the Visualization Works</h3>
        <ul>
          <li><strong>Regional Foundation Pedestals:</strong> France's 13 administrative regions form base foundations whose elevation corresponds to total regional population (from Corse with ~350k inhabitants to Île-de-France with ~12.4M).</li>
          <li><strong>Department Topography:</strong> Each department extrudes upward from its regional pedestal based on department population, color-coded by its parent region hue and brightness-modulated by local population density.</li>
          <li><strong>Offline "WarGames" Mode:</strong> Built-in 1980s glowing vector grid and embedded high-precision boundary topology that operates with zero network dependencies.</li>
        </ul>
      `;
    } else if (tabId === 'dataset') {
      modalBody.innerHTML = `
        <h2>Demographic & Cartographic Methodology</h2>
        <p>Data is compiled from official <strong>INSEE</strong> census estimates and metropolitan territorial reform records.</p>
        <table>
          <thead>
            <tr><th>Region</th><th>Departments</th><th>Est. Population</th></tr>
          </thead>
          <tbody>
            ${regionsData.map(r => `<tr><td><strong>${r.name}</strong></td><td>${r.departmentsCount}</td><td>${formatNumberFr(r.population)}</td></tr>`).join('')}
          </tbody>
        </table>
        <p>Total metropolitan population modeled: <strong>${formatNumberFr(totalNationalPop)}</strong> residents across 96 departments.</p>
      `;
    } else if (tabId === 'ailog') {
      const rawMarkdown = window.AI_LOG_MARKDOWN || '# AI Provenance Log\n\nAI log content loaded.';
      if (typeof marked !== 'undefined' && marked.parse) {
        modalBody.innerHTML = marked.parse(rawMarkdown);
      } else {
        modalBody.innerHTML = `<pre>${rawMarkdown}</pre>`;
      }
    }
  }

  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showModalTab(btn.dataset.tab);
    });
  });

  // --- 11. Render Loop with Software-WebGL Pacing ---
  let frameId = 0;
  function afterDraw(cb) {
    const gl = renderer.getContext();
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (st === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 60);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    const now = performance.now();

    // Advance growth animation
    if (state.animation.active) {
      const elapsed = now - state.animation.startTime;
      state.animation.progress = Math.min(1.0, elapsed / state.animation.duration);
      updateDepartmentHeights(state.animation.progress);
      if (state.animation.progress >= 1.0) {
        state.animation.active = false;
      }
    }

    updateCameraTween();
    controls.update();
    updateNavigationUI();
    syncMapLibreCamera();

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  // Window Resize Handling
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (maplibreMap) maplibreMap.resize();
  });

  // --- Initialization ---
  initMapLibre();
  loadAndBuildFrance();
  updateInspectorHUD('75'); // Default to Paris
  tick();

})();
