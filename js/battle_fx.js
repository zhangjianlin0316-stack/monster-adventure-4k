// ================== 战斗特效：对象池粒子 + 每招专属动画 + 镜头 ==================
const HEXA_CACHE = {};
function hexA(hex, a) {
  let rgb = HEXA_CACHE[hex];
  if (!rgb) { const n = parseInt(hex.slice(1), 16); rgb = HEXA_CACHE[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
}
// 预渲染发光精灵（避免每帧创建渐变）
const GLOW_CACHE = {};
function glowSprite(c) {
  let g = GLOW_CACHE[c]; if (g) return g;
  g = document.createElement('canvas'); g.width = g.height = 128; const x = g.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, hexA(c, 0.95)); gr.addColorStop(0.55, hexA(c, 0.35)); gr.addColorStop(1, hexA(c, 0));
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); GLOW_CACHE[c] = g; return g;
}
const SOFT_CACHE = {};
function softSprite(c) {
  let g = SOFT_CACHE[c]; if (g) return g;
  if (/^rgb/.test(c)) { const m = c.match(/[\d.]+/g) || [255, 255, 255]; const hx = '#' + [0, 1, 2].map(i => (+m[i] | 0).toString(16).padStart(2, '0')).join(''); return (SOFT_CACHE[c] = softSprite(hx)); } // rgba() 颜色也转成十六进制，避免黑色烟雾
  g = document.createElement('canvas'); g.width = g.height = 128; const x = g.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, hexA(c, 0.9)); gr.addColorStop(0.6, hexA(c, 0.45)); gr.addColorStop(1, hexA(c, 0));
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); SOFT_CACHE[c] = g; return g;
}
function glowOrb(x, y, r, c, solid) {
  if (solid) { ctx.drawImage(softSprite(c), x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6); }
  const o = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(glowSprite(c), x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = o;
}
function lightning(x0, y0, x1, y1, w, c, seed) {
  const pts = [[x0, y0]]; const n = 10; const R = seed !== undefined ? (i => hash(seed, i) - 0.5) : (() => Math.random() - 0.5);
  const len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  for (let i = 1; i < n; i++) { const k = i / n, o = R(i) * len * 0.16; pts.push([x0 + (x1 - x0) * k + nx * o, y0 + (y1 - y0) * k + ny * o]); }
  pts.push([x1, y1]);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  [[w * 5, hexA(c, 0.18)], [w * 2.2, hexA(c, 0.6)], [w * 0.8, 'rgba(255,255,255,0.95)']].forEach(([lw, col]) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  });
  ctx.restore();
}
// ---------- 粒子对象池 ----------
const POOL_N = 1800;
const PART = []; const FREE = [];
for (let i = 0; i < POOL_N; i++) { PART.push({ on: false }); FREE.push(i); }
const PK = { glow: 0, leaf: 1, drop: 2, shard: 3, rock: 4, petal: 5, snow: 6, spark: 7, smoke: 8, star: 9, ember: 10, bubble: 11, note: 12, sym: 13 };
function pSpawn(o) {
  if (!FREE.length) return null; const i = FREE.pop(); const p = PART[i];
  p.on = true; p.i = i; p.x = o.x; p.y = o.y; p.vx = o.vx || 0; p.vy = o.vy || 0; p.ax = o.ax || 0; p.ay = o.ay || 0; p.drag = o.drag === undefined ? 1.5 : o.drag;
  p.t = 0; p.life = o.life || 0.8; p.s = o.s || 20; p.s1 = o.s1 === undefined ? p.s : o.s1; p.c = o.c || '#ffffff'; p.k = o.k || 0; p.r = o.r || Math.random() * 6.28; p.vr = o.vr === undefined ? (Math.random() - 0.5) * 8 : o.vr;
  p.a = o.a === undefined ? 1 : o.a; p.txt = o.txt || ''; p.delay = o.delay || 0; p.front = !!o.front;
  return p;
}
function pClear() { PART.forEach((p, i) => { if (p.on) { p.on = false; FREE.push(i); } }); }
function burst(x, y, n, o) {
  o = o || {};
  for (let i = 0; i < n; i++) {
    const a = o.dir !== undefined ? o.dir + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * 6.28; const sp = rnd(o.sp0 || 150, o.sp1 || 600);
    pSpawn({ x: x + rnd(-1, 1) * (o.jit || 0), y: y + rnd(-1, 1) * (o.jit || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (o.flat || 0.8) + (o.up || 0), ay: o.g === undefined ? 300 : o.g,
      drag: o.drag, life: rnd(o.l0 || 0.4, o.l1 || 0.9), s: rnd(o.s0 || 14, o.s1 || 34), s1: o.shrink === false ? undefined : 0, c: Array.isArray(o.c) ? o.c[i % o.c.length] : o.c, k: PK[o.k || 'glow'], front: o.front });
  }
}
function drawParticles(dt, front) {
  for (let i = 0; i < POOL_N; i++) {
    const p = PART[i]; if (!p.on || p.front !== front) continue;
    if (front === false || true) { }
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.t += dt; if (p.t >= p.life) { p.on = false; FREE.push(i); continue; }
    const dr = Math.exp(-p.drag * dt); p.vx = p.vx * dr + p.ax * dt; p.vy = p.vy * dr + p.ay * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
    const k = p.t / p.life, s = p.s + (p.s1 - p.s) * k, a = p.a * (k < 0.1 ? k / 0.1 : 1 - Math.max(0, (k - 0.6) / 0.4));
    if (s <= 0.3 || a <= 0) continue;
    switch (p.k) {
      case 0: case 10: ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite(p.c), p.x - s, p.y - s, s * 2, s * 2); break;
      case 8: ctx.globalAlpha = a * 0.7; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(softSprite(p.c), p.x - s, p.y - s, s * 2, s * 2); break;
      case 7: { ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = p.c; ctx.lineWidth = Math.max(2, s * 0.25); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke(); break; }
      default: {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        if (p.k === 1) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.4, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(20,80,20,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.lineTo(s * 0.8, 0); ctx.stroke(); }
        else if (p.k === 2 || p.k === 11) { ctx.fillStyle = p.k === 11 ? 'rgba(200,240,255,0.25)' : p.c; ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 6.28); ctx.fill(); ctx.strokeStyle = p.k === 11 ? 'rgba(230,250,255,0.9)' : 'rgba(20,80,160,0.4)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(-s * 0.17, -s * 0.17, s * 0.12, 0, 6.28); ctx.fill(); }
        else if (p.k === 3) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.35, 0); ctx.lineTo(0, s * 0.7); ctx.lineTo(-s * 0.35, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke(); }
        else if (p.k === 4) { ctx.fillStyle = p.c; ctx.beginPath(); for (let j = 0; j < 6; j++) { const aa = j / 6 * 6.28, rr = s * (0.6 + 0.4 * hash(p.i, j)); ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,25,10,0.6)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.25, s * 0.25, 0, 6.28); ctx.fill(); }
        else if (p.k === 5) { ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(p.t * 6 + p.i))); ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.6, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, 0, s * 0.4, s * 0.2, 0, 0, 6.28); ctx.fill(); }
        else if (p.k === 6) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, 6.28); ctx.fill(); }
        else if (p.k === 9) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.c; ctx.beginPath(); for (let j = 0; j < 10; j++) { const aa = j / 10 * 6.28, rr = j % 2 ? s * 0.4 : s; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } ctx.closePath(); ctx.fill(); }
        else if (p.k === 12 || p.k === 13) { ctx.rotate(-p.r + Math.sin(p.t * 3) * 0.3); ctx.font = '900 ' + Math.round(s * 1.6) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = s * 0.25; ctx.strokeStyle = 'rgba(20,20,60,0.6)'; ctx.strokeText(p.txt, 0, 0); ctx.fillStyle = p.c; ctx.fillText(p.txt, 0, 0); }
        ctx.restore();
      }
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
// ---------- 冲击环 / 星芒 / 数字 / 印章文字 ----------
function addRing(B, x, y, size, c, life, flat, w) { B.rings.push({ x, y, t: 0, life: life || 0.5, size, c, flat: flat === undefined ? 0.55 : flat, w: w || 14 }); }
function addStar(B, x, y, c, big) { B.stars.push({ x, y, t: 0, life: big ? 0.45 : 0.32, c, big }); }
function addStamp(B, text, c, big) { B.stamps.push({ text, c, t: 0, life: 1.1, big }); }
function drawRingsStars(B, dt) {
  for (let i = B.rings.length - 1; i >= 0; i--) {
    const r = B.rings[i]; r.t += dt; if (r.t > r.life) { B.rings.splice(i, 1); continue; }
    const k = r.t / r.life, e = easeOut(k);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(r.c, (1 - k) * 0.95); ctx.lineWidth = r.w * (1 - k) + 2;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, 30 + e * r.size, (30 + e * r.size) * r.flat, 0, 0, 6.28); ctx.stroke(); ctx.restore();
  }
  for (let i = B.stars.length - 1; i >= 0; i--) {
    const st = B.stars[i]; st.t += dt; if (st.t > st.life) { B.stars.splice(i, 1); continue; }
    const k = st.t / st.life, R0 = (st.big ? 260 : 180) * (0.5 + k * 0.7);
    ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(0.3 + k * 0.3); ctx.globalAlpha = 1 - k;
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? '#ffffff' : st.c; const sc = pass ? 0.55 : 1; ctx.beginPath();
      for (let j = 0; j < 16; j++) { const a = j / 16 * 6.283, rr = (j % 2 ? R0 * 0.3 : R0 * (j % 4 ? 0.72 : 1)) * sc; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  for (let i = B.nums.length - 1; i >= 0; i--) {
    const n = B.nums[i]; n.t += dt; if (n.t > 1.2) { B.nums.splice(i, 1); continue; }
    const k = n.t / 1.2, s = (n.t < 0.12 ? 0.6 + n.t / 0.12 * 0.9 : 1.5 - Math.min(0.5, (n.t - 0.12) * 2)) * (n.big ? 1.35 : 1);
    ctx.save(); ctx.translate(n.x, n.y - k * 80); ctx.scale(s, s); ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
    ctx.font = '900 60px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 13; ctx.strokeStyle = '#1b1030'; ctx.strokeText(n.text, 0, 0); ctx.fillStyle = n.c; ctx.fillText(n.text, 0, 0); ctx.restore();
  }
}
function drawStamps(B, dt) {
  // UI 空间："会心一击！""效果拔群！""连击×3" 等大字
  for (let i = B.stamps.length - 1; i >= 0; i--) {
    const s = B.stamps[i]; s.t += dt; if (s.t > s.life) { B.stamps.splice(i, 1); continue; }
    const k = s.t / s.life, sc = s.t < 0.15 ? 2.2 - s.t / 0.15 * 1.2 : 1 + (k - 0.14) * 0.08;
    ctx.save(); ctx.translate(800, (s.y || 330) - i * 0); ctx.rotate(-0.06); ctx.scale(sc, sc); ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
    ctx.font = '900 ' + (s.big ? 96 : 72) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 22; ctx.strokeStyle = 'rgba(20,10,40,0.85)'; ctx.strokeText(s.text, 0, 0);
    const g = ctx.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, s.c); g.addColorStop(1, lighten(s.c, -0.0));
    ctx.fillStyle = g; ctx.fillText(s.text, 0, 0); ctx.restore();
  }
}
// ---------- 天气覆盖 ----------
function setWeather(B, kind, dur) { if (!kind) return; B.weather = { kind, t: 0, dur: dur || 2.4 }; }
function drawWeather(B, dt) {
  const W0 = B.weather; if (!W0) return; W0.t += dt; if (W0.t > W0.dur) { B.weather = null; return; }
  const a = Math.min(1, W0.t / 0.35, (W0.dur - W0.t) / 0.5);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const k = W0.kind, s = CH / 900;
  if (k === 'rain' || k === 'storm') {
    ctx.fillStyle = 'rgba(10,20,50,' + 0.35 * a + ')'; ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = 'rgba(190,220,255,' + 0.55 * a + ')'; ctx.lineWidth = 3 * s; ctx.beginPath();
    for (let i = 0; i < 160; i++) { const x = (hash(i, 1) * CW * 1.3 + NOW * 300 * s) % (CW * 1.3) - CW * 0.15, y = (hash(i, 2) * CH + NOW * 1800 * s * (0.8 + hash(i, 3) * 0.4)) % (CH + 60 * s) - 30 * s; ctx.moveTo(x, y); ctx.lineTo(x - 14 * s, y + 46 * s); }
    ctx.stroke();
    if (k === 'storm' && Math.sin(NOW * 13) > 0.93) { ctx.fillStyle = 'rgba(230,240,255,' + 0.35 * a + ')'; ctx.fillRect(0, 0, CW, CH); }
  } else if (k === 'snow') {
    ctx.fillStyle = 'rgba(200,230,255,' + 0.22 * a + ')'; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = 'rgba(255,255,255,' + 0.9 * a + ')';
    for (let i = 0; i < 180; i++) { const z = 0.5 + hash(i, 5); const x = (hash(i, 1) * CW * 1.2 + NOW * 260 * s * z + Math.sin(NOW * 2 + i) * 30 * s) % (CW * 1.2) - CW * 0.1, y = (hash(i, 2) * CH + NOW * 360 * s * z) % (CH + 40) - 20; ctx.beginPath(); ctx.arc(x, y, 4 * s * z, 0, 6.28); ctx.fill(); }
  } else if (k === 'heat') {
    const g = ctx.createLinearGradient(0, CH, 0, 0); g.addColorStop(0, 'rgba(255,90,20,' + 0.35 * a + ')'); g.addColorStop(1, 'rgba(255,170,60,' + 0.08 * a + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) { const x = hash(i, 1) * CW + Math.sin(NOW * 2 + i) * 20 * s, y = CH - ((hash(i, 2) * CH + NOW * 220 * s * (0.6 + hash(i, 3))) % (CH * 1.1)); ctx.globalAlpha = a; ctx.drawImage(glowSprite('#ff8a20'), x - 10 * s, y - 10 * s, 20 * s, 20 * s); }
  } else if (k === 'petals') {
    ctx.fillStyle = 'rgba(255,190,220,' + 0.12 * a + ')'; ctx.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 90; i++) { const x = (hash(i, 1) * CW * 1.3 + NOW * 380 * s * (0.6 + hash(i, 4))) % (CW * 1.3) - CW * 0.15, y = (hash(i, 2) * CH + NOW * 160 * s + Math.sin(NOW * 2 + i) * 40 * s) % CH;
      ctx.save(); ctx.translate(x, y); ctx.rotate(NOW * 3 + i); ctx.scale(1, 0.5 + 0.5 * Math.sin(NOW * 5 + i)); ctx.globalAlpha = a; ctx.fillStyle = i % 3 ? '#ffb3d1' : '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 12 * s, 7 * s, 0, 0, 6.28); ctx.fill(); ctx.restore(); }
  } else if (k === 'sun') {
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,170,' + 0.2 * a + ')'; ctx.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(CW * 0.5, -CH * 0.1); ctx.rotate(0.2 + i * 0.22 + Math.sin(NOW + i) * 0.03); const g = ctx.createLinearGradient(0, 0, 0, CH * 1.3); g.addColorStop(0, 'rgba(255,250,200,' + 0.35 * a + ')'); g.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = g; ctx.fillRect(-40 * s, 0, 80 * s, CH * 1.3); ctx.restore(); }
  } else if (k === 'night') {
    ctx.fillStyle = 'rgba(10,10,50,' + 0.5 * a + ')'; ctx.fillRect(0, 0, CW, CH); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) { const tw = 0.5 + 0.5 * Math.sin(NOW * 4 + i * 3); ctx.globalAlpha = a * tw; const x = hash(i, 7) * CW, y = hash(i, 8) * CH * 0.7; ctx.drawImage(glowSprite('#cfe0ff'), x - 8 * s, y - 8 * s, 16 * s, 16 * s); }
  } else if (k === 'wind') {
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.45 * a + ')'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) { const y = hash(i, 2) * CH, x = (hash(i, 1) * CW * 1.5 + NOW * 2400 * s) % (CW * 1.5) - CW * 0.25; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 120 * s, y - 20 * s, x + 260 * s, y); ctx.stroke(); }
  }
  ctx.restore();
}
// ---------- 招式特效配方 ----------
// type: proj 投射 / beam 光束 / stream 喷射 / contact 近身 / sky 天降 / area 目标区域 / wave 巨浪 / vortex 漩涡 / self 自身强化 / status 干扰
const FXDEF = {
  impact: { type: 'contact', c: ['#ffffff', '#ffe9a0'], pk: 'spark' }, slash: { type: 'contact', c: ['#ffffff', '#c8e0ff'], slash: 3 }, speedlines: { type: 'contact', c: ['#ffffff', '#bfe8ff'], speed: 1 },
  beam: { type: 'beam', c: ['#fff6c0', '#ffd23a'], w: 70 }, sound: { type: 'status', c: ['#c8d0ff', '#ffffff'], sound: 1 }, glare: { type: 'status', c: ['#ff5a7a', '#ffd0e0'], glare: 1 }, buff: { type: 'self', c: ['#ffb84a', '#ff6a3a'] },
  fireball: { type: 'proj', c: ['#ffb030', '#ff4a1a'], pk: 'ember', size: 70, arc: 90 }, flamedash: { type: 'contact', c: ['#ffb030', '#ff4a1a'], pk: 'ember', trailFire: 1 },
  flamestream: { type: 'stream', c: ['#ffd060', '#ff4a1a'], pk: 'ember' }, explosion: { type: 'area', c: ['#ffd060', '#ff4a1a'], pk: 'ember', boom: 1 }, firestorm: { type: 'sky', c: ['#ffb030', '#ff3a10'], drop: 'meteor', n: 7, pk: 'ember' },
  waterball: { type: 'proj', c: ['#9ad8ff', '#2a8aff'], pk: 'drop', size: 60, arc: 70 }, bubbles: { type: 'proj', c: ['#c8f0ff', '#5ab8ff'], pk: 'bubble', size: 34, count: 7, arc: 40 },
  waterstream: { type: 'stream', c: ['#c8ecff', '#2a8aff'], pk: 'drop' }, wave: { type: 'wave', c: ['#bfe6ff', '#1f6fd8'], pk: 'drop' }, hydrobeam: { type: 'beam', c: ['#d0f0ff', '#2a8aff'], w: 90, pk: 'drop' },
  vinewhip: { type: 'contact', c: ['#7adf5a', '#2f8a2a'], vine: 1, pk: 'leaf' }, leaves: { type: 'proj', c: ['#9ae86a', '#3aa83a'], pk: 'leaf', size: 30, count: 9, arc: 50 }, leafslash: { type: 'contact', c: ['#c8ff9a', '#3aa83a'], slash: 2, pk: 'leaf' },
  petalstorm: { type: 'vortex', c: ['#ffb3d1', '#ff6aa0'], pk: 'petal' }, solarbeam: { type: 'beam', c: ['#fffbd0', '#9aff5a'], w: 110, charge: 1 },
  sparks: { type: 'contact', c: ['#fff36a', '#ffd23a'], pk: 'spark', zap: 1 }, emwave: { type: 'status', c: ['#fff36a', '#ffe23a'], emw: 1 }, bolt: { type: 'sky', c: ['#fff36a', '#ffd23a'], drop: 'bolt', n: 1 },
  thunder: { type: 'sky', c: ['#fff36a', '#ffd23a'], drop: 'bolt', n: 4 }, railbeam: { type: 'beam', c: ['#fffbd0', '#ffe23a'], w: 60, zap: 1, charge: 1 },
  shards: { type: 'proj', c: ['#e8fbff', '#7fe0ff'], pk: 'shard', size: 34, count: 6, arc: 30 }, frostbreath: { type: 'stream', c: ['#ffffff', '#9fe8ff'], pk: 'snow' }, icebeam: { type: 'beam', c: ['#f0fdff', '#66ccee'], w: 64, ice: 1 },
  blizzard: { type: 'vortex', c: ['#ffffff', '#9fe8ff'], pk: 'shard' },
  rocks: { type: 'proj', c: ['#d8b878', '#8a6a3a'], pk: 'rock', size: 40, count: 4, arc: 120 }, rockslide: { type: 'sky', c: ['#d8b878', '#7a5a2a'], drop: 'rock', n: 8, pk: 'rock' }, quake: { type: 'area', c: ['#d8b878', '#7a5a2a'], crack: 1, pk: 'rock' },
  spikes: { type: 'area', c: ['#e8d0a0', '#8a6a3a'], spikes: 1, pk: 'rock' },
  // 招牌技
  firetornado: { type: 'vortex', c: ['#ffd060', '#ff3a10'], pk: 'ember' }, ninetails: { type: 'sky', c: ['#ffe080', '#ff3a10'], drop: 'tail', n: 9, pk: 'ember', boom: 1 },
  whirlpool: { type: 'vortex', c: ['#c8ecff', '#1f6fd8'], pk: 'drop' }, tsunami: { type: 'wave', c: ['#e8fbff', '#1a5ab8'], pk: 'shard', big: 1 },
  vinebind: { type: 'area', c: ['#7adf5a', '#2f8a2a'], vines: 1, pk: 'leaf' }, sakura: { type: 'vortex', c: ['#ffd0e4', '#ff6aa0'], pk: 'petal', big: 1 },
  cloudbomb: { type: 'proj', c: ['#ffffff', '#ffe23a'], pk: 'spark', size: 110, arc: 160, cloud: 1 }, megathunder: { type: 'sky', c: ['#fffbd0', '#ffd23a'], drop: 'bolt', n: 10, boom: 1 },
  multikick: { type: 'contact', c: ['#ffffff', '#b8ffb0'], multi: 4, pk: 'leaf' }, moonlight: { type: 'beam', c: ['#ffffff', '#c8b8ff'], w: 150, moon: 1, pk: 'star' },
  galewing: { type: 'contact', c: ['#ffffff', '#bfe8ff'], speed: 1, wind: 1 }, hurricane: { type: 'vortex', c: ['#ffffff', '#b8e0ff'], pk: 'leaf', big: 1, wind: 1 },
  tailwhip: { type: 'contact', c: ['#ffb030', '#ff4a1a'], slash: 1, pk: 'ember' }, meteor: { type: 'sky', c: ['#ffd060', '#ff3a10'], drop: 'meteor', n: 5, big: 1, boom: 1, pk: 'ember' },
  rainbow: { type: 'beam', c: ['#ffffff', '#ff6aa0'], w: 80, rainbow: 1 }, aurora: { type: 'beam', c: ['#d0fff0', '#5ae0c0'], w: 160, aurora: 1, pk: 'star' },
  sporebomb: { type: 'proj', c: ['#e8ffa0', '#9ad84a'], pk: 'smoke', size: 60, arc: 140, spore: 1 }, forestwrath: { type: 'area', c: ['#c8ff9a', '#2f8a2a'], vines: 1, pk: 'leaf', boom: 1 },
  magnethorn: { type: 'contact', c: ['#fff36a', '#b07aff'], zap: 1, pk: 'spark' }, thunderlance: { type: 'beam', c: ['#fffbd0', '#ffd23a'], w: 90, zap: 1, charge: 1, lance: 1 },
  frostfang: { type: 'contact', c: ['#ffffff', '#7fe0ff'], fang: 1, pk: 'shard' }, glacier: { type: 'area', c: ['#f0fdff', '#66ccee'], icicles: 1, pk: 'shard', boom: 1 },
  rollout: { type: 'contact', c: ['#e8b878', '#a8502a'], roll: 1, pk: 'rock' }, earthsplit: { type: 'area', c: ['#ffb060', '#7a4a1a'], crack: 1, spikes: 1, pk: 'rock', boom: 1 }
};
// 动作曲线：返回攻击者的偏移 / 旋转 / 挤压拉伸
function motionOf(m, u, H, dir, dist) {
  const o = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, glow: 0 };
  if (m === 'lunge' || m === 'dash') {
    const reach = m === 'dash' ? dist * 0.55 : 130;
    if (u < 0.22) { const q = u / 0.22; o.x = -40 * easeOut(q) * dir; o.sx = 1 + 0.12 * q; o.sy = 1 - 0.1 * q; }
    else if (u < H) { const q = (u - 0.22) / (H - 0.22); o.x = (-40 + (reach + 40) * easeInOut(q)) * dir; o.y = -Math.sin(q * Math.PI) * 30; o.sx = 0.88; o.sy = 1.12; }
    else { const q = Math.min(1, (u - H) / (1 - H)); o.x = reach * (1 - easeOut(q)) * dir; o.sx = 1 - 0.08 * Math.sin(q * Math.PI); o.sy = 1 + 0.06 * Math.sin(q * Math.PI); }
  } else if (m === 'jump') {
    if (u < 0.15) { const q = u / 0.15; o.sx = 1 + 0.18 * q; o.sy = 1 - 0.18 * q; }
    else if (u < H) { const q = (u - 0.15) / (H - 0.15); o.x = dist * 0.45 * q * dir; o.y = -Math.sin(q * Math.PI * 0.85) * 260 - (q > 0.8 ? 0 : 0); o.sx = 0.86; o.sy = 1.16; o.rot = q * 0.3 * dir; }
    else { const q = Math.min(1, (u - H) / (1 - H)); o.x = dist * 0.45 * (1 - easeOut(q)) * dir; o.sx = 1 + 0.2 * (1 - q) * (q < 0.3 ? 1 : 0); o.sy = 1 - 0.18 * (q < 0.3 ? 1 - q / 0.3 : 0); }
  } else if (m === 'spin') {
    const q = clamp((u - 0.1) / (H - 0.1), 0, 1); o.rot = easeInOut(q) * 6.283 * 2 * dir * (u < H ? 1 : 0); o.x = Math.sin(Math.min(1, u / H) * Math.PI) * dist * 0.3 * dir; o.sx = 1 + Math.sin(q * 20) * 0.04;
  } else if (m === 'cast') {
    const q = Math.min(1, u / H); o.x = -Math.sin(q * Math.PI) * 30 * dir; o.y = -Math.sin(q * Math.PI) * 18; o.glow = Math.sin(q * Math.PI) * 0.7; o.sy = 1 + 0.05 * Math.sin(q * Math.PI);
  } else if (m === 'charge') {
    const q = Math.min(1, u / H); o.glow = q < 0.85 ? q : 1 - (q - 0.85) / 0.15 * 0.6; o.x = (Math.random() - 0.5) * 10 * q; o.sx = 1 + 0.08 * q; o.sy = 1 - 0.06 * q;
    if (u > H) { const r = Math.min(1, (u - H) / 0.2); o.x = -50 * (1 - r) * dir; o.sx = 1.0; }
  } else if (m === 'roar') {
    const q = Math.min(1, u / H); const pul = Math.sin(q * Math.PI); o.sx = 1 + 0.12 * pul; o.sy = 1 + 0.12 * pul; o.y = -pul * 20; o.glow = pul * 0.5;
  }
  return o;
}
// 招式动画参数
function moveTiming(id) { const fx = MOVES[id].fx; const sig = fx.sig || 0; const def = FXDEF[fx.k]; const cut = sig === 2 ? 1.5 : sig === 1 ? 0.75 : 0;
  const base = def.type === 'sky' || def.type === 'vortex' || def.type === 'wave' || def.type === 'area' ? 1.35 : def.type === 'beam' || def.type === 'stream' ? 1.25 : 1.0;
  const H = def.type === 'beam' || def.type === 'stream' ? 0.42 : def.type === 'sky' ? 0.5 : def.type === 'vortex' ? 0.4 : def.type === 'contact' ? 0.42 : 0.5;
  return { cut, dur: cut + base * (sig ? 1.35 : 1), H }; }
// 每帧绘制招式的主体特效（在战斗镜头坐标系中）
function drawMoveFx(B, A, u, S, Tg, dt) {
  const fx = MOVES[A.move].fx, d = FXDEF[fx.k], H = A.H, c1 = d.c[0], c2 = d.c[1], big = fx.sig ? 1.35 + (fx.sig - 1) * 0.35 : 1;
  const dir = A.side === 'p' ? 1 : -1;
  // 蓄力 / 施法光环
  if ((fx.m === 'charge' || d.charge) && u < H) {
    const q = u / H;
    glowOrb(S.x, S.y, 140 * q * big + 40, c2, true);
    if (Math.random() < 0.9) { const a = Math.random() * 6.28, r = 320 * big; pSpawn({ x: S.x + Math.cos(a) * r, y: S.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 2.2, vy: -Math.sin(a) * r * 1.6, drag: 0, ay: 0, life: 0.42, s: 16, s1: 4, c: c2, k: 0, front: true }); }
  }
  if (fx.m === 'cast' && u < H) { const q = u / H; glowOrb(S.x + 40 * dir, S.y - 20, 70 * Math.sin(q * Math.PI) * big + 10, c2); }
  if (fx.m === 'roar' && u > 0.1 && u < H && !A.roared) { A.roared = 1; for (let i = 0; i < 3; i++) setTimeout(() => G.battle && addRing(G.battle, S.x, S.y, 420, c2, 0.6, 0.6, 16), i * 110); B.shake = Math.max(B.shake, 10); }
  switch (d.type) {
    case 'proj': {
      const n = d.count || 1;
      for (let j = 0; j < n; j++) {
        const delay = j * 0.05, q = clamp((u - 0.15 - delay) / (H - 0.15), 0, 1); if (q <= 0 || u > H + delay + 0.02) continue;
        const ox = (hash(j, 3) - 0.5) * 120 * (n > 1 ? 1 : 0), oy = (hash(j, 5) - 0.5) * 100 * (n > 1 ? 1 : 0);
        const x = S.x + (Tg.x + ox * q - S.x) * q, y = S.y + (Tg.y + oy * q - S.y) * q - Math.sin(q * Math.PI) * (d.arc || 60);
        const sz = (d.size || 50) * big;
        if (d.pk === 'leaf' || d.pk === 'shard' || d.pk === 'rock' || d.pk === 'bubble') {
          ctx.save(); ctx.translate(x, y); ctx.rotate(d.pk === 'shard' ? Math.atan2(Tg.y - S.y, Tg.x - S.x) + Math.PI / 2 : NOW * 14 + j);
          if (d.pk === 'leaf') { ctx.fillStyle = j % 2 ? c1 : c2; ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 0.38, 0, 0, 6.28); ctx.fill(); }
          else if (d.pk === 'shard') { ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.32, 0); ctx.lineTo(0, sz * 0.8); ctx.lineTo(-sz * 0.32, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.stroke(); }
          else if (d.pk === 'rock') { ctx.fillStyle = c2; ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, r = sz * (0.7 + 0.3 * hash(j, i)); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(-sz * 0.2, -sz * 0.2, sz * 0.35, 0, 6.28); ctx.fill(); }
          else { ctx.strokeStyle = 'rgba(230,250,255,0.95)'; ctx.lineWidth = 4; ctx.fillStyle = 'rgba(160,220,255,0.25)'; ctx.beginPath(); ctx.arc(0, 0, sz, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-sz * 0.35, -sz * 0.35, sz * 0.2, 0, 6.28); ctx.fill(); }
          ctx.restore();
          if (Math.random() < 0.3) pSpawn({ x, y, vx: rnd(-60, 60), vy: rnd(-60, 60), life: 0.35, s: sz * 0.4, s1: 0, c: c2, k: 0 });
        } else if (d.cloud) {
          for (let i = 0; i < 5; i++) ctx.drawImage(softSprite('#f4f8ff'), x - sz + i * sz * 0.4 - sz * 0.3, y - sz * 0.6 + Math.sin(i * 2) * 20, sz * 1.2, sz * 1.1);
          if (Math.random() < 0.5) lightning(x, y + sz * 0.3, x + rnd(-80, 80), y + sz * 1.4, 4, c2);
        } else if (d.spore) {
          ctx.drawImage(softSprite(c2), x - sz, y - sz, sz * 2, sz * 2); glowOrb(x, y, sz * 0.6, c1);
          if (Math.random() < 0.7) pSpawn({ x, y, vx: rnd(-50, 50), vy: rnd(-80, 0), ay: -20, life: 0.9, s: 18, s1: 40, c: c2, k: PK.smoke });
        } else {
          for (let i = 0; i < 6; i++) { const kk = Math.max(0, q - i * 0.035); const xx = S.x + (Tg.x - S.x) * kk, yy = S.y + (Tg.y - S.y) * kk - Math.sin(kk * Math.PI) * (d.arc || 60); glowOrb(xx, yy, sz * (1 - i * 0.13), i % 2 ? c2 : c1, i === 0); }
          if (d.pk === 'ember') pSpawn({ x, y, vx: rnd(-80, 80), vy: rnd(-160, -40), ay: -200, life: 0.5, s: 22, s1: 0, c: Math.random() < 0.5 ? c1 : c2, k: 0 });
          if (d.pk === 'drop') pSpawn({ x, y, vx: rnd(-80, 80), vy: rnd(-60, 60), ay: 600, life: 0.5, s: 14, s1: 6, c: c1, k: PK.drop });
        }
      }
      break;
    }
    case 'beam': {
      const q0 = 0.15; if (u < q0) break;
      const grow = clamp((u - q0) / (H - q0), 0, 1), fade = u > 0.82 ? 1 - (u - 0.82) / 0.18 : 1; if (fade <= 0) break;
      const ex = S.x + (Tg.x - S.x) * easeOut(grow), ey = S.y + (Tg.y - S.y) * easeOut(grow);
      const w = d.w * big * (0.75 + 0.25 * Math.sin(NOW * 40)) * fade;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      if (d.rainbow || d.aurora) {
        const cols = d.rainbow ? ['#ff5a5a', '#ffb03a', '#ffe83a', '#5ae05a', '#3ab0ff', '#9a6aff'] : ['#5affc8', '#5ae0ff', '#b08aff', '#5affa0'];
        cols.forEach((cc, i) => { const off = (i - cols.length / 2) * w * 0.22 + Math.sin(NOW * 6 + i) * 10; ctx.strokeStyle = hexA(cc, 0.55 * fade); ctx.lineWidth = w * 0.3; ctx.beginPath(); ctx.moveTo(S.x, S.y + off); ctx.quadraticCurveTo((S.x + ex) / 2, (S.y + ey) / 2 - 120 + off, ex, ey + off * 0.3); ctx.stroke(); });
      } else if (d.moon) {
        // 月光：从天而降的光柱
        ctx.strokeStyle = hexA(c2, 0.35 * fade); ctx.lineWidth = w * 2.2; ctx.beginPath(); ctx.moveTo(Tg.x, Tg.y - 900); ctx.lineTo(Tg.x, Tg.y + 60); ctx.stroke();
        ctx.strokeStyle = hexA('#ffffff', 0.7 * fade); ctx.lineWidth = w * 0.6; ctx.beginPath(); ctx.moveTo(Tg.x, Tg.y - 900); ctx.lineTo(Tg.x, Tg.y + 60); ctx.stroke();
        glowOrb(Tg.x, Tg.y - 640, 180 * fade, '#e8e0ff', true);
      } else {
        [[w * 1.9, hexA(c2, 0.25 * fade)], [w, hexA(c2, 0.7 * fade)], [w * 0.42, 'rgba(255,255,255,' + 0.95 * fade + ')']].forEach(([lw, col]) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(ex, ey); ctx.stroke(); });
        if (d.zap) for (let i = 0; i < 2; i++) lightning(S.x, S.y, ex, ey, 5 * big, c2);
        if (d.ice && Math.random() < 0.8) pSpawn({ x: S.x + (ex - S.x) * Math.random(), y: S.y + (ey - S.y) * Math.random(), vx: rnd(-90, 90), vy: rnd(-90, 90), ay: 120, life: 0.6, s: 18, c: '#e8fbff', k: PK.shard });
        if (d.pk === 'drop' && Math.random() < 0.9) pSpawn({ x: ex, y: ey, vx: rnd(-300, 300), vy: rnd(-400, -100), ay: 900, life: 0.6, s: 16, s1: 6, c: '#bfe6ff', k: PK.drop });
      }
      glowOrb(S.x, S.y, w * 1.3, c2); if (grow >= 1) glowOrb(ex, ey, w * 2.2 * (0.8 + 0.2 * Math.sin(NOW * 30)), c2);
      if (d.lance && grow >= 1) { for (let i = 0; i < 3; i++) lightning(Tg.x + rnd(-120, 120), Tg.y - 500, Tg.x + rnd(-30, 30), Tg.y, 7, c2); }
      ctx.restore();
      if (d.pk === 'star' && Math.random() < 0.8) pSpawn({ x: ex + rnd(-100, 100), y: ey + rnd(-100, 100), vx: rnd(-40, 40), vy: rnd(-120, -20), ay: 0, life: 0.8, s: 22, s1: 0, c: '#ffffff', k: PK.star });
      break;
    }
    case 'stream': {
      if (u < 0.12 || u > 0.86) break;
      for (let i = 0; i < Math.round(5 * big); i++) {
        const ang = Math.atan2(Tg.y - S.y, Tg.x - S.x) + rnd(-0.12, 0.12), dist = Math.hypot(Tg.x - S.x, Tg.y - S.y), sp = dist / 0.42;
        pSpawn({ x: S.x + 40 * dir, y: S.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, drag: 0.3, ay: d.pk === 'drop' ? 200 : d.pk === 'ember' ? -120 : 40, life: 0.45, s: d.pk === 'snow' ? 26 : 34, s1: d.pk === 'snow' ? 60 : 70, c: Math.random() < 0.5 ? c1 : c2, k: d.pk === 'drop' ? PK.drop : d.pk === 'snow' ? 0 : 0, front: true });
      }
      if (d.pk === 'snow') for (let i = 0; i < 2; i++) pSpawn({ x: S.x + (Tg.x - S.x) * Math.random(), y: S.y + (Tg.y - S.y) * Math.random(), vx: rnd(-100, 100), vy: rnd(-100, 100), ay: 60, life: 0.6, s: 12, c: '#fff', k: PK.shard });
      break;
    }
    case 'contact': {
      // 冲刺残影与速度线
      if (u > 0.2 && u < H) {
        if (d.speed || d.trailFire || d.roll) for (let i = 0; i < 2; i++) pSpawn({ x: A.ax + rnd(-60, 60), y: A.ay + rnd(-80, 80), vx: -dir * rnd(300, 700), vy: rnd(-30, 30), ay: 0, drag: 2, life: 0.3, s: d.trailFire ? 40 : 18, s1: 0, c: d.trailFire ? (Math.random() < 0.5 ? c1 : c2) : d.roll ? '#e8c890' : '#ffffff', k: d.trailFire ? 0 : PK.spark });
        if (d.zap && Math.random() < 0.6) lightning(A.ax, A.ay, A.ax + rnd(-150, 150), A.ay + rnd(-150, 150), 4, c1);
        if (d.wind && Math.random() < 0.7) pSpawn({ x: A.ax, y: A.ay + rnd(-90, 90), vx: -dir * 900, vy: 0, ay: 0, drag: 0, life: 0.25, s: 30, c: '#ffffff', k: PK.spark });
      }
      // 命中瞬间的爪痕/斩击
      if (u >= H && u < H + 0.3) {
        const q = (u - H) / 0.3;
        if (d.slash) for (let i = 0; i < d.slash; i++) { ctx.save(); ctx.translate(Tg.x + (i - (d.slash - 1) / 2) * 50, Tg.y); ctx.rotate(-0.8 + i * 0.12); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(c2, 1 - q); ctx.lineWidth = 26 * (1 - q) + 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 150 * big, -1.1, -1.1 + 2.2 * Math.min(1, q * 3)); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - q) + ')'; ctx.lineWidth = 8 * (1 - q) + 2; ctx.stroke(); ctx.restore(); }
        if (d.vine) { ctx.save(); ctx.strokeStyle = c2; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(S.x, S.y + 40); ctx.bezierCurveTo(S.x + (Tg.x - S.x) * 0.3, S.y - 250, Tg.x - 200 * dir, Tg.y - 300 * (1 - q), Tg.x, Tg.y); ctx.stroke(); ctx.strokeStyle = c1; ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); }
        if (d.fang) { ctx.save(); ctx.translate(Tg.x, Tg.y); ctx.globalAlpha = 1 - q; const cl = (1 - Math.min(1, q * 4)) * 120; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = c2; ctx.lineWidth = 6; for (let s2 = -1; s2 <= 1; s2 += 2) { ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.lineTo(-160 + i * 80, s2 * cl); ctx.lineTo(-120 + i * 80, s2 * (cl - 70)); } ctx.lineTo(240, s2 * cl); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); }
        if (d.multi) { const hits = d.multi; const hi = Math.floor(q * hits * 1.5); if (hi !== A.lastMulti && hi < hits) { A.lastMulti = hi; addStar(B, Tg.x + rnd(-80, 80), Tg.y + rnd(-80, 80), c2, false); B.shake = Math.max(B.shake, 14); AudioSys.sfx('hit'); } }
      }
      break;
    }
    case 'sky': {
      const n = Math.round((d.n || 3) * (fx.sig ? 1 : 1));
      for (let j = 0; j < n; j++) {
        const t0 = 0.12 + (H - 0.12) * (j / Math.max(1, n)) * 0.9, q = clamp((u - t0) / 0.18, 0, 1); if (q <= 0) continue;
        const tx = Tg.x + (n > 1 ? (hash(j, 9) - 0.5) * 360 : 0), ty = Tg.y + (n > 1 ? (hash(j, 4) - 0.5) * 120 : 0);
        if (d.drop === 'bolt') { if (q < 1 || u - t0 < 0.32) { lightning(tx + (hash(j, 2) - 0.5) * 200, ty - 900, tx, ty + 60, 9 * big, c2, Math.floor(NOW * 30) + j); glowOrb(tx, ty + 40, 160 * big, c2); if (!A['b' + j]) { A['b' + j] = 1; B.flash = Math.max(B.flash, 0.35); B.flashC = '255,250,200'; AudioSys.sfx('electric'); burst(tx, ty + 40, 14, { c: c2, k: 'spark', g: 0 }); } } }
        else {
          const sx = tx - 500 * (d.drop === 'meteor' || d.drop === 'tail' ? dir : 0.2), sy = ty - 900;
          const x = sx + (tx - sx) * q, y = sy + (ty - sy) * q;
          if (q < 1) {
            if (d.drop === 'rock') { ctx.save(); ctx.translate(x, y); ctx.rotate(NOW * 6 + j); ctx.fillStyle = c2; ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, r = 60 * (0.7 + 0.3 * hash(j, i)) * big; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(-14, -14, 22 * big, 0, 6.28); ctx.fill(); ctx.restore(); }
            else { for (let i = 0; i < 7; i++) { const kk = Math.max(0, q - i * 0.05); glowOrb(sx + (tx - sx) * kk, sy + (ty - sy) * kk, (d.drop === 'tail' ? 60 : 90) * big * (1 - i * 0.12), i % 2 ? c2 : c1, i === 0); } pSpawn({ x, y, vx: rnd(-60, 60), vy: rnd(-200, -60), ay: -100, life: 0.4, s: 26, s1: 0, c: c1, k: 0 }); }
          } else if (!A['m' + j]) { A['m' + j] = 1; addRing(B, tx, ty + 80, 260 * big, c2, 0.5); burst(tx, ty + 30, 18, { c: [c1, c2], k: d.pk || 'glow', up: -200 }); B.shake = Math.max(B.shake, 16 * big); AudioSys.sfx(d.drop === 'rock' ? 'rock' : 'hit'); }
        }
      }
      break;
    }
    case 'vortex': {
      const q = clamp((u - 0.1) / 0.8, 0, 1); if (q <= 0 || q >= 1) break;
      const amp = Math.sin(q * Math.PI);
      for (let i = 0; i < Math.round(4 * big); i++) {
        const a = NOW * 9 + Math.random() * 6.28, r = 200 * big * (0.4 + Math.random() * 0.6);
        pSpawn({ x: Tg.x + Math.cos(a) * r, y: Tg.y + 80 + Math.sin(a) * r * 0.3, vx: -Math.sin(a) * 600, vy: -rnd(200, 520), ay: -100, drag: 1, life: 0.55, s: d.pk === 'petal' || d.pk === 'leaf' ? 18 : 30, s1: d.pk === 'petal' ? 14 : 0, c: Math.random() < 0.5 ? c1 : c2, k: PK[d.pk] || 0, front: Math.sin(a) > 0 });
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(Tg.x, Tg.y + 60);
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = hexA(i % 2 ? c1 : c2, 0.35 * amp); ctx.lineWidth = 16; ctx.beginPath(); const yy = -i * 70 * big; const rr = (140 + i * 26) * big; ctx.ellipse(0, yy, rr, rr * 0.28, 0, NOW * 8 + i, NOW * 8 + i + 4); ctx.stroke(); }
      ctx.restore();
      if (d.wind) for (let i = 0; i < 2; i++) pSpawn({ x: Tg.x - 700, y: Tg.y + rnd(-200, 200), vx: 2200, vy: 0, ay: 0, drag: 0, life: 0.35, s: 30, c: '#ffffff', k: PK.spark });
      break;
    }
    case 'wave': {
      const q = clamp((u - 0.12) / (H - 0.12 + 0.2), 0, 1); if (q <= 0 || q >= 1) break;
      const x0 = A.side === 'p' ? -200 : 1800, x1 = A.side === 'p' ? 1800 : -200, wx = x0 + (x1 - x0) * easeInOut(q);
      const top = Tg.y - 360 * big;
      ctx.save();
      const g = ctx.createLinearGradient(0, top, 0, 1000); g.addColorStop(0, hexA(c1, 0.9)); g.addColorStop(0.3, hexA(c2, 0.85)); g.addColorStop(1, hexA(c2, 0.95));
      ctx.fillStyle = g; ctx.beginPath(); const back = A.side === 'p' ? -2000 : 2000;
      ctx.moveTo(wx + back, 1000); ctx.lineTo(wx + back, top + 80);
      for (let i = 0; i <= 20; i++) { const xx = wx + back * (1 - i / 20), yy = top + 80 + Math.sin(i * 0.9 + NOW * 6) * 30 - (i > 16 ? (i - 16) * 30 : 0); ctx.lineTo(xx, yy); }
      ctx.quadraticCurveTo(wx + 160 * dir, top - 80, wx + 60 * dir, top + 140); ctx.lineTo(wx, 1000); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 10; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 6; i++) pSpawn({ x: wx + rnd(-40, 40), y: top + rnd(0, 200), vx: dir * rnd(100, 500), vy: rnd(-500, -100), ay: 900, life: 0.6, s: 18, s1: 6, c: '#e8f8ff', k: d.pk === 'shard' && i % 2 ? PK.shard : PK.drop, front: true });
      break;
    }
    case 'area': {
      const q = clamp((u - 0.2) / (H - 0.2 + 0.3), 0, 1); if (q <= 0 || q >= 1) break;
      if (d.boom && u < H) glowOrb(Tg.x, Tg.y, 80 + 160 * (u - 0.2) / (H - 0.2) * big, c2, true);
      if (d.crack) { ctx.save(); ctx.strokeStyle = hexA('#2a1a0a', 0.9 * (1 - q)); ctx.lineWidth = 8; ctx.lineCap = 'round'; const gy = Tg.y + 150; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(Tg.x, gy); let x = Tg.x, y = gy; for (let s2 = 0; s2 < 5; s2++) { x += Math.cos(i * 0.9) * 70 * Math.min(1, q * 3) * big; y += Math.sin(i * 0.9) * 22 + (hash(i, s2) - 0.5) * 30; ctx.lineTo(x, y); } ctx.stroke(); } ctx.strokeStyle = hexA(c1, 0.8 * (1 - q)); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
      if (d.spikes || d.icicles) { for (let i = 0; i < 7; i++) { const sx = Tg.x + (i - 3) * 70 * big, hgt = (140 + hash(i, 2) * 160) * big * easeBack(Math.min(1, q * 2.5)) * (q > 0.8 ? (1 - q) / 0.2 : 1); ctx.save(); ctx.fillStyle = d.icicles ? 'rgba(220,250,255,0.92)' : c2; ctx.strokeStyle = d.icicles ? '#7fd8ff' : '#3a2a10'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx - 34 * big, Tg.y + 160); ctx.lineTo(sx, Tg.y + 160 - hgt); ctx.lineTo(sx + 34 * big, Tg.y + 160); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } }
      if (d.vines || d.vines === 1) { ctx.save(); ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + q * 4, r = 210 * big * (1 - q * 0.3); ctx.strokeStyle = i % 2 ? c2 : c1; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(Tg.x + Math.cos(i) * 260, Tg.y + 170); ctx.quadraticCurveTo(Tg.x + Math.cos(a) * r * 1.4, Tg.y + Math.sin(a) * r * 0.5 - 60, Tg.x + Math.cos(a + 1) * r * 0.6, Tg.y + Math.sin(a + 1) * r * 0.4 - 40); ctx.stroke(); } ctx.restore(); if (Math.random() < 0.6) pSpawn({ x: Tg.x + rnd(-200, 200), y: Tg.y + rnd(-150, 100), vx: rnd(-100, 100), vy: rnd(-200, -50), ay: 100, life: 0.8, s: 18, c: Math.random() < 0.5 ? c1 : c2, k: PK.leaf }); }
      break;
    }
    case 'self': {
      const q = clamp(u / 0.9, 0, 1); glowOrb(S.x, S.y, 220 * Math.sin(q * Math.PI), c2, true);
      if (Math.random() < 0.8) pSpawn({ x: S.x + rnd(-120, 120), y: S.y + 160, vx: 0, vy: -rnd(300, 600), ay: 0, drag: 0.5, life: 0.6, s: 26, s1: 0, c: c1, k: PK.glow, front: true });
      if (!A.selfRing && u > 0.3) { A.selfRing = 1; addRing(B, S.x, A.footY, 240, c2, 0.6, 0.3); }
      break;
    }
    case 'status': {
      const q = clamp((u - 0.1) / 0.7, 0, 1); if (q <= 0 || q >= 1) break;
      if (d.sound) { if (Math.random() < 0.4) pSpawn({ x: S.x + 60 * dir, y: S.y - 40, vx: (Tg.x - S.x) * 1.3, vy: (Tg.y - S.y) * 1.3 + rnd(-80, 80), ay: 0, drag: 0, life: 0.7, s: 30, c: '#ffffff', k: PK.note, txt: Math.random() < 0.5 ? '♪' : '♫' }); if (Math.random() < 0.1) addRing(B, S.x, S.y, 300, '#c8d0ff', 0.6, 0.9, 10); }
      if (d.glare) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let s2 = -1; s2 <= 1; s2 += 2) { ctx.strokeStyle = hexA(c1, 0.8 * Math.sin(q * Math.PI)); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(S.x + s2 * 24, S.y - 50); ctx.lineTo(Tg.x + s2 * 24, Tg.y - 40); ctx.stroke(); } ctx.restore(); glowOrb(Tg.x, Tg.y - 30, 120 * Math.sin(q * Math.PI), c1); }
      if (d.emw) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const k2 = (q * 2 + i / 5) % 1; const x = S.x + (Tg.x - S.x) * k2, y = S.y + (Tg.y - S.y) * k2; ctx.strokeStyle = hexA(c1, 0.8 * (1 - Math.abs(k2 - 0.5) * 1.6)); ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(x, y, 40 + k2 * 70, 90 + k2 * 60, Math.atan2(Tg.y - S.y, Tg.x - S.x), 0, 6.28); ctx.stroke(); } ctx.restore(); }
      break;
    }
  }
}
// 命中瞬间：环、星芒、粒子、闪光、震屏、顿帧、伤害数字、镜头冲击
function onMoveHit(B, A, Tg) {
  const fx = MOVES[A.move].fx, d = FXDEF[fx.k], c1 = d.c[0], c2 = d.c[1], eff = A.eff || 1, big = fx.sig ? 1.4 + (fx.sig - 1) * 0.4 : 1;
  const pow = (eff > 1 ? 1.35 : eff < 1 ? 0.7 : 1) * big * (A.crit ? 1.3 : 1);
  if (A.miss) { B.nums.push({ x: Tg.x, y: Tg.y - 80, t: 0, text: '未命中', c: '#c8d0e0' }); return; }
  if (!A.dmg && d.type === 'status') { addRing(B, Tg.x, Tg.y + 80, 220, c1, 0.6, 0.35); burst(Tg.x, Tg.y, 12, { c: c1, k: 'glow', g: -100 }); return; }
  if (d.type === 'self') return;
  burst(Tg.x, Tg.y, Math.round(26 * pow), { c: [c1, c2], k: d.pk && PK[d.pk] !== undefined ? d.pk : 'glow', sp1: 650 * Math.min(1.6, pow), up: -120 });
  burst(Tg.x, Tg.y, Math.round(12 * pow), { c: '#ffffff', k: 'spark', g: 200, sp1: 900 });
  addRing(B, Tg.x, Tg.y + 110, 220 * pow, c2, 0.5, 0.35, 18); if (pow > 1.2) addRing(B, Tg.x, Tg.y, 320 * pow, c1, 0.6, 0.9, 10);
  addStar(B, Tg.x, Tg.y, c2, eff > 1 || A.crit);
  B.shake = Math.max(B.shake, (eff > 1 ? 30 : eff < 1 ? 9 : 18) * Math.min(1.8, big * (A.crit ? 1.4 : 1)));
  B.flash = Math.max(B.flash, eff > 1 ? 0.55 : A.crit ? 0.5 : 0.22); B.flashC = eff > 1 ? '255,248,215' : '255,255,255';
  B.hitStop = A.crit ? 0.16 : eff > 1 ? 0.1 : fx.sig ? 0.12 : 0.05;
  B.cam.kz = Math.max(B.cam.kz, A.crit ? 0.22 : eff > 1 ? 0.12 : fx.sig ? 0.14 : 0.05); B.cam.kx = (Tg.x - 800) * 0.25; B.cam.ky = (Tg.y - 450) * 0.25;
  if (A.dmg) B.nums.push({ x: Tg.x + rnd(-30, 30), y: Tg.y - 70, t: 0, text: String(A.dmg), c: A.crit ? '#ff5a3a' : eff > 1 ? '#ffd23a' : eff < 1 ? '#c8d0e0' : '#ffffff', big: A.crit || eff > 1 });
  if (A.crit) { addStamp(B, '会心一击！', '#ff7a3a', true); B.speedLines = 0.45; }
  else if (eff > 1) addStamp(B, '效果拔群！', '#ffd23a');
  const ts = { fire: 'fire', water: 'water', grass: 'grassmove', electric: 'electric', ice: 'ice', rock: 'rock' }[MOVES[A.move].t]; if (ts) AudioSys.sfx(ts);
  AudioSys.sfx(A.crit ? 'crit' : eff > 1 ? 'super' : eff < 1 ? 'weak' : 'hit');
  const def = A.side === 'p' ? 'e' : 'p';
  B.react[def] = { t: 0, dir: A.side === 'p' ? 1 : -1, pow };
}
// 招牌技电影镜头：黑边 + 斜向横幅 + 立绘 + 招式名
function drawCutIn(B, A, t) {
  const fx = MOVES[A.move].fx; const cut = A.cut; if (t > cut) return;
  const k = t / cut, inK = easeOut(Math.min(1, k * 4)), outK = k > 0.82 ? (k - 0.82) / 0.18 : 0;
  const mon = A.side === 'p' ? active() : B.enemy, col = TYPES[MOVES[A.move].t].c;
  ctx.save();
  ctx.fillStyle = 'rgba(5,8,25,' + 0.55 * inK * (1 - outK) + ')'; ctx.fillRect(-200, -200, 2000, 1300);
  const bar = 110 * inK * (1 - outK); ctx.fillStyle = '#000'; ctx.fillRect(-200, -200, 2000, 200 + bar); ctx.fillRect(-200, 900 - bar, 2000, bar + 200);
  ctx.translate(800, 450); ctx.rotate(-0.12);
  const bx = (1 - inK) * -1800 + outK * 1800;
  ctx.save(); ctx.translate(bx, 0);
  const g = ctx.createLinearGradient(-1000, 0, 1000, 0); g.addColorStop(0, hexA(col, 0)); g.addColorStop(0.2, hexA(col, 0.95)); g.addColorStop(0.8, lighten(col, 0.3)); g.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = g; ctx.fillRect(-1100, -150, 2200, 300);
  ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4;
  for (let i = 0; i < 26; i++) { const y = -140 + hash(i, 1) * 280, x = ((hash(i, 2) * 2400 + t * 3000) % 2400) - 1200; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 200 + hash(i, 3) * 200, y); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.beginPath(); ctx.rect(-1100, -150, 2200, 300); ctx.clip();
  drawCreature(ctx, mon.sp, -420 + t * 60, 330, 620, { back: false, t: NOW });
  ctx.restore();
  ctx.font = '900 ' + (fx.sig === 2 ? 118 : 96) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 20; ctx.strokeStyle = 'rgba(20,10,40,0.9)'; ctx.strokeText(MOVES[A.move].n, 260, -10);
  const tg = ctx.createLinearGradient(0, -60, 0, 60); tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#ffe08a'); ctx.fillStyle = tg; ctx.fillText(MOVES[A.move].n, 260, -10);
  ctx.font = '800 34px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText(fx.sig === 2 ? '★ 终极招牌技 ★' : '★ 进化招牌技 ★', 260, 92);
  ctx.restore(); ctx.restore();
}
// 状态异常的持续视觉
function drawStatusFx(B, mon, x, y, size) {
  if (!mon || !mon.status) return;
  if (mon.status === 'burn' && Math.random() < 0.35) pSpawn({ x: x + rnd(-size * 0.3, size * 0.3), y: y - rnd(0, size * 0.6), vx: 0, vy: -rnd(60, 160), ay: -60, life: 0.6, s: 22, s1: 0, c: Math.random() < 0.5 ? '#ffb030' : '#ff4a1a', k: 0, front: true });
  if (mon.status === 'para' && Math.random() < 0.08) { const yy = y - rnd(size * 0.2, size * 0.7); lightning(x - size * 0.3, yy, x + size * 0.3, yy + rnd(-40, 40), 3, '#fff36a'); }
  if (mon.status === 'frz') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.2 * Math.sin(NOW * 3); ctx.drawImage(softSprite('#9fe8ff'), x - size * 0.45, y - size * 0.85, size * 0.9, size * 0.85); ctx.restore(); if (Math.random() < 0.06) pSpawn({ x: x + rnd(-size * 0.3, size * 0.3), y: y - rnd(0, size * 0.7), vx: 0, vy: 0, ay: 0, life: 0.5, s: 14, c: '#ffffff', k: PK.star, front: true }); }
}
// 濒死溶解：从身体中飘散出光粒
function faintDissolve(B, x, y, size, col) {
  for (let i = 0; i < 60; i++) pSpawn({ x: x + rnd(-size * 0.32, size * 0.32), y: y - rnd(0, size * 0.8), vx: rnd(-40, 40), vy: -rnd(40, 260), ay: -80, drag: 1, life: rnd(0.6, 1.3), s: rnd(10, 24), s1: 0, c: i % 3 ? col : '#ffffff', k: 0, delay: Math.random() * 0.4, front: true });
}
