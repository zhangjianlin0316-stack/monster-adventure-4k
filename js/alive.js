'use strict';
// ================== 灵兽“活起来”：网格变形（呼吸/挤压拉伸/身体摆动/尾巴与翅膀摆动/触手波动）+ 眨眼 + 待机小动作 ==================
// 所有 63 只灵兽通用：按系列（line）配置运动参数；眼睛位置来自 MON_EYES。由 drawCreature 调用。
const ALIVE_PROF = {
  fox: { tail: 'r', tailA: 1.2, jig: 1.2 }, cat: { tail: 'r', tailA: 1.3, jig: 1 }, lizard: { tail: 'r', tailA: 1, jig: 0.6 }, otter: { tail: 'r', tailA: 1.1 },
  tanuki: { tail: 'r', tailA: 1.2 }, fawn: { tail: 'r', tailA: 0.6, jig: 0.8 }, dragon: { tail: 'r', tailA: 1.1, wave: 0.6, jig: 1 }, rock: { tail: 'r', tailA: 0.4, br: 0.8 },
  turtle: { tail: 'r', tailA: 0.4, br: 0.9 }, bird: { wing: 1.3, jig: 0.8 }, moth: { wing: 1.4, jig: 1 }, crane: { wing: 1.1, jig: 0.6 }, owl: { wing: 0.9, br: 1.1 },
  beetle: { wing: 0.7, br: 0.9 }, jelly: { tent: 1.4, br: 1.3 }, volt: { br: 1.5, bounce: 1.3 }, bunny: { br: 1.2, bounce: 1.2, jig: 1.2 }, seal: { br: 1.4, bounce: 1.1 },
  shroom: { br: 1.3, bounce: 1.3 }, golem: { br: 0.7, sway: 0.5 }, koi: { wave: 1.2, tail: 'r', tailA: 1.3 }, qilin: { wave: 0.6, tail: 'r', tailA: 0.8, jig: 1.4 },
  whale: { wave: 0.9, tail: 'r', tailA: 1.4 }, zhulong: { wave: 1.1, jig: 1.5, tail: 'r', tailA: 0.8 }
};
const ALIVE = { q: 'high' }; try { ALIVE.q = localStorage.getItem('ls_quality') || 'high'; } catch (e) { }
function setQuality(q) { ALIVE.q = q; try { localStorage.setItem('ls_quality', q); } catch (e) { } }
const _h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const _seed = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h / 9973; };
// 眨眼：0=睁开 1=闭上。每只每 2.6–5.8 秒眨一次，偶尔连眨两下
function blinkAmt(seed, t) {
  const p = 2.6 + _h(seed, 1) * 3.2, k = Math.floor((t + seed * 10) / p), q = (t + seed * 10) - k * p;
  const one = x => x > 0 && x < 0.17 ? Math.sin(Math.PI * x / 0.17) : 0;
  let b = one(q); if (_h(k, seed * 7) < 0.25) b = Math.max(b, one(q - 0.24)); return b;
}
// 待机小动作：每 6–9 秒随机一种（跳一下 / 左右张望 / 抖一抖 / 伸懒腰 / 点头）
function fidget(seed, t) {
  const p = 6 + _h(seed, 3) * 3, k = Math.floor((t + seed * 20) / p), q = (t + seed * 20) - k * p;
  const type = Math.floor(_h(k, seed * 13) * 5), D = [0.7, 1.4, 0.6, 1.2, 0.8][type];
  if (q > D) return null; return { type, q: q / D };
}
const LID_CACHE = {};
function lidInfo(sp) {
  if (LID_CACHE[sp] !== undefined) return LID_CACHE[sp];
  const E = typeof MON_EYES !== 'undefined' && MON_EYES[sp]; if (!E) return (LID_CACHE[sp] = null);
  return (LID_CACHE[sp] = E.map(([u, v, rw, rh, hex]) => { const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return { u, v, rw, rh, c: `rgb(${r},${g},${b})`, c2: `rgb(${r * 0.82 | 0},${g * 0.8 | 0},${b * 0.8 | 0})`, lash: `rgb(${r * 0.28 | 0},${g * 0.24 | 0},${b * 0.24 | 0})` }; }));
}
const ALV_A = document.createElement('canvas'), ALV_B = document.createElement('canvas'), ALV_C = document.createElement('canvas');
function fitCv(cv, w, h) { if (cv.width < w || cv.height < h) { cv.width = Math.max(cv.width, w); cv.height = Math.max(cv.height, h); } const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w + 6, h + 6); g.imageSmoothingQuality = 'high'; return g; }
function drawLids(g, L, pw, ph, b) {
  for (const e of L) {
    const x = e.u * pw, y = e.v * ph, rx = e.rw * pw * 1.22, ry = e.rh * ph * 1.25; if (rx < 1.2) continue;
    g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.clip();
    const yl = y - ry + 2 * ry * b; const gr = g.createLinearGradient(0, y - ry, 0, yl + 1); gr.addColorStop(0, e.c); gr.addColorStop(1, e.c2);
    g.fillStyle = gr; g.fillRect(x - rx - 2, y - ry - 2, rx * 2 + 4, yl - (y - ry) + 2); g.restore();
    // 睫毛线：闭眼时成一条向下弯的弧线
    g.save(); g.strokeStyle = e.lash; g.lineCap = 'round'; g.lineWidth = Math.max(1.2, ry * 0.2); g.beginPath();
    const sag = ry * 0.35 * b; g.moveTo(x - rx * 0.95, yl - sag * 0.4); g.quadraticCurveTo(x, yl + sag, x + rx * 0.95, yl - sag * 0.4); g.globalAlpha = Math.min(1, b * 1.6); g.stroke(); g.restore();
  }
}
// 返回已经变形好的画布（以及外扩边距），drawCreature 负责最后贴到屏幕
function aliveFrame(sp, src, pw, ph, t, opt) {
  const info = SPECIES[sp] || {}, P = ALIVE_PROF[info.line] || {}, seed = _seed(sp) + (opt.phase || 0) * 0.37;
  const hi = ALIVE.q !== 'low', big = pw > 150;
  let S = src;
  const L = opt.noBlink ? null : lidInfo(sp); const bl = L ? Math.max(blinkAmt(seed, t), opt.eyesClosed || 0) : 0;
  if (bl > 0.03 && pw > 40) { const g = fitCv(ALV_C, pw, ph); g.drawImage(src, 0, 0, pw, ph); drawLids(g, L, pw, ph, bl); S = ALV_C; }
  if (!hi || pw < 60) return S === src ? null : { cv: S, m: 0, w: pw, h: ph };
  const fd = opt.fidget === false ? null : fidget(seed, t);
  const br = Math.sin(t * 2.4 + seed * 6) * (P.br || 1), sw = Math.sin(t * 1.1 + seed * 9) * (P.sway || 1), lean = opt.lean || 0;
  let tilt = 0, shake = 0, stretch = 0, hop = 0, nod = 0;
  if (fd) { const s = Math.sin(Math.PI * fd.q); if (fd.type === 0) hop = s; if (fd.type === 1) tilt = Math.sin(fd.q * Math.PI * 2) * 1.2; if (fd.type === 2) shake = Math.sin(fd.q * 60) * (1 - fd.q); if (fd.type === 3) stretch = s; if (fd.type === 4) nod = Math.sin(fd.q * Math.PI * 4) * (1 - fd.q); }
  const m = Math.round(Math.max(pw, ph) * 0.09);
  const W1 = pw + m * 2, H1 = ph + m * 2;
  // ---- 第 1 遍：横条（身体前后摆动、呼吸鼓胀、头部/毛发晃动、触手波动、整体扭动）----
  const fx = S.width === pw ? 1 : (S === ALV_C ? 1 : S.width / pw), fy = S === ALV_C ? 1 : S.height / ph;
  const g1 = fitCv(ALV_A, W1, H1); const N = big ? Math.min(30, Math.max(10, Math.round(ph / 22))) : 6; const hs = ph / N;
  const bounce = (P.bounce || 1);
  const sq = hop ? (hop > 0.85 ? 0 : 0) : 0;
  let yCur = m + ph; // 从脚底往上叠，脚底固定
  const vScaleTop = 1 + 0.022 * br * bounce + 0.07 * stretch - 0.05 * hop * (1 - hop) * 0 + sq;
  for (let i = N - 1; i >= 0; i--) {
    const y0 = i * hs, vc = 1 - (y0 + hs / 2) / ph; // vc: 0=脚底 1=头顶
    const ks = 1 + (vScaleTop - 1) * Math.min(1, vc * 1.6);
    const hh = hs * ks;
    const belly = Math.exp(-Math.pow((vc - 0.4) / 0.28, 2));
    const kx = 1 + 0.018 * br * belly * bounce - 0.03 * stretch * vc;
    let dx = pw * (0.011 * sw * vc * vc + 0.006 * (P.jig || 0.7) * Math.sin(t * 4.6 + vc * 7 + seed * 5) * Math.pow(vc, 3)
      - 0.05 * lean * Math.pow(vc, 1.4) + 0.035 * tilt * vc * vc + 0.016 * shake * vc + 0.012 * nod * Math.pow(Math.max(0, vc - 0.5) * 2, 2) * 0);
    if (P.wave) dx += pw * 0.012 * P.wave * Math.sin(t * 2.2 - vc * 6.5 + seed * 3) * (0.3 + vc * 0.7);
    if (P.tent) dx += pw * 0.022 * P.tent * Math.sin(t * 3 + vc * 11 + seed) * Math.pow(Math.max(0, 0.55 - vc) / 0.55, 1.5);
    const dw = pw * kx;
    g1.drawImage(S, 0, y0 * fy, pw * fx, Math.min(hs + 1, ph - y0) * fy, m + (pw - dw) / 2 + dx, yCur - hh - 0.5, dw, hh + 1);
    yCur -= hh;
  }
  // 点头：头部区域整体轻微下压（用顶部额外挤压近似）
  // ---- 第 2 遍：竖条（尾巴/翅膀/鳍上下摆动）----
  const wing = P.wing || 0, tail = P.tail ? (P.tailA || 1) : 0;
  const flapSp = opt.excited ? 1.8 : 1;
  if (!big || (!wing && !tail && !hop && !nod)) return { cv: ALV_A, m, w: W1, h: H1, hopY: -hop * ph * 0.1 * bounce };
  const g2 = fitCv(ALV_B, W1, H1); const M = Math.min(26, Math.max(10, Math.round(W1 / 26))); const ws = W1 / M;
  for (let j = 0; j < M; j++) {
    const x0 = j * ws, u = (x0 + ws / 2 - m) / pw; // 0=左 1=右（插画多面向左，尾巴在右侧）
    let dy = 0;
    if (tail) { const e = Math.max(0, u - 0.55) / 0.45; dy += ph * 0.03 * tail * e * e * Math.sin(t * 3.1 + seed * 4 - u * 4); }
    if (wing) { const e = Math.max(0, Math.abs(u - 0.5) - 0.18) / 0.32; dy += ph * 0.045 * wing * e * e * Math.sin(t * 5.2 * flapSp + seed * 4); }
    if (nod) { const e = Math.max(0, 0.45 - u) / 0.45; dy += ph * 0.025 * nod * e; }
    g2.drawImage(ALV_A, x0, 0, Math.min(ws + 1, W1 - x0), H1, x0 - 0.3, dy, ws + 1, H1);
  }
  return { cv: ALV_B, m, w: W1, h: H1, hopY: -hop * ph * 0.1 * bounce };
}

// 战斗姿态：蓄力（后仰）→ 出招（前冲前倾）→ 收招（回正）；受击后仰并闭眼；倒下闭眼；残血半眯眼
function battleLean(B, A, side, m) {
  const r = { lean: 0, eyes: 0, ex: false, fid: true }; const E = x => x * x * (3 - 2 * x);
  if (A && A.kind === 'move' && A.side === side && A.dur) {
    r.fid = false; r.ex = true; const cut = A.cut || 0, H = A.H || 0.5;
    if (A.t > cut) { const u = clamp((A.t - cut) / Math.max(0.01, A.dur - cut), 0, 1), a = H * 0.6;
      if (u < a) r.lean = -0.8 * E(u / a); else if (u < H) r.lean = -0.8 + 2.0 * E((u - a) / Math.max(0.01, H - a)); else r.lean = 1.2 * (1 - E((u - H) / Math.max(0.01, 1 - H)));
      if (u > a && u < H + 0.08) r.eyes = 0.0; }
    else r.lean = -0.25 * E(clamp(A.t / Math.max(0.01, cut), 0, 1));
  }
  const rc = B.react && B.react[side]; if (rc) { const k = clamp(rc.t / 0.7, 0, 1); r.lean -= 1.1 * (rc.pow || 1) * (1 - k) * Math.min(1, k * 8); r.eyes = Math.max(r.eyes, k < 0.35 ? 0.9 : 0); r.fid = false; }
  if (A && A.kind === 'faint' && A.side === side) { r.eyes = 1; r.fid = false; }
  if (m && m.hp > 0 && m.hp < stats(m).hp * 0.25) r.eyes = Math.max(r.eyes, 0.35);
  return r;
}
