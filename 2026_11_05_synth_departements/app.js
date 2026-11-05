/**
 * ============================================================================
 * CARTO JAM: "SYNTH-DÉPARTEMENTS" (Close Encounters 1977 Edition)
 * Core Audio Synthesis, Cartography, Sequencer, & Tracker Keyboard Engine
 * ============================================================================
 */

(function () {
  'use strict';

  // Check data presence
  if (!window.DATA || !window.DATA.departments) {
    console.error('Fatal: window.DATA not found. Ensure data.js is loaded.');
    return;
  }

  const {
    departments,
    idfCodes,
    chromaticPalette,
    noteNames,
    marseillaiseTheme
  } = window.DATA;

  // Department code lookup map
  const deptByCode = {};
  departments.forEach((d, i) => {
    deptByCode[d.code] = d;
  });

  // ==========================================================================
  // 1. AUDIO ENGINE (Pure Web Audio API - ARP 2500 Emulation)
  // ==========================================================================
  let audioCtx = null;
  let masterGain = null;
  let masterCompressor = null;
  let analyserNode = null;
  let reverbSend = null;
  let chorusNode = null;

  // Synth parameters
  const synthParams = {
    cutoff: 3500,       // Hz
    resonance: 6.0,     // Q
    detuneCents: 9,     // Osc 2 detune in cents
    reverbWet: 0.35,    // Reverb send level
    releaseTime: 0.28,  // seconds
    waveform: 'sawsquare', // 'sawsquare', 'saw', 'square'
    volume: 0.75
  };

  function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Master Limiter / Compressor to avoid any clipping
    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-14, audioCtx.currentTime);
    masterCompressor.knee.setValueAtTime(10, audioCtx.currentTime);
    masterCompressor.ratio.setValueAtTime(5, audioCtx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    masterCompressor.release.setValueAtTime(0.12, audioCtx.currentTime);

    // Master Gain
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(synthParams.volume, audioCtx.currentTime);

    // Analyser Node for Oscilloscope HUD
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.8;

    // Algorithmic Schroeder Reverb / Multi-Tap Delay Network
    const delay1 = audioCtx.createDelay();
    delay1.delayTime.setValueAtTime(0.14, audioCtx.currentTime);
    const delay2 = audioCtx.createDelay();
    delay2.delayTime.setValueAtTime(0.29, audioCtx.currentTime);

    const delayFeedback1 = audioCtx.createGain();
    delayFeedback1.gain.setValueAtTime(0.35, audioCtx.currentTime);
    const delayFeedback2 = audioCtx.createGain();
    delayFeedback2.gain.setValueAtTime(0.25, audioCtx.currentTime);

    const delayFilter = audioCtx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.setValueAtTime(2400, audioCtx.currentTime);

    reverbSend = audioCtx.createGain();
    reverbSend.gain.setValueAtTime(synthParams.reverbWet, audioCtx.currentTime);

    // Connect Reverb Network
    reverbSend.connect(delay1);
    delay1.connect(delayFilter);
    delayFilter.connect(delayFeedback1);
    delayFeedback1.connect(delay1);

    reverbSend.connect(delay2);
    delay2.connect(delayFeedback2);
    delayFeedback2.connect(delay2);

    delay1.connect(masterCompressor);
    delay2.connect(masterCompressor);

    // Master pipeline
    masterCompressor.connect(masterGain);
    masterGain.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);
  }

  function resumeAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  /**
   * Triggers an analog dual-oscillator voice with 24dB resonant lowpass filtering.
   */
  function playSynthVoice(freq, durationSec = 0.35) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // Dual Oscillators
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator();

    if (synthParams.waveform === 'sawsquare') {
      osc1.type = 'sawtooth';
      osc2.type = 'square';
    } else if (synthParams.waveform === 'square') {
      osc1.type = 'square';
      osc2.type = 'square';
    } else {
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
    }
    subOsc.type = 'triangle';

    osc1.frequency.setValueAtTime(freq, now);
    // Detuned Osc 2 for rich analog chorus beating
    osc2.frequency.setValueAtTime(freq * Math.pow(2, synthParams.detuneCents / 1200), now);
    // Sub-oscillator 1 octave lower for deep Spielberg bass punch
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    // Voice Voice Gain / Mixer
    const osc1Gain = audioCtx.createGain();
    osc1Gain.gain.setValueAtTime(0.45, now);
    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, now);
    const subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(0.20, now);

    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    subOsc.connect(subGain);

    // Voice Mixer
    const voiceMixer = audioCtx.createGain();
    osc1Gain.connect(voiceMixer);
    osc2Gain.connect(voiceMixer);
    subGain.connect(voiceMixer);

    // Cascaded 24dB Resonant Lowpass Filter (2 x 12dB BiquadFilters)
    const filter1 = audioCtx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.Q.setValueAtTime(synthParams.resonance * 0.7, now);

    const filter2 = audioCtx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.Q.setValueAtTime(synthParams.resonance * 0.7, now);

    // Filter Envelope (sweep down from peak on attack)
    const peakCutoff = Math.min(16000, synthParams.cutoff * 2.8);
    filter1.frequency.setValueAtTime(peakCutoff, now);
    filter1.frequency.exponentialRampToValueAtTime(Math.max(60, synthParams.cutoff), now + 0.18);

    filter2.frequency.setValueAtTime(peakCutoff, now);
    filter2.frequency.exponentialRampToValueAtTime(Math.max(60, synthParams.cutoff), now + 0.18);

    voiceMixer.connect(filter1);
    filter1.connect(filter2);

    // Amplitude Envelope (VCA)
    const vca = audioCtx.createGain();
    vca.gain.setValueAtTime(0.0001, now);
    // Fast attack (10ms)
    vca.gain.exponentialRampToValueAtTime(0.85, now + 0.012);
    // Punchy decay to sustain
    const sustainLevel = 0.5;
    vca.gain.exponentialRampToValueAtTime(sustainLevel, now + 0.12);

    // Note end & release
    const noteHold = Math.max(0.12, durationSec);
    const releaseStart = now + noteHold;
    const releaseDuration = synthParams.releaseTime;
    vca.gain.setValueAtTime(sustainLevel, releaseStart);
    vca.gain.exponentialRampToValueAtTime(0.0001, releaseStart + releaseDuration);

    filter2.connect(vca);

    // Send to dry path and reverb send
    vca.connect(masterCompressor);
    if (reverbSend) {
      vca.connect(reverbSend);
    }

    // Start & Stop Oscillators
    osc1.start(now);
    osc2.start(now);
    subOsc.start(now);

    const stopTime = releaseStart + releaseDuration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    subOsc.stop(stopTime);
  }

  // ==========================================================================
  // 2. MUSICAL MAPPING & UTILITIES
  // ==========================================================================
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function getNoteDetails(midi) {
    const pitchIndex = ((midi % 12) + 12) % 12;
    const pitchName = noteNames[pitchIndex];
    const octave = Math.floor(midi / 12) - 1;
    const fullName = `${pitchName}${octave}`;
    const color = chromaticPalette[pitchName] || '#FF9F1C';
    const freq = midiToFreq(midi);
    return { pitchName, octave, fullName, color, freq };
  }

  // Mode 1: 88-Key Spectrum
  function get88KeyMapping(deptIndex) {
    let midi;
    if (deptIndex < 88) {
      midi = 21 + deptIndex; // 21 (A0) to 108 (C8)
    } else {
      // Retrograde wrap for 89..96
      midi = 108 - 1 - (deptIndex - 88);
    }
    const d = getNoteDetails(midi);
    return {
      midi,
      pitchName: d.pitchName,
      octave: d.octave,
      fullName: d.fullName,
      freq: d.freq,
      color: d.color,
      keyNumber: deptIndex < 88 ? deptIndex + 1 : 88 - (deptIndex - 87)
    };
  }

  // Mode 2: "La Marseillaise" Melodic Modulator
  function getMarseillaiseMapping(deptIndex) {
    const theme = marseillaiseTheme;
    const noteIdx = deptIndex % theme.length;
    const cycle = Math.floor(deptIndex / theme.length);

    let transposition = 0;
    if (cycle === 1) transposition = 5;  // +4th
    if (cycle >= 2) transposition = 12; // +Octave

    const baseMidi = 62; // D4
    const item = theme[noteIdx];
    const midi = baseMidi + item.offset + transposition;
    const d = getNoteDetails(midi);

    return {
      midi,
      pitchName: d.pitchName,
      octave: d.octave,
      fullName: d.fullName,
      freq: d.freq,
      color: d.color,
      durationSixteenths: item.dur
    };
  }

  // Close Encounters 5-Tone Motif
  const CLOSE_ENCOUNTERS_MOTIF = [
    { midi: 62 }, // D4 (Re)
    { midi: 64 }, // E4 (Mi)
    { midi: 60 }, // C4 (Do)
    { midi: 48 }, // C3 (Do)
    { midi: 55 }, // G3 (Sol)
  ];

  // QWERTY Tracker Key Map
  const TRACKER_KEYS = {
    // Lower Octave
    'z': { semitone: 0, octave: 0, label: 'C' },
    's': { semitone: 1, octave: 0, label: 'C#', sharp: true },
    'x': { semitone: 2, octave: 0, label: 'D' },
    'd': { semitone: 3, octave: 0, label: 'D#', sharp: true },
    'c': { semitone: 4, octave: 0, label: 'E' },
    'v': { semitone: 5, octave: 0, label: 'F' },
    'g': { semitone: 6, octave: 0, label: 'F#', sharp: true },
    'b': { semitone: 7, octave: 0, label: 'G' },
    'h': { semitone: 8, octave: 0, label: 'G#', sharp: true },
    'n': { semitone: 9, octave: 0, label: 'A' },
    'j': { semitone: 10, octave: 0, label: 'A#', sharp: true },
    'm': { semitone: 11, octave: 0, label: 'B' },
    // Upper Octave
    'q': { semitone: 0, octave: 1, label: 'C' },
    '2': { semitone: 1, octave: 1, label: 'C#', sharp: true },
    'w': { semitone: 2, octave: 1, label: 'D' },
    '3': { semitone: 3, octave: 1, label: 'D#', sharp: true },
    'e': { semitone: 4, octave: 1, label: 'E' },
    'r': { semitone: 5, octave: 1, label: 'F' },
    '5': { semitone: 6, octave: 1, label: 'F#', sharp: true },
    't': { semitone: 7, octave: 1, label: 'G' },
    '6': { semitone: 8, octave: 1, label: 'G#', sharp: true },
    'y': { semitone: 9, octave: 1, label: 'A' },
    '7': { semitone: 10, octave: 1, label: 'A#', sharp: true },
    'u': { semitone: 11, octave: 1, label: 'B' },
  };

  // State
  let currentMode = 'chromatic'; // 'chromatic' | 'marseillaise'
  let currentDeptIndex = 0;
  let isPlaying = false;
  let sequenceTimer = null;
  let bpm = 120;
  let speedMultiplier = 1.0;
  let trackerBaseOctave = 4;

  // DOM Elements
  const elUnlockModal = document.getElementById('unlock-modal');
  const btnUnlockAudio = document.getElementById('btn-unlock-audio');
  const franceSvg = document.getElementById('france-svg');
  const idfSvg = document.getElementById('idf-svg');
  const nixieCode = document.getElementById('nixie-code');
  const nixieName = document.getElementById('nixie-name');
  const nixieChefLieu = document.getElementById('nixie-chef-lieu');
  const nixieMusicalInfo = document.getElementById('nixie-musical-info');
  const nixieCounter = document.getElementById('nixie-counter');
  const timelineSlider = document.getElementById('timeline-slider');
  const timelineBadge = document.getElementById('timeline-badge');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnRewind = document.getElementById('btn-rewind');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const tabChromatic = document.getElementById('tab-chromatic');
  const tabMarseillaise = document.getElementById('tab-marseillaise');
  const btnMothership = document.getElementById('btn-mothership');
  const mapTooltip = document.getElementById('map-tooltip');
  const scopeCanvas = document.getElementById('scope-canvas');
  const speedSlider = document.getElementById('speed-slider');
  const speedVal = document.getElementById('speed-val');
  const trackerOctaveVal = document.getElementById('tracker-octave-val');
  const btnOctaveDown = document.getElementById('btn-octave-down');
  const btnOctaveUp = document.getElementById('btn-octave-up');
  const trackerKeysContainer = document.getElementById('tracker-keys-container');

  // Sliders
  const sliderCutoff = document.getElementById('slider-cutoff');
  const valCutoff = document.getElementById('val-cutoff');
  const sliderRes = document.getElementById('slider-res');
  const valRes = document.getElementById('val-res');
  const sliderDetune = document.getElementById('slider-detune');
  const valDetune = document.getElementById('val-detune');
  const sliderReverb = document.getElementById('slider-reverb');
  const valReverb = document.getElementById('val-reverb');
  const sliderRelease = document.getElementById('slider-release');
  const valRelease = document.getElementById('val-release');
  const waveBtns = document.querySelectorAll('.wave-btn');

  // ==========================================================================
  // 3. CARTOGRAPHY RENDERING (SVG Generation)
  // ==========================================================================
  const mapPathsByCode = {};
  const idfPathsByCode = {};

  function renderMap() {
    // Render main France map
    franceSvg.setAttribute('viewBox', window.DATA.viewBox);
    let mainSvgContent = '<g id="france-departments-group">';

    departments.forEach(dept => {
      // Modulo-12 color for default idle fill
      const note = get88KeyMapping(dept.index);
      mainSvgContent += `
        <path
          id="dept-main-${dept.code}"
          class="dept-path"
          data-code="${dept.code}"
          data-index="${dept.index}"
          d="${dept.path}"
          fill="${note.color}"
          style="color: ${note.color}"
        />
      `;
    });
    mainSvgContent += '</g>';
    franceSvg.innerHTML = mainSvgContent;

    // Cache main paths
    departments.forEach(dept => {
      mapPathsByCode[dept.code] = document.getElementById(`dept-main-${dept.code}`);
    });

    // Render Zoom Inset for Île-de-France (top-left)
    idfSvg.setAttribute('viewBox', window.DATA.idfViewBox);
    let idfSvgContent = '<g id="idf-departments-group">';

    // Render only IDF departments
    idfCodes.forEach(code => {
      const dept = deptByCode[code];
      if (!dept) return;
      const note = get88KeyMapping(dept.index);
      idfSvgContent += `
        <path
          id="dept-idf-${dept.code}"
          class="idf-dept-path"
          data-code="${dept.code}"
          data-index="${dept.index}"
          d="${dept.path}"
          fill="${note.color}"
          style="color: ${note.color}"
        />
        <text
          x="${dept.centroid[0]}"
          y="${dept.centroid[1]}"
          class="idf-label"
        >${dept.code}</text>
      `;
    });
    idfSvgContent += '</g>';
    idfSvg.innerHTML = idfSvgContent;

    // Cache idf paths
    idfCodes.forEach(code => {
      idfPathsByCode[code] = document.getElementById(`dept-idf-${code}`);
    });

    // Attach map events
    attachMapInteractions(franceSvg);
    attachMapInteractions(idfSvg);
  }

  function attachMapInteractions(svgEl) {
    svgEl.addEventListener('click', (e) => {
      const target = e.target.closest('path');
      if (!target) return;
      const code = target.getAttribute('data-code');
      const dept = deptByCode[code];
      if (dept) {
        if (isPlaying) pauseSequence();
        triggerDepartment(dept.index, true);
      }
    });

    svgEl.addEventListener('mousemove', (e) => {
      const target = e.target.closest('path');
      if (!target) {
        mapTooltip.style.display = 'none';
        return;
      }
      const code = target.getAttribute('data-code');
      const dept = deptByCode[code];
      if (dept) {
        const info = getActiveNoteInfo(dept.index);
        mapTooltip.style.display = 'block';
        mapTooltip.style.left = `${e.clientX}px`;
        mapTooltip.style.top = `${e.clientY}px`;
        mapTooltip.innerHTML = `
          <strong>[${dept.code}] ${dept.name}</strong><br>
          <span style="color:var(--neon-cyan)">Chef-lieu: ${dept.chefLieu}</span><br>
          <span style="color:${info.color}">Note: ${info.fullName} (${info.freq.toFixed(1)} Hz)</span>
        `;
      }
    });

    svgEl.addEventListener('mouseleave', () => {
      mapTooltip.style.display = 'none';
    });
  }

  // ==========================================================================
  // 4. SEQUENCER & PLAYBACK
  // ==========================================================================
  function getActiveNoteInfo(deptIndex) {
    if (currentMode === 'chromatic') {
      return get88KeyMapping(deptIndex);
    } else {
      return getMarseillaiseMapping(deptIndex);
    }
  }

  function updateHUD(dept, noteInfo) {
    nixieCode.textContent = `[ ${dept.code} ]`;
    nixieName.textContent = dept.name;
    nixieChefLieu.textContent = `Chef-lieu: ${dept.chefLieu}`;
    nixieCounter.textContent = `${String(dept.index + 1).padStart(2, '0')} / 96`;

    if (currentMode === 'chromatic') {
      nixieMusicalInfo.textContent = `Key #${noteInfo.keyNumber} (${noteInfo.fullName}) | MIDI ${noteInfo.midi} | Freq: ${noteInfo.freq.toFixed(2)} Hz`;
    } else {
      const cycle = Math.floor(dept.index / marseillaiseTheme.length) + 1;
      nixieMusicalInfo.textContent = `La Marseillaise Cycle ${cycle} | ${noteInfo.fullName} | MIDI ${noteInfo.midi} | ${noteInfo.freq.toFixed(2)} Hz`;
    }

    nixieCode.style.color = noteInfo.color;
    nixieCode.style.textShadow = `0 0 16px ${noteInfo.color}, 0 0 32px ${noteInfo.color}`;

    timelineSlider.value = dept.index;
    timelineBadge.textContent = `${dept.index + 1} / 96`;

    // Highlight chromatic palette legend
    document.querySelectorAll('.legend-chip').forEach(chip => {
      if (chip.getAttribute('data-note') === noteInfo.pitchName) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Flash mothership light bulbs
    const bulbs = document.querySelectorAll('.light-bulb');
    const bulbIdx = dept.index % bulbs.length;
    bulbs.forEach((b, i) => {
      if (i === bulbIdx) {
        b.classList.add('active');
        b.style.color = noteInfo.color;
      } else {
        b.classList.remove('active');
      }
    });
  }

  function triggerDepartment(deptIndex, playAudio = true) {
    if (deptIndex < 0) deptIndex = 0;
    if (deptIndex >= departments.length) deptIndex = departments.length - 1;

    currentDeptIndex = deptIndex;
    const dept = departments[deptIndex];
    const noteInfo = getActiveNoteInfo(deptIndex);

    // Visual Glow on both Main Map and Inset
    const mainPath = mapPathsByCode[dept.code];
    if (mainPath) {
      mainPath.classList.add('active');
      setTimeout(() => mainPath.classList.remove('active'), 350);
    }

    const idfPath = idfPathsByCode[dept.code];
    if (idfPath) {
      idfPath.classList.add('active');
      setTimeout(() => idfPath.classList.remove('active'), 350);
    }

    // Play Synth Voice
    if (playAudio) {
      let durationSec = 0.28;
      if (currentMode === 'marseillaise' && noteInfo.durationSixteenths) {
        // Duration derived from sixteenth-note count at current tempo
        const sixteenthSec = (60 / bpm) / 4 / speedMultiplier;
        durationSec = noteInfo.durationSixteenths * sixteenthSec;
      }
      playSynthVoice(noteInfo.freq, durationSec);
    }

    // Update HUD display
    updateHUD(dept, noteInfo);
  }

  function stepSequence() {
    triggerDepartment(currentDeptIndex, true);

    let nextIntervalMs = 250 / speedMultiplier;
    if (currentMode === 'marseillaise') {
      const noteInfo = getMarseillaiseMapping(currentDeptIndex);
      const sixteenthMs = (60000 / bpm) / 4 / speedMultiplier;
      nextIntervalMs = (noteInfo.durationSixteenths || 4) * sixteenthMs;
    }

    currentDeptIndex = (currentDeptIndex + 1) % departments.length;

    if (isPlaying) {
      sequenceTimer = setTimeout(stepSequence, nextIntervalMs);
    }
  }

  function playSequence() {
    resumeAudio();
    if (isPlaying) return;
    isPlaying = true;
    btnPlayPause.innerHTML = '<span>⏸</span> PAUSE';
    btnPlayPause.classList.add('playing');
    stepSequence();
  }

  function pauseSequence() {
    isPlaying = false;
    clearTimeout(sequenceTimer);
    btnPlayPause.innerHTML = '<span>▶</span> PLAY';
    btnPlayPause.classList.remove('playing');
  }

  function rewindSequence() {
    pauseSequence();
    currentDeptIndex = 0;
    triggerDepartment(0, true);
  }

  function setMode(mode) {
    currentMode = mode;
    tabChromatic.classList.toggle('active', mode === 'chromatic');
    tabMarseillaise.classList.toggle('active', mode === 'marseillaise');
    // Refresh HUD
    triggerDepartment(currentDeptIndex, false);
  }

  // Close Encounters 5-Tone Motif Action
  function playCloseEncountersMotif() {
    resumeAudio();
    if (isPlaying) pauseSequence();

    const motif = CLOSE_ENCOUNTERS_MOTIF;
    let step = 0;

    function playNextMotifTone() {
      if (step >= motif.length) return;
      const note = motif[step];
      const d = getNoteDetails(note.midi);

      // Flash matching departments with that pitch
      departments.forEach(dept => {
        const deptNote = getActiveNoteInfo(dept.index);
        if (deptNote.pitchName === d.pitchName) {
          const p = mapPathsByCode[dept.code];
          if (p) {
            p.classList.add('active');
            setTimeout(() => p.classList.remove('active'), 500);
          }
        }
      });

      // Cinematic Spielberg voice: longer duration and rich deep filter
      const originalCutoff = synthParams.cutoff;
      synthParams.cutoff = 4800;
      playSynthVoice(d.freq, 0.65);
      synthParams.cutoff = originalCutoff;

      // Update HUD
      nixieCode.textContent = `[ 1977 ]`;
      nixieName.textContent = `MOTHERSHIP COMMUNICATION`;
      nixieChefLieu.textContent = `Spielberg Close Encounters Motif (${step + 1}/5)`;
      nixieMusicalInfo.textContent = `${d.fullName} | ${d.freq.toFixed(2)} Hz | Alien Greeting`;
      nixieCode.style.color = d.color;

      step++;
      setTimeout(playNextMotifTone, 750 / speedMultiplier);
    }

    playNextMotifTone();
  }

  // ==========================================================================
  // 5. TRACKER KEYBOARD (FastTracker II ProTracker QWERTY Mode)
  // ==========================================================================
  function renderTrackerKeys() {
    let keysHtml = '';
    // Display Lower Octave keys
    const lowerKeys = ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'];
    lowerKeys.forEach(k => {
      const def = TRACKER_KEYS[k];
      const sharpClass = def.sharp ? 'sharp' : '';
      keysHtml += `
        <button class="tracker-key ${sharpClass}" data-key="${k}" title="Key ${k.toUpperCase()}">
          <span class="key-char">${k.toUpperCase()}</span>
          <span class="key-note">${def.label}</span>
        </button>
      `;
    });
    trackerKeysContainer.innerHTML = keysHtml;

    // Attach click/touch to tracker keys
    trackerKeysContainer.querySelectorAll('.tracker-key').forEach(btn => {
      btn.addEventListener('mousedown', () => {
        const k = btn.getAttribute('data-key');
        triggerTrackerKey(k);
      });
    });
  }

  function triggerTrackerKey(key) {
    const def = TRACKER_KEYS[key.toLowerCase()];
    if (!def) return;

    resumeAudio();

    const midi = (trackerBaseOctave + 1 + def.octave) * 12 + def.semitone;
    const noteInfo = getNoteDetails(midi);

    // Play tone
    playSynthVoice(noteInfo.freq, 0.45);

    // Visual button press
    const keyBtn = trackerKeysContainer.querySelector(`[data-key="${key.toLowerCase()}"]`);
    if (keyBtn) {
      keyBtn.classList.add('pressed');
      setTimeout(() => keyBtn.classList.remove('pressed'), 200);
    }

    // Flash departments sharing this pitch class
    departments.forEach(dept => {
      const dNote = getActiveNoteInfo(dept.index);
      if (dNote.pitchName === noteInfo.pitchName) {
        const mp = mapPathsByCode[dept.code];
        if (mp) {
          mp.classList.add('active');
          setTimeout(() => mp.classList.remove('active'), 300);
        }
      }
    });

    // Update HUD
    nixieCode.textContent = `[ ${noteInfo.fullName} ]`;
    nixieName.textContent = `TRACKER KEY [${key.toUpperCase()}]`;
    nixieChefLieu.textContent = `Pitch Class: ${noteInfo.pitchName} (Octave ${noteInfo.octave})`;
    nixieMusicalInfo.textContent = `MIDI ${midi} | Frequency: ${noteInfo.freq.toFixed(2)} Hz`;
    nixieCode.style.color = noteInfo.color;
  }

  // ==========================================================================
  // 6. VECTOR OSCILLOSCOPE (CRT Visualizer)
  // ==========================================================================
  function setupOscilloscope() {
    const ctx = scopeCanvas.getContext('2d');
    const width = scopeCanvas.width = scopeCanvas.clientWidth || 300;
    const height = scopeCanvas.height = scopeCanvas.clientHeight || 100;

    const dataArray = new Uint8Array(512);
    let lastDrawTime = 0;

    function draw(timestamp) {
      requestAnimationFrame(draw);

      // Throttle to ~30 FPS
      if (timestamp - lastDrawTime < 33) return;
      lastDrawTime = timestamp;

      if (!analyserNode) {
        // Idle flat phosphor line
        ctx.fillStyle = 'rgba(2, 3, 5, 0.25)';
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(46, 196, 182, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      analyserNode.getByteTimeDomainData(dataArray);

      // CRT Phosphor decay trail
      ctx.fillStyle = 'rgba(2, 3, 5, 0.25)';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2ec4b6';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#2ec4b6';

      ctx.beginPath();
      const sliceWidth = width * 1.0 / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    requestAnimationFrame(draw);
  }

  // ==========================================================================
  // 7. EVENT LISTENERS & INITIALIZATION
  // ==========================================================================
  function initListeners() {
    // Unlock modal
    btnUnlockAudio.addEventListener('click', () => {
      resumeAudio();
      elUnlockModal.classList.add('hidden');
      // Auto-start intro playback
      setTimeout(() => {
        playSequence();
      }, 200);
    });

    // Check for ?autostart=1 in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      resumeAudio();
      elUnlockModal.classList.add('hidden');
      setTimeout(() => {
        playSequence();
      }, 100);
    }

    // Transport buttons
    btnPlayPause.addEventListener('click', () => {
      if (isPlaying) {
        pauseSequence();
      } else {
        playSequence();
      }
    });

    btnRewind.addEventListener('click', rewindSequence);

    btnPrev.addEventListener('click', () => {
      if (isPlaying) pauseSequence();
      triggerDepartment(currentDeptIndex - 1, true);
    });

    btnNext.addEventListener('click', () => {
      if (isPlaying) pauseSequence();
      triggerDepartment(currentDeptIndex + 1, true);
    });

    // Timeline Slider
    timelineSlider.addEventListener('input', (e) => {
      const idx = parseInt(e.target.value, 10);
      if (isPlaying) pauseSequence();
      triggerDepartment(idx, true);
    });

    // Modes
    tabChromatic.addEventListener('click', () => setMode('chromatic'));
    tabMarseillaise.addEventListener('click', () => setMode('marseillaise'));

    // Mothership Motif
    btnMothership.addEventListener('click', playCloseEncountersMotif);

    // Speed Slider
    speedSlider.addEventListener('input', (e) => {
      speedMultiplier = parseFloat(e.target.value);
      speedVal.textContent = `${speedMultiplier.toFixed(1)}x`;
    });

    // Tracker Octave Buttons
    btnOctaveDown.addEventListener('click', () => {
      if (trackerBaseOctave > 1) {
        trackerBaseOctave--;
        trackerOctaveVal.textContent = `Octave: ${trackerBaseOctave}`;
      }
    });

    btnOctaveUp.addEventListener('click', () => {
      if (trackerBaseOctave < 7) {
        trackerBaseOctave++;
        trackerOctaveVal.textContent = `Octave: ${trackerBaseOctave}`;
      }
    });

    // Sliders: Cutoff
    sliderCutoff.addEventListener('input', (e) => {
      synthParams.cutoff = parseInt(e.target.value, 10);
      valCutoff.textContent = `${synthParams.cutoff} Hz`;
    });

    // Sliders: Resonance
    sliderRes.addEventListener('input', (e) => {
      synthParams.resonance = parseFloat(e.target.value);
      valRes.textContent = synthParams.resonance.toFixed(1);
    });

    // Sliders: Detune
    sliderDetune.addEventListener('input', (e) => {
      synthParams.detuneCents = parseInt(e.target.value, 10);
      valDetune.textContent = `${synthParams.detuneCents} cents`;
    });

    // Sliders: Reverb
    sliderReverb.addEventListener('input', (e) => {
      synthParams.reverbWet = parseFloat(e.target.value);
      valReverb.textContent = `${Math.round(synthParams.reverbWet * 100)}%`;
      if (reverbSend && audioCtx) {
        reverbSend.gain.setValueAtTime(synthParams.reverbWet, audioCtx.currentTime);
      }
    });

    // Sliders: Release
    sliderRelease.addEventListener('input', (e) => {
      synthParams.releaseTime = parseFloat(e.target.value);
      valRelease.textContent = `${synthParams.releaseTime.toFixed(2)}s`;
    });

    // Waveform selector buttons
    waveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        waveBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        synthParams.waveform = btn.getAttribute('data-wave');
      });
    });

    // Global Keyboard Listeners
    window.addEventListener('keydown', (e) => {
      // Avoid interfering if focus is in an input
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') return;

      const key = e.key.toLowerCase();

      // Space: Toggle Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) pauseSequence();
        else playSequence();
        return;
      }

      // Left / Right Arrows: Step Previous / Next
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (isPlaying) pauseSequence();
        triggerDepartment(currentDeptIndex - 1, true);
        return;
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (isPlaying) pauseSequence();
        triggerDepartment(currentDeptIndex + 1, true);
        return;
      }

      // Octave Shift: '-' / '+'
      if (key === '-' || key === '_') {
        btnOctaveDown.click();
        return;
      }
      if (key === '+' || key === '=') {
        btnOctaveUp.click();
        return;
      }

      // Tracker Keyboard input
      if (TRACKER_KEYS[key]) {
        e.preventDefault();
        triggerTrackerKey(key);
      }
    });
  }

  // ==========================================================================
  // 8. BOOTSTRAP
  // ==========================================================================
  function init() {
    renderMap();
    renderTrackerKeys();
    setupOscilloscope();
    initListeners();

    // Trigger initial department info (01 Ain)
    triggerDepartment(0, false);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
