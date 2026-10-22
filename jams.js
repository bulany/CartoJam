window.CARTOJAM_DATA = {
  jams: [
    {
      id: "2026_10_22_french_departments",
      date: "2026-10-22",
      title: "The Human Topography of France",
      subtitle: "96 Metropolitan Departments & 13 Regions extruded in 3D by INSEE population",
      path: "./2026_10_22_french_departments/index.html",
      thumb: "./2026_10_22_french_departments/thumb.jpg",
      gif: "./2026_10_22_french_departments/thumb.jpg", // Uses thumb.jpg until preview.gif is added so hover never breaks!
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