// ================== 音频：WebAudio 合成音乐与音效 ==================
const AudioSys = (() => {
  let ac = null, master, comp, musicBus, sfxBus, reverb, revIn, noiseBuf;
  let muted = false, vol = 0.7;
  try { muted = localStorage.getItem('ls_muted') === '1'; const v = parseFloat(localStorage.getItem('ls_vol')); if (!isNaN(v)) vol = v; } catch (e) { }
  let cur = null, fading = [], wanted = null, timer = null;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function noteMidi(s) { const m = /^([A-G][#b]?)(-?\d)$/.exec(s); return m ? (parseInt(m[2]) + 1) * 12 + SEMI[m[1]] : null; }
  function chordNotes(name) { const m = /^([A-G][#b]?)(m?)$/.exec(name); const r = SEMI[m[1]]; return { root: r, third: r + (m[2] ? 3 : 4), fifth: r + 7 }; }
  function init() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC();
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.005; comp.release.value = 0.2;
    master = ac.createGain(); master.gain.value = muted ? 0 : vol;
    master.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0.62; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.85; sfxBus.connect(master);
    reverb = ac.createConvolver(); reverb.buffer = impulse(2.6, 2.6);
    revIn = ac.createGain(); revIn.gain.value = 1; revIn.connect(reverb);
    const wet = ac.createGain(); wet.gain.value = 0.32; reverb.connect(wet); wet.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    timer = setInterval(tick, 25);
    if (wanted) { const w = wanted; wanted = null; play(w); }
    return true;
  }
  function impulse(sec, decay) {
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 200 ? i / 200 : 1); }
    return b;
  }
  function unlock() { if (!init()) return; if (ac.state === 'suspended') ac.resume(); }
  // ---------- 乐器 ----------
  function env(g, t, a, d, s, r, dur, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * s, t + a, Math.max(0.01, d / 3));
    g.gain.setTargetAtTime(0.0001, t + Math.max(dur, a + 0.01), Math.max(0.01, r / 4));
  }
  function osc(type, f, t, stop, detune) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (detune) o.detune.value = detune; o.start(t); o.stop(stop); return o; }
  function send(node, amt) { if (amt > 0) { const s = ac.createGain(); s.gain.value = amt; node.connect(s); s.connect(revIn); } }
  function noise(t, stop) { const n = ac.createBufferSource(); n.buffer = noiseBuf; n.start(t, Math.random() * 1.5); n.stop(stop); return n; }
  const INST = {
    flute(t, f, dur, vel, out) {
      const stop = t + dur + 0.4, g = ac.createGain(), lp = ac.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 3800;
      const o1 = osc('triangle', f, t, stop), o2 = osc('sine', f * 2, t, stop), g2 = ac.createGain(); g2.gain.value = 0.18;
      const lfo = osc('sine', 5.4, t, stop), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + 0.3);
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
      env(g, t, 0.035, 0.2, 0.78, 0.25, dur, 0.34 * vel); g.connect(out); send(g, 0.4);
    },
    brass(t, f, dur, vel, out, soft) {
      const stop = t + dur + 0.4, g = ac.createGain(), lp = ac.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 1.6;
      const top = soft ? 2000 : 3200;
      lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(top, t + 0.06); lp.frequency.setTargetAtTime(top * 0.6, t + 0.06, 0.15);
      [-7, 7].forEach(dt => osc('sawtooth', f, t, stop, dt).connect(lp));
      const sq = osc('square', f / 2, t, stop), sg = ac.createGain(); sg.gain.value = 0.25; sq.connect(sg); sg.connect(lp);
      const lfo = osc('sine', 5.8, t, stop), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(8, t + 0.35); lfo.connect(lg);
      lp.connect(g); env(g, t, 0.025, 0.15, 0.72, 0.15, dur, (soft ? 0.13 : 0.15) * vel); g.connect(out); send(g, 0.28);
    },
    brassSoft(t, f, dur, vel, out) { INST.brass(t, f, dur, vel, out, true); },
    bell(t, f, dur, vel, out) {
      const stop = t + 2.2, g = ac.createGain();
      const c = osc('sine', f, t, stop), m = osc('sine', f * 3.5, t, stop), mg = ac.createGain();
      mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 1.4);
      m.connect(mg); mg.connect(c.frequency); c.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      g.connect(out); send(g, 0.55);
    },
    pluck(t, f, dur, vel, out) {
      const stop = t + 0.8, g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
      osc('triangle', f, t, stop).connect(lp); const s = osc('sawtooth', f, t, stop, 5), sg = ac.createGain(); sg.gain.value = 0.35; s.connect(sg); sg.connect(lp);
      lp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13 * vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      g.connect(out); send(g, 0.3);
    },
    stab(t, f, dur, vel, out) {
      const stop = t + 0.4, g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      [-10, 10].forEach(dt => osc('sawtooth', f, t, stop, dt).connect(lp)); lp.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * vel, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      g.connect(out); send(g, 0.2);
    },
    pad(t, f, dur, vel, out) {
      const stop = t + dur + 1.2, g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1150; lp.Q.value = 0.4;
      [-9, 0, 9].forEach(dt => osc('sawtooth', f, t, stop, dt).connect(lp));
      lp.connect(g); env(g, t, 0.35, 0.5, 0.9, 0.9, dur, 0.032 * vel); g.connect(out); send(g, 0.6);
    },
    bass(t, f, dur, vel, out) {
      const stop = t + dur + 0.3, g = ac.createGain();
      osc('sine', f, t, stop).connect(g); const tr = osc('triangle', f, t, stop), tg = ac.createGain(); tg.gain.value = 0.5; tr.connect(tg); tg.connect(g);
      env(g, t, 0.01, 0.25, 0.6, 0.08, dur * 0.9, 0.42 * vel); g.connect(out);
    },
    bassSaw(t, f, dur, vel, out) {
      const stop = t + dur + 0.3, g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
      lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(300, t + 0.15);
      osc('sawtooth', f, t, stop).connect(lp); osc('sine', f, t, stop).connect(g);
      lp.connect(g); env(g, t, 0.005, 0.12, 0.55, 0.05, dur * 0.85, 0.2 * vel); g.connect(out);
    },
    kick(t, f, dur, vel, out) {
      const o = osc('sine', 160, t, t + 0.4), g = ac.createGain();
      o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
      g.gain.setValueAtTime(0.95 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34); o.connect(g); g.connect(out);
    },
    snare(t, f, dur, vel, out) {
      const n = noise(t, t + 0.3), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 0.7;
      n.connect(bp); bp.connect(g); g.gain.setValueAtTime(0.38 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19); g.connect(out); send(g, 0.25);
      const o = osc('triangle', 190, t, t + 0.12), og = ac.createGain(); og.gain.setValueAtTime(0.25 * vel, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(og); og.connect(out);
    },
    rim(t, f, dur, vel, out) { INST.snare(t, f, dur, vel * 0.35, out); },
    hat(t, f, dur, vel, out) {
      const n = noise(t, t + 0.1), hp = ac.createBiquadFilter(), g = ac.createGain(); hp.type = 'highpass'; hp.frequency.value = 7500;
      n.connect(hp); hp.connect(g); g.gain.setValueAtTime(0.11 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045); g.connect(out);
    },
    tom(t, f, dur, vel, out) {
      const o = osc('sine', 210, t, t + 0.5), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(80, t + 0.3);
      g.gain.setValueAtTime(0.6 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(out); send(g, 0.3);
    },
    timpani(t, f, dur, vel, out) {
      const o = osc('sine', f, t, t + 1.6), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(f * 0.92, t + 1);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g); g.connect(out); send(g, 0.5);
      const n = noise(t, t + 0.2), lp = ac.createBiquadFilter(), ng = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 600;
      n.connect(lp); lp.connect(ng); ng.gain.setValueAtTime(0.2 * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); ng.connect(out);
    }
  };
  // ---------- 乐曲 ----------
  const SONGS = {
    title: {
      bpm: 84, chords: 'F C Dm Bb F C Bb C',
      mel: { inst: 'brass', unit: 2, oct: 0, notes: 'C5:2 F5:2 A5:4 | G5:3 F5:1 E5:2 C5:2 | D5:2 F5:2 A5:2 D6:2 | C6:6 Bb5:2 | A5:2 C6:2 F6:4 | E6:3 D6:1 C6:2 G5:2 | D6:2 C6:2 Bb5:2 A5:2 | G5:6 r:2' },
      dbl: { inst: 'bell', oct: 12, vel: 0.5, bars: [4, 8] },
      pad: 1, arp: { inst: 'bell', pat: 'x...x...x...x...', oct: 6, vel: 0.35 },
      bass: { inst: 'bass', pat: 'R.......F.......', oct: 2 },
      drums: { timpani: 'x...............', rim: '............x...' }
    },
    town: {
      bpm: 100, chords: 'C Am F G C Em F G Am F C G F G C C',
      mel: { inst: 'flute', unit: 2, notes: 'E5:2 G5:2 C6:3 B5:1 | A5:2 G5:2 E5:4 | F5:2 A5:2 C6:2 A5:2 | G5:6 r:2 | E5:2 G5:2 C6:3 D6:1 | E6:2 D6:2 B5:4 | A5:2 C6:2 B5:2 A5:2 | G5:6 r:2 | C6:3 B5:1 A5:2 E5:2 | F5:2 A5:2 C6:4 | G5:3 E5:1 C5:2 E5:2 | D5:6 G5:2 | A5:2 G5:2 F5:2 A5:2 | B5:2 A5:2 G5:2 D6:2 | E6:2 D6:2 C6:4 | C6:6 r:2' },
      dbl: { inst: 'bell', oct: 12, vel: 0.35, bars: [8, 16] },
      pad: 1, arp: { inst: 'pluck', pat: 'x.x.x.x.x.x.x.x.', oct: 4, vel: 0.8 },
      bass: { inst: 'bass', pat: 'R.....F.R...F...', oct: 2 },
      drums: { kick: 'x.......x.......', rim: '....x.......x...', hat: '..x...x...x...x.' }
    },
    route: {
      bpm: 128, chords: 'G D Em C G D C D Em C G D C D G D',
      mel: { inst: 'brassSoft', unit: 2, notes: 'D5:2 G5:2 A5:2 B5:2 | A5:3 F#5:1 D5:4 | E5:2 G5:2 B5:2 D6:2 | C6:4 B5:2 A5:2 | B5:2 D6:2 B5:2 G5:2 | A5:2 F#5:2 A5:2 D6:2 | E6:2 D6:2 C6:2 G5:2 | A5:6 r:2 | G5:2 F#5:2 E5:2 B4:2 | C5:2 E5:2 G5:4 | B4:2 D5:2 G5:2 B5:2 | A5:6 F#5:2 | G5:2 A5:2 B5:2 C6:2 | D6:2 C6:2 B5:2 A5:2 | G5:4 B5:2 D6:2 | D6:4 C6:2 A5:2' },
      dbl: { inst: 'flute', oct: -12, vel: 0.45, bars: [8, 16] },
      pad: 1, arp: { inst: 'pluck', pat: 'x.xxx.xxx.xxx.xx', oct: 4, vel: 0.6 },
      bass: { inst: 'bass', pat: 'R.R.R.R.F.F.O.R.', oct: 2 },
      drums: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }
    },
    battle: {
      bpm: 166, chords: 'Dm Bb C A Dm Bb Gm A',
      mel: { inst: 'brass', unit: 2, notes: 'D5:1 F5:1 A5:2 D6:2 C6:1 A5:1 | Bb5:3 A5:1 G5:2 F5:2 | E5:2 G5:2 C6:2 E6:2 | C#6:4 A5:2 E5:2 | D6:2 C6:1 A5:1 F5:2 A5:2 | D6:2 F6:2 E6:1 D6:1 Bb5:2 | G5:2 Bb5:2 D6:2 G6:2 | E6:4 C#6:2 A5:2' },
      dbl: { inst: 'bell', oct: 0, vel: 0.4, bars: [4, 8] },
      pad: 0.7, stab: { pat: '..x...x...x..x.x', oct: 4 },
      bass: { inst: 'bassSaw', pat: 'RRRRRRRRRRRROORR', oct: 2 },
      drums: { kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx' },
      fill: { bar: 8, snare: '....x...x.xxxxxx', tom: '........x.x.x...' }
    },

    // ---- v3 新增乐曲 ----
    lake: {
      bpm: 92, chords: 'D Bm G A D F#m G A',
      mel: { inst: 'flute', unit: 2, notes: 'F#5:3 A5:1 D6:4 | B5:2 A5:2 F#5:4 | G5:2 B5:2 D6:2 B5:2 | A5:6 r:2 | F#5:2 A5:2 D6:3 E6:1 | F#6:2 E6:2 C#6:4 | B5:2 D6:2 C#6:2 B5:2 | A5:6 r:2' },
      dbl: { inst: 'bell', oct: 12, vel: 0.4, bars: [0, 8] },
      pad: 1, arp: { inst: 'bell', pat: 'x..x..x.x..x..x.', oct: 5, vel: 0.3 },
      bass: { inst: 'bass', pat: 'R.......F...R...', oct: 2 },
      drums: { rim: '....x.......x...', hat: '..x...x...x...x.' }
    },
    forest: {
      bpm: 104, chords: 'Am F C G Am F E E',
      mel: { inst: 'flute', unit: 2, notes: 'A5:2 C6:2 E6:2 D6:2 | C6:3 B5:1 A5:4 | F5:2 A5:2 C6:2 E6:2 | D6:6 r:2 | E6:2 D6:2 C6:2 B5:2 | A5:2 C6:2 F6:4 | E6:3 D6:1 B5:2 G#5:2 | A5:6 r:2' },
      pad: 1, arp: { inst: 'pluck', pat: 'x..x..x.x..x..x.', oct: 4, vel: 0.7 },
      bass: { inst: 'bass', pat: 'R...R...F...R...', oct: 2 },
      drums: { kick: 'x.........x.....', rim: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }
    },
    desert: {
      bpm: 112, chords: 'Em Em C D Em Em C B',
      mel: { inst: 'brassSoft', unit: 2, notes: 'E5:2 F#5:1 G5:1 B5:4 | A5:2 G5:1 F#5:1 E5:4 | G5:2 A5:2 B5:2 C6:2 | D6:4 B5:4 | E6:2 D6:1 C6:1 B5:4 | A5:2 B5:1 A5:1 G5:4 | C6:2 B5:2 A5:2 G5:2 | F#5:4 D#5:4' },
      pad: 0.8, arp: { inst: 'pluck', pat: 'x.xx..x.x.xx..x.', oct: 4, vel: 0.7 },
      bass: { inst: 'bass', pat: 'R..R..R.R..R..F.', oct: 2 },
      drums: { kick: 'x..x..x.x.......', tom: '..........x...x.', hat: '..x...x...x...x.' }
    },
    snow: {
      bpm: 88, chords: 'C G Am Em F C F G',
      mel: { inst: 'bell', unit: 2, notes: 'E6:2 G6:2 C7:4 | B6:2 G6:2 D6:4 | C6:2 E6:2 A6:4 | G6:6 r:2 | F6:2 A6:2 C7:2 A6:2 | G6:2 E6:2 C6:4 | A5:2 C6:2 F6:2 E6:2 | D6:6 r:2' },
      dbl: { inst: 'flute', oct: -12, vel: 0.5, bars: [0, 8] },
      pad: 1.1, arp: { inst: 'bell', pat: 'x...x...x...x...', oct: 5, vel: 0.25 },
      bass: { inst: 'bass', pat: 'R.......R.......', oct: 2 },
      drums: { rim: '........x.......' }
    },
    volcano: {
      bpm: 150, chords: 'Cm Ab Bb G Cm Ab Fm G',
      mel: { inst: 'brass', unit: 2, notes: 'C5:2 Eb5:2 G5:2 C6:2 | Ab5:3 G5:1 F5:4 | Bb5:2 D6:2 F6:2 D6:2 | B5:6 G5:2 | C6:2 Eb6:2 G6:2 Eb6:2 | Ab6:3 G6:1 F6:4 | F6:2 Eb6:2 D6:2 C6:2 | B5:6 D6:2' },
      pad: 0.8, stab: { pat: 'x..x..x...x..x..', oct: 4 },
      bass: { inst: 'bassSaw', pat: 'RRRRRRRRRRRRFFOO', oct: 2 },
      drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', timpani: 'x...............' }
    },
    trainer: {
      bpm: 172, chords: 'Em C D B Em C Am B',
      mel: { inst: 'brass', unit: 2, notes: 'E5:1 G5:1 B5:2 E6:2 D6:1 B5:1 | C6:3 B5:1 A5:2 G5:2 | F#5:2 A5:2 D6:2 F#6:2 | D#6:4 B5:2 F#5:2 | E6:2 D6:1 B5:1 G5:2 B5:2 | E6:2 G6:2 F#6:1 E6:1 C6:2 | A5:2 C6:2 E6:2 A6:2 | F#6:4 D#6:2 B5:2' },
      dbl: { inst: 'bell', oct: 0, vel: 0.4, bars: [4, 8] },
      pad: 0.7, stab: { pat: 'x.x...x...x.x.x.', oct: 4 },
      bass: { inst: 'bassSaw', pat: 'RORORORORORORORO', oct: 2 },
      drums: { kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx' },
      fill: { bar: 8, snare: '....x...x.xxxxxx', tom: '........x.x.x...' }
    },
    quiz: {
      bpm: 120, chords: 'F Dm Bb C F Dm Bb C',
      mel: { inst: 'bell', unit: 2, notes: 'C6:1 r:1 A5:1 r:1 F5:2 A5:2 | D6:2 C6:2 A5:4 | Bb5:1 r:1 D6:1 r:1 F6:2 D6:2 | C6:6 r:2 | A5:2 C6:2 F6:2 E6:2 | D6:2 C6:2 A5:4 | Bb5:2 A5:2 G5:2 E5:2 | F5:6 r:2' },
      pad: 0.6, arp: { inst: 'pluck', pat: 'x.x.x.x.x.x.x.x.', oct: 4, vel: 0.5 },
      bass: { inst: 'bass', pat: 'R...F...R...F...', oct: 2 },
      drums: { kick: 'x.......x.......', rim: '....x.......x...', hat: '..x...x...x...x.' }
    },
    evolve: {
      bpm: 76, chords: 'Ab Bb Cm Cm Ab Bb C C',
      mel: { inst: 'brass', unit: 2, notes: 'Eb5:4 F5:4 | G5:4 Bb5:4 | C6:8 | r:4 G5:4 | Ab5:4 C6:4 | D6:4 F6:4 | E6:8 | G6:8' },
      dbl: { inst: 'bell', oct: 12, vel: 0.45, bars: [4, 8] },
      pad: 1.2, arp: { inst: 'bell', pat: 'x.x.x.x.x.x.x.x.', oct: 5, vel: 0.35 },
      bass: { inst: 'bass', pat: 'R.......R.......', oct: 2 },
      drums: { timpani: 'x.......x.......', rim: '............x.x.' }
    },
    victory: {
      bpm: 140, chords: 'C F G C',
      mel: { inst: 'brass', unit: 2, notes: 'G5:1 G5:1 G5:1 r:1 C6:4 | A5:2 C6:2 F6:4 | D6:2 B5:2 G5:2 B5:2 | C6:6 r:2' },
      dbl: { inst: 'bell', oct: 12, vel: 0.4, bars: [0, 4] },
      pad: 1, arp: { inst: 'pluck', pat: 'x.x.x.x.x.x.x.x.', oct: 5, vel: 0.6 },
      bass: { inst: 'bass', pat: 'R...F...R...O...', oct: 2 },
      drums: { kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }
    }
  };
  function build(name) {
    const S = SONGS[name], ev = [];
    const chords = S.chords.split(' '), bars = chords.length, L = bars * 16;
    // 旋律
    let st = 0;
    const toks = S.mel.notes.split(/\s+/).filter(x => x && x !== '|');
    toks.forEach(tk => {
      const [n, d] = tk.split(':'); const dur = parseFloat(d) * S.mel.unit;
      if (n !== 'r') {
        const m = noteMidi(n) + (S.mel.oct || 0);
        ev.push({ s: st, d: dur, i: S.mel.inst, m, v: 1 });
        if (S.dbl) { const bar = Math.floor(st / 16); if (bar >= S.dbl.bars[0] && bar < S.dbl.bars[1]) ev.push({ s: st, d: dur, i: S.dbl.inst, m: m + S.dbl.oct, v: S.dbl.vel }); }
      }
      st += dur;
    });
    chords.forEach((cn, b) => {
      const c = chordNotes(cn), base = b * 16;
      if (S.pad) [c.root, c.third, c.fifth].forEach(x => ev.push({ s: base, d: 16, i: 'pad', m: 60 + ((x + 12 - 0) % 12) - (x % 12 > 7 ? 12 : 0), v: S.pad }));
      if (S.arp) { const tones = [c.root, c.third, c.fifth, c.root + 12, c.fifth, c.third]; let k = 0; for (let i = 0; i < 16; i++) if (S.arp.pat[i] === 'x') { ev.push({ s: base + i, d: 2, i: S.arp.inst, m: (S.arp.oct + 1) * 12 + tones[k % tones.length], v: S.arp.vel }); k++; } }
      if (S.stab) for (let i = 0; i < 16; i++) if (S.stab.pat[i] === 'x') [c.root, c.third, c.fifth].forEach(x => ev.push({ s: base + i, d: 1, i: 'stab', m: (S.stab.oct + 1) * 12 + x, v: 1 }));
      if (S.bass) for (let i = 0; i < 16; i++) { const ch = S.bass.pat[i]; if (ch === '.') continue; const iv = ch === 'F' ? c.root + 7 : ch === 'O' ? c.root + 12 : c.root; let len = 1; while (i + len < 16 && S.bass.pat[i + len] === '.') len++; ev.push({ s: base + i, d: len, i: S.bass.inst, m: (S.bass.oct + 1) * 12 + iv, v: 1 }); }
      const dr = (S.fill && b === S.fill.bar - 1) ? Object.assign({}, S.drums, S.fill) : S.drums;
      for (const k in dr) { if (k === 'bar' || !INST[k]) continue; for (let i = 0; i < 16; i++) if (dr[k][i] === 'x') ev.push({ s: base + i, d: 1, i: k, m: k === 'timpani' ? 36 + c.root : 0, v: k === 'hat' ? (i % 2 ? 0.6 : 1) : 1 }); }
    });
    ev.sort((a, b) => a.s - b.s);
    return { name, ev, L, sx: 60 / S.bpm / 4 };
  }
  const built = {};
  function play(name) {
    if (!ac) { wanted = name; return; }
    if (cur && cur.name === name) return;
    const now = ac.currentTime;
    if (cur) { cur.gain.gain.cancelScheduledValues(now); cur.gain.gain.setValueAtTime(cur.gain.gain.value, now); cur.gain.gain.linearRampToValueAtTime(0.0001, now + 0.9); cur.stopAt = now + 0.9; fading.push(cur); cur = null; }
    if (!name) return;
    const b = built[name] || (built[name] = build(name));
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(1, now + 0.8); g.connect(musicBus);
    cur = { name, b, gain: g, t0: now + 0.08, idx: 0, loop: 0 };
  }
  function tick() {
    if (!ac) return;
    const now = ac.currentTime, ahead = now + 0.18;
    fading = fading.filter(f => { if (now > f.stopAt + 2) { try { f.gain.disconnect(); } catch (e) { } return false; } return true; });
    if (!cur) return;
    const c = cur, b = c.b;
    for (let guard = 0; guard < 400; guard++) {
      const e = b.ev[c.idx];
      const t = c.t0 + (c.loop * b.L + e.s) * b.sx;
      if (t > ahead) break;
      if (t >= now - 0.05) { try { INST[e.i](t, mtof(e.m), e.d * b.sx, e.v, c.gain); } catch (err) { } }
      c.idx++; if (c.idx >= b.ev.length) { c.idx = 0; c.loop++; }
    }
  }
  // ---------- 音效 ----------
  const SFX_ALIAS = { select: 'move', powerup: 'gold', victory_short: 'levelup', ok: 'confirm' };
  function sfx(name) {
    name = SFX_ALIAS[name] || name;
    if (!ac || ac.state !== 'running') return;
    const t = ac.currentTime + 0.005, o = sfxBus;
    const tone = (type, f0, f1, dur, vol, delay) => {
      const tt = t + (delay || 0), os = osc(type, f0, tt, tt + dur + 0.05), g = ac.createGain();
      if (f1) os.frequency.exponentialRampToValueAtTime(f1, tt + dur);
      g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(vol, tt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
      os.connect(g); g.connect(o); return g;
    };
    const nz = (freq, q, dur, vol, type, delay, f1) => {
      const tt = t + (delay || 0), n = noise(tt, tt + dur + 0.05), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, tt); if (f1) f.frequency.exponentialRampToValueAtTime(f1, tt + dur); f.Q.value = q;
      g.gain.setValueAtTime(vol, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
      n.connect(f); f.connect(g); g.connect(o); return g;
    };
    const B = (m, d, v, dl) => INST.bell(t + (dl || 0), mtof(m), d, v, o);
    switch (name) {
      case 'move': tone('sine', 1200, 1400, 0.05, 0.12); break;
      case 'confirm': tone('sine', 880, 0, 0.07, 0.16); tone('sine', 1320, 0, 0.12, 0.14, 0.05); break;
      case 'cancel': tone('sine', 700, 450, 0.12, 0.15); break;
      case 'blip': tone('triangle', 1500, 0, 0.03, 0.06); break;
      case 'step': nz(900, 0.8, 0.07, 0.10, 'lowpass'); break;
      case 'grass': nz(3500, 0.6, 0.14, 0.13, 'bandpass', 0, 1800); break;
      case 'bump': tone('sine', 120, 70, 0.1, 0.25); break;
      case 'encounter': [0, 3, 7, 12, 15, 19].forEach((x, i) => tone('square', mtof(76 + x), 0, 0.09, 0.05, i * 0.045)); nz(5000, 0.5, 0.4, 0.12, 'highpass', 0.25); break;
      case 'swoosh': nz(1200, 1, 0.22, 0.25, 'bandpass', 0, 4000); break;
      case 'hit': tone('sine', 180, 50, 0.18, 0.6); nz(2500, 0.6, 0.15, 0.5, 'lowpass', 0, 600); break;
      case 'super': tone('sine', 200, 45, 0.25, 0.7); nz(3000, 0.5, 0.25, 0.6, 'lowpass', 0, 500); B(91, 0.5, 0.6, 0.02); B(96, 0.5, 0.5, 0.08); break;
      case 'weak': tone('sine', 150, 80, 0.15, 0.35); nz(800, 0.8, 0.1, 0.2, 'lowpass'); break;
      case 'fire': nz(1500, 0.4, 0.5, 0.35, 'lowpass', 0, 400); break;
      case 'water': nz(1800, 2, 0.35, 0.3, 'bandpass', 0, 600); tone('sine', 600, 1400, 0.15, 0.12); break;
      case 'grassmove': nz(4000, 1, 0.4, 0.25, 'bandpass', 0, 2000); break;
      case 'electric': for (let i = 0; i < 5; i++) nz(6000, 0.4, 0.06, 0.25, 'highpass', i * 0.05); tone('sawtooth', 90, 60, 0.35, 0.12); break;
      case 'statdown': [0, -3, -6].forEach((x, i) => tone('triangle', mtof(79 + x), 0, 0.12, 0.12, i * 0.08)); break;
      case 'faint': tone('triangle', 600, 80, 0.7, 0.25); break;
      case 'throw': nz(800, 1.2, 0.35, 0.3, 'bandpass', 0, 3000); break;
      case 'shake': tone('square', 300, 0, 0.04, 0.08); tone('square', 260, 0, 0.04, 0.08, 0.08); break;
      case 'catch': tone('square', 600, 0, 0.05, 0.1); [0, 4, 7, 12].forEach((x, i) => B(84 + x, 0.6, 0.7, 0.1 + i * 0.07)); break;
      case 'levelup': [0, 4, 7, 12, 16, 19, 24].forEach((x, i) => B(72 + x, 0.5, 0.6, i * 0.06)); break;
      case 'heal': [0, 4, 7, 12, 7, 12, 16].forEach((x, i) => B(79 + x, 0.9, 0.7, i * 0.13)); break;
      case 'sendout': nz(2000, 0.8, 0.3, 0.2, 'bandpass', 0, 6000); B(88, 0.4, 0.4, 0.15); break;
      case 'run': nz(1000, 1, 0.4, 0.25, 'bandpass', 0, 300); break;

      case 'correct': B(84, 0.4, 0.6); B(88, 0.4, 0.6, 0.07); B(91, 0.6, 0.7, 0.14); tone('sine', 1760, 0, 0.12, 0.06, 0.14); break;
      case 'wrong': tone('square', 220, 180, 0.16, 0.08); tone('square', 180, 140, 0.22, 0.08, 0.14); break;
      case 'combo': [0, 4, 7, 11, 14, 19].forEach((x, i) => B(79 + x, 0.4, 0.55, i * 0.04)); nz(6000, 0.5, 0.3, 0.08, 'highpass', 0.1); break;
      case 'tick': tone('sine', 1900, 0, 0.03, 0.05); break;
      case 'crit': tone('sine', 240, 40, 0.35, 0.8); nz(4000, 0.4, 0.35, 0.6, 'lowpass', 0, 300); B(96, 0.6, 0.6, 0.03); B(103, 0.6, 0.4, 0.09); break;
      case 'beam': tone('sawtooth', 220, 880, 0.5, 0.08); nz(3000, 2, 0.6, 0.2, 'bandpass', 0, 8000); break;
      case 'ice': for (let i = 0; i < 6; i++) B(96 + (i % 3) * 5, 0.25, 0.35, i * 0.05); nz(7000, 1, 0.3, 0.15, 'highpass'); break;
      case 'rock': tone('sine', 90, 40, 0.4, 0.7); nz(400, 0.6, 0.4, 0.5, 'lowpass', 0.02, 120); nz(1200, 0.8, 0.2, 0.2, 'bandpass', 0.12); break;
      case 'charge': tone('sawtooth', 110, 660, 1.2, 0.06); nz(800, 1, 1.2, 0.12, 'bandpass', 0, 6000); break;
      case 'burst': tone('sine', 60, 30, 0.8, 0.9); nz(5000, 0.4, 1.0, 0.5, 'lowpass', 0, 200); [0, 7, 12, 16, 19, 24].forEach((x, i) => B(84 + x, 1.2, 0.6, 0.05 + i * 0.05)); break;
      case 'evolve': [0, 4, 7, 12, 16, 19, 24, 28].forEach((x, i) => B(72 + x, 1, 0.7, i * 0.09)); break;
      case 'chest': tone('square', 300, 600, 0.12, 0.06); [0, 4, 7, 12].forEach((x, i) => B(86 + x, 0.6, 0.6, 0.12 + i * 0.06)); break;
      case 'gate': tone('sine', 80, 60, 0.6, 0.5); nz(500, 0.5, 0.8, 0.3, 'lowpass', 0, 150); B(91, 0.8, 0.5, 0.4); B(96, 0.8, 0.5, 0.5); break;
      case 'gold': [0, 7, 12, 16, 19, 24, 28, 31].forEach((x, i) => B(76 + x, 0.9, 0.6, i * 0.05)); nz(8000, 0.5, 0.6, 0.1, 'highpass', 0.1); break;
      case 'wheel': tone('triangle', 1400, 0, 0.025, 0.07); break;
      case 'star': B(98, 0.3, 0.4); B(103, 0.3, 0.3, 0.05); break;
      case 'buy': B(88, 0.3, 0.5); B(95, 0.4, 0.5, 0.08); break;
      case 'save': B(84, 0.5, 0.6); B(91, 0.6, 0.6, 0.1); break;
    }
  }
  function jingle(name) {
    if (!ac) return;
    const now = ac.currentTime;
    musicBus.gain.cancelScheduledValues(now); musicBus.gain.setValueAtTime(musicBus.gain.value, now);
    musicBus.gain.linearRampToValueAtTime(0.08, now + 0.2); musicBus.gain.setValueAtTime(0.08, now + 2.4); musicBus.gain.linearRampToValueAtTime(0.62, now + 3.4);
    sfx(name);
  }
  function setMuted(m) { muted = m; try { localStorage.setItem('ls_muted', m ? '1' : '0'); } catch (e) { } if (ac) master.gain.setTargetAtTime(m ? 0 : vol, ac.currentTime, 0.05); }
  function setVol(v) { vol = clamp(v, 0, 1); try { localStorage.setItem('ls_vol', String(vol)); } catch (e) { } if (ac && !muted) master.gain.setTargetAtTime(vol, ac.currentTime, 0.05); }
  return {
    unlock, play, sfx, jingle, setMuted, setVol,
    get muted() { return muted; }, get vol() { return vol; }, get started() { return !!ac && ac.state === 'running'; },
    get current() { return cur ? cur.name : (wanted || null); }, _build: build, SONGS, INST, mtof
  };
})();
