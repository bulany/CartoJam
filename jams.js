window.CARTOJAM_DATA = {
  jams: [
    {
      id: "2026_10_22_french_departments",
      date: "2026-10-22",
      title: "The Human Topography of France",
      subtitle: "96 Metropolitan Departments & 13 Regions extruded in 3D by INSEE population",
      path: "./2026_10_22_french_departments/index.html",
      thumb: "./2026_10_22_french_departments/thumb.jpg",
      gif: "./2026_10_22_french_departments/preview.gif", // Uses thumb.jpg until preview.gif is added so hover never breaks!
      tags: ["Three.js", "MapLibre GL", "GeoJSON", "INSEE", "Offline-First"],
      stats: {
        human_min: 117.1,
        ai_min: 38.5,
        tokens: "72k+ (Argon) + 2x Max Pass (3.8 Flash)"
      },
      ai_log: {
        dayStart: "2026-10-22T13:50:00+02:00",
        dayEnd: "2026-10-22T17:40:00+02:00",
        events: [
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "13:58", end: "14:28", dur: "30m 09s", color: "#10b981", detail: "Voice spec: Shadertoy portfolio + 3D French departments" },
          { lane: "Gemini Argon (Architect)", actor: "Gemini Argon", start: "14:28", end: "14:29", dur: "48.2s (8,113 tok)", color: "#3b82f6", detail: "Turn 1: AI Studio prompt & repo blueprint" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "15:56", end: "16:16", dur: "19m 50s", color: "#10b981", detail: "Feedback, launched AI Studio Max Mode" },
          { lane: "AI Studio Build (3.8 Flash)", actor: "Gemini 3.8 Flash", start: "16:02", end: "16:18", dur: "16m 33s", color: "#f59e0b", detail: "Pass 1: Built 3D map, GeoJSON bundle & UI" },
          { lane: "Gemini Argon (Architect)", actor: "Gemini Argon", start: "16:16", end: "16:17", dur: "33.3s (12,856 tok)", color: "#3b82f6", detail: "Turn 2: dir_tree.py script & Jekyll fix" },
          { lane: "AI Studio Build (3.8 Flash)", actor: "Gemini 3.8 Flash", start: "16:18", end: "16:36", dur: "17m 25s", color: "#f59e0b", detail: "Pass 2: Auto-fixed container & verified" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "16:19", end: "16:34", dur: "15m 02s", color: "#10b981", detail: "Inspected repo tree & git setup" },
          { lane: "Gemini Argon (Architect)", actor: "Gemini Argon", start: "16:34", end: "16:35", dur: "48.8s (19,882 tok)", color: "#3b82f6", detail: "Turn 3: dir_tree v2 + git mv archive commands" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "16:37", end: "16:59", dur: "20m 39s", color: "#10b981", detail: "Tested 3D app offline & designed AI waterfall log" },
          { lane: "Gemini Argon (Architect)", actor: "Gemini Argon", start: "16:59", end: "17:01", dur: "1m 24.7s (31,355 tok)", color: "#3b82f6", detail: "Turn 4: Portfolio index.html & waterfall chart" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "17:03", end: "17:34", dur: "31m 26s", color: "#10b981", detail: "Deployed GitHub Pages, created thumb.jpg, emailed live link" },
          { lane: "Gemini Argon (Architect)", actor: "Gemini Argon", start: "17:34", end: "17:36", dur: "79.1 (40688 tok)", color: "#3b82f6", detail: "Turn 5: Finalized ai_log.json, fixed hover thumb & Next Thursday context" }
        ]
      }
    },
    {
      id: "2026_10_29_retro_flight_paths",
      date: "2026-10-29",
      title: "Retro Flight Paths",
      subtitle: "A retro-inspired 3D holographic flight path simulator with astronomical solar terminator & great-circle tracking",
      path: "./2026_10_29_retro_flight_paths/index.html",
      thumb: "./2026_10_29_retro_flight_paths/thumb.jpg",
      gif: "./2026_10_29_retro_flight_paths/preview.gif", // Uses thumb.jpg until preview.gif is added so hover never breaks!
      tags: ["Three.js", "CRT Shader", "Aviation", "Solar Terminator", "Offline-First", "No-Build"],
      stats: {
        human_min: 27.1,
        ai_min: 32.2,
        tokens: "26.3k+ (Flash Max & Argon) + 4x Passes (App Builder 3.8 Flash)"
      },
      ai_log: {
        dayStart: "2026-10-30T01:30:00+02:00",
        dayEnd: "2026-10-30T03:05:00+02:00",
        events: [
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "01:32", end: "01:43", dur: "11m 10s", color: "#10b981", detail: "Voice spec: WarGames WOPR 3D globe, EY426 route & CRT terminator" },
          { lane: "Gemini Flash Max", actor: "Gemini Flash Max", start: "01:43", end: "01:45", dur: "1m 52.1s (20,559 tok)", color: "#8b5cf6", detail: "Turn 1: Standalone single-file prototype (flash38.html)" },
          { lane: "Gemini Argon (Architect)", actor: "Gemini Argon", start: "01:48", end: "01:50", dur: "53.6s (5,794 tok)", color: "#3b82f6", detail: "Turn 2: Modular No-Build spec prompt for Google App Builder" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "02:00", end: "02:02", dur: "1m 11s", color: "#10b981", detail: "Pasted Argon spec to App Builder, logged initial telemetry" },
          { lane: "AI Studio Build (3.8 Flash)", actor: "Gemini 3.8 Flash", start: "02:00", end: "02:12", dur: "12m 21s", color: "#f59e0b", detail: "Pass 1: Modular scaffolding (index, style, data, app)" },
          { lane: "AI Studio Build (3.8 Flash)", actor: "Gemini 3.8 Flash", start: "02:13", end: "02:15", dur: "1m 50s", color: "#f59e0b", detail: "Pass 2: Self-correction run for detected build errors" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "02:18", end: "02:25", dur: "7m 28s", color: "#10b981", detail: "Voice feedback: Google Earth center-pivot controls, BA15 Kangaroo preset, speed presets, loop flight" },
          { lane: "AI Studio Build (3.8 Flash)", actor: "Gemini 3.8 Flash", start: "02:26", end: "02:31", dur: "5m 25s", color: "#f59e0b", detail: "Pass 3: Camera pivot lock, BA15 default, 1x/600x/3600x speeds & loop animation" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "02:40", end: "02:45", dur: "5m 07s", color: "#10b981", detail: "Voice feedback: Clean grid, high-res contours, translucent ocean hollow globe, flash38.html toggle button" },
          { lane: "AI Studio Build (3.8 Flash)", actor: "Gemini 3.8 Flash", start: "02:46", end: "02:56", dur: "10m 16s", color: "#f59e0b", detail: "Pass 4: Ocean transparency, vector contours, alternate view modal switch" },
          { lane: "Human (Voice Spec & Test)", actor: "Bulany", start: "02:58", end: "03:00", dur: "2m 21s", color: "#10b981", detail: "Final voice polish: Remove inland vector artifacts, strip sun reticle/yellow ring, smooth plane motion" },
          { lane: "AI Studio Build (3.8 Flash)", actor: "Gemini 3.8 Flash", start: "03:00", end: "03:00", dur: "0s (Quota Reached)", color: "#ef4444", detail: "Pass 5: Cancelled due to quota limit reached" }
        ]
      }
    }
  ],
  archived: [
    { title: "France Trip 01", path: "./archive_2026_10_21/docs/france_trip_01.html" },
    { title: "Gemini Flights 04", path: "./archive_2026_10_21/docs/gemini_flights_04.html" },
    { title: "Gemini Globe 04", path: "./archive_2026_10_21/docs/gemini_globe_04.html" },
    { title: "Projection Lab", path: "./archive_2026_10_21/docs/projection.html" },
    { title: "R Gemini 01", path: "./archive_2026_10_21/docs/r_gemini_01.html" }
  ]
};