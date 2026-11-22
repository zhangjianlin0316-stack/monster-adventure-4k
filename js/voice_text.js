// ================== 语音文本：把讲解文字拆成「固定句段 + 数字」，用预生成的神经语音片段拼读 ==================
// 浏览器与 node（生成脚本）共用。
(function (root) {
'use strict';
const D = '零一二三四五六七八九';
// 整数 → 读音片段（每个片段都有预生成的语音）
function hund(n, lead) { // 0..999 → 片段（百位单独一个片段，减少语音文件数量）
  if (n < 100) return [zh2(n, lead)];
  const h = Math.floor(n / 100), r = n % 100; const out = [D[h] + '百'];
  if (r) out.push(r < 10 ? '零' + D[r] : zh2(r, true)); return out;
}
function zhFull(n, lead) { return hund(n, lead).join(''); }
function numChunks(n) {
  n = Math.floor(Math.abs(n));
  if (n < 1000) return hund(n, false);
  if (n < 10000) { const k = Math.floor(n / 1000), r = n % 1000; const out = [D[k] + '千']; if (r) { if (r < 100) out.push('零' + zh2(r, true)); else out.push(...hund(r, true)); } return out; }
  if (n < 100000000) { const w = Math.floor(n / 10000), r = n % 10000; const out = numChunks(w).concat(['万']); if (r) { if (r < 1000) out.push('零', ...hund(r, true)); else out.push(...numChunks(r)); } return out; }
  return String(n).split('').map(c => D[+c]);
}
function zh2(n, lead) { if (n < 10) return D[n]; const t = Math.floor(n / 10), o = n % 10; return (t === 1 && !lead ? '' : D[t]) + '十' + (o ? D[o] : ''); }
function mergeZero(a) { const o = []; for (const c of a) { if (c === '零' && o[o.length - 1] === '零') continue; o.push(c); } return o; }
// 一个数字记号 → 片段
function tokChunks(tok) {
  if (tok.k === 'frac') return numChunks(tok.d).concat(['分之'], numChunks(tok.n));
  if (tok.k === 'pct') return ['百分之'].concat(numText(tok.v));
  return numText(tok.v);
}
function numText(s) { s = String(s); const [i, f] = s.split('.'); const out = numChunks(+i); if (f) { out.push('点'); for (const c of f) out.push(D[+c]); } return out; }
const RE = /\{(\d+)\/(\d+)\}|(\d+(?:\.\d+)?)(%?)/g;
// 讲解一步 → { key: 模板, toks: 数字记号 }
function parse(s) {
  s = String(s); const toks = []; const key = s.replace(RE, (m, a, b, v, p) => { if (a) { toks.push({ k: 'frac', n: +a, d: +b }); return '#'; } toks.push(p ? { k: 'pct', v } : { k: 'num', v }); return '#'; });
  return { key, toks };
}
// 模板 → 朗读句段（# 处插入数字）
const SYM = [[/πr²/g, '派r平方'], [/πr/g, '派r'], [/πd/g, '派d'], [/²/g, '平方'], [/≥/g, '大于等于'], [/</g, '小于'], [/>/g, '大于'], [/×/g, '乘'], [/÷/g, '除以'], [/[−-]/g, '减'], [/\+/g, '加'], [/=/g, '等于'], [/°/g, '度'], [/……/g, '余'], [/~/g, '到'], [/⅓/g, '三分之一'], [/[“”"()（）]/g, ' '], [/:/g, '比'], [/\s+/g, ' ']];
function speakSeg(t) { for (const [r, v] of SYM) t = t.replace(r, v); return t.trim(); }
function segs(key) { return key.split('#').map(speakSeg); }
// 只含标点/空白的句段不需要朗读，只停顿
function silentSeg(t) { return !/[\p{Script=Han}a-zA-Z]/u.test(t); }
const API = { zhFull, numChunks, tokChunks, parse, segs, speakSeg, silentSeg };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.VoiceText = API;
})(typeof window !== 'undefined' ? window : globalThis);
