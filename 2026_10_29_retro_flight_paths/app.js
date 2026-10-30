/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CartoJam WarGames WOPR 3D Flight Tracker
 * 1983 NORAD CRT Vector Hologram Globe & Great Circle Flight Engine
 */

(function () {
  'use strict';

  // Math constants
  var DEG2RAD = Math.PI / 180;
  var RAD2DEG = 180 / Math.PI;
  var GLOBE_RADIUS = 100;

  // Global State
  var state = {
    // Time Engine
    simDate: new Date(),
    isPlaying: true,
    timeDirection: 1, // 1 for FWD, -1 for REV
    speedMultiplier: 3600, // Default 3600x for flight playback
    colorMode: 0, // 0 = WOPR Day/Night (Green/Red), 1 = Phosphor Green, 2 = Amber Terminal
    crtFxEnabled: true,
    controlsCollapsed: false,
    drawerCollapsed: false,

    // Camera & Follow
    autoFollowPlane: true,
    userIntervened: false,
    is2DMode: false,

    // Active Itinerary
    departureUtcMs: Date.now(),
    legs: [],
    activeFlightInfo: null, // Title / flight callsign
    progressStatus: null,

    // Auto-complete state
    acTargetInput: null
  };

  // Reusable vectors for zero GC in render loop
  var _v3_1 = new THREE.Vector3();
  var _v3_2 = new THREE.Vector3();
  var _sunDir = new THREE.Vector3(0, 0, 1);

  // Software WebGL Detection (Three.js Skill standard)
  var isSoftwareGl = (function () {
    try {
      var gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      var param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      var gpu = String(gl.getParameter(param));
      if (gl.getExtension('WEBGL_lose_context')) {
        gl.getExtension('WEBGL_lose_context').loseContext();
      }
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch (e) {
      return true;
    }
  })();

  // -------------------------------------------------------------
  // SPHERICAL & SOLAR MATHEMATICS
  // -------------------------------------------------------------

  function latLonToVec3(lat, lon, radius) {
    var phi = (90 - lat) * DEG2RAD;
    var theta = (lon + 180) * DEG2RAD;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function greatCircleDistRad(lat1, lon1, lat2, lon2) {
    var phi1 = lat1 * DEG2RAD;
    var phi2 = lat2 * DEG2RAD;
    var dPhi = (lat2 - lat1) * DEG2RAD;
    var dLambda = (lon2 - lon1) * DEG2RAD;
    var a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  }

  function interpolateGreatCircle(lat1, lon1, lat2, lon2, t) {
    var d = greatCircleDistRad(lat1, lon1, lat2, lon2);
    if (d < 1e-6) return { lat: lat1, lon: lon1 };

    var phi1 = lat1 * DEG2RAD;
    var phi2 = lat2 * DEG2RAD;
    var lam1 = lon1 * DEG2RAD;
    var lam2 = lon2 * DEG2RAD;

    var sinD = Math.sin(d);
    var A = Math.sin((1 - t) * d) / sinD;
    var B = Math.sin(t * d) / sinD;

    var x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2);
    var y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2);
    var z = A * Math.sin(phi1) + B * Math.sin(phi2);

    var lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD2DEG;
    var lon = Math.atan2(y, x) * RAD2DEG;
    return { lat: lat, lon: lon };
  }

  function calculateSubsolarPoint(date) {
    var startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    var diffMs = date.getTime() - startOfYear.getTime();
    var dayOfYear = Math.floor(diffMs / 86400000) + 1;

    // Solar declination using Spencer approximation
    var delta = 23.44 * Math.sin(((360 / 365) * (dayOfYear - 81)) * DEG2RAD);

    // UTC Hours
    var utcHours =
      date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600 +
      date.getUTCMilliseconds() / 3600000;

    // Longitude = (12.0 - utcHours) * 15 degrees
    var sunLon = (12.0 - utcHours) * 15.0;
    while (sunLon > 180) sunLon -= 360;
    while (sunLon < -180) sunLon += 360;

    return { lat: delta, lon: sunLon };
  }

  function calculateTotalItineraryMinutes(legs) {
    if (!legs || legs.length === 0) return 0;
    var total = 0;
    for (var i = 0; i < legs.length; i++) {
      total += legs[i].flightMinutes;
      if (i < legs.length - 1) {
        total += legs[i].layoverMinutes || 0;
      }
    }
    return total;
  }

  function getFlightProgress(legs, elapsedMinutes) {
    var totalMinutes = calculateTotalItineraryMinutes(legs);
    if (!legs || legs.length === 0) {
      return {
        status: 'SCHEDULED',
        activeLegIndex: -1,
        legProgress: 0,
        totalProgress: 0,
        elapsedMinutes: 0,
        totalMinutes: 0
      };
    }

    if (elapsedMinutes <= 0) {
      return {
        status: 'SCHEDULED',
        activeLegIndex: 0,
        legProgress: 0,
        totalProgress: 0,
        currentAirportIata: legs[0].fromIata,
        elapsedMinutes: elapsedMinutes,
        totalMinutes: totalMinutes
      };
    }

    if (elapsedMinutes >= totalMinutes) {
      return {
        status: 'ARRIVED',
        activeLegIndex: legs.length - 1,
        legProgress: 1,
        totalProgress: 1,
        currentAirportIata: legs[legs.length - 1].toIata,
        elapsedMinutes: elapsedMinutes,
        totalMinutes: totalMinutes
      };
    }

    var cumulative = 0;
    var totalProgress = Math.min(1, Math.max(0, elapsedMinutes / totalMinutes));

    for (var i = 0; i < legs.length; i++) {
      var leg = legs[i];
      var flightEnd = cumulative + leg.flightMinutes;

      if (elapsedMinutes < flightEnd) {
        var legProgress = Math.max(0, Math.min(1, (elapsedMinutes - cumulative) / leg.flightMinutes));
        return {
          status: 'EN_ROUTE',
          activeLegIndex: i,
          legProgress: legProgress,
          totalProgress: totalProgress,
          elapsedMinutes: elapsedMinutes,
          totalMinutes: totalMinutes
        };
      }

      cumulative = flightEnd;

      if (i < legs.length - 1) {
        var layoverEnd = cumulative + (leg.layoverMinutes || 0);
        if (elapsedMinutes < layoverEnd) {
          return {
            status: 'LAYOVER',
            activeLegIndex: i,
            legProgress: 1,
            totalProgress: totalProgress,
            currentAirportIata: leg.toIata,
            layoverRemainingMinutes: layoverEnd - elapsedMinutes,
            elapsedMinutes: elapsedMinutes,
            totalMinutes: totalMinutes
          };
        }
        cumulative = layoverEnd;
      }
    }

    return {
      status: 'ARRIVED',
      activeLegIndex: legs.length - 1,
      legProgress: 1,
      totalProgress: 1,
      currentAirportIata: legs[legs.length - 1].toIata,
      elapsedMinutes: elapsedMinutes,
      totalMinutes: totalMinutes
    };
  }

  // -------------------------------------------------------------
  // THREE.JS SCENE SETUP & MATERIALS
  // -------------------------------------------------------------

  var scene, camera, renderer, controls;
  var globeGroup;
  var continentLinesMesh, graticuleLinesMesh;
  var terminatorRingMesh, subsolarMarker;
  var planeMesh, planeActiveTraceLine, planeRefTrajectoryLine;
  var airportNodesGroup;
  var canvasContainer = document.getElementById('webgl-container');

  // Custom Shader for Day (Green) / Night (Red) Vector Hologram Lines with Transparent Hologram Depth
  var lineVertexShader = [
    'varying vec3 vWorldNormal;',
    'varying vec3 vWorldPosition;',
    'void main() {',
    '  vWorldNormal = normalize((modelMatrix * vec4(position, 0.0)).xyz);',
    '  vec4 worldPos = modelMatrix * vec4(position, 1.0);',
    '  vWorldPosition = worldPos.xyz;',
    '  gl_Position = projectionMatrix * viewMatrix * worldPos;',
    '}'
  ].join('\n');

  var lineFragmentShader = [
    'uniform vec3 uSunDir;',
    'uniform int uColorMode;', // 0: WOPR Green/Red, 1: Phosphor Green, 2: Amber
    'varying vec3 vWorldNormal;',
    'varying vec3 vWorldPosition;',
    'void main() {',
    '  float dotSun = dot(vWorldNormal, uSunDir);',
    '  vec3 col;',
    '  if (uColorMode == 0) {',
    '    // Blend across twilight terminator (-0.05 to +0.05)',
    '    float t = smoothstep(-0.06, 0.06, dotSun);',
    '    vec3 nightRed = vec3(1.0, 0.13, 0.25);',
    '    vec3 dayGreen = vec3(0.0, 1.0, 0.4);',
    '    col = mix(nightRed, dayGreen, t);',
    '  } else if (uColorMode == 1) {',
    '    col = vec3(0.0, 1.0, 0.4);',
    '  } else {',
    '    col = vec3(1.0, 0.67, 0.0);',
    '  }',
    '  // Hologram Transparency: Lines on far side of globe seen through ocean are rendered fainter',
    '  vec3 viewDir = normalize(cameraPosition - vWorldPosition);',
    '  float dotView = dot(vWorldNormal, viewDir);',
    '  float alpha = 0.95;',
    '  if (dotView < 0.0) {',
    '    // Back side seen through translucent ocean: muted phosphor glow',
    '    col *= 0.28;',
    '    alpha = 0.24;',
    '  } else {',
    '    // Front side: crisp with subtle rim glow',
    '    float rim = pow(1.0 - max(0.0, dotView), 2.2);',
    '    col = clamp(col + col * rim * 0.35, 0.0, 1.0);',
    '  }',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  var sharedLineMaterial = new THREE.ShaderMaterial({
    vertexShader: lineVertexShader,
    fragmentShader: lineFragmentShader,
    uniforms: {
      uSunDir: { value: _sunDir },
      uColorMode: { value: 0 }
    },
    transparent: true,
    depthWrite: false
  });

  function initThree() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020604, 0.0018);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 70, 260);

    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    canvasContainer.appendChild(renderer.domElement);

    if (typeof THREE.OrbitControls !== 'function') {
      THREE.OrbitControls = function (cam, domEl) {
        this.object = cam;
        this.domElement = domEl;
        this.target = new THREE.Vector3(0, 0, 0);
        this.enableDamping = false;
        this.dampingFactor = 0.05;
        this.minDistance = 115;
        this.maxDistance = 650;
        this.rotateSpeed = 0.6;
        this.zoomSpeed = 0.8;
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;
        var scope = this;
        var isDragging = false;
        var prevX = 0, prevY = 0;

        domEl.addEventListener('pointerdown', function (e) {
          isDragging = true;
          prevX = e.clientX;
          prevY = e.clientY;
        });
        window.addEventListener('pointerup', function () { isDragging = false; });
        window.addEventListener('pointermove', function (e) {
          if (!isDragging) return;
          var dx = (e.clientX - prevX) * 0.005;
          var dy = (e.clientY - prevY) * 0.005;
          prevX = e.clientX;
          prevY = e.clientY;

          var offset = cam.position.clone().sub(scope.target);
          var radius = offset.length();
          var theta = Math.atan2(offset.x, offset.z) - dx;
          var phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius))) + dy;
          phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));

          offset.x = radius * Math.sin(phi) * Math.sin(theta);
          offset.y = radius * Math.cos(phi);
          offset.z = radius * Math.sin(phi) * Math.cos(theta);
          cam.position.copy(scope.target).add(offset);
          cam.lookAt(scope.target);
        });
        domEl.addEventListener('wheel', function (e) {
          var factor = e.deltaY > 0 ? 1.1 : 0.9;
          var offset = cam.position.clone().sub(scope.target).multiplyScalar(factor);
          if (offset.length() > scope.minDistance && offset.length() < scope.maxDistance) {
            cam.position.copy(scope.target).add(offset);
          }
        }, { passive: true });

        this.update = function () { cam.lookAt(scope.target); };
        this.dollyIn = function (f) { cam.position.sub(scope.target).multiplyScalar(1 / f).add(scope.target); };
        this.dollyOut = function (f) { cam.position.sub(scope.target).multiplyScalar(f).add(scope.target); };
        this.getAzimuthalAngle = function () {
          var offset = cam.position.clone().sub(scope.target);
          return Math.atan2(offset.x, offset.z);
        };
      };
    }

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 115;
    controls.maxDistance = 650;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.enablePan = false; // Never pan off-center; always rotate around Earth center
    controls.target.set(0, 0, 0); // Strictly locked to Earth center
    if (THREE.MOUSE) {
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };
    }

    // Detect user manual interaction to override auto-follow
    renderer.domElement.addEventListener('pointerdown', function () {
      if (state.autoFollowPlane) {
        state.userIntervened = true;
        updateCameraLockUI();
      }
    });

    renderer.domElement.addEventListener('wheel', function () {
      if (state.autoFollowPlane) {
        state.userIntervened = true;
        updateCameraLockUI();
      }
    }, { passive: true });

    // Globe Group
    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Core Sphere (Translucent ocean body enabling transparent 3D vector hologram)
    var sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS - 0.2, 48, 36);
    var sphereMat = new THREE.MeshBasicMaterial({
      color: 0x011408,
      transparent: true,
      opacity: 0.35, // Transparent oceans let you see through to the far side of the globe
      depthWrite: false
    });
    var sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereMesh);

    // 2. Graticule Lines (Removed per user request to showcase clean continent contours)
    // buildGraticule();

    // 3. Continent Coastlines & Topographic Contours
    buildCoastlines();

    // 4. Solar Terminator Glowing Ring
    buildTerminatorRing();

    // 5. Subsolar Sun Marker (Crosshair reticle)
    buildSubsolarMarker();

    // 6. Airport Nodes Group
    airportNodesGroup = new THREE.Group();
    globeGroup.add(airportNodesGroup);

    // 7. Plane 3D Model & Flight Trace Lines
    buildPlaneModel();
    buildFlightLines();

    // Listeners
    window.addEventListener('resize', onWindowResize);

    // Progressive online coastlines upgrade (110m TopoJSON)
    tryFetchOnlineCoastlines();
  }

  // Major continental topographic ridge lines / elevation contours (lon, lat)
  var TOPOGRAPHIC_CONTOURS = [
    // Himalayas & Tibetan Plateau
    [[73.0, 36.0], [77.0, 35.0], [81.0, 31.0], [86.0, 28.5], [90.0, 28.0], [95.0, 29.5], [100.0, 28.0]],
    [[78.0, 33.0], [84.0, 32.5], [89.0, 32.0], [94.0, 33.0], [98.0, 35.0], [103.0, 34.0]],
    // Andes Ridge
    [[-70.0, 10.0], [-73.0, 5.0], [-76.0, 0.0], [-78.0, -5.0], [-75.0, -12.0], [-68.0, -17.0], [-66.0, -22.0], [-68.0, -30.0], [-70.0, -38.0], [-72.0, -46.0], [-69.0, -53.0]],
    // Rocky Mountains
    [[-150.0, 63.0], [-135.0, 60.0], [-125.0, 54.0], [-116.0, 49.0], [-111.0, 43.0], [-106.0, 38.0], [-104.0, 32.0], [-100.0, 24.0]],
    // Alps
    [[5.5, 45.0], [7.0, 46.0], [9.5, 46.5], [12.0, 47.0], [14.5, 47.2], [16.0, 47.5]],
    // Scandinavian Mountains
    [[6.0, 60.0], [8.0, 62.0], [13.0, 65.0], [18.0, 68.0]],
    // Great Dividing Range (Australia)
    [[143.0, -13.0], [145.0, -18.0], [148.0, -24.0], [152.0, -29.0], [150.0, -34.0], [146.0, -37.0]],
    // East African Rift
    [[40.0, 12.0], [38.0, 7.0], [36.0, 0.0], [35.0, -5.0], [34.0, -12.0], [35.0, -18.0]]
  ];

  function subdivideLine(pts, iterations) {
    var result = pts;
    for (var it = 0; it < iterations; it++) {
      var next = [];
      for (var i = 0; i < result.length - 1; i++) {
        var p0 = result[i];
        var p1 = result[i + 1];
        var q = [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]];
        var r = [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]];
        next.push(q);
        next.push(r);
      }
      if (result.length > 0) next.push(result[result.length - 1]);
      result = next;
    }
    return result;
  }

  function buildCoastlines() {
    var points = [];
    var radius = GLOBE_RADIUS + 0.3;
    var coastlines = (window.CARTO_DATA && window.CARTO_DATA.coastlines) || [];

    // Detailed subdivided offline coastline curves
    for (var i = 0; i < coastlines.length; i++) {
      var poly = subdivideLine(coastlines[i], 2);
      for (var j = 0; j < poly.length - 1; j++) {
        var pt1 = poly[j];
        var pt2 = poly[j + 1];
        var v1 = latLonToVec3(pt1[1], pt1[0], radius);
        var v2 = latLonToVec3(pt2[1], pt2[0], radius);
        points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      }
    }

    // Add topographic mountain contours for rich layered detail
    for (var t = 0; t < TOPOGRAPHIC_CONTOURS.length; t++) {
      var ridge = subdivideLine(TOPOGRAPHIC_CONTOURS[t], 2);
      for (var r = 0; r < ridge.length - 1; r++) {
        var r1 = latLonToVec3(ridge[r][1], ridge[r][0], radius);
        var r2 = latLonToVec3(ridge[r + 1][1], ridge[r + 1][0], radius);
        points.push(r1.x, r1.y, r1.z, r2.x, r2.y, r2.z);
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    continentLinesMesh = new THREE.LineSegments(geo, sharedLineMaterial);
    globeGroup.add(continentLinesMesh);
  }

  function tryFetchOnlineCoastlines() {
    if (typeof fetch === 'undefined') return;
    // High-resolution 110m TopoJSON coastline upgrade
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
      .then(function (res) { return res.json(); })
      .then(function (topo) {
        if (!topo || !topo.arcs || !topo.transform) return;
        var scale = topo.transform.scale;
        var trans = topo.transform.translate;
        var points = [];
        var radius = GLOBE_RADIUS + 0.35;

        // Decode TopoJSON arcs into 3D spherical lines
        for (var a = 0; a < topo.arcs.length; a++) {
          var arc = topo.arcs[a];
          var curX = 0, curY = 0;
          var arcPts = [];
          for (var p = 0; p < arc.length; p++) {
            curX += arc[p][0];
            curY += arc[p][1];
            var lon = curX * scale[0] + trans[0];
            var lat = curY * scale[1] + trans[1];
            arcPts.push(latLonToVec3(lat, lon, radius));
          }
          for (var s = 0; s < arcPts.length - 1; s++) {
            points.push(
              arcPts[s].x, arcPts[s].y, arcPts[s].z,
              arcPts[s + 1].x, arcPts[s + 1].y, arcPts[s + 1].z
            );
          }
        }

        // Keep topographic mountain contours
        for (var t = 0; t < TOPOGRAPHIC_CONTOURS.length; t++) {
          var ridge = subdivideLine(TOPOGRAPHIC_CONTOURS[t], 2);
          for (var r = 0; r < ridge.length - 1; r++) {
            var v1 = latLonToVec3(ridge[r][1], ridge[r][0], radius);
            var v2 = latLonToVec3(ridge[r + 1][1], ridge[r + 1][0], radius);
            points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
          }
        }

        if (points.length > 0 && continentLinesMesh) {
          var newGeo = new THREE.BufferGeometry();
          newGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
          var oldGeo = continentLinesMesh.geometry;
          continentLinesMesh.geometry = newGeo;
          if (oldGeo) oldGeo.dispose();
        }
      })
      .catch(function () {
        // Offline-first fallback already loaded gracefully
      });
  }

  function buildTerminatorRing() {
    // Great circle ring separating Day and Night
    var segments = 128;
    var radius = GLOBE_RADIUS + 0.5;
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });
    terminatorRingMesh = new THREE.Line(geo, mat);
    globeGroup.add(terminatorRingMesh);
  }

  function buildSubsolarMarker() {
    // Crosshair target reticle showing exact subsolar point
    var group = new THREE.Group();

    // Circle ring
    var pts = [];
    for (var i = 0; i <= 32; i++) {
      var a = (i / 32) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 3, Math.sin(a) * 3, 0));
    }
    var ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var ringMat = new THREE.LineBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0.95 });
    var ring = new THREE.Line(ringGeo, ringMat);
    group.add(ring);

    // Crosshairs
    var crossPts = [
      new THREE.Vector3(-4.5, 0, 0), new THREE.Vector3(4.5, 0, 0),
      new THREE.Vector3(0, -4.5, 0), new THREE.Vector3(0, 4.5, 0)
    ];
    var crossGeo = new THREE.BufferGeometry().setFromPoints(crossPts);
    var cross = new THREE.LineSegments(crossGeo, ringMat);
    group.add(cross);

    // Center glow dot
    var dotGeo = new THREE.SphereGeometry(0.8, 12, 12);
    var dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var dot = new THREE.Mesh(dotGeo, dotMat);
    group.add(dot);

    subsolarMarker = group;
    globeGroup.add(subsolarMarker);
  }

  function buildPlaneModel() {
    // 1983 Vector Wireframe Jet Model (Fuselage, delta swept wings, tail fin, engine nacelles)
    var group = new THREE.Group();

    var jetMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2
    });

    var pts = [
      // Fuselage nose to tail
      new THREE.Vector3(0, 0, 3.5), new THREE.Vector3(0, 0.4, 1.5),
      new THREE.Vector3(0, 0.4, 1.5), new THREE.Vector3(0, 0.3, -2.5),
      new THREE.Vector3(0, 0.3, -2.5), new THREE.Vector3(0, 0, -3.0),
      new THREE.Vector3(0, 0, -3.0), new THREE.Vector3(0, -0.3, -2.5),
      new THREE.Vector3(0, -0.3, -2.5), new THREE.Vector3(0, -0.3, 1.5),
      new THREE.Vector3(0, -0.3, 1.5), new THREE.Vector3(0, 0, 3.5),

      // Main Delta Wings
      new THREE.Vector3(0, 0, 1.2), new THREE.Vector3(3.2, -0.1, -1.2),
      new THREE.Vector3(3.2, -0.1, -1.2), new THREE.Vector3(2.4, -0.1, -1.8),
      new THREE.Vector3(2.4, -0.1, -1.8), new THREE.Vector3(0, 0, -1.4),

      new THREE.Vector3(0, 0, 1.2), new THREE.Vector3(-3.2, -0.1, -1.2),
      new THREE.Vector3(-3.2, -0.1, -1.2), new THREE.Vector3(-2.4, -0.1, -1.8),
      new THREE.Vector3(-2.4, -0.1, -1.8), new THREE.Vector3(0, 0, -1.4),

      // Vertical Tail Fin
      new THREE.Vector3(0, 0.3, -1.6), new THREE.Vector3(0, 1.8, -2.8),
      new THREE.Vector3(0, 1.8, -2.8), new THREE.Vector3(0, 0.2, -3.0),

      // Engine Nacelles
      new THREE.Vector3(0.9, -0.4, -0.2), new THREE.Vector3(0.9, -0.4, -1.6),
      new THREE.Vector3(-0.9, -0.4, -0.2), new THREE.Vector3(-0.9, -0.4, -1.6)
    ];

    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var wireframeJet = new THREE.LineSegments(geo, jetMat);
    group.add(wireframeJet);

    // Glowing core light sphere
    var coreGeo = new THREE.SphereGeometry(0.4, 8, 8);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    var coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    group.scale.set(1.2, 1.2, 1.2);
    group.visible = false;

    planeMesh = group;
    globeGroup.add(planeMesh);
  }

  function buildFlightLines() {
    // 1. Reference dashed trajectory arc
    var maxPoints = 2000;
    var refGeo = new THREE.BufferGeometry();
    refGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
    refGeo.setDrawRange(0, 0);

    var refMat = new THREE.LineDashedMaterial({
      color: 0x00883a,
      dashSize: 2,
      gapSize: 1.5,
      transparent: true,
      opacity: 0.6
    });
    planeRefTrajectoryLine = new THREE.Line(refGeo, refMat);
    planeRefTrajectoryLine.computeLineDistances();
    globeGroup.add(planeRefTrajectoryLine);

    // 2. Active glowing trace line
    var activeGeo = new THREE.BufferGeometry();
    activeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
    activeGeo.setDrawRange(0, 0);

    var activeMat = new THREE.LineBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.95,
      linewidth: 3
    });
    planeActiveTraceLine = new THREE.Line(activeGeo, activeMat);
    globeGroup.add(planeActiveTraceLine);
  }

  // -------------------------------------------------------------
  // ITINERARY 3D ARCS & AIRPORT NODES REBUILD
  // -------------------------------------------------------------

  var fullTrajectoryPoints = []; // [{vec3, legIndex, isLayover, progressFrac}, ...]

  function rebuildItinerary3D() {
    // Clear existing airport nodes
    while (airportNodesGroup.children.length > 0) {
      var child = airportNodesGroup.children[0];
      airportNodesGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    fullTrajectoryPoints = [];

    if (!state.legs || state.legs.length === 0) {
      planeMesh.visible = false;
      planeRefTrajectoryLine.geometry.setDrawRange(0, 0);
      planeActiveTraceLine.geometry.setDrawRange(0, 0);
      updateAirportBadges([]);
      return;
    }

    planeMesh.visible = true;

    // Collect all visited airports in order
    var visitedAirports = [];
    var firstAp = window.CARTO_DATA.getAirport(state.legs[0].fromIata);
    if (firstAp) visitedAirports.push(firstAp);

    for (var i = 0; i < state.legs.length; i++) {
      var destAp = window.CARTO_DATA.getAirport(state.legs[i].toIata);
      if (destAp) visitedAirports.push(destAp);
    }

    // Place glowing concentric rings on each airport
    var visitedIatas = {};
    for (var a = 0; a < visitedAirports.length; a++) {
      var ap = visitedAirports[a];
      if (visitedIatas[ap.iata]) continue;
      visitedIatas[ap.iata] = true;

      var apPos = latLonToVec3(ap.lat, ap.lon, GLOBE_RADIUS + 0.35);

      // Outer ring
      var pts = [];
      for (var r = 0; r <= 24; r++) {
        var angle = (r / 24) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0));
      }
      var ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var ringMat = new THREE.LineBasicMaterial({
        color: (a === 0 || a === visitedAirports.length - 1) ? 0x00ff66 : 0xffaa00,
        transparent: true,
        opacity: 0.9
      });
      var ringMesh = new THREE.Line(ringGeo, ringMat);
      ringMesh.position.copy(apPos);
      ringMesh.lookAt(apPos.clone().multiplyScalar(2));
      airportNodesGroup.add(ringMesh);

      // Inner dot
      var dotGeo = new THREE.SphereGeometry(0.7, 8, 8);
      var dotMat = new THREE.MeshBasicMaterial({
        color: (a === 0 || a === visitedAirports.length - 1) ? 0x00ff66 : 0xffaa00
      });
      var dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(apPos);
      airportNodesGroup.add(dotMesh);
    }

    // Build Great Circle Trajectory Arcs with Parabolic Cruise Altitude
    var totalItinMinutes = calculateTotalItineraryMinutes(state.legs);
    var cumulativeMinutes = 0;

    for (var legIdx = 0; legIdx < state.legs.length; legIdx++) {
      var leg = state.legs[legIdx];
      var origin = window.CARTO_DATA.getAirport(leg.fromIata);
      var destination = window.CARTO_DATA.getAirport(leg.toIata);

      if (!origin || !destination) continue;

      var legDistRad = greatCircleDistRad(origin.lat, origin.lon, destination.lat, destination.lon);
      var maxAltitude = Math.min(18, Math.max(3, legDistRad * 12)); // Realistic parabolic cruise altitude

      var legSamples = 80;
      for (var s = 0; s <= legSamples; s++) {
        var t = s / legSamples;
        var coords = interpolateGreatCircle(origin.lat, origin.lon, destination.lat, destination.lon, t);

        // Parabolic altitude: 0 at takeoff/landing, maxAltitude at midpoint
        var alt = Math.sin(t * Math.PI) * maxAltitude;
        var r = GLOBE_RADIUS + 0.5 + alt;
        var pos = latLonToVec3(coords.lat, coords.lon, r);

        var minuteAtSample = cumulativeMinutes + t * leg.flightMinutes;
        var totalFrac = totalItinMinutes > 0 ? minuteAtSample / totalItinMinutes : 0;

        fullTrajectoryPoints.push({
          pos: pos,
          lat: coords.lat,
          lon: coords.lon,
          legIndex: legIdx,
          legFraction: t,
          totalFraction: totalFrac,
          isLayover: false
        });
      }

      cumulativeMinutes += leg.flightMinutes;

      // If layover follows, hold at airport position
      if (legIdx < state.legs.length - 1 && leg.layoverMinutes > 0) {
        var layoverPos = latLonToVec3(destination.lat, destination.lon, GLOBE_RADIUS + 0.5);
        for (var ls = 0; ls < 15; ls++) {
          var lt = ls / 15;
          var minuteAtLayover = cumulativeMinutes + lt * leg.layoverMinutes;
          fullTrajectoryPoints.push({
            pos: layoverPos,
            lat: destination.lat,
            lon: destination.lon,
            legIndex: legIdx,
            legFraction: 1,
            totalFraction: totalItinMinutes > 0 ? minuteAtLayover / totalItinMinutes : 0,
            isLayover: true,
            layoverRemaining: leg.layoverMinutes * (1 - lt)
          });
        }
        cumulativeMinutes += leg.layoverMinutes;
      }
    }

    // Populate Reference Trajectory Geometry
    var refPosAttr = planeRefTrajectoryLine.geometry.attributes.position;
    var count = Math.min(fullTrajectoryPoints.length, refPosAttr.count);
    for (var p = 0; p < count; p++) {
      var pt = fullTrajectoryPoints[p].pos;
      refPosAttr.setXYZ(p, pt.x, pt.y, pt.z);
    }
    refPosAttr.needsUpdate = true;
    planeRefTrajectoryLine.geometry.setDrawRange(0, count);
    planeRefTrajectoryLine.computeLineDistances();

    // Reset Active Trace line
    planeActiveTraceLine.geometry.setDrawRange(0, 0);

    // Fly camera to origin airport smoothly if user didn't explicitly disengage
    if (visitedAirports.length > 0 && !state.userIntervened) {
      focusOnAirport(visitedAirports[0]);
    }
  }

  function focusOnAirport(ap) {
    if (!ap) return;
    var dir = latLonToVec3(ap.lat, ap.lon, 1).normalize();
    var camDist = Math.max(camera.position.length(), GLOBE_RADIUS + 90);
    camera.position.copy(dir.multiplyScalar(camDist));
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  // -------------------------------------------------------------
  // UPDATE SIMULATION & TIME ENGINE
  // -------------------------------------------------------------

  var lastFrameTimestamp = performance.now();

  function updateSimulation(deltaMs) {
    if (state.isPlaying) {
      var simDeltaMs = deltaMs * state.speedMultiplier * state.timeDirection;
      state.simDate = new Date(state.simDate.getTime() + simDeltaMs);

      // Continuous loop of flight itinerary from takeoff to landing
      if (state.legs && state.legs.length > 0) {
        var totalMinutes = calculateTotalItineraryMinutes(state.legs);
        if (totalMinutes > 0) {
          var elapsedMinutes = (state.simDate.getTime() - state.departureUtcMs) / 60000;
          if (state.timeDirection === 1 && elapsedMinutes >= totalMinutes) {
            // Loop back to departure
            state.simDate = new Date(state.departureUtcMs);
          } else if (state.timeDirection === -1 && elapsedMinutes <= 0) {
            // Loop back to landing when in reverse
            state.simDate = new Date(state.departureUtcMs + totalMinutes * 60000);
          }
        }
      }
    }

    // Calculate Subsolar Point
    var subsolar = calculateSubsolarPoint(state.simDate);
    var sunPos = latLonToVec3(subsolar.lat, subsolar.lon, GLOBE_RADIUS);
    _sunDir.copy(sunPos).normalize();

    // Update Sun marker position & orientation
    if (subsolarMarker) {
      var markerPos = latLonToVec3(subsolar.lat, subsolar.lon, GLOBE_RADIUS + 0.6);
      subsolarMarker.position.copy(markerPos);
      subsolarMarker.lookAt(markerPos.clone().multiplyScalar(2));
    }

    // Update Solar Terminator Ring orientation (perpendicular to sun vector)
    if (terminatorRingMesh) {
      terminatorRingMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _sunDir);
    }

    // Update Itinerary Playback & Aircraft Position
    updateFlightProgress();

    // Update UI HUD Readouts
    updateTelemetryUI(subsolar);
  }

  function updateFlightProgress() {
    if (!state.legs || state.legs.length === 0 || fullTrajectoryPoints.length === 0) {
      return;
    }

    var elapsedMinutes = (state.simDate.getTime() - state.departureUtcMs) / 60000;
    var progress = getFlightProgress(state.legs, elapsedMinutes);
    state.progressStatus = progress;

    // Find closest index in fullTrajectoryPoints matching progress.totalProgress
    var targetFrac = progress.totalProgress;
    var closestIdx = Math.floor(targetFrac * (fullTrajectoryPoints.length - 1));
    closestIdx = Math.max(0, Math.min(fullTrajectoryPoints.length - 1, closestIdx));

    var currentSample = fullTrajectoryPoints[closestIdx];
    var nextSample = fullTrajectoryPoints[Math.min(fullTrajectoryPoints.length - 1, closestIdx + 1)];

    // Update Plane Position
    planeMesh.position.copy(currentSample.pos);

    // Orient Plane along velocity vector
    if (nextSample && !currentSample.isLayover) {
      var forward = _v3_1.subVectors(nextSample.pos, currentSample.pos).normalize();
      var up = _v3_2.copy(currentSample.pos).normalize();
      if (forward.lengthSq() > 0.001) {
        var m4 = new THREE.Matrix4();
        m4.lookAt(currentSample.pos, currentSample.pos.clone().add(forward), up);
        planeMesh.quaternion.setFromRotationMatrix(m4);
      }
    } else {
      // During layover, face surface normal
      planeMesh.lookAt(currentSample.pos.clone().multiplyScalar(2));
    }

    // Update Active Glowing Trace Line
    var activeAttr = planeActiveTraceLine.geometry.attributes.position;
    for (var k = 0; k <= closestIdx; k++) {
      var p = fullTrajectoryPoints[k].pos;
      activeAttr.setXYZ(k, p.x, p.y, p.z);
    }
    activeAttr.needsUpdate = true;
    planeActiveTraceLine.geometry.setDrawRange(0, closestIdx + 1);

    // Auto-Follow Camera Logic (Google Earth centered on Earth (0,0,0))
    if (state.autoFollowPlane && !state.userIntervened && state.isPlaying) {
      var planeDir = currentSample.pos.clone().normalize();
      var camDist = Math.max(camera.position.length(), GLOBE_RADIUS + 70);
      var targetCamPos = planeDir.multiplyScalar(camDist);

      // Smooth camera interpolation towards overhead plane ray
      camera.position.lerp(targetCamPos, 0.04);
      controls.target.set(0, 0, 0);
      controls.update();
    }

    // Update UI Progress Scrubber & Status Pill
    updateItineraryUI(progress);
  }

  // -------------------------------------------------------------
  // ANIMATION LOOP & SOFTWARE GL PACING
  // -------------------------------------------------------------

  var frameId = 0;

  function afterDraw(cb) {
    var gl = renderer.getContext();
    var sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    var poll = function () {
      var status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 70);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    var now = performance.now();
    var delta = Math.min(now - lastFrameTimestamp, 100);
    lastFrameTimestamp = now;

    updateSimulation(delta);

    controls.update();
    renderer.render(scene, camera);

    updateCompassNeedle();
    updateScaleBar();

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // -------------------------------------------------------------
  // UI CHROME, HUD & USER INTERACTION
  // -------------------------------------------------------------

  function setupUI() {
    // 1. Theme Switcher buttons
    var themeBtns = document.querySelectorAll('.theme-pill-btn');
    themeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        themeBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var mode = parseInt(btn.getAttribute('data-mode'), 10);
        setColorMode(mode);
      });
    });

    // 2. Transport & Playback controls
    var playPauseBtn = document.getElementById('play-pause-btn');
    playPauseBtn.addEventListener('click', function () {
      state.isPlaying = !state.isPlaying;
      playPauseBtn.textContent = state.isPlaying ? '❚❚ PAUSE' : '▶ PLAY';
    });

    var dirBtn = document.getElementById('dir-toggle-btn');
    dirBtn.addEventListener('click', function () {
      state.timeDirection = state.timeDirection === 1 ? -1 : 1;
      dirBtn.textContent = state.timeDirection === 1 ? 'FWD ▶' : '◀ REV';
      dirBtn.classList.toggle('amber', state.timeDirection === -1);
    });

    // Speed Preset Buttons
    var speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        speedBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.speedMultiplier = parseFloat(btn.getAttribute('data-speed'));
      });
    });

    // 3. Triple Time Sliders
    var hourSlider = document.getElementById('time-hour-slider');
    hourSlider.addEventListener('input', function () {
      var h = parseFloat(hourSlider.value);
      var d = state.simDate;
      var curHourFloat = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
      var diffHours = h - curHourFloat;
      state.simDate = new Date(d.getTime() + diffHours * 3600000);
      updateTelemetryUI(calculateSubsolarPoint(state.simDate));
    });

    var doySlider = document.getElementById('time-doy-slider');
    doySlider.addEventListener('input', function () {
      var targetDoy = parseInt(doySlider.value, 10);
      var year = state.simDate.getUTCFullYear();
      var newDate = new Date(Date.UTC(year, 0, targetDoy, state.simDate.getUTCHours(), state.simDate.getUTCMinutes(), state.simDate.getUTCSeconds()));
      state.simDate = newDate;
      updateTelemetryUI(calculateSubsolarPoint(state.simDate));
    });

    var yearSlider = document.getElementById('time-year-slider');
    yearSlider.addEventListener('input', function () {
      var targetYear = parseInt(yearSlider.value, 10);
      var d = state.simDate;
      state.simDate = new Date(Date.UTC(targetYear, d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
      updateTelemetryUI(calculateSubsolarPoint(state.simDate));
    });

    // 4. Master Flight Scrubber
    var flightScrubber = document.getElementById('flight-scrubber');
    flightScrubber.addEventListener('input', function () {
      if (!state.legs || state.legs.length === 0) return;
      var totalMinutes = calculateTotalItineraryMinutes(state.legs);
      var targetFrac = parseFloat(flightScrubber.value) / 100;
      var targetElapsedMs = targetFrac * totalMinutes * 60000;
      state.simDate = new Date(state.departureUtcMs + targetElapsedMs);
      updateSimulation(0);
    });

    // 5. Dock & Drawer Collapse Toggles
    var dockCollapseBtn = document.getElementById('dock-collapse-btn');
    var bottomDock = document.getElementById('bottom-dock');
    dockCollapseBtn.addEventListener('click', function () {
      state.controlsCollapsed = !state.controlsCollapsed;
      bottomDock.classList.toggle('collapsed', state.controlsCollapsed);
      dockCollapseBtn.textContent = state.controlsCollapsed ? '▴ SHOW CONTROLS' : '▾ HIDE CONTROLS';
    });

    var drawerToggleBtn = document.getElementById('drawer-toggle-btn');
    var flightDrawer = document.getElementById('flight-drawer');
    drawerToggleBtn.addEventListener('click', function () {
      state.drawerCollapsed = !state.drawerCollapsed;
      flightDrawer.classList.toggle('collapsed', state.drawerCollapsed);
    });

    document.getElementById('drawer-close-btn').addEventListener('click', function () {
      state.drawerCollapsed = true;
      flightDrawer.classList.add('collapsed');
    });

    // 6. Drawer Tab Switcher
    var drawerTabs = document.querySelectorAll('.drawer-tabs .tab-btn');
    drawerTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        drawerTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var targetMode = tab.getAttribute('data-tab');
        document.getElementById('tab-lookup-pane').style.display = targetMode === 'lookup' ? 'block' : 'none';
        document.getElementById('tab-manual-pane').style.display = targetMode === 'manual' ? 'block' : 'none';
      });
    });

    // 7. Flight Callsign Lookup
    var callsignInput = document.getElementById('flight-search-input');
    var searchBtn = document.getElementById('flight-search-btn');
    searchBtn.addEventListener('click', function () {
      handleFlightSearch(callsignInput.value);
    });
    callsignInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleFlightSearch(callsignInput.value);
    });

    // Preset Pill
    var presetPill = document.getElementById('preset-ba15');
    if (presetPill) {
      presetPill.addEventListener('click', function () {
        callsignInput.value = 'BA15';
        handleFlightSearch('BA15');
      });
    }

    // 8. Re-lock Camera Button
    var relockBtn = document.getElementById('relock-camera-btn');
    relockBtn.addEventListener('click', function () {
      state.userIntervened = false;
      state.autoFollowPlane = true;
      updateCameraLockUI();
      showToast('CAMERA RE-LOCKED TO AIRCRAFT OVERHEAD');
    });

    // 9. Navigation Dock Buttons
    document.getElementById('zoom-in-btn').addEventListener('click', function () {
      var offset = camera.position.clone().sub(controls.target);
      var currentDist = offset.length();
      var minDist = (controls && controls.minDistance) || 115;
      var newDist = Math.max(minDist, currentDist * 0.8);
      offset.setLength(newDist);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    });
    document.getElementById('zoom-out-btn').addEventListener('click', function () {
      var offset = camera.position.clone().sub(controls.target);
      var currentDist = offset.length();
      var maxDist = (controls && controls.maxDistance) || 650;
      var newDist = Math.min(maxDist, currentDist * 1.25);
      offset.setLength(newDist);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    });
    document.getElementById('pitch-toggle-btn').addEventListener('click', function () {
      state.is2DMode = !state.is2DMode;
      if (state.is2DMode) {
        // Top-down nadir view
        controls.maxPolarAngle = 0.01;
        controls.minPolarAngle = 0.01;
      } else {
        // 3D Oblique view
        controls.maxPolarAngle = Math.PI;
        controls.minPolarAngle = 0;
      }
      controls.update();
      document.getElementById('pitch-toggle-btn').textContent = state.is2DMode ? '2D' : '3D';
    });

    document.getElementById('compass-reset-btn').addEventListener('click', function () {
      // Smoothly reset azimuth to North up
      var r = camera.position.length();
      camera.position.set(0, 40, r);
      controls.target.set(0, 0, 0);
      controls.update();
    });

    // 10. Top Bar Actions (Share, CRT FX, About)
    document.getElementById('share-btn').addEventListener('click', handleShareTrip);
    document.getElementById('crt-fx-toggle').addEventListener('click', function () {
      state.crtFxEnabled = !state.crtFxEnabled;
      document.body.classList.toggle('crt-off', !state.crtFxEnabled);
      showToast(state.crtFxEnabled ? 'CRT SCANLINES & VIGNETTE ENABLED' : 'CRT SCANLINES DISABLED');
    });

    document.getElementById('about-btn').addEventListener('click', function () {
      document.getElementById('about-modal').classList.add('visible');
    });
    document.getElementById('about-modal-close').addEventListener('click', function () {
      document.getElementById('about-modal').classList.remove('visible');
    });

    document.getElementById('share-modal-close').addEventListener('click', function () {
      document.getElementById('share-modal').classList.remove('visible');
    });

    // 11. Manual Itinerary Planner Controls
    setupManualPlannerUI();

    // Auto populate BA15 search instances in drawer
    handleFlightSearch('BA15');

    // 12. Check for URL Hash on boot
    parseUrlHashOnLoad();
  }

  function setColorMode(mode) {
    state.colorMode = mode;
    sharedLineMaterial.uniforms.uColorMode.value = mode;

    document.body.classList.remove('theme-phosphor', 'theme-amber');
    if (mode === 1) document.body.classList.add('theme-phosphor');
    if (mode === 2) document.body.classList.add('theme-amber');
  }

  function updateCameraLockUI() {
    var relockBtn = document.getElementById('relock-camera-btn');
    if (state.userIntervened && state.legs.length > 0) {
      relockBtn.classList.add('visible');
    } else {
      relockBtn.classList.remove('visible');
    }
  }

  // -------------------------------------------------------------
  // FLIGHT LOOKUP & MANUAL PLANNER
  // -------------------------------------------------------------

  function handleFlightSearch(query) {
    if (!query) return;
    var callsign = query.trim().toUpperCase();
    var flightData = window.CARTO_DATA.lookupFlight(callsign);
    var resultsContainer = document.getElementById('flight-search-results');
    resultsContainer.innerHTML = '';

    if (!flightData || !flightData.instances || flightData.instances.length === 0) {
      resultsContainer.innerHTML = '<div style="color:var(--crt-amber); font-size:11px; padding:8px;">[!] NO PRE-CACHED ROUTE FOUND FOR ' + callsign + '. USE MANUAL PLANNER TAB TO BUILD ANY ROUTE.</div>';
      return;
    }

    flightData.instances.forEach(function (inst) {
      var card = document.createElement('div');
      card.className = 'flight-card';

      var legsHtml = '';
      for (var j = 0; j < inst.legs.length; j++) {
        var l = inst.legs[j];
        var hours = Math.floor(l.flightMinutes / 60);
        var mins = l.flightMinutes % 60;
        legsHtml += '<div class="flight-leg-mini"><span>' + (l.callsign || inst.callsign) + ': ' + l.fromIata + ' ➔ ' + l.toIata + '</span><span>' + hours + 'h ' + mins + 'm</span></div>';
        if (l.layoverMinutes > 0) {
          var loH = Math.floor(l.layoverMinutes / 60);
          var loM = l.layoverMinutes % 60;
          legsHtml += '<div class="layover-mini">LAYOVER AT ' + l.toIata + ': ' + loH + 'h ' + loM + 'm</div>';
        }
      }

      card.innerHTML = 
        '<div class="flight-card-title">' + inst.title + '</div>' +
        '<div class="flight-card-sub">' + inst.subtitle + '</div>' +
        legsHtml +
        '<div style="margin-top:8px; display:flex; gap:6px;">' +
        '<button class="wopr-btn primary" style="flex:1; padding:4px 8px; font-size:10px;">▶ LOAD & PLAY (3600X)</button>' +
        '<button class="wopr-btn amber quick-preview-btn" style="padding:4px 8px; font-size:10px;">⚡ 600X PREVIEW</button>' +
        '</div>';

      card.querySelector('.wopr-btn.primary').addEventListener('click', function (e) {
        e.stopPropagation();
        loadFlightInstance(inst, 3600);
      });

      card.querySelector('.quick-preview-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        loadFlightInstance(inst, 600);
      });

      resultsContainer.appendChild(card);
    });
  }

  function loadFlightInstance(instance, playbackSpeed) {
    // Departure time: offset relative to today
    var nowMs = Date.now();
    var depMs = nowMs + (instance.departureHourOffset || 0) * 3600000;

    state.activeFlightInfo = instance.title;
    state.departureUtcMs = depMs;
    state.legs = JSON.parse(JSON.stringify(instance.legs));
    state.simDate = new Date(depMs);
    state.isPlaying = true;
    state.speedMultiplier = playbackSpeed || 3600;
    state.timeDirection = 1;
    state.userIntervened = false;
    state.autoFollowPlane = true;

    // Update Speed preset active button
    var speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(function (b) {
      var s = parseFloat(b.getAttribute('data-speed'));
      b.classList.toggle('active', s === state.speedMultiplier);
    });

    rebuildItinerary3D();
    updateCameraLockUI();
    showToast('LOADED ' + instance.title + ' // PLAYBACK STARTED');

    // Auto close drawer on mobile/small screen
    if (window.innerWidth < 900) {
      state.drawerCollapsed = true;
      document.getElementById('flight-drawer').classList.add('collapsed');
    }
  }

  // -------------------------------------------------------------
  // MANUAL PLANNER MULTI-LEG BUILDER
  // -------------------------------------------------------------

  var manualLegsState = [
    { fromIata: 'GVA', toIata: 'AUH', flightH: 6, flightM: 25, layoverH: 2, layoverM: 45 },
    { fromIata: 'AUH', toIata: 'CNX', flightH: 6, flightM: 15, layoverH: 0, layoverM: 0 }
  ];

  function setupManualPlannerUI() {
    var container = document.getElementById('manual-legs-list');
    var addLegBtn = document.getElementById('add-manual-leg-btn');
    var applyPlanBtn = document.getElementById('apply-manual-plan-btn');

    renderManualLegs(container);

    addLegBtn.addEventListener('click', function () {
      var lastDest = manualLegsState.length > 0 ? manualLegsState[manualLegsState.length - 1].toIata : 'AUH';
      manualLegsState.push({
        fromIata: lastDest,
        toIata: 'BKK',
        flightH: 3,
        flightM: 30,
        layoverH: 0,
        layoverM: 0
      });
      renderManualLegs(container);
    });

    applyPlanBtn.addEventListener('click', function () {
      var compiledLegs = [];
      for (var i = 0; i < manualLegsState.length; i++) {
        var ml = manualLegsState[i];
        compiledLegs.push({
          id: 'manual_leg_' + (i + 1),
          callsign: 'PLAN_' + (i + 1),
          fromIata: ml.fromIata.toUpperCase(),
          toIata: ml.toIata.toUpperCase(),
          flightMinutes: (ml.flightH * 60) + ml.flightM,
          layoverMinutes: (ml.layoverH * 60) + ml.layoverM
        });
      }

      state.legs = compiledLegs;
      state.activeFlightInfo = 'MANUAL CUSTOM TRIP (' + compiledLegs[0].fromIata + ' ➔ ' + compiledLegs[compiledLegs.length - 1].toIata + ')';
      state.departureUtcMs = state.simDate.getTime();
      state.isPlaying = true;
      state.speedMultiplier = 3600;
      state.userIntervened = false;
      state.autoFollowPlane = true;

      rebuildItinerary3D();
      updateCameraLockUI();
      showToast('APPLIED CUSTOM MULTI-LEG ITINERARY');
    });

    // Autocomplete handler on focus/input
    setupAutocompleteListeners();
  }

  function renderManualLegs(container) {
    container.innerHTML = '';

    manualLegsState.forEach(function (leg, idx) {
      var row = document.createElement('div');
      row.className = 'leg-builder-row';

      var removeBtnHtml = manualLegsState.length > 1 
        ? '<button class="wopr-btn danger remove-leg-btn" data-idx="' + idx + '" style="padding:2px 6px; font-size:10px;">✕ REMOVE</button>' 
        : '';

      row.innerHTML = 
        '<div class="leg-builder-header">' +
        '<span>LEG #' + (idx + 1) + ': ' + leg.fromIata + ' ➔ ' + leg.toIata + '</span>' +
        removeBtnHtml +
        '</div>' +
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">' +
        '<div class="input-group" style="margin:0;">' +
        '<label class="input-label">FROM (IATA / CITY)</label>' +
        '<input type="text" class="wopr-input airport-ac-input" data-field="from" data-idx="' + idx + '" value="' + leg.fromIata + '">' +
        '</div>' +
        '<div class="input-group" style="margin:0;">' +
        '<label class="input-label">TO (IATA / CITY)</label>' +
        '<input type="text" class="wopr-input airport-ac-input" data-field="to" data-idx="' + idx + '" value="' + leg.toIata + '">' +
        '</div>' +
        '</div>' +
        '<div class="leg-durations">' +
        '<div>' +
        '<label class="input-label">FLIGHT TIME</label>' +
        '<div style="display:flex; gap:4px;">' +
        '<input type="number" min="0" max="24" class="wopr-input duration-input" data-field="flightH" data-idx="' + idx + '" value="' + leg.flightH + '" style="width:50%;"> h ' +
        '<input type="number" min="0" max="59" class="wopr-input duration-input" data-field="flightM" data-idx="' + idx + '" value="' + leg.flightM + '" style="width:50%;"> m' +
        '</div>' +
        '</div>' +
        '<div>' +
        '<label class="input-label">LAYOVER TIME</label>' +
        '<div style="display:flex; gap:4px;">' +
        '<input type="number" min="0" max="24" class="wopr-input duration-input" data-field="layoverH" data-idx="' + idx + '" value="' + leg.layoverH + '" style="width:50%;"> h ' +
        '<input type="number" min="0" max="59" class="wopr-input duration-input" data-field="layoverM" data-idx="' + idx + '" value="' + leg.layoverM + '" style="width:50%;"> m' +
        '</div>' +
        '</div>' +
        '</div>';

      container.appendChild(row);
    });

    // Wire Remove Leg buttons
    container.querySelectorAll('.remove-leg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        manualLegsState.splice(idx, 1);
        renderManualLegs(container);
      });
    });

    // Wire Duration Inputs
    container.querySelectorAll('.duration-input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var idx = parseInt(inp.getAttribute('data-idx'), 10);
        var field = inp.getAttribute('data-field');
        manualLegsState[idx][field] = parseInt(inp.value, 10) || 0;
      });
    });
  }

  function setupAutocompleteListeners() {
    var acDropdown = document.getElementById('ac-dropdown-list');

    document.addEventListener('input', function (e) {
      if (!e.target.classList.contains('airport-ac-input')) return;
      var query = e.target.value.trim();
      state.acTargetInput = e.target;

      if (query.length < 1) {
        acDropdown.classList.remove('visible');
        return;
      }

      var matches = window.CARTO_DATA.searchAirports(query);
      if (matches.length === 0) {
        acDropdown.classList.remove('visible');
        return;
      }

      acDropdown.innerHTML = '';
      matches.forEach(function (ap) {
        var item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = '<strong>[' + ap.iata + ']</strong> ' + ap.city + ' — ' + ap.name + ' (' + ap.country + ')';
        item.addEventListener('click', function () {
          selectAirportForInput(ap);
        });
        acDropdown.appendChild(item);
      });

      // Position dropdown below input
      var rect = e.target.getBoundingClientRect();
      acDropdown.style.top = (rect.bottom + window.scrollY) + 'px';
      acDropdown.style.left = (rect.left + window.scrollX) + 'px';
      acDropdown.style.width = rect.width + 'px';
      acDropdown.classList.add('visible');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#ac-dropdown-list') && !e.target.classList.contains('airport-ac-input')) {
        acDropdown.classList.remove('visible');
      }
    });
  }

  function selectAirportForInput(airport) {
    if (!state.acTargetInput) return;
    state.acTargetInput.value = airport.iata;

    var idx = parseInt(state.acTargetInput.getAttribute('data-idx'), 10);
    var field = state.acTargetInput.getAttribute('data-field');
    if (!isNaN(idx) && field) {
      manualLegsState[idx][field + 'Iata'] = airport.iata;
    }

    document.getElementById('ac-dropdown-list').classList.remove('visible');

    // If user clicked airport, focus camera on it
    focusOnAirport(airport);
  }

  // -------------------------------------------------------------
  // URL SHARING & SERIALIZATION (#trip=...)
  // -------------------------------------------------------------

  function handleShareTrip() {
    if (!state.legs || state.legs.length === 0) {
      showToast('NO ACTIVE TRIP LOADED TO SHARE');
      return;
    }

    var compact = {
      t: state.departureUtcMs,
      s: state.speedMultiplier,
      m: state.colorMode,
      l: state.legs.map(function (leg) {
        return {
          c: leg.callsign || '',
          f: leg.fromIata,
          t: leg.toIata,
          fm: leg.flightMinutes,
          lm: leg.layoverMinutes || 0
        };
      })
    };

    var jsonStr = JSON.stringify(compact);
    var base64 = btoa(encodeURIComponent(jsonStr));
    var shareUrl = window.location.origin + window.location.pathname + '#trip=' + base64;

    window.location.hash = 'trip=' + base64;

    // Clipboard copy with fallback modal
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(function () {
        showToast('COPIED SHAREABLE TRIP LINK TO CLIPBOARD!');
      }).catch(function () {
        openShareModalFallback(shareUrl);
      });
    } else {
      openShareModalFallback(shareUrl);
    }
  }

  function openShareModalFallback(url) {
    var modal = document.getElementById('share-modal');
    document.getElementById('share-url-box').textContent = url;
    modal.classList.add('visible');
  }

  function parseUrlHashOnLoad() {
    var hash = window.location.hash;
    if (!hash || hash.indexOf('trip=') === -1) {
      // Default initial state: load BA15 Kangaroo Route preset!
      var defFlight = window.CARTO_DATA.lookupFlight('BA15');
      if (defFlight && defFlight.instances && defFlight.instances.length > 0) {
        loadFlightInstance(defFlight.instances[0], 3600);
      }
      return;
    }

    try {
      var match = hash.match(/trip=([^&]+)/);
      if (!match || !match[1]) return;
      var jsonStr = decodeURIComponent(atob(match[1]));
      var parsed = JSON.parse(jsonStr);

      if (parsed && parsed.l && parsed.l.length > 0) {
        state.departureUtcMs = Number(parsed.t) || Date.now();
        state.speedMultiplier = Number(parsed.s) || 10;
        state.colorMode = Number(parsed.m) || 0;
        state.legs = parsed.l.map(function (item, idx) {
          return {
            id: 'shared_leg_' + (idx + 1),
            callsign: item.c || undefined,
            fromIata: String(item.f).toUpperCase(),
            toIata: String(item.t).toUpperCase(),
            flightMinutes: Number(item.fm) || 360,
            layoverMinutes: Number(item.lm) || 0
          };
        });

        setColorMode(state.colorMode);
        state.simDate = new Date(state.departureUtcMs);
        state.isPlaying = true;
        rebuildItinerary3D();
        showToast('LOADED SHARED TRIP FROM URL!');
      }
    } catch (e) {
      console.warn('Failed to parse trip hash', e);
    }
  }

  // -------------------------------------------------------------
  // HUD TELEMETRY & SCALE BAR UPDATERS
  // -------------------------------------------------------------

  function updateTelemetryUI(subsolar) {
    var d = state.simDate;

    // Formatted UTC string
    var pad = function (n) { return n < 10 ? '0' + n : n; };
    var timeStr = d.getUTCFullYear() + '-' +
      pad(d.getUTCMonth() + 1) + '-' +
      pad(d.getUTCDate()) + ' ' +
      pad(d.getUTCHours()) + ':' +
      pad(d.getUTCMinutes()) + ':' +
      pad(d.getUTCSeconds()) + ' UTC';

    var clockEl = document.getElementById('hud-utc-clock');
    if (clockEl) clockEl.textContent = timeStr;

    // Subsolar coordinate readout
    var subsolarEl = document.getElementById('hud-subsolar');
    if (subsolarEl) {
      var latStr = Math.abs(subsolar.lat).toFixed(1) + '°' + (subsolar.lat >= 0 ? 'N' : 'S');
      var lonStr = Math.abs(subsolar.lon).toFixed(1) + '°' + (subsolar.lon >= 0 ? 'E' : 'W');
      subsolarEl.textContent = latStr + ' ' + lonStr;
    }

    // Solar Declination
    var decEl = document.getElementById('hud-declination');
    if (decEl) {
      decEl.textContent = (subsolar.lat >= 0 ? '+' : '') + subsolar.lat.toFixed(1) + '°';
    }

    // Update Sliders to match simulated time
    var hourSlider = document.getElementById('time-hour-slider');
    var hourVal = document.getElementById('time-hour-val');
    if (hourSlider && document.activeElement !== hourSlider) {
      var hFloat = d.getUTCHours() + d.getUTCMinutes() / 60;
      hourSlider.value = hFloat.toFixed(2);
      if (hourVal) hourVal.textContent = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
    }

    var doySlider = document.getElementById('time-doy-slider');
    var doyVal = document.getElementById('time-doy-val');
    if (doySlider && document.activeElement !== doySlider) {
      var startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      var doy = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000) + 1;
      doySlider.value = doy;
      if (doyVal) {
        var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        doyVal.textContent = months[d.getUTCMonth()] + ' ' + d.getUTCDate() + ' (DAY ' + doy + ')';
      }
    }

    var yearSlider = document.getElementById('time-year-slider');
    var yearVal = document.getElementById('time-year-val');
    if (yearSlider && document.activeElement !== yearSlider) {
      yearSlider.value = d.getUTCFullYear();
      if (yearVal) yearVal.textContent = d.getUTCFullYear();
    }
  }

  function updateItineraryUI(progress) {
    var flightScrubber = document.getElementById('flight-scrubber');
    var flightStatusBadge = document.getElementById('flight-status-badge');
    var flightReadout = document.getElementById('flight-hud-readout');

    var pct = (progress.totalProgress * 100).toFixed(1);

    if (flightScrubber && document.activeElement !== flightScrubber) {
      flightScrubber.value = pct;
    }

    if (flightStatusBadge) {
      flightStatusBadge.className = 'flight-status-badge ' + progress.status.toLowerCase();
      if (progress.status === 'EN_ROUTE') {
        var leg = state.legs[progress.activeLegIndex];
        flightStatusBadge.textContent = 'EN ROUTE (' + pct + '%)';
      } else if (progress.status === 'LAYOVER') {
        var remH = Math.floor(progress.layoverRemainingMinutes / 60);
        var remM = Math.floor(progress.layoverRemainingMinutes % 60);
        flightStatusBadge.textContent = 'LAYOVER @ ' + progress.currentAirportIata + ' (' + remH + 'h ' + remM + 'm)';
      } else if (progress.status === 'ARRIVED') {
        flightStatusBadge.textContent = 'ARRIVED @ ' + progress.currentAirportIata;
      } else {
        flightStatusBadge.textContent = 'SCHEDULED';
      }
    }

    if (flightReadout && state.legs.length > 0) {
      var routeStr = state.legs[0].fromIata;
      for (var i = 0; i < state.legs.length; i++) {
        routeStr += ' ➔ ' + state.legs[i].toIata;
      }
      flightReadout.textContent = (state.activeFlightInfo || 'ACTIVE FLIGHT') + ' // ' + routeStr;
    }
  }

  function updateCompassNeedle() {
    var needle = document.getElementById('compass-needle');
    if (!needle || !camera || !controls) return;
    var angle = 0;
    if (typeof controls.getAzimuthalAngle === 'function') {
      angle = controls.getAzimuthalAngle();
    } else {
      var offset = camera.position.clone().sub(controls.target);
      angle = Math.atan2(offset.x, offset.z);
    }
    needle.style.transform = 'rotate(' + (-angle * RAD2DEG) + 'deg)';
  }

  function updateScaleBar() {
    var scaleValEl = document.getElementById('scale-val');
    var scaleLineEl = document.getElementById('scale-line');
    if (!scaleValEl || !scaleLineEl || !camera) return;

    // Approximate ground resolution in km for current distance
    var camDist = camera.position.distanceTo(controls.target);
    var kmRepresented = Math.round((camDist / GLOBE_RADIUS) * 1200);
    scaleValEl.textContent = kmRepresented.toLocaleString() + ' KM';
  }

  function updateAirportBadges(list) {
    // Canvas/HTML callouts handled seamlessly
  }

  function showToast(msg) {
    var toast = document.getElementById('wopr-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function () {
      toast.classList.remove('visible');
    }, 2800);
  }

  // -------------------------------------------------------------
  // BOOTSTRAP ON DOM READY
  // -------------------------------------------------------------

  window.addEventListener('DOMContentLoaded', function () {
    initThree();
    setupUI();
    tick();
  });

})();
