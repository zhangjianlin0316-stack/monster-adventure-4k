'use strict';
// ================== 声音与语音设置面板（菜单 / 标题 / 右上角喇叭按钮打开） ==================
const SOUND_ROWS = ['test', 'voice', 'vvol', 'music', 'mvol', 'reload', 'quality', 'day', 'close'];
function openSoundUI() { AudioSys.unlock(); G.soundUI = { row: 0, res: null, busy: false, t0: NOW }; }
function soundRowLabel(r) {
  switch (r) {
    case 'test': return '▶ 测试语音（星老师说一句话）';
    case 'voice': return '星老师 / 灵兽语音：' + (Voice.enabled ? '开' : '关');
    case 'vvol': return '语音音量：' + Math.round(Voice.vol * 100) + '%　（← →）';
    case 'music': return '音乐与音效：' + (AudioSys.muted ? '关' : '开');
    case 'mvol': return '音乐音量：' + Math.round(AudioSys.vol * 100) + '%　（← →）';
    case 'reload': return '重新下载语音包';
    case 'quality': return '画质：' + (ALIVE.q === 'low' ? '省电（关闭部分动画）' : '高（灵兽全身动画 + 地图生机）');
    case 'day': return '昼夜变化：' + (ALIVE.day === 'day' ? '固定白天' : '开（8 分钟一轮）');
    case 'close': return '关闭';
  }
}
async function soundTest() {
  const U = G.soundUI; if (!U || U.busy) return; U.busy = true; U.res = { text: '正在播放测试语音…', c: '#ffe08a' };
  const r = await Voice.test(); if (!G.soundUI) return; U.busy = false;
  if (r.played && r.peak > 0.01) U.res = { text: '✓ 语音正常：已播放 ' + r.dur.toFixed(1) + ' 秒（检测到声音输出）。如果还是听不到，请检查电脑音量 / 耳机 / 浏览器标签页是否被静音。', c: '#8ff0a4' };
  else if (r.played) U.res = { text: '语音已播放，但检测到的音量很小，请调大语音音量。', c: '#ffe08a' };
  else if (r.ac !== 'running') U.res = { text: '浏览器还没允许播放声音（' + r.ac + '）。请点一下画面后再试。', c: '#ff9a8a' };
  else U.res = { text: '神经语音包没加载成功，已改用浏览器自带语音朗读。可以选「重新下载语音包」。', c: '#ff9a8a' };
}
function soundInput(k) {
  const U = G.soundUI; const r = SOUND_ROWS[U.row];
  if (k === 'cancel') { G.soundUI = null; return; }
  if (k === 'up') U.row = (U.row + SOUND_ROWS.length - 1) % SOUND_ROWS.length;
  if (k === 'down') U.row = (U.row + 1) % SOUND_ROWS.length;
  if (k === 'left' || k === 'right') { const d = k === 'right' ? 0.1 : -0.1; if (r === 'vvol') Voice.setVol(Voice.vol + d); if (r === 'mvol') AudioSys.setVol(AudioSys.vol + d); }
  if (k === 'ok') {
    if (r === 'test') soundTest();
    if (r === 'voice') Voice.setEnabled(!Voice.enabled);
    if (r === 'music') AudioSys.setMuted(!AudioSys.muted);
    if (r === 'vvol' || r === 'mvol') soundInput('right');
    if (r === 'reload') { VoicePack.retry('tutor').then(() => VoicePack.retry('mons')); VoicePack.retry('npc'); U.res = { text: '正在重新下载语音包…', c: '#ffe08a' }; }
    if (r === 'quality') setQuality(ALIVE.q === 'low' ? 'high' : 'low');
    if (r === 'day') { ALIVE.day = ALIVE.day === 'day' ? 'cycle' : 'day'; try { localStorage.setItem('ls_daycycle', ALIVE.day); } catch (e) { } }
    if (r === 'close') G.soundUI = null;
  }
  AudioSys.sfx('cursor');
}
function soundPointer(x, y) {
  const U = G.soundUI; for (let i = 0; i < SOUND_ROWS.length; i++) { const ry = 236 + i * 50; if (x > 430 && x < 1170 && y > ry - 28 && y < ry + 28) { U.row = i; return soundInput('ok'); } }
  if (x < 380 || x > 1220 || y < 120 || y > 820) G.soundUI = null;
}
function drawSoundUI() {
  const U = G.soundUI; if (!U) return; beginUI();
  ctx.fillStyle = 'rgba(8,12,30,0.55)'; ctx.fillRect(-2000, -2000, 6000, 6000);
  glass(380, 120, 840, 700, 30, true, 'rgba(255,210,110,0.9)');
  text('声音 · 语音 · 画质', 800, 170, 40, '#ffe08a', 'center', '900', 'middle', true);
  SOUND_ROWS.forEach((r, i) => { const y = 236 + i * 50; if (i === U.row) selBar(430, y - 23, 740, 46); text(soundRowLabel(r), 470, y + 1, 26, r === 'test' ? '#ffe08a' : '#fff', 'left', '800', 'middle', true); });
  const pt = VoicePack.progress('tutor'), pm = VoicePack.progress('mons'), ac = AudioSys.ac ? AudioSys.ac.state : '无';
  const st = (p) => p.done ? (p.bad ? '缺 ' + p.bad + ' 片' : '已就绪') : p.pct + '%';
  text('语音包　星老师：' + st(pt) + '　灵兽：' + st(pm) + '　｜　声音引擎：' + (ac === 'running' ? '运行中' : ac), 800, 694, 22, '#c9d6ff', 'center', '700');
  if (Voice.busy()) for (let i = 0; i < 7; i++) { const h = 8 + Math.abs(Math.sin(NOW * 9 + i * 1.3)) * 26; rrect(1060 + i * 14, 236 - h / 2, 8, h, 4, '#ffb84a'); }
  if (U.res) mathWrap(U.res.text, 420, 735, 760, 22, 30, U.res.c, '700');
  text('↑↓ 选择　Z 确认　← → 调音量　X 关闭', 800, 800, 20, '#9fb0d8', 'center', '700');
}
