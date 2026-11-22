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
  // ---------- v4 和风乐器：筝 / 三味线（Karplus-Strong 拨弦）、尺八、太鼓、钲、铃、弦乐、现代节拍 ----------
  const KS_CACHE = {};
  function ksBuffer(f, kind) {
    const key = kind + Math.round(f * 4); if (KS_CACHE[key]) return KS_CACHE[key];
    const sr = ac.sampleRate, dur = kind === 'koto' ? 2.4 : 1.2, len = Math.floor(sr * dur), b = ac.createBuffer(1, len, sr), y = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f)), decay = kind === 'koto' ? 0.9965 : 0.990, bright = kind === 'koto' ? 0.5 : 0.25;
    let prev = 0; for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * (1 - bright) + r * bright * 2 * (kind === 'koto' ? 0.7 : 1); y[i] = kind === 'koto' ? prev : r * 0.8; }
    for (let i = N; i < len; i++) { const v = decay * (0.5 * (y[i - N] + y[i - N + 1 < i ? i - N + 1 : i - N])); y[i] = kind === 'shami' ? Math.tanh(v * 1.25) * 0.8 : v; }
    for (let i = 0; i < 64 && i < len; i++) y[i] *= i / 64;
    return (KS_CACHE[key] = b);
  }
  function ksPlay(t, f, vel, out, kind, gainV, rev) {
    const src = ac.createBufferSource(); src.buffer = ksBuffer(f, kind);
    const g = ac.createGain(); g.gain.value = gainV * vel;
    if (kind === 'shami') { const pk = ac.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 2600; pk.Q.value = 1.2; pk.gain.value = 7; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 160; src.connect(hp); hp.connect(pk); pk.connect(g); }
    else src.connect(g);
    g.connect(out); send(g, rev); src.start(t); src.stop(t + src.buffer.duration);
  }
  Object.assign(INST, {
    koto(t, f, dur, vel, out) { ksPlay(t, f, vel, out, 'koto', 0.55, 0.42); },
    shami(t, f, dur, vel, out) {
      ksPlay(t, f, vel, out, 'shami', 0.5, 0.25);
      const n = noise(t, t + 0.03), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 3500; bp.Q.value = 1;
      n.connect(bp); bp.connect(g); g.gain.setValueAtTime(0.08 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); g.connect(out);
    },
    shaku(t, f, dur, vel, out) {
      const stop = t + dur + 0.5, g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      const o1 = osc('sine', f * 0.95, t, stop), o2 = osc('triangle', f * 0.95, t, stop), g2 = ac.createGain(); g2.gain.value = 0.35;
      [o1, o2].forEach(o => { o.frequency.setValueAtTime(f * 0.95, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); });
      const lfo = osc('sine', 4.8, t, stop), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + Math.min(0.4, dur * 0.5)); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.4, dur * 0.5) + 0.3);
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      o1.connect(lp); o2.connect(g2); g2.connect(lp);
      const n = noise(t, stop), bp = ac.createBiquadFilter(), ng = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 6; ng.gain.value = 0.5;
      n.connect(bp); bp.connect(ng); ng.connect(lp);
      const ch = ac.createGain(); ch.gain.setValueAtTime(0.0001, t); ch.gain.linearRampToValueAtTime(0.9, t + 0.02); ch.gain.exponentialRampToValueAtTime(0.25, t + 0.15); ng.connect(ch); ch.connect(g);
      lp.connect(g); env(g, t, 0.09, 0.3, 0.85, 0.3, dur, 0.3 * vel); g.connect(out); send(g, 0.6);
    },
    ryuteki(t, f, dur, vel, out) { INST.shaku(t, f, dur, vel * 0.8, out); },
    strings(t, f, dur, vel, out) {
      const stop = t + dur + 1.0, g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700; lp.Q.value = 0.5;
      [-11, -4, 4, 11].forEach(dt => { const o = osc('sawtooth', f, t, stop, dt); o.connect(lp); });
      const lfo = osc('sine', 5.2, t, stop), lg = ac.createGain(); lg.gain.value = 6; lfo.connect(lg);
      lp.connect(g); env(g, t, 0.5, 0.6, 0.9, 0.8, dur, 0.028 * vel); g.connect(out); send(g, 0.7);
    },
    taiko(t, f, dur, vel, out) {
      const o = osc('sine', 120, t, t + 1.0), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.95 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); o.connect(g); g.connect(out); send(g, 0.35);
      const n = noise(t, t + 0.15), lp = ac.createBiquadFilter(), ng = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 500; n.connect(lp); lp.connect(ng);
      ng.gain.setValueAtTime(0.45 * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); ng.connect(out);
    },
    odaiko(t, f, dur, vel, out) {
      const o = osc('sine', 80, t, t + 2.0), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(34, t + 0.35);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1.0 * vel, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); o.connect(g); g.connect(out); send(g, 0.55);
      const n = noise(t, t + 0.3), lp = ac.createBiquadFilter(), ng = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 300; n.connect(lp); lp.connect(ng);
      ng.gain.setValueAtTime(0.6 * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); ng.connect(out);
    },
    ka(t, f, dur, vel, out) {
      const n = noise(t, t + 0.06), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 2.5;
      n.connect(bp); bp.connect(g); g.gain.setValueAtTime(0.4 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); g.connect(out); send(g, 0.2);
      const o = osc('square', 1100, t, t + 0.03), og = ac.createGain(); og.gain.setValueAtTime(0.05 * vel, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); o.connect(og); og.connect(out);
    },
    shime(t, f, dur, vel, out) {
      const o = osc('sine', 420, t, t + 0.2), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(260, t + 0.06);
      g.gain.setValueAtTime(0.35 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g); g.connect(out);
      const n = noise(t, t + 0.05), hp = ac.createBiquadFilter(), ng = ac.createGain(); hp.type = 'highpass'; hp.frequency.value = 2500; n.connect(hp); hp.connect(ng);
      ng.gain.setValueAtTime(0.18 * vel, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); ng.connect(out);
    },
    kane(t, f, dur, vel, out) {
      const base = f || 520;
      [[1, 0.2, 3], [2.76, 0.1, 2], [5.4, 0.06, 1.2], [8.93, 0.03, 0.7]].forEach(([r, a, d]) => { const o = osc('sine', base * r, t, t + d + 0.1), g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a * vel, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(out); send(g, 0.6); });
    },
    suzu(t, f, dur, vel, out) {
      for (let i = 0; i < 4; i++) { const tt = t + i * 0.022, n = noise(tt, tt + 0.08), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 8500 + i * 600; bp.Q.value = 8;
        n.connect(bp); bp.connect(g); g.gain.setValueAtTime(0.25 * vel, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07); g.connect(out); send(g, 0.4); }
    },
    sub(t, f, dur, vel, out) {
      const stop = t + dur + 0.2, g = ac.createGain(), o = osc('sine', f, t, stop), o2 = osc('triangle', f * 2, t, stop), g2 = ac.createGain(); g2.gain.value = 0.12;
      o.connect(g); o2.connect(g2); g2.connect(g); env(g, t, 0.008, 0.2, 0.7, 0.08, dur * 0.9, 0.42 * vel); g.connect(out);
    },
    k808(t, f, dur, vel, out) {
      const o = osc('sine', 130, t, t + 0.7), g = ac.createGain(); o.frequency.exponentialRampToValueAtTime(42, t + 0.09);
      g.gain.setValueAtTime(0.85 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(g); g.connect(out);
    },
    clap(t, f, dur, vel, out) {
      for (let i = 0; i < 3; i++) { const tt = t + i * 0.011, n = noise(tt, tt + 0.2), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.2;
        n.connect(bp); bp.connect(g); g.gain.setValueAtTime(0.28 * vel, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + (i === 2 ? 0.16 : 0.02)); g.connect(out); send(g, 0.25); }
    }
  });
  // ---------- v4 作曲引擎：五声/都节调式 + 动机发展 + 分层（强度 0/1/2）+ 每轮变奏 ----------
  const SCALES = { in: [0, 1, 5, 7, 8], yo: [0, 2, 5, 7, 9], hira: [0, 2, 3, 7, 8], minp: [0, 3, 5, 7, 10], ritsu: [0, 2, 5, 7, 10] };
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // 原创曲目：全部由调式 + 种子动机生成，不引用任何现成旋律
  const SONGS = {
    title: { bpm: 72, root: 62, scale: 'in', seed: 11, calm: 1, lead: 'shaku', alt: 'koto', prog: [0, 0, 3, 2, 0, 4, 3, 0], pad: 1, koto: { pat: 'x...x...x...x...', L: 1 }, bass: { pat: 'x.......x.......', L: 0 }, d0: { odaiko: 'x...............' }, d1: { kane: 'x...............' }, d2: { suzu: '........x.......' }, int: 1 },
    town: { bpm: 96, root: 60, scale: 'yo', seed: 23, calm: 1, lead: 'ryuteki', alt: 'koto', prog: [0, 3, 1, 4, 0, 3, 2, 0], pad: 0.7, koto: { pat: 'x.x.x.x.x.x.x.x.', L: 1 }, shami: { pat: 'x...o...x...o.o.', L: 2 }, bass: { pat: 'x.....o.x.......', L: 0 }, d0: { ka: '....x.......x...' }, d1: { shime: 'x.......x.x.....' }, d2: { suzu: '..x...x...x...x.' }, int: 1 },
    route: { bpm: 118, root: 64, scale: 'yo', seed: 37, lead: 'shaku', alt: 'shami', prog: [0, 4, 3, 1, 0, 4, 2, 3], pad: 0.8, koto: { pat: 'x.xx.xx.x.xx.xx.', L: 1 }, shami: { pat: 'x.o.x.o.x.o.xoxo', L: 2 }, bass: { pat: 'x.x...x.x.x...x.', L: 0 }, d0: { taiko: 'x.......x.......', ka: '....x.......x...' }, d1: { shime: '..x...x...x...x.' }, d2: { k808: 'x.....x...x.....', hat: 'x.x.x.x.x.x.x.x.' }, int: 1 },
    flower: { bpm: 104, root: 65, scale: 'yo', seed: 41, calm: 1, lead: 'koto', alt: 'ryuteki', prog: [0, 1, 3, 4, 0, 2, 3, 0], pad: 1, koto: { pat: 'x..x..x.x..x..x.', L: 1 }, bass: { pat: 'x.......x...o...', L: 0 }, d0: { ka: '........x.......' }, d1: { suzu: 'x.......x.......' }, d2: { shime: '..x.x...x...x.x.', hat: '..x...x...x...x.' }, int: 1 },
    lake: { bpm: 78, root: 62, scale: 'ritsu', seed: 53, calm: 1, lead: 'shaku', alt: 'koto', prog: [0, 3, 0, 4, 2, 3, 1, 0], pad: 1.1, koto: { pat: 'x...x.x...x.x...', L: 1 }, bass: { pat: 'x...............', L: 0 }, d0: { kane: 'x...............' }, d1: { suzu: '........x.......' }, d2: { ka: '....x.......x...' }, int: 1 },
    forest: { bpm: 90, root: 57, scale: 'in', seed: 67, lead: 'shaku', alt: 'shami', prog: [0, 0, 1, 3, 0, 4, 3, 1], pad: 1, koto: { pat: 'x.x...x.x.x...x.', L: 1 }, shami: { pat: 'x...x.o.....x...', L: 2 }, bass: { pat: 'x.......x.o.....', L: 0 }, d0: { taiko: 'x.........x.....', ka: '......x.......x.' }, d1: { shime: 'x...x...x...x...' }, d2: { k808: 'x.........x.....', hat: '..x...x...x...x.' }, int: 1 },
    desert: { bpm: 112, root: 62, scale: 'hira', seed: 71, lead: 'shami', alt: 'shaku', prog: [0, 1, 0, 3, 0, 1, 4, 0], pad: 0.7, koto: { pat: 'x.x.x...x.x.x...', L: 1 }, shami: { pat: 'x.xox.o.x.xox.o.', L: 1 }, bass: { pat: 'x..x..x.x..x..x.', L: 0 }, d0: { taiko: 'x..x..x.........', ka: '....x.......x...' }, d1: { shime: 'xx..xx..xx..xx..' }, d2: { k808: 'x..x..x...x.....', clap: '....x.......x...' }, int: 1 },
    snow: { bpm: 70, root: 64, scale: 'in', seed: 83, calm: 1, lead: 'ryuteki', alt: 'koto', prog: [0, 3, 2, 1, 0, 3, 4, 0], pad: 1.2, koto: { pat: 'x.......x...x...', L: 1 }, bass: { pat: 'x...............', L: 0 }, d0: { kane: 'x.......' + '........' }, d1: { suzu: '....x.......x...' }, d2: { ka: '........x.......' }, int: 1 },
    volcano: { bpm: 132, root: 57, scale: 'hira', seed: 97, lead: 'shami', alt: 'shaku', prog: [0, 1, 3, 0, 0, 1, 4, 3], pad: 0.8, koto: { pat: 'xxx.xxx.xxx.xxx.', L: 2 }, shami: { pat: 'x.o.xxo.x.o.xxo.', L: 1 }, bass: { pat: 'x.x.x.x.x.x.x.x.', L: 0 }, d0: { odaiko: 'x.......x.......', taiko: '....x.......x.x.' }, d1: { shime: 'x.x.x.x.x.x.x.x.' }, d2: { k808: 'x...x...x...x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' }, int: 1 },
    battle: { bpm: 150, root: 62, scale: 'in', seed: 101, dense: 1, lead: 'shami', alt: 'shaku', prog: [0, 1, 3, 4, 0, 1, 3, 2], pad: 0.8, koto: { pat: 'x.xxx.xxx.xxx.xx', L: 1 }, shami: { pat: 'x.o.x.o.x.o.xoxo', L: 1 }, bass: { pat: 'x.x.x.x.x.xxx.x.', L: 0 }, d0: { taiko: 'x...x...x...x.x.', ka: '....x.......x...' }, d1: { k808: 'x.....x...x.....', hat: 'x.x.x.x.x.x.x.x.' }, d2: { odaiko: 'x.......x.......', shime: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' }, int: 1 },
    battle_rare: { bpm: 158, root: 64, scale: 'hira', seed: 113, dense: 1, lead: 'shaku', alt: 'shami', prog: [0, 3, 1, 4, 0, 3, 2, 4], pad: 1, koto: { pat: 'xxx.xxx.xxx.xx.x', L: 1 }, shami: { pat: 'x.xox.xox.xox.xo', L: 1 }, bass: { pat: 'x.xxx.x.x.xxx.x.', L: 0 }, d0: { taiko: 'x..x..x...x..x..', ka: '....x.......x...' }, d1: { k808: 'x..x..x...x.....', hat: 'xxxxxxxxxxxxxxxx' }, d2: { odaiko: 'x.......x.......', shime: 'x.xxx.xxx.xxx.xx', clap: '....x.......x...' }, int: 1 },
    legend: { bpm: 140, root: 59, scale: 'in', seed: 127, dense: 1, lead: 'shaku', alt: 'koto', prog: [0, 1, 0, 3, 4, 3, 1, 0], pad: 1.3, koto: { pat: 'x.x.x.x.xxx.x.x.', L: 1 }, shami: { pat: 'x...x.o.x...xoxo', L: 2 }, bass: { pat: 'x...x...x...x.x.', L: 0 }, d0: { odaiko: 'x.......x.....x.', kane: 'x...............' }, d1: { taiko: '..x...x...x...x.', k808: 'x.....x...x.....', hat: 'x.x.x.x.x.x.x.x.' }, d2: { shime: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' }, int: 1 },
    trainer: { bpm: 164, root: 61, scale: 'minp', seed: 131, dense: 1, lead: 'shami', alt: 'ryuteki', prog: [0, 4, 3, 1, 0, 4, 2, 3], pad: 0.8, koto: { pat: 'x.xxx.xxx.xxx.xx', L: 1 }, shami: { pat: 'xoxox.xoxoxox.xo', L: 1 }, bass: { pat: 'x.x.xx.xx.x.xx.x', L: 0 }, d0: { taiko: 'x...x...x...x...', ka: '..x...x...x...x.' }, d1: { k808: 'x...x...x...x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' }, d2: { odaiko: 'x.......x.......', shime: 'x.x.xxx.x.x.xxxx' }, int: 1 },
    quiz: { bpm: 100, root: 60, scale: 'yo', seed: 139, calm: 1, lead: 'koto', alt: 'ryuteki', prog: [0, 3, 4, 0, 1, 3, 4, 0], pad: 0.6, koto: { pat: 'x...x...x...x...', L: 1 }, bass: { pat: 'x.......x.......', L: 0 }, d0: { ka: '....x.......x...' }, d1: { shime: 'x.......x.......' }, d2: { hat: '..x...x...x...x.' }, int: 1 },
    tutor: { bpm: 84, root: 62, scale: 'yo', seed: 149, calm: 1, lead: 'koto', alt: 'shaku', prog: [0, 3, 1, 4, 0, 2, 3, 0], pad: 0.9, koto: { pat: 'x.....x.....x...', L: 1 }, bass: { pat: 'x...............', L: 0 }, d0: { suzu: 'x...............' }, d1: { ka: '........x.......' }, d2: {}, int: 1 },
    evolve: { bpm: 80, root: 60, scale: 'in', seed: 157, lead: 'shaku', alt: 'koto', prog: [0, 1, 3, 4, 0, 3, 4, 0], pad: 1.4, koto: { pat: 'xxxxxxxxxxxxxxxx', L: 1 }, bass: { pat: 'x.......x.......', L: 0 }, d0: { odaiko: 'x.......x.......', kane: 'x...............' }, d1: { taiko: '....x.......x.x.', suzu: 'x...x...x...x...' }, d2: { shime: 'x.x.x.x.x.x.x.xx' }, int: 2 },
    victory: { bpm: 126, root: 62, scale: 'yo', seed: 163, lead: 'ryuteki', alt: 'koto', prog: [0, 3, 4, 0, 0, 3, 4, 0], pad: 1, koto: { pat: 'x.x.x.x.x.x.x.x.', L: 1 }, shami: { pat: 'x.o.x.o.x.o.x.o.', L: 1 }, bass: { pat: 'x...o...x...o...', L: 0 }, d0: { taiko: 'x.......x.......', ka: '....x.......x...' }, d1: { suzu: 'x.x.x.x.x.x.x.x.' }, d2: { k808: 'x.......x.......', clap: '....x.......x...' }, int: 1 }
  };
  function deg2m(S, d, base) { const sc = SCALES[S.scale], o = Math.floor(d / 5), i = ((d % 5) + 5) % 5; return base + o * 12 + sc[i]; }
  function genMotif(rng, S) {
    const pool = S.dense ? [2, 2, 1, 1, 2, 4, 3, 1] : S.calm ? [4, 4, 8, 2, 6, 4, 2] : [2, 4, 2, 2, 4, 6, 1, 3];
    const R = []; let tot = 0;
    while (tot < 32) { let d = pool[Math.floor(rng() * pool.length)]; if (tot + d > 32) d = 32 - tot; R.push(d); tot += d; }
    if (R[R.length - 1] < 3 && R.length > 1) { const l = R.pop(); R[R.length - 1] += l; }
    const C = R.map((_, i) => i === 0 ? 0 : [-2, -1, -1, 0, 1, 1, 2, 3, -3][Math.floor(rng() * 9)]);
    return { R, C };
  }
  function mutate(rng, M) { return { R: M.R.slice(), C: M.C.map((c, i) => i && rng() < 0.35 ? c + (rng() < 0.5 ? 1 : -1) : c) }; }
  function lay(ev, S, M, start, d0, inst, L, v, opt) {
    let st = start, d = d0; opt = opt || {};
    M.R.forEach((dur, i) => {
      d += M.C[i]; d = Math.max(-2, Math.min(9, d));
      if (opt.end && i === M.R.length - 1) d = opt.end;
      const m = deg2m(S, d, S.root + 12 + (opt.oct || 0));
      if (opt.grace && dur >= 4 && i % 2 === 0) { ev.push({ s: st, d: 1, i: inst, m: deg2m(S, d + 1, S.root + 12 + (opt.oct || 0)), v: v * 0.7, L }); ev.push({ s: st + 1, d: dur - 1, i: inst, m, v, L }); }
      else ev.push({ s: st, d: dur, i: inst, m, v, L });
      st += dur;
    });
  }
  function build(name) {
    const S = SONGS[name], ev = [], rng = mulberry(S.seed * 7919);
    const BARS = 16, L = BARS * 16;
    const A = genMotif(rng, S), Bm = genMotif(rng, S), A2 = mutate(rng, A), C = genMotif(rng, S);
    // 第一段：A A' B A（终止）；第二段（变奏）：C C' A'' B'（换主奏乐器、加装饰音）
    lay(ev, S, A, 0, 5, S.lead, 0, 1); lay(ev, S, mutate(rng, A), 32, 7, S.lead, 0, 1, { end: 3 }); lay(ev, S, Bm, 64, 7, S.lead, 0, 1); lay(ev, S, A, 96, 5, S.lead, 0, 1, { end: 5 });
    lay(ev, S, C, 128, 5, S.alt, 0, 1, { grace: 1 }); lay(ev, S, mutate(rng, C), 160, 7, S.alt, 0, 1, { end: 3, grace: 1 }); lay(ev, S, A2, 192, 5, S.lead, 0, 1, { grace: 1 }); lay(ev, S, mutate(rng, Bm), 224, 5, S.lead, 0, 1, { end: 5 });
    // 高强度层：第二段的尺八/笛八度重奏
    lay(ev, S, A2, 192, 5, S.lead === 'shaku' ? 'ryuteki' : 'shaku', 2, 0.5, { oct: -12 });
    for (let b = 0; b < BARS; b++) {
      const dg = S.prog[b % S.prog.length], base = b * 16;
      if (S.pad) [dg, dg + 2, dg + 4].forEach(x => ev.push({ s: base, d: 16, i: 'strings', m: deg2m(S, x, S.root - 12), v: S.pad, L: 0 }));
      if (S.koto) { const tones = [dg, dg + 1, dg + 2, dg + 4, dg + 2, dg + 1]; let k = 0; for (let i = 0; i < 16; i++) if (S.koto.pat[i] === 'x') ev.push({ s: base + i, d: 2, i: 'koto', m: deg2m(S, tones[k++ % tones.length] + (b >= 8 ? 5 : 0), S.root - 12 + 12), v: 0.55, L: S.koto.L }); }
      if (S.shami) for (let i = 0; i < 16; i++) { const ch = S.shami.pat[i]; if (ch === '.') continue; ev.push({ s: base + i, d: 1, i: 'shami', m: deg2m(S, dg + (ch === 'o' ? 3 : 0), S.root - 12), v: 0.7, L: S.shami.L }); }
      if (S.bass) for (let i = 0; i < 16; i++) { const ch = S.bass.pat[i]; if (ch === '.') continue; let len = 1; while (i + len < 16 && S.bass.pat[i + len] === '.') len++; ev.push({ s: base + i, d: len, i: 'sub', m: deg2m(S, dg + (ch === 'o' ? 3 : 0), S.root - 24), v: 1, L: S.bass.L }); }
      [['d0', 0], ['d1', 1], ['d2', 2]].forEach(([k, Lv]) => { const D = S[k] || {}; for (const ins in D) { const p = D[ins]; for (let i = 0; i < 16; i++) if (p[i % p.length] === 'x') ev.push({ s: base + i, d: 1, i: ins, m: ins === 'kane' ? S.root + 12 : 0, v: ins === 'hat' ? (i % 2 ? 0.55 : 0.9) : 1, L: Lv }); } });
      // 每 8 小节的过门：太鼓连击 + 钲
      if (b % 8 === 7) { for (let i = 8; i < 16; i += (S.dense ? 1 : 2)) ev.push({ s: base + i, d: 1, i: 'shime', m: 0, v: 0.5 + (i - 8) / 16, L: 1 }); ev.push({ s: base + 14, d: 1, i: 'taiko', m: 0, v: 1, L: 0 }); }
      if (b % 8 === 0) ev.push({ s: base, d: 1, i: 'kane', m: S.root + 24, v: 0.5, L: 1 });
    }
    ev.sort((a, b) => a.s - b.s);
    return { name, ev, L, sx: 60 / S.bpm / 4 };
  }
  const built = {};
  let boost = 0;
  function layerTargets(name) { const base = (SONGS[name] && SONGS[name].int) || 1, lv = Math.min(2, base + boost); return [1, lv >= 1 ? 1 : 0.0001, lv >= 2 ? 1 : 0.0001]; }
  function play(name) {
    if (!ac) { wanted = name; return; }
    if (cur && cur.name === name) return;
    const now = ac.currentTime;
    if (cur) { cur.gain.gain.cancelScheduledValues(now); cur.gain.gain.setValueAtTime(cur.gain.gain.value, now); cur.gain.gain.linearRampToValueAtTime(0.0001, now + 0.9); cur.stopAt = now + 0.9; fading.push(cur); cur = null; }
    if (!name || !SONGS[name]) return;
    const b = built[name] || (built[name] = build(name));
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(1, now + 0.8); g.connect(musicBus);
    const tg = layerTargets(name), layers = tg.map(v => { const lg = ac.createGain(); lg.gain.value = v; lg.connect(g); return lg; });
    cur = { name, b, gain: g, layers, t0: now + 0.08, idx: 0, loop: 0 };
  }
  // 动态强度：低血量 / 奥义时 +1 层（太鼓连打、现代节拍、八度重奏）
  function setIntensity(b) {
    b = b ? 1 : 0; if (b === boost) return; boost = b;
    if (!ac || !cur) return; const tg = layerTargets(cur.name), now = ac.currentTime;
    cur.layers.forEach((lg, i) => { lg.gain.cancelScheduledValues(now); lg.gain.setValueAtTime(Math.max(0.0001, lg.gain.value), now); lg.gain.exponentialRampToValueAtTime(tg[i], now + 0.6); });
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
      if (t >= now - 0.05) { try { INST[e.i](t, mtof(e.m), e.d * b.sx, e.v, c.layers[e.L || 0]); } catch (err) { } }
      c.idx++; if (c.idx >= b.ev.length) { c.idx = 0; c.loop++; }
    }
  }
  // ---------- 音效 ----------
  const SFX_ALIAS = { select: 'move', powerup: 'gauge', victory_short: 'levelup', ok: 'confirm' };
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
      // ---- v4 新增音效 ----
      case 'talk': { const base = 74 + Math.floor(Math.random() * 5); [0, 2, 4].forEach((x, i) => { const f = mtof(base + [0, 3, 5, 7][Math.floor(Math.random() * 4)]); tone('triangle', f * 1.12, f, 0.07, 0.07, i * 0.085); tone('sine', f * 2, 0, 0.05, 0.02, i * 0.085); }); break; }
      case 'chalk': for (let i = 0; i < 3; i++) nz(5200 + i * 700, 3, 0.06, 0.07, 'bandpass', i * 0.05, 3000); break;
      case 'tutor_in': [0, 5, 7, 12].forEach((x, i) => INST.koto(t + i * 0.07, mtof(67 + x), 0.5, 0.8, o)); INST.suzu(t + 0.3, 0, 0, 0.6, o); break;
      case 'slash': nz(3000, 1.5, 0.12, 0.3, 'bandpass', 0, 9000); tone('sawtooth', 900, 200, 0.08, 0.04); break;
      case 'cutin': INST.ka(t, 0, 0, 1, o); INST.shime(t + 0.06, 0, 0, 0.8, o); nz(1500, 1, 0.3, 0.2, 'bandpass', 0.05, 6000); break;
      case 'sigcut': INST.taiko(t, 0, 0, 1, o); INST.kane(t + 0.05, mtof(81), 1.5, 0.7, o); nz(800, 1, 0.6, 0.25, 'bandpass', 0.1, 6000); break;
      case 'ult': INST.odaiko(t, 0, 0, 1, o); INST.kane(t + 0.02, mtof(74), 2, 1, o); [0, 0.18, 0.3, 0.38, 0.44, 0.5].forEach((d, i) => INST.taiko(t + 0.9 + d, 0, 0, 0.6 + i * 0.08, o)); INST.odaiko(t + 1.6, 0, 0, 1, o);
        nz(400, 0.7, 1.4, 0.3, 'bandpass', 0.2, 5000); [0, 1, 5, 7, 8, 12].forEach((x, i) => INST.koto(t + 1.0 + i * 0.06, mtof(62 + x), 0.6, 0.9, o)); break;
      case 'gauge': [0, 5, 7, 12, 17].forEach((x, i) => INST.koto(t + i * 0.05, mtof(74 + x), 0.4, 0.8, o)); INST.suzu(t + 0.25, 0, 0, 0.7, o); break;
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
  let duckN = 0;
  function duck(on) { if (!ac) return; duckN = Math.max(0, duckN + (on ? 1 : -1)); const now = ac.currentTime; musicBus.gain.cancelScheduledValues(now); musicBus.gain.setTargetAtTime(duckN ? 0.22 : 0.62, now, 0.12); }
  return {
    get ac() { init(); return ac; }, get master() { init(); return master; }, get reverbIn() { init(); return revIn; }, duck,
    unlock, play, sfx, jingle, setMuted, setVol, setIntensity, get intensity() { return boost; },
    get muted() { return muted; }, get vol() { return vol; }, get started() { return !!ac && ac.state === 'running'; },
    get current() { return cur ? cur.name : (wanted || null); }, _build: build, SONGS, INST, mtof
  };
})();
