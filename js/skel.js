'use strict';
// ================== v7 骨骼动画运行时（自写，无第三方依赖） ==================
// 数据：js/rigs.js（tools/rig/build.py 从原画切出的部件图集 + 骨骼层级）
// 每根骨骼：枢轴(x,y) 在原画坐标系；部件图片也在原画坐标系，所以静止姿势=原画。
// 动画：关键帧包络 K()（带缓动）驱动各部位组（前肢/后肢/手臂/尾巴/翅膀/脊椎/触手/头/身体），
// 片段：idle / walk / attack / special / ult / hit / knock / dodge / victory / faint，片段间交叉淡入；
// 事件：attack/ult 的 'hit' 帧、'roar'（用于特效与语音同步）。
const SKEL = { img: {}, info: {}, st: {}, q: 'high', on: true };
try { if (localStorage.getItem('ls_skel') === '0') SKEL.on = false; } catch (e) { }
const D2R = Math.PI / 180;
// ---------- 缓动 + 关键帧包络 ----------
const EASE = { lin: x => x, in: x => x * x, out: x => 1 - (1 - x) * (1 - x), io: x => x * x * (3 - 2 * x), back: x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }, el: x => x === 0 || x === 1 ? x : Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * 2.094) + 1 };
function K(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) { const k = keys[i]; if (u <= k[0]) { const p = keys[i - 1], f = (u - p[0]) / Math.max(1e-6, k[0] - p[0]); return p[1] + (k[1] - p[1]) * (EASE[k[2] || 'io'])(f); } }
  return keys[keys.length - 1][1];
}
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const _hs = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
// ---------- 载入 ----------
function skelLoad(sp) {
  if (SKEL.img[sp] || typeof RIGS === 'undefined' || !RIGS[sp]) return;
  const im = new Image(); let tries = 0; im.onerror = () => { if (++tries <= 3) setTimeout(() => { im.src = 'assets/rig/' + sp + '.webp?r=' + tries; }, 800 * tries); };
  im.src = 'assets/rig/' + sp + '.webp'; SKEL.img[sp] = im;
}
function skelInfo(sp) {
  let I = SKEL.info[sp]; if (I) return I;
  const R = RIGS[sp]; const idx = {}; R.bones.forEach((b, i) => idx[b.n] = i);
  const cx = R.w / 2, front = !!(R.opts && R.opts.front), G = (R.w + R.h) / 20;
  const B = R.bones.map((b, i) => {
    const n = b.n; let g = n, seg = 0, ord = 0, near = 1;
    if (/^(FN|FF)_/.test(n)) { g = 'legF'; seg = n.endsWith('_l') ? 1 : 0; near = n[1] === 'N' ? 1 : 0; }
    else if (/^(BN|BF|LN|LF)_/.test(n)) { g = 'legB'; seg = n.endsWith('_l') ? 1 : 0; near = n[1] === 'N' ? 1 : 0; }
    else if (/^(AN|AF)_/.test(n)) { g = 'arm'; seg = n.endsWith('_l') ? 1 : 0; near = n[1] === 'N' ? 1 : 0; }
    else if (/^tail/.test(n)) { g = 'tail'; ord = b.idx || 0; }
    else if (/^w[NFBC]\d/.test(n)) { g = 'wing'; seg = +n[2]; near = n[1] === 'N' || n[1] === 'B' ? 1 : 0; }
    else if (/^pr/.test(n)) g = 'prop';
    else if (/^t\d+_\d+/.test(n)) { g = 'tent'; ord = b.idx || 0; seg = b.tn || 0; }
    else if (/^sp\d/.test(n)) { g = b.ch === 'h' ? 'neck' : 'spine'; ord = b.idx || 0; }
    else if (/^ear/.test(n)) { g = 'ear'; ord = b.idx || 0; }
    else if (n !== 'body' && n !== 'head') g = 'extra';
    // 方向符号：正角度 = “向前/抬起”。侧面/四分之三视角：按朝向；正面造型：按左右侧向外
    const sg = front && (g === 'arm' || g === 'wing' || g === 'legB' || g === 'ear' || g === 'tent') ? (b.x < cx ? 1 : -1) : -R.face;
    return { n, p: b.p == null ? -1 : idx[b.p], x: b.x, y: b.y, ex: b.ex, ey: b.ey, g, seg, ord, near, sg, len: Math.hypot(b.ex - b.x, b.ey - b.y) };
  });
  const parts = R.parts.map(p => Object.assign({ bi: idx[p.b] }, p));
  const cnt = {}; B.forEach(b => cnt[b.g] = Math.max(cnt[b.g] || 0, b.ord + 1));
  const has = g => B.some(b => b.g === g);
  I = SKEL.info[sp] = { lidB: (R.opts && R.opts.lidBone) || (R.bones.some(b => b.n === 'head') ? 'head' : 'body'), fly: !!(R.opts && R.opts.fly), R, B, parts, G, face: R.face, front, cnt, has, type: R.type, seed: _hs(sp.length, sp.charCodeAt(0) + sp.charCodeAt(sp.length - 1)), amp: (R.opts && R.opts.amp) || {} };
  return I;
}
function skelReady(sp) {
  if (!SKEL.on || typeof RIGS === 'undefined' || !RIGS[sp]) return false;
  skelLoad(sp); const im = SKEL.img[sp]; return !!(im && im.complete && im.naturalWidth > 0);
}
// 预载全部图集（标题画面期间后台下载）
function skelPreload() { if (typeof RIGS !== 'undefined') Object.keys(RIGS).forEach(skelLoad); }

// ---------- 姿势 ----------
// 每根骨骼的通道：r（度，正=向前/抬起）、x/y（单位 G，x 正=朝向前方）、s（整体缩放）、sy（纵向缩放）
function P0() { return { r: 0, x: 0, y: 0, s: 1, sy: 1 }; }
function poseIdle(I, t, out, k, ex) {
  const s = I.seed * 10, A = I.amp, ty = I.type;
  for (let i = 0; i < I.B.length; i++) {
    const b = I.B[i], o = out[i]; let r = 0;
    switch (b.g) {
      case 'body': o.sy += k * 0.022 * Math.sin(t * 2.4 + s) * (A.br || 1); r = 0.8 * Math.sin(t * 1.1 + s); break;
      case 'head': r = 3 * Math.sin(t * 1.3 + 1 + s) + 1.5 * Math.sin(t * 2.9 + s); o.y += k * 0.02 * Math.sin(t * 2.4 + s + 0.6); break;
      case 'tail': r = (6 + b.ord * 4) * Math.sin(t * (ex ? 5 : 2.8) - b.ord * 0.9 + s) * (A.tail || 1); break;
      case 'wing': r = (ty === 'float' || I.fly ? 18 : 5) * (b.seg ? 0.6 : 1) * Math.sin(t * (ty === 'float' || I.fly ? 6 : 2.6) * (ex ? 1.5 : 1) + s - b.seg * 0.6) * (A.wing || 1); break;
      case 'tent': r = (7 + b.ord * 5) * Math.sin(t * 2.4 - b.ord * 0.9 + b.seg * 1.7 + s) * (A.tent || 1); break;
      case 'spine': r = (3 + b.ord * 1.2) * Math.sin(t * 1.8 - b.ord * 0.8 + s) * (A.spine || 1); break;
      case 'neck': r = 2.5 * Math.sin(t * 1.6 + b.ord * 0.7 + s); break;
      case 'ear': r = 4 * Math.sin(t * 2.1 + b.ord * 2 + s) + (Math.sin(t * 0.9 + b.ord + s) > 0.97 ? 14 * Math.sin(t * 40) : 0); break;
      case 'arm': r = (b.seg ? 4 : 3) * Math.sin(t * 1.6 + s + b.near); break;
      case 'legF': case 'legB': r = 0.6 * Math.sin(t * 2.4 + s + b.near); break;
      case 'extra': r = 4 * Math.sin(t * 2 + s + i); break;
    }
    o.r += r * k;
  }
}
// 待机小动作（每 5–8 秒一个）：张望、挠痒、伸懒腰、抖毛、蹦跳、摇尾、转圈欢呼
function idleFidget(I, t) {
  const s = I.seed, p = 5 + _hs(s, 3) * 3, kk = Math.floor((t + s * 20) / p), q = (t + s * 20) - kk * p;
  const type = Math.floor(_hs(kk, s * 13) * 7), D = [1.6, 1.3, 1.6, 0.9, 0.9, 1.2, 1.4][type];
  if (q > D) return null; return { type, u: q / D };
}
function poseFidget(I, f, out) {
  const u = f.u, bell = Math.sin(Math.PI * u), B = I.B, ty = I.type;
  for (let i = 0; i < B.length; i++) {
    const b = B[i], o = out[i];
    if (f.type === 0) { // 张望：头左右转（侧视角里用上下点 + 位移近似）
      if (b.g === 'head') { o.r += 14 * Math.sin(u * Math.PI * 2) * bell; o.x += -0.12 * bell; }
      if (b.g === 'ear') o.r += 10 * bell;
    } else if (f.type === 1) { // 挠痒：一条后腿/手臂快速摆动
      if (b.g === (I.has('arm') ? 'arm' : 'legB') && b.near) o.r += (b.seg ? -40 : 55) * bell + (b.seg ? 0 : 14 * Math.sin(u * 50) * bell);
      if (b.g === 'head') o.r += -10 * bell;
    } else if (f.type === 2) { // 伸懒腰：前肢前伸、身体前低
      if (b.g === 'legF') o.r += (b.seg ? -10 : 45) * bell;
      if (b.g === 'arm') o.r += (b.seg ? 30 : 140) * bell;
      if (b.g === 'body' && ty === 'quad') o.r += -10 * bell;
      if (b.g === 'body' && ty !== 'quad') o.sy += 0.06 * bell;
      if (b.g === 'head') o.r += 18 * bell;
      if (b.g === 'tail') o.r += 25 * bell;
      if (b.g === 'wing') o.r += 55 * bell;
    } else if (f.type === 3) { // 抖毛
      const w = Math.sin(u * 70) * bell;
      if (b.g === 'body') o.r += 4 * w; if (b.g === 'head') o.r += 9 * w; if (b.g === 'tail' || b.g === 'ear' || b.g === 'tent') o.r += 18 * w; if (b.g === 'wing') o.r += 20 * w;
    } else if (f.type === 4) { // 蹦跳
      if (b.g === 'body') { o.y -= 0.9 * bell; o.r += 6 * Math.sin(u * 6.28); }
      if (b.g === 'legF' || b.g === 'legB') o.r += (b.g === 'legF' ? 1 : -1) * (b.seg ? -30 : 30) * bell;
      if (b.g === 'arm') o.r += 70 * bell; if (b.g === 'wing') o.r += 50 * bell; if (b.g === 'tail') o.r += 20 * bell;
    } else if (f.type === 5) { // 摇尾巴 / 扇翅膀 / 甩触手
      const w = Math.sin(u * 40) * bell;
      if (b.g === 'tail') o.r += (14 + b.ord * 6) * w; if (b.g === 'wing') o.r += 35 * Math.sin(u * 30) * bell; if (b.g === 'tent') o.r += 25 * w; if (b.g === 'head') o.r += 6 * bell; if (b.g === 'spine') o.r += 8 * Math.sin(u * 20 - b.ord) * bell;
      if (b.g === 'arm') o.r += 50 * bell + 20 * w;
    } else { // 欢呼：举手/抬前腿/张翅
      if (b.g === 'arm') o.r += (b.seg ? -20 : 150) * bell + 10 * Math.sin(u * 30) * bell;
      if (b.g === 'legF' && b.near && !I.has('arm')) o.r += (b.seg ? -50 : 60) * bell;
      if (b.g === 'wing') o.r += 60 * bell; if (b.g === 'head') o.r += 15 * bell; if (b.g === 'body') o.y -= 0.3 * bell;
    }
  }
}
function poseWalk(I, t, out, k, spd) {
  const ph = t * 6.28 * 2.0 * (spd || 1), B = I.B, ty = I.type;
  for (let i = 0; i < B.length; i++) {
    const b = B[i], o = out[i];
    const phs = ph + (b.g === 'legF' ? (b.near ? 0 : Math.PI) : b.g === 'legB' ? (b.near ? Math.PI : 0) : 0) + (ty === 'biped' && b.g === 'legB' ? 0 : 0);
    if (b.g === 'legF' || b.g === 'legB') {
      const sw = Math.sin(phs), lift = Math.max(0, Math.cos(phs));
      if (b.seg === 0) o.r += k * 30 * sw; else o.r += k * (b.g === 'legF' ? -38 : 32) * lift;
    }
    if (b.g === 'arm') { const sw = Math.sin(ph + (b.near ? Math.PI : 0)); o.r += k * (b.seg ? 15 : 35) * sw; }
    if (b.g === 'body') { o.y += k * -0.12 * Math.abs(Math.sin(ph)); o.r += k * 2.5 * Math.sin(ph * 2); }
    if (b.g === 'head') o.r += k * 4 * Math.sin(ph * 2 + 0.6);
    if (b.g === 'tail') o.r += k * (8 + b.ord * 5) * Math.sin(ph - b.ord * 0.8);
    if (b.g === 'wing') o.r += k * (ty === 'bird' || ty === 'float' ? 40 : 10) * Math.sin(ph * 1.5 - b.seg * 0.7);
    if (b.g === 'spine') o.r += k * (6 + b.ord * 2) * Math.sin(ph * 0.8 - b.ord * 0.9);
    if (b.g === 'neck') o.r += k * 4 * Math.sin(ph * 0.8 + b.ord);
    if (b.g === 'tent') o.r += k * (12 + b.ord * 6) * Math.sin(ph - b.ord * 0.9 + b.seg);
    if (b.g === 'ear') o.r += k * 8 * Math.sin(ph * 2 + b.ord);
  }
}
// ---------- 动作片段（关键帧包络） ----------
// 攻击：蓄力(0→0.3) → 出击(0.3→0.45 命中帧) → 停顿 → 收招
const CLIP = {
  attack: { dur: 1, ev: [[0.45, 'hit']] },
  special: { dur: 1.4, ev: [[0.5, 'roar']] },
  ult: { dur: 1.6, ev: [[0.62, 'hit']] },
  hit: { dur: 0.7 }, knock: { dur: 0.9 }, dodge: { dur: 0.7 }, victory: { dur: 1.6, loop: true }, faint: { dur: 1 },
};
function poseAction(I, clip, u, out, k) {
  const B = I.B, ty = I.type, arm = I.has('arm');
  if (clip === 'attack') {
    const a = K([[0, 0], [0.3, 1, 'out'], [0.42, 0, 'in']], u), s = K([[0.3, 0], [0.45, 1, 'out'], [0.62, 1], [1, 0, 'io']], u), w = K([[0.42, 0], [0.5, 1], [0.7, 0]], u);
    for (let i = 0; i < B.length; i++) {
      const b = B[i], o = out[i];
      switch (b.g) {
        case 'body': o.x += k * (-0.5 * a + 1.3 * s); o.y += k * (0.2 * a - 0.15 * s); o.r += k * (8 * a - 10 * s); if (ty === 'float' || ty === 'blob') { o.sy += k * (-0.08 * a + 0.1 * s); } break;
        case 'head': o.r += k * (14 * a - 24 * s); o.x += k * 0.15 * s; break;
        case 'legF': o.r += k * (b.seg ? (25 * a - 55 * s * (b.near ? 1 : 0.6)) : (-15 * a + (b.near ? 75 : 45) * s)); break;
        case 'legB': o.r += k * (b.seg ? (-20 * a + 30 * s) : (10 * a - 35 * s)); break;
        case 'arm': o.r += k * (b.seg ? (-70 * a + 10 * s) * (b.near ? 1 : 0.7) : (-45 * a + (b.near ? 125 : 70) * s)); break;
        case 'tail': o.r += k * ((25 + b.ord * 8) * a - (15 + b.ord * 10) * s + 20 * w * Math.sin(u * 40 - b.ord)); break;
        case 'wing': o.r += k * (65 * a - 70 * s) * (b.seg ? 0.7 : 1); break;
        case 'spine': o.r += k * ((10 * a) * Math.sin(b.ord * 1.1 + 1) - 14 * s * Math.sin(b.ord * 1.1 + 2.4)); break;
        case 'neck': o.r += k * (18 * a - 26 * s); break;
        case 'tent': o.r += k * (-30 * a + (45 + b.ord * 10) * s); break;
        case 'ear': o.r += k * (-20 * a + 15 * s); break;
        case 'extra': o.r += k * (20 * a - 25 * s); break;
      }
    }
  } else if (clip === 'special') { // 招牌：四足人立咆哮 / 双足举臂蓄力 / 鸟展翅 / 蛇身盘起昂首 / 漂浮旋转
    const up = K([[0, 0], [0.25, 1, 'back'], [0.75, 1], [1, 0, 'io']], u), roar = K([[0.3, 0], [0.45, 1, 'out'], [0.7, 0.6], [0.85, 0]], u), sh = Math.sin(u * 50) * roar;
    for (let i = 0; i < B.length; i++) {
      const b = B[i], o = out[i];
      switch (b.g) {
        case 'body': if (ty === 'quad') { o.r += k * 24 * up; o.y += k * -0.15 * up; } else if (ty === 'float' || ty === 'blob') { o.r += k * 12 * Math.sin(u * 12.56) * up; o.y -= k * 0.5 * up; o.sy += k * 0.06 * roar; } else { o.y -= k * 0.25 * up; o.sy += k * 0.05 * up; } o.r += k * 1.5 * sh; break;
        case 'head': o.r += k * (ty === 'quad' ? -8 * up + 22 * roar : 20 * roar) + k * 2 * sh; break;
        case 'legF': o.r += k * (ty === 'quad' ? (b.seg ? -60 * up + 25 * Math.sin(u * 22 + b.near * 2) * up : (20 + 25 * b.near) * up + 20 * Math.sin(u * 22 + b.near * 2) * up) : 0); break;
        case 'legB': o.r += k * (ty === 'quad' ? (b.seg ? 15 * up : -24 * up) : (b.seg ? 0 : (b.near ? 1 : -1) * 6 * up)); break;
        case 'arm': o.r += k * (b.seg ? -35 * up : 160 * up) + k * 10 * sh; break;
        case 'tail': o.r += k * ((30 + b.ord * 8) * up * 0.6 + 20 * Math.sin(u * 30 - b.ord) * up); break;
        case 'wing': o.r += k * (85 * up * (b.seg ? 0.5 : 1) + 25 * Math.sin(u * 25) * up); break;
        case 'spine': o.r += k * (18 * up * Math.sin(b.ord * 1.3 + u * 6) + 6 * sh); break;
        case 'neck': o.r += k * (20 * up + 10 * roar); break;
        case 'tent': o.r += k * (50 * up + 20 * Math.sin(u * 20 - b.ord)); break;
        case 'ear': o.r += k * (25 * up); break;
        case 'extra': o.r += k * 20 * up; break;
      }
    }
  } else if (clip === 'ult') { // 奥义：蓄力下蹲 → 腾空展开 → 重击落地
    const c = K([[0, 0], [0.25, 1, 'out'], [0.36, 0]], u), air = K([[0.3, 0], [0.45, 1, 'out'], [0.58, 1], [0.64, 0, 'in']], u), slam = K([[0.6, 0], [0.65, 1, 'out'], [0.8, 0.6], [1, 0, 'io']], u), spin = K([[0.33, 0], [0.58, 1, 'io']], u);
    for (let i = 0; i < B.length; i++) {
      const b = B[i], o = out[i];
      switch (b.g) {
        case 'body': o.y += k * (0.35 * c - 1.6 * air + 0.1 * slam); o.x += k * (-0.3 * c + 0.8 * air + 0.6 * slam); o.r += k * (ty === 'quad' || ty === 'serpent' ? 360 * spin * 0 + 18 * air - 14 * slam : 10 * air) ; o.sy += k * (-0.08 * c + 0.06 * air - 0.08 * slam); break;
        case 'head': o.r += k * (-12 * c + 28 * air - 25 * slam); break;
        case 'legF': o.r += k * (b.seg ? (-60 * c + 30 * air - 40 * slam) : (-20 * c + 70 * air + 40 * slam)); break;
        case 'legB': o.r += k * (b.seg ? (40 * c + 50 * air) : (-20 * c - 55 * air - 15 * slam)); break;
        case 'arm': o.r += k * (b.seg ? (-90 * c - 20 * air) : (-40 * c + 175 * air + 90 * slam)); break;
        case 'tail': o.r += k * ((30 + b.ord * 10) * air + 25 * Math.sin(u * 30 - b.ord) * (air + slam) - 20 * c); break;
        case 'wing': o.r += k * (-30 * c + 95 * air - 60 * slam) * (b.seg ? 0.6 : 1); break;
        case 'spine': o.r += k * (22 * Math.sin(b.ord * 1.2 + u * 14) * (air + 0.5 * slam) + 10 * c); break;
        case 'neck': o.r += k * (30 * air - 20 * slam); break;
        case 'tent': o.r += k * (-40 * c + 70 * air - 30 * slam + 15 * Math.sin(u * 25 - b.ord)); break;
        case 'ear': o.r += k * (-25 * c + 30 * air); break;
        case 'extra': o.r += k * 25 * air; break;
      }
    }
  } else if (clip === 'hit' || clip === 'knock') {
    const big = clip === 'knock', h = K([[0, 0], [0.08, 1, 'out'], [big ? 0.55 : 0.35, big ? 0.8 : 0.5], [1, 0, 'io']], u), fl = Math.sin(u * (big ? 26 : 34)) * h;
    for (let i = 0; i < B.length; i++) {
      const b = B[i], o = out[i];
      switch (b.g) {
        case 'body': o.r += k * (big ? 22 : 10) * h; o.x -= k * (big ? 0.5 : 0.25) * h; o.sy += k * -0.05 * h; break;
        case 'head': o.r += k * ((big ? 30 : 22) * h + 6 * fl); break;
        case 'legF': o.r += k * (b.seg ? -30 * h + (big ? 25 * fl : 0) : (big ? 45 : 20) * h); break;
        case 'legB': o.r += k * (b.seg ? 25 * h : (big ? -45 : -15) * h + (big ? 20 * fl : 0)); break;
        case 'arm': o.r += k * (b.seg ? -40 * h : (big ? 110 : 50) * h + 20 * fl); break;
        case 'tail': o.r += k * ((25 + b.ord * 10) * h + 15 * fl); break;
        case 'wing': o.r += k * ((big ? 70 : 40) * h + 25 * fl); break;
        case 'spine': o.r += k * (14 * h * Math.sin(b.ord * 1.4) + 6 * fl); break;
        case 'neck': o.r += k * 25 * h; break;
        case 'tent': o.r += k * (35 * h + 20 * fl); break;
        case 'ear': o.r += k * (35 * h + 10 * fl); break;
        case 'extra': o.r += k * 20 * h; break;
      }
    }
  } else if (clip === 'dodge') {
    const j = K([[0, 0], [0.15, 1, 'out'], [0.6, 1], [1, 0, 'io']], u), air = Math.sin(Math.PI * clamp01(u / 0.8));
    for (let i = 0; i < B.length; i++) {
      const b = B[i], o = out[i];
      switch (b.g) {
        case 'body': o.x -= k * 0.9 * j; o.y -= k * 0.7 * air; o.r += k * 14 * air; break;
        case 'head': o.r += k * 12 * air; break;
        case 'legF': o.r += k * (b.seg ? -70 : 45) * air; break;
        case 'legB': o.r += k * (b.seg ? 60 : -40) * air; break;
        case 'arm': o.r += k * (b.seg ? -60 : 40) * air; break;
        case 'tail': o.r += k * (20 + b.ord * 8) * air; break;
        case 'wing': o.r += k * 60 * Math.sin(u * 18); break;
        case 'spine': o.r += k * 15 * air * Math.sin(b.ord + 1); break;
        case 'tent': o.r += k * 30 * air; break;
      }
    }
  } else if (clip === 'victory') { // 欢庆舞蹈（循环）
    const ph = u * 6.2832, hop = Math.abs(Math.sin(ph * 2));
    for (let i = 0; i < B.length; i++) {
      const b = B[i], o = out[i];
      switch (b.g) {
        case 'body': o.y -= k * 0.45 * hop; o.r += k * 7 * Math.sin(ph); break;
        case 'head': o.r += k * (10 * Math.sin(ph + 0.5) + 8); break;
        case 'legF': o.r += k * (I.has('arm') ? 15 * Math.sin(ph * 2 + b.near * 3) : (b.seg ? -40 : 50) * hop * (b.near ? 1 : 0.5)); break;
        case 'legB': o.r += k * (b.seg ? 25 : -18) * hop; break;
        case 'arm': o.r += k * (b.seg ? -25 + 25 * Math.sin(ph * 4 + b.near * 3) : 150 + 25 * Math.sin(ph * 2 + b.near * 3)); break;
        case 'tail': o.r += k * (20 + b.ord * 8) * Math.sin(ph * 4 - b.ord); break;
        case 'wing': o.r += k * (55 + 30 * Math.sin(ph * 4)) * (b.seg ? 0.6 : 1); break;
        case 'spine': o.r += k * 12 * Math.sin(ph * 2 - b.ord); break;
        case 'tent': o.r += k * 30 * Math.sin(ph * 3 - b.ord); break;
        case 'ear': o.r += k * 15 * Math.sin(ph * 4 + b.ord); break;
      }
    }
  } else if (clip === 'faint') {
    const d = K([[0, 0], [0.5, 1, 'in'], [0.62, 0.9, 'out'], [0.75, 1, 'in']], u);
    for (let i = 0; i < B.length; i++) {
      const b = B[i], o = out[i];
      switch (b.g) {
        case 'body': o.y += k * 0.5 * d; o.r += k * (ty === 'quad' ? -12 : 0) * d; if (ty !== 'quad') o.sy += k * -0.1 * d; break;
        case 'head': o.r += k * -35 * d; o.y += k * 0.2 * d; break;
        case 'legF': o.r += k * (b.seg ? 30 : 60) * d * (b.near ? 1 : 0.6); break;
        case 'legB': o.r += k * (b.seg ? -30 : -55) * d * (b.near ? 1 : 0.6); break;
        case 'arm': o.r += k * (b.seg ? 20 : -15) * d; break;
        case 'tail': o.r += k * -(15 + b.ord * 10) * d; break;
        case 'wing': o.r += k * -40 * d; break;
        case 'spine': o.r += k * -10 * d * Math.sin(b.ord); break;
        case 'neck': o.r += k * -25 * d; break;
        case 'tent': o.r += k * -20 * d; break;
        case 'ear': o.r += k * -30 * d; break;
      }
    }
  }
}
// 片段事件（命中帧 / 咆哮），供特效与语音同步；返回 [t, name]
function skelEvents(clip) { return (CLIP[clip] && CLIP[clip].ev) || []; }

// 计算一帧姿势：st = { clip, u, t, walk, ex, fid, prev:{clip,u,w} }
function skelPose(I, st) {
  const n = I.B.length; const out = new Array(n); for (let i = 0; i < n; i++) out[i] = P0();
  const t = st.t || 0, act = st.clip && st.clip !== 'idle' && st.clip !== 'walk' ? st.clip : null;
  const wAct = act ? (st.w == null ? 1 : st.w) : 0;
  poseIdle(I, t, out, 1 - 0.6 * wAct, st.ex);
  if (st.walk) poseWalk(I, t, out, st.walk * (1 - wAct), st.spd);
  if (!act && st.fid !== false && !st.walk && SKEL.q !== 'low') { const f = idleFidget(I, t); if (f) poseFidget(I, f, out); }
  if (act) poseAction(I, act, st.u || 0, out, wAct);
  if (st.prev && st.prev.w > 0) poseAction(I, st.prev.clip, st.prev.u, out, st.prev.w);
  return out;
}
// ---------- 绘制 ----------
const SK_M = new Array(64);
function skelMats(I, pose) {
  const B = I.B, G = I.G, face = I.face;
  for (let i = 0; i < B.length; i++) {
    const b = B[i], o = pose[i];
    const th = o.r * D2R * b.sg, c = Math.cos(th), s = Math.sin(th), sx = o.s, sy = o.s * o.sy;
    const tx = o.x * G * face, ty = o.y * G;
    // 局部：T(piv+t) R S T(-piv)
    const a = c * sx, bb = s * sx, cc = -s * sy, d = c * sy;
    const e = b.x + tx - (a * b.x + cc * b.y), f = b.y + ty - (bb * b.x + d * b.y);
    let M;
    if (b.p < 0) M = [a, bb, cc, d, e, f];
    else { const P = SK_M[b.p]; M = [P[0] * a + P[2] * bb, P[1] * a + P[3] * bb, P[0] * cc + P[2] * d, P[1] * cc + P[3] * d, P[0] * e + P[2] * f + P[4], P[1] * e + P[3] * f + P[5]]; }
    SK_M[i] = M;
  }
  return SK_M;
}
// 在当前变换下（原画坐标：左上 0,0 → 右下 w,h）画出骨骼化灵兽
function skelDraw(c, sp, st, lids, blink) {
  const I = skelInfo(sp), im = SKEL.img[sp]; const pose = skelPose(I, st); const M = skelMats(I, pose);
  const base = c.getTransform();
  const hi = base.a; // 设备像素缩放
  for (const p of I.parts) {
    const m = M[p.bi];
    c.setTransform(base.a * m[0] + base.c * m[1], base.b * m[0] + base.d * m[1], base.a * m[2] + base.c * m[3], base.b * m[2] + base.d * m[3], base.a * m[4] + base.c * m[5] + base.e, base.b * m[4] + base.d * m[5] + base.f);
    c.drawImage(im, p.sx, p.sy, p.w, p.h, p.x, p.y, p.w, p.h);
    if (p.b === I.lidB && lids && blink > 0.03) drawLids(c, lids, I.R.w, I.R.h, blink);
  }
  c.setTransform(base);
}

// drawCreature 调用：在 (−w/2,−h,w,h) 框内画骨骼灵兽；需要闪白/剪影时先画到离屏画布
const SK_FC = document.createElement('canvas');
function skelState(sp, t, opt) {
  if (opt.skel) return Object.assign({ t }, opt.skel);
  if (opt.showcase) return showcaseState(t, (_hs(sp.length, sp.charCodeAt(0)) * 10) + (opt.phase || 0));
  return { t, clip: 'idle', walk: opt.walk || 0, spd: opt.spd, ex: opt.excited, fid: opt.fidget };
}
function skelCreature(c, sp, w, h, pw, ph, t, opt, seed) {
  const I = skelInfo(sp), st = skelState(sp, t, opt);
  const L = opt.noBlink ? null : lidInfo(sp); const bl = L ? Math.max(blinkAmt(seed, t), opt.eyesClosed || 0) : 0;
  const fl = opt.silhouette ? 1 : opt.flash;
  if (!fl) { c.save(); c.translate(-w / 2, -h); c.scale(w / I.R.w, h / I.R.h); skelDraw(c, sp, st, L, bl); c.restore(); return; }
  const m = Math.round(Math.max(pw, ph) * 0.45), W = pw + m * 2, H = ph + m * 2;
  if (SK_FC.width < W || SK_FC.height < H) { SK_FC.width = Math.max(SK_FC.width, W); SK_FC.height = Math.max(SK_FC.height, H); }
  const g = SK_FC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W + 4, H + 4); g.imageSmoothingQuality = 'high';
  g.setTransform(pw / I.R.w, 0, 0, ph / I.R.h, m, m); skelDraw(g, sp, st, L, bl);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = opt.silhouette || opt.flashColor || ('rgba(255,255,255,' + fl + ')'); g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  const kx = w / pw, ky = h / ph; c.drawImage(SK_FC, 0, 0, W, H, -w / 2 - m * kx, -h - m * ky, W * kx, H * ky);
}

// ---------- 头部过大的造型：降低头部转动幅度，避免露出身体缺口 ----------
function headK(I) { const hf = I.R.hf || 0; return hf > 0.38 ? 0.4 : hf > 0.28 ? 0.6 : hf > 0.2 ? 0.8 : 1; }
const _skelPose0 = skelPose;
skelPose = function (I, st) {
  const out = _skelPose0(I, st); if (I.hk === undefined) I.hk = headK(I);
  if (I.hk < 1) for (let i = 0; i < I.B.length; i++) if (I.B[i].g === 'head') { out[i].r *= I.hk; }
  return out;
};
// ---------- 展示模式（图鉴/祈愿/选择初始灵兽）：待机中每隔几秒表演一个动作 ----------
const SHOW_SEQ = ['special', 'attack', 'victory', 'ult', 'dodge'];
function showcaseState(t, seed) {
  const P = 6.5, k = Math.floor((t + seed * 7) / P), q = (t + seed * 7) - k * P, clip = SHOW_SEQ[k % SHOW_SEQ.length], d = CLIP[clip].dur * 1.15;
  if (q < 4.6 || q > 4.6 + d) return { t, clip: 'idle' };
  const u = (q - 4.6) / d, w = Math.min(1, Math.min(u, 1 - u) * 8);
  return { t, clip, u, w };
}
// ---------- 战斗：根据战斗队列里的动画决定每一方的骨骼片段 ----------
function skelBattle(B, A, side, m, NOWT) {
  const mem = B.skelMem || (B.skelMem = {}); const M = mem[side] || (mem[side] = { clip: 'idle', u: 0, since: NOWT, prev: null });
  let clip = 'idle', u = 0, ex = false;
  if (A && A.side === side) {
    if (A.kind === 'move' && A.dur) {
      const mv = MOVES[A.move] || {}; const cut = A.cut || 0, H = A.H || 0.5;
      clip = mv.ult ? 'ult' : (mv.p > 0 ? 'attack' : 'special'); ex = true;
      if (A.t < cut) { clip = mv.ult ? 'special' : 'attack'; u = 0.22 * clamp01(A.t / Math.max(0.01, cut)); }
      else { const v = clamp01((A.t - cut) / Math.max(0.01, A.dur - cut)), ch = clip === 'ult' ? 0.62 : clip === 'attack' ? 0.45 : 0.5; u = v < H ? ch * v / H : ch + (1 - ch) * (v - H) / Math.max(0.01, 1 - H); }
    } else if (A.kind === 'sig' || A.kind === 'taunt') { clip = 'special'; u = clamp01(A.t / (A.dur || 1)); }
    else if (A.kind === 'dodge') { clip = 'dodge'; u = clamp01(A.t / (A.dur || 0.6)); }
    else if (A.kind === 'dance' || A.kind === 'cheer') { clip = 'victory'; u = (A.t / 1.6) % 1; }
    else if (A.kind === 'faint') { clip = 'faint'; u = clamp01(A.t / (A.dur || 1) * 1.3); }
    else if (A.kind === 'lunge') { clip = 'attack'; u = clamp01(A.t / (A.dur || 0.6)); }
  }
  const rc = B.react && B.react[side];
  if (clip === 'idle' && rc) { clip = (rc.pow || 1) > 1.25 || rc.style === 'launch' || rc.style === 'spin' ? 'knock' : 'hit'; u = clamp01(rc.t / 0.7); }
  if (clip === 'idle' && side === 'p' && B.victory) { clip = 'victory'; u = ((NOWT - (M.vt || (M.vt = NOWT))) / 1.6) % 1; }
  if (clip === 'idle' && m && m.hp <= 0) { clip = 'faint'; u = 1; }
  // 交叉淡入：片段切换时，上一片段在 0.18 秒内淡出
  if (clip !== M.clip) { M.prev = { clip: M.clip, u: M.u, t0: NOWT }; M.clip = clip; M.since = NOWT;
    // 动画事件：命中帧/咆哮 → 特效
  }
  const pe = M.prev && M.prev.clip !== 'idle' ? Math.max(0, 1 - (NOWT - M.prev.t0) / 0.18) : 0;
  const w = clip === 'idle' ? 0 : Math.min(1, (NOWT - M.since) / 0.12 + (clip === 'faint' || clip === 'knock' || clip === 'hit' ? 1 : 0.35));
  // 事件
  const evs = skelEvents(clip); for (const [et, en] of evs) { if (M.u < et && u >= et && M.clip === clip) skelOnEvent(B, side, clip, en); }
  M.u = u;
  return { clip, u, w, ex, prev: pe > 0 ? { clip: M.prev.clip, u: M.prev.u, w: pe } : null, fid: clip === 'idle' };
}
function skelOnEvent(B, side, clip, name) {
  if (typeof pSpawn !== 'function' || typeof battlePositions !== 'function') return;
  const P = battlePositions(B), x = side === 'e' ? P.EX : P.PX, y = side === 'e' ? P.EY : P.PY, sz = side === 'e' ? 380 : 500;
  if (name === 'hit' && clip === 'ult' || name === 'roar') {
    // 落地/咆哮：脚下扬起尘土冲击波
    for (let i = 0; i < 16; i++) { const a = Math.PI * (i / 15); pSpawn({ x: x + Math.cos(a) * sz * 0.2, y: y - 6, vx: Math.cos(a) * rnd(260, 520) * (Math.random() < 0.5 ? 1 : -1), vy: -rnd(30, 160), ay: 120, drag: 2.2, life: 0.7, s: rnd(30, 60), s1: rnd(90, 140), c: name === 'roar' ? 'rgba(255,240,200,0.5)' : 'rgba(210,190,150,0.55)', k: PK.smoke, front: true }); }
    if (typeof AudioSys !== 'undefined' && AudioSys.sfx) try { AudioSys.sfx(name === 'roar' ? 'confirm' : 'hit'); } catch (e) { }
  }
}
window.addEventListener('load', () => setTimeout(skelPreload, 400));
