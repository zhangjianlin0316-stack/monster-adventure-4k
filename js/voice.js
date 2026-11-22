// ================== 语音系统：预生成神经语音片段（voice/*.js，base64 mp3）拼接播放 ==================
const VoicePack = (() => {
  // v6：每个语音包拆成多个约 300KB 的分片（voice/<包>_NN.js），并行下载，单片失败自动重试 4 次
  const raw = {}, buf = {}, prom = {}, prog = {};
  const SH = () => (typeof VOICE_SHARDS !== 'undefined' ? VOICE_SHARDS : {});
  function add(name, data) { for (const k in data) raw[name + '|' + k] = data[k]; }
  function loadShard(name, i, tries) {
    return new Promise(res => {
      const s = document.createElement('script'); const f = name + (SH()[name] ? '_' + String(i).padStart(2, '0') : '') + '.js';
      s.src = 'voice/' + f + (tries ? '?r=' + tries + '_' + Date.now() : ''); s.async = true;
      s.onload = () => res(true);
      s.onerror = () => { s.remove(); if (tries < 4) { console.warn('语音分片加载失败，重试', f, tries + 1); setTimeout(() => loadShard(name, i, tries + 1).then(res), 800 * (tries + 1)); } else res(false); };
      document.head.appendChild(s);
    });
  }
  function load(name) {
    if (prom[name]) return prom[name];
    const n = SH()[name] || 1; const P = prog[name] = { n, ok: 0, bad: 0, done: false, t0: performance.now() };
    prom[name] = Promise.all(Array.from({ length: n }, (_, i) => loadShard(name, i, 0).then(r => { if (r) P.ok++; else P.bad++; }))).then(() => {
      P.done = true; P.ms = performance.now() - P.t0;
      if (P.bad) { console.warn('语音包', name, '有', P.bad, '个分片加载失败'); if (typeof toast === 'function') toast('语音包下载不完整（' + P.bad + '/' + n + ' 失败），缺少的句子改用浏览器语音。可在菜单「声音与语音」里重试'); }
    });
    return prom[name];
  }
  function retry(name) { delete prom[name]; return load(name); }
  function progress(name) { const P = prog[name]; return P ? { n: P.n, ok: P.ok, bad: P.bad, done: P.done, pct: Math.round(100 * (P.ok + P.bad) / P.n) } : { n: SH()[name] || 1, ok: 0, bad: 0, done: false, pct: 0 }; }
  const loaded = new Proxy({}, { get: (o, k) => prog[k] && prog[k].done ? (prog[k].bad ? 'err' : true) : undefined, ownKeys: () => Object.keys(prog), getOwnPropertyDescriptor: (o, k) => ({ enumerable: true, configurable: true, value: prog[k] && prog[k].done }) });
  function has(name, k) { return !!raw[name + '|' + k]; }
  function b64ToAB(b) { const s = atob(b), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.buffer; }
  function trim(ab) { // 去掉 mp3 编码器首尾的静音
    const d = ab.getChannelData(0), n = d.length, th = 0.012; let a = 0, b = n - 1;
    while (a < n && Math.abs(d[a]) < th) a++; while (b > a && Math.abs(d[b]) < th) b--;
    const sr = ab.sampleRate; return { b: ab, s: Math.max(0, a / sr - 0.012), e: Math.min(n / sr, b / sr + 0.05) };
  }
  function get(name, k) {
    const key = name + '|' + k; if (buf[key]) return buf[key]; if (!raw[key]) return Promise.resolve(null);
    const ac = AudioSys.ac;
    buf[key] = new Promise(res => { try { const p = ac.decodeAudioData(b64ToAB(raw[key]), b => res(trim(b)), () => res(null)); if (p && p.catch) p.catch(() => res(null)); } catch (e) { res(null); } });
    return buf[key];
  }
  return { add, load, retry, progress, has, get, get loaded() { return loaded; } };
})();

const Voice = (() => {
  let enabled = true, vol = 0.95, out = null, cur = null, seq = 0;
  try { if (!localStorage.getItem('ls_v6')) { localStorage.setItem('ls_v6', '1'); localStorage.removeItem('ls_voice'); } enabled = localStorage.getItem('ls_voice') !== '0'; const v = parseFloat(localStorage.getItem('ls_voicevol')); if (!isNaN(v)) vol = v; } catch (e) { }
  // v6：语音走独立通道直连扬声器，不受「音乐/音效静音」影响（之前点了右上角静音，语音也一起没声了）
  let an = null;
  function bus() { if (!out) { const ac = AudioSys.ac; out = ac.createGain(); out.gain.value = vol; an = ac.createAnalyser(); an.fftSize = 1024; out.connect(an); out.connect(ac.destination); } return out; }
  function level() { if (!an) return 0; const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); return m; }
  function setEnabled(b) { enabled = b; try { localStorage.setItem('ls_voice', b ? '1' : '0'); } catch (e) { } if (!b) stop(); }
  function setVol(v) { vol = clamp(v, 0, 1); try { localStorage.setItem('ls_voicevol', String(vol)); } catch (e) { } if (out) out.gain.value = vol; }
  function stop() {
    seq++; if (cur) { cur.nodes.forEach(n => { try { n.stop(); } catch (e) { } }); if (cur.ducked) AudioSys.duck(false); cur = null; }
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
  }
  // items: [{pack, k} | {gap: 秒}]；opts: {rate, detune, reverb, onend, tag}
  async function playSeq(items, opts) {
    opts = opts || {}; stop(); if (!enabled) { if (opts.onend) opts.onend(0); return null; }
    const my = ++seq; const bufs = await Promise.all(items.map(it => it.gap !== undefined ? null : VoicePack.get(it.pack, it.k)));
    if (my !== seq) return null;
    if (items.some((it, i) => it.gap === undefined && !bufs[i])) { stats.decodeFail++; return null; } // 缺片段/解码失败
    const ac = AudioSys.ac; if (ac.state !== 'running') { try { await Promise.race([ac.resume(), new Promise(r => setTimeout(r, 600))]); } catch (e) { } if (my !== seq) return null; if (ac.state !== 'running') { stats.blocked++; if (typeof toast === 'function') toast('浏览器还没允许播放声音：点一下画面或按任意键即可开启语音'); if (opts.onend) opts.onend(0); return 0; } }
    const rate = opts.rate || 1; let t = ac.currentTime + 0.04; const t0 = t; const nodes = [];
    const dst = bus(); let chain = dst;
    if (opts.reverb) { const g = ac.createGain(); g.gain.value = opts.reverb; g.connect(AudioSys.reverbIn); const m = ac.createGain(); m.connect(dst); m.connect(g); chain = m; }
    items.forEach((it, i) => {
      if (it.gap !== undefined) { t += it.gap; return; }
      const c = bufs[i], src = ac.createBufferSource(); src.buffer = c.b; src.playbackRate.value = rate; if (opts.detune) src.detune.value = opts.detune;
      src.connect(chain); src.start(t, c.s, c.e - c.s); nodes.push(src); t += (c.e - c.s) / rate - 0.015;
    });
    const dur = t - t0; AudioSys.duck(true); stats.played++; stats.lastDur = dur;
    cur = { nodes, ducked: true, end: performance.now() + dur * 1000, tag: opts.tag };
    const me = cur; setTimeout(() => { if (cur === me) { AudioSys.duck(false); cur = null; if (opts.onend) opts.onend(dur); } }, dur * 1000 + 30);
    return dur;
  }
  // ---- 星老师 ----
  function tutorItems(text) {
    const p = VoiceText.parse(text), segs = VoiceText.segs(p.key), items = [];
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (s && !VoiceText.silentSeg(s)) { if (!VoicePack.has('tutor', s)) return null; items.push({ pack: 'tutor', k: s }); }
      else if (/[，。；：！？,]/.test(s || '')) items.push({ gap: /[。！？]/.test(s) ? 0.25 : 0.12 });
      if (i < p.toks.length) { if (i > 0 || s) items.push({ gap: 0.03 }); for (const c of VoiceText.tokChunks(p.toks[i])) { if (!VoicePack.has('tutor', c)) return null; items.push({ pack: 'tutor', k: c }); } items.push({ gap: 0.03 }); }
    }
    return items;
  }
  let zhVoice = null; try { if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { zhVoice = null; pickZh(); }; } catch (e) { }
  function pickZh() {
    if (zhVoice || !window.speechSynthesis) return zhVoice; const vs = speechSynthesis.getVoices().filter(v => /^zh/i.test(v.lang) && !/HK|TW/i.test(v.lang));
    const score = v => (/Xiaoxiao|Xiaoyi|Natural|Neural/i.test(v.name) ? 10 : 0) + (/Google/i.test(v.name) ? 5 : 0) + (/Ting|Mei|Yaoyao|Huihui/i.test(v.name) ? 2 : 0);
    zhVoice = vs.sort((a, b) => score(b) - score(a))[0] || null; return zhVoice;
  }
  function fallbackSpeak(text, onend) { // 只有缺少预生成片段时才使用
    try {
      if (!window.speechSynthesis) { if (onend) onend(0); return 0; }
      const u = new SpeechSynthesisUtterance(VoiceText.speakSeg(text.replace(/\{(\d+)\/(\d+)\}/g, '$2分之$1'))); u.lang = 'zh-CN'; const v = pickZh(); if (v) u.voice = v; u.rate = 0.95; u.pitch = 1.1; u.volume = vol;
      u.onend = () => onend && onend(); speechSynthesis.speak(u); return Math.max(1.5, text.length * 0.22);
    } catch (e) { return 0; }
  }
  const stats = { clip: 0, fallback: 0, played: 0, blocked: 0, decodeFail: 0, lastDur: 0 };
  async function tutor(text, onend) {
    if (!enabled) return 0;
    await VoicePack.load('tutor');
    const items = tutorItems(text);
    if (items) { stats.clip++; const d = await playSeq(items, { onend, tag: 'tutor' }); if (d !== null) return d; }
    stats.fallback++; stop(); return fallbackSpeak(text, onend);
  }
  function tutorLine(text, onend) { return VoicePack.load('tutor').then(() => VoicePack.has('tutor', text) ? playSeq([{ pack: 'tutor', k: text }], { onend, tag: 'tutor' }) : 0); }
  // ---- 灵兽台词 ----
  function mon(sp, kind, idx, opts) { // 播放灵兽台词，返回 {text, dur promise}
    const L = (typeof MON_VOICE !== 'undefined' && MON_VOICE[sp]) ? MON_VOICE[sp][kind] : null; if (!L || !L.length) return null;
    const i = idx === undefined ? Math.floor(Math.random() * L.length) : idx % L.length; const text = L[i];
    const pv = (typeof monVoiceProfile === 'function') ? monVoiceProfile(sp) : {};
    if (enabled) VoicePack.load('mons').then(() => { const k = sp + ':' + kind + ':' + i; if (VoicePack.has('mons', k)) playSeq([{ pack: 'mons', k }], Object.assign({ tag: 'mon', reverb: pv.reverb, detune: pv.detune }, opts || {})); });
    return text;
  }
  function npc(k, opts) { if (!enabled) return; VoicePack.load('npc').then(() => { if (VoicePack.has('npc', k)) playSeq([{ pack: 'npc', k }], Object.assign({ tag: 'npc' }, opts || {})); }); }
  const busy = () => !!cur && performance.now() < cur.end;
  // 菜单「测试语音」：播放一句星老师测试语，同时检测是否真的有声音输出
  async function test() {
    const r = { ac: AudioSys.ac.state, pack: false, played: false, peak: 0, fallback: false };
    if (!enabled) setEnabled(true);
    await VoicePack.load('npc'); r.pack = VoicePack.has('npc', 'test');
    let peak = 0; const iv = setInterval(() => { peak = Math.max(peak, level()); }, 40);
    const d = r.pack ? await playSeq([{ pack: 'npc', k: 'test' }], { tag: 'tutor' }) : null;
    if (d) { r.played = true; r.dur = d; await new Promise(z => setTimeout(z, Math.min(2500, d * 1000))); }
    else { r.fallback = true; fallbackSpeak('你好呀，我是星老师！如果你能听到我的声音，说明语音一切正常。'); }
    clearInterval(iv); r.peak = peak; r.ac = AudioSys.ac.state; return r;
  }
  return { test, level, fallbackSpeak, npc, playSeq, tutor, tutorLine, tutorItems, mon, stop, setEnabled, setVol, busy, stats, get enabled() { return enabled; }, get vol() { return vol; }, get curTag() { return cur && busy() ? cur.tag : null; } };
})();
