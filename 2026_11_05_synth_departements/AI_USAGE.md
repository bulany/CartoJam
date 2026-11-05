# AI USAGE & ARCHITECTURAL PROVENANCE
## CartoJam 2026: "Synth-Départements" (Close Encounters 1977 Edition)

### 1. Project Overview & Prompt
- **Topic:** Interactive 3D/2D Web Audio cartography mapping all 96 metropolitan French departments to an analog ARP 2500 synthesizer console inspired by Spielberg's 1977 *Close Encounters of the Third Kind*.
- **Model:** `Gemini Flash 3.8` (via Google AI Studio App Builder)
- **Architect Model:** `Gemini Max Mode`
- **Date:** 2026-11-05

---

### 2. Architectural Design Decisions
1. **100% No-Build & Offline First (`file://` Double-Click Safe):**
   - Zero CORS blocking: `data.js` exposes all 96 pre-projected French department geometries and metadata globally on `window.DATA`.
   - Native `<script src="data.js">` and `<script src="app.js">` tags allow the file to run instantly on local double-click, static hosts, GitHub Pages, or Vite development servers.
2. **Close Encounters ARP 2500 Analog Synthesis Engine:**
   - Implemented exclusively using the native Web Audio API (zero external sound libraries or network audio downloads).
   - Dual-oscillator architecture (Sawtooth + Pulse-width/detuned Square) with a dedicated sub-oscillator for cinematic sub-bass punch.
   - Cascaded 4-pole 24dB resonant lowpass filter (`BiquadFilterNode` cascade with Q peaking and envelope sweeping).
   - Algorithmic Schroeder multi-tap delay & spatial reverberation network with high-frequency damping.
   - Master `DynamicsCompressorNode` to eliminate clipping while maintaining rich analog headroom.
3. **Dual Map & Île-de-France Zoom Inset:**
   - Metropolitan France + Corsica (2A, 2B in bottom-right).
   - Framed top-left zoom inset magnifying Paris and the Île-de-France petite/grande couronne (75, 92, 93, 94, 77, 78, 91, 95) by ~7x with explicit labels and coordinated event triggering.
4. **Playback Modes & Modulations:**
   - **Mode 1 (88-Key Spectrum):** Maps Department 01 (Ain) to Piano Key #1 (`A0`, 27.50 Hz), progressing chromatically to Key #88 (`C8`, 4186 Hz) at Department 88, wrapping smoothly in retrograde for Departments 89–96.
   - **Mode 2 (La Marseillaise Melodic Modulator):** 32-note theme of the French national anthem starting at Department 01 on Middle D (`D4`), cycling across the 96 departments with Bach-style circular transpositions (+5 semitones, +12 semitones).
   - **Mode 3 (1977 Mothership Motif):** Dedicated button triggering the Spielberg 5-tone sequence (D4, E4, C4, C3, G3) with glowing department illumination.
5. **Interactive Controls:**
   - FastTracker II / ProTracker QWERTY keyboard tracker mapping with octave transpose.
   - Real-time vector CRT oscilloscope rendered via HTML5 canvas and `AnalyserNode`.
   - Massive retro Nixie/LED readout displaying Department Code, Name, Chef-lieu, Key #, MIDI number, and exact frequency.
