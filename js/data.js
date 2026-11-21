// ================== 属性 / 招式 / 灵兽 / 道具 ==================
const TYPES = {
  normal: { n: '一般', c: '#a8a878' }, fire: { n: '火', c: '#f08030' }, water: { n: '水', c: '#6890f0' },
  grass: { n: '草', c: '#78c850' }, electric: { n: '电', c: '#e8c020' }, ice: { n: '冰', c: '#66ccdd' }, rock: { n: '岩', c: '#b8a058' }
};
const CHART = {
  fire: { grass: 2, ice: 2, water: 0.5, fire: 0.5, rock: 0.5 },
  water: { fire: 2, rock: 2, grass: 0.5, water: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, grass: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, rock: 0.5 },
  ice: { grass: 2, fire: 0.5, water: 0.5, ice: 0.5, rock: 0.5 },
  rock: { fire: 2, ice: 2, electric: 2, grass: 0.5, water: 0.5 },
  normal: { rock: 0.5 }
};
function effOf(mt, dt) { const r = CHART[mt][dt]; return r === undefined ? 1 : r; }
// fx: 动画配方 { m: 施法动作, k: 特效类型, w: 天气覆盖, sig: 招牌大招电影镜头 }
// 动作 m：lunge 扑击 / dash 冲刺 / jump 跃击 / spin 旋转 / cast 施法 / charge 蓄力 / roar 咆哮
const MOVES = {
  tackle: { n: '冲撞', t: 'normal', p: 40, acc: 100, pp: 35, fx: { m: 'dash', k: 'impact' } },
  scratch: { n: '利爪', t: 'normal', p: 45, acc: 100, pp: 30, fx: { m: 'lunge', k: 'slash' } },
  quickhit: { n: '疾风突', t: 'normal', p: 40, acc: 100, pp: 30, prio: 1, fx: { m: 'dash', k: 'speedlines' } },
  slam: { n: '猛力撞', t: 'normal', p: 70, acc: 90, pp: 15, fx: { m: 'jump', k: 'impact' } },
  headbutt: { n: '铁头槌', t: 'normal', p: 80, acc: 95, pp: 15, fx: { m: 'charge', k: 'impact' } },
  megaBeam: { n: '超能光束', t: 'normal', p: 105, acc: 85, pp: 5, fx: { m: 'cast', k: 'beam' } },
  growl: { n: '低吼', t: 'normal', p: 0, acc: 100, pp: 40, eff: { stat: 'atk', d: -1 }, fx: { m: 'roar', k: 'sound' } },
  glare: { n: '瞪视', t: 'normal', p: 0, acc: 100, pp: 30, eff: { stat: 'def', d: -1 }, fx: { m: 'cast', k: 'glare' } },
  focus: { n: '聚气', t: 'normal', p: 0, acc: 100, pp: 20, self: { stat: 'atk', d: 1 }, fx: { m: 'charge', k: 'buff' } },
  ember: { n: '火苗', t: 'fire', p: 40, acc: 100, pp: 25, st: ['burn', 10], fx: { m: 'cast', k: 'fireball' } },
  flameRush: { n: '烈焰冲', t: 'fire', p: 70, acc: 95, pp: 15, fx: { m: 'dash', k: 'flamedash' } },
  flamethrower: { n: '喷射火焰', t: 'fire', p: 80, acc: 100, pp: 15, st: ['burn', 10], fx: { m: 'cast', k: 'flamestream' } },
  blaze: { n: '炎爆', t: 'fire', p: 90, acc: 85, pp: 10, st: ['burn', 20], fx: { m: 'cast', k: 'explosion' } },
  inferno: { n: '炼狱火海', t: 'fire', p: 100, acc: 80, pp: 5, st: ['burn', 30], fx: { m: 'roar', k: 'firestorm', w: 'heat' } },
  splash: { n: '水弹', t: 'water', p: 40, acc: 100, pp: 25, fx: { m: 'cast', k: 'waterball' } },
  bubble: { n: '泡沫光线', t: 'water', p: 50, acc: 100, pp: 25, eff: { stat: 'spd', d: -1, ch: 30 }, fx: { m: 'cast', k: 'bubbles' } },
  torrent: { n: '激流', t: 'water', p: 70, acc: 95, pp: 15, fx: { m: 'cast', k: 'waterstream' } },
  tidal: { n: '怒涛', t: 'water', p: 90, acc: 85, pp: 10, fx: { m: 'roar', k: 'wave', w: 'rain' } },
  hydro: { n: '水炮', t: 'water', p: 105, acc: 80, pp: 5, fx: { m: 'charge', k: 'hydrobeam' } },
  vine: { n: '藤条抽', t: 'grass', p: 45, acc: 100, pp: 25, fx: { m: 'lunge', k: 'vinewhip' } },
  razorLeaf: { n: '飞叶快刀', t: 'grass', p: 55, acc: 95, pp: 25, fx: { m: 'cast', k: 'leaves' } },
  leafBlade: { n: '叶刃', t: 'grass', p: 70, acc: 95, pp: 15, fx: { m: 'dash', k: 'leafslash' } },
  bloom: { n: '花瓣暴', t: 'grass', p: 90, acc: 85, pp: 10, fx: { m: 'spin', k: 'petalstorm', w: 'petals' } },
  solar: { n: '日光束', t: 'grass', p: 110, acc: 85, pp: 5, fx: { m: 'charge', k: 'solarbeam', w: 'sun' } },
  spark: { n: '电火花', t: 'electric', p: 40, acc: 100, pp: 25, st: ['para', 10], fx: { m: 'dash', k: 'sparks' } },
  thunderWave: { n: '电磁波', t: 'electric', p: 0, acc: 90, pp: 20, st: ['para', 100], fx: { m: 'cast', k: 'emwave' } },
  bolt: { n: '雷霆击', t: 'electric', p: 70, acc: 95, pp: 15, st: ['para', 10], fx: { m: 'cast', k: 'bolt' } },
  storm: { n: '雷暴', t: 'electric', p: 90, acc: 85, pp: 10, st: ['para', 20], fx: { m: 'roar', k: 'thunder', w: 'storm' } },
  railgun: { n: '电磁炮', t: 'electric', p: 110, acc: 80, pp: 5, st: ['para', 30], fx: { m: 'charge', k: 'railbeam' } },
  iceShard: { n: '冰砾', t: 'ice', p: 40, acc: 100, pp: 30, prio: 1, fx: { m: 'cast', k: 'shards' } },
  frostBreath: { n: '寒冰吐息', t: 'ice', p: 60, acc: 95, pp: 20, st: ['frz', 10], fx: { m: 'cast', k: 'frostbreath' } },
  iceBeam: { n: '冰冻光束', t: 'ice', p: 85, acc: 95, pp: 10, st: ['frz', 15], fx: { m: 'cast', k: 'icebeam' } },
  blizzard: { n: '暴风雪', t: 'ice', p: 100, acc: 80, pp: 5, st: ['frz', 20], fx: { m: 'roar', k: 'blizzard', w: 'snow' } },
  pebble: { n: '落石', t: 'rock', p: 45, acc: 100, pp: 25, fx: { m: 'cast', k: 'rocks' } },
  rockSlide: { n: '岩崩', t: 'rock', p: 75, acc: 90, pp: 10, fx: { m: 'roar', k: 'rockslide' } },
  quake: { n: '地裂', t: 'rock', p: 90, acc: 90, pp: 10, fx: { m: 'jump', k: 'quake' } },
  stoneEdge: { n: '尖石攻击', t: 'rock', p: 100, acc: 80, pp: 5, fx: { m: 'roar', k: 'spikes' } },
  // ---- 进化招牌技（二阶 / 三阶）----
  sigFox2: { n: '炎鬃旋风', t: 'fire', p: 85, acc: 95, pp: 10, st: ['burn', 20], fx: { m: 'spin', k: 'firetornado', sig: 1 } },
  sigFox3: { n: '九尾焚天', t: 'fire', p: 130, acc: 90, pp: 5, st: ['burn', 40], fx: { m: 'charge', k: 'ninetails', w: 'heat', sig: 2 } },
  sigTurtle2: { n: '漩涡冲击', t: 'water', p: 85, acc: 95, pp: 10, fx: { m: 'spin', k: 'whirlpool', sig: 1 } },
  sigTurtle3: { n: '玄冰潮涌', t: 'water', p: 130, acc: 90, pp: 5, st: ['frz', 20], fx: { m: 'charge', k: 'tsunami', w: 'rain', sig: 2 } },
  sigFawn2: { n: '青藤缚', t: 'grass', p: 85, acc: 95, pp: 10, eff: { stat: 'spd', d: -1, ch: 50 }, fx: { m: 'cast', k: 'vinebind', sig: 1 } },
  sigFawn3: { n: '樱花神舞', t: 'grass', p: 130, acc: 90, pp: 5, self: { stat: 'atk', d: 1 }, fx: { m: 'spin', k: 'sakura', w: 'petals', sig: 2 } },
  sigVolt2: { n: '雷云绵弹', t: 'electric', p: 85, acc: 95, pp: 10, st: ['para', 30], fx: { m: 'jump', k: 'cloudbomb', sig: 1 } },
  sigVolt3: { n: '万雷天降', t: 'electric', p: 130, acc: 90, pp: 5, st: ['para', 40], fx: { m: 'roar', k: 'megathunder', w: 'storm', sig: 2 } },
  sigBunny2: { n: '风叶连踢', t: 'normal', p: 85, acc: 95, pp: 10, fx: { m: 'jump', k: 'multikick', sig: 1 } },
  sigBunny3: { n: '月华之舞', t: 'normal', p: 125, acc: 95, pp: 5, heal: 0.25, fx: { m: 'spin', k: 'moonlight', w: 'night', sig: 2 } },
  sigBird2: { n: '疾风翼', t: 'normal', p: 85, acc: 100, pp: 10, prio: 1, fx: { m: 'dash', k: 'galewing', sig: 1 } },
  sigBird3: { n: '凤翎飓风', t: 'normal', p: 125, acc: 90, pp: 5, fx: { m: 'roar', k: 'hurricane', w: 'wind', sig: 2 } },
  sigLizard2: { n: '烈鳞甩尾', t: 'fire', p: 85, acc: 95, pp: 10, fx: { m: 'spin', k: 'tailwhip', sig: 1 } },
  sigLizard3: { n: '炎龙流星', t: 'fire', p: 130, acc: 85, pp: 5, st: ['burn', 30], fx: { m: 'roar', k: 'meteor', w: 'heat', sig: 2 } },
  sigJelly2: { n: '虹光波', t: 'water', p: 85, acc: 100, pp: 10, fx: { m: 'cast', k: 'rainbow', sig: 1 } },
  sigJelly3: { n: '星海极光', t: 'water', p: 125, acc: 95, pp: 5, heal: 0.2, fx: { m: 'charge', k: 'aurora', w: 'night', sig: 2 } },
  sigShroom2: { n: '孢子炸弹', t: 'grass', p: 85, acc: 95, pp: 10, eff: { stat: 'atk', d: -1, ch: 50 }, fx: { m: 'cast', k: 'sporebomb', sig: 1 } },
  sigShroom3: { n: '森罗万象', t: 'grass', p: 125, acc: 95, pp: 5, heal: 0.25, fx: { m: 'charge', k: 'forestwrath', w: 'petals', sig: 2 } },
  sigBeetle2: { n: '磁暴角', t: 'electric', p: 85, acc: 95, pp: 10, fx: { m: 'dash', k: 'magnethorn', sig: 1 } },
  sigBeetle3: { n: '雷神贯击', t: 'electric', p: 130, acc: 90, pp: 5, st: ['para', 30], fx: { m: 'charge', k: 'thunderlance', w: 'storm', sig: 2 } },
  sigSeal2: { n: '霜牙咬', t: 'ice', p: 85, acc: 95, pp: 10, st: ['frz', 20], fx: { m: 'lunge', k: 'frostfang', sig: 1 } },
  sigSeal3: { n: '绝对冰河', t: 'ice', p: 130, acc: 90, pp: 5, st: ['frz', 30], fx: { m: 'roar', k: 'glacier', w: 'snow', sig: 2 } },
  sigRock2: { n: '赤岩滚动', t: 'rock', p: 85, acc: 95, pp: 10, fx: { m: 'spin', k: 'rollout', sig: 1 } },
  sigRock3: { n: '山崩地裂', t: 'rock', p: 130, acc: 90, pp: 5, fx: { m: 'jump', k: 'earthsplit', sig: 2 } }
};
// 12 条进化链 × 3 阶段 = 36 种灵兽
// b: [体力, 攻击, 防御, 速度]（一阶基础值，二阶 ×1.25，三阶 ×1.5，并按特色微调）
const LINES = {
  fox: { t: 'fire', b: [45, 60, 45, 65], cr: 45, xp: 62, evo: [12, 25], names: ['焰尾狐', '炎鬃狐', '九焰天狐'], sig: ['sigFox2', 'sigFox3'], bias: [0, 0.1, -0.05, 0.1],
    d: ['尾巴尖端燃着永不熄灭的小火苗，性格活泼好动。', '鬃毛化作跃动的火焰，奔跑时会在身后留下火之轨迹。', '传说中拥有九条火焰之尾的灵狐，每条尾巴都蕴藏着一种火之力量。'],
    learn: [[1, 'scratch'], [1, 'growl'], [4, 'ember'], [8, 'quickhit'], [14, 'flameRush'], [18, 'focus'], [21, 'flamethrower'], [30, 'blaze'], [36, 'inferno']] },
  turtle: { t: 'water', b: [52, 50, 62, 43], cr: 45, xp: 62, evo: [12, 25], names: ['涟漪龟', '浪纹龟', '晶潮玄龟'], sig: ['sigTurtle2', 'sigTurtle3'], bias: [0.1, 0, 0.1, -0.1],
    d: ['背甲能储存清水，遇到危险时会喷出水柱。', '甲壳上浮现出浪花般的纹路，能在水中高速游动。', '背负着冰晶山峦的古老神龟，一声低吟便能掀起巨浪。'],
    learn: [[1, 'tackle'], [1, 'glare'], [4, 'splash'], [8, 'bubble'], [14, 'torrent'], [18, 'headbutt'], [22, 'iceBeam'], [30, 'tidal'], [36, 'hydro']] },
  fawn: { t: 'grass', b: [48, 55, 52, 55], cr: 45, xp: 62, evo: [12, 25], names: ['芽芽鹿', '青藤鹿', '樱语神鹿'], sig: ['sigFawn2', 'sigFawn3'], bias: [0.05, 0.05, 0, 0.05],
    d: ['头上的嫩芽会随着成长慢慢长成枝叶之角。', '藤蔓缠绕的鹿角能感知整片森林的呼吸。', '鹿角上终年盛开着樱花，所到之处万物复苏。'],
    learn: [[1, 'tackle'], [1, 'growl'], [4, 'vine'], [8, 'razorLeaf'], [14, 'leafBlade'], [18, 'quickhit'], [22, 'focus'], [30, 'bloom'], [36, 'solar']] },
  volt: { t: 'electric', b: [40, 50, 40, 80], cr: 120, xp: 55, evo: [13, 27], names: ['雷绒球', '霆绒羊', '暴雷云羊'], sig: ['sigVolt2', 'sigVolt3'], bias: [0, 0.05, 0.05, 0.05],
    d: ['全身绒毛蓄满静电，一碰就会噼啪作响。', '长出了金色的小角，绒毛里藏着一朵小雷云。', '化身翻滚的雷云，所到之处电闪雷鸣。'],
    learn: [[1, 'quickhit'], [1, 'glare'], [5, 'spark'], [9, 'thunderWave'], [15, 'bolt'], [24, 'storm'], [34, 'railgun']] },
  bunny: { t: 'normal', b: [50, 45, 40, 60], cr: 200, xp: 45, evo: [11, 24], names: ['绒耳兔', '风叶兔', '月纱兔'], sig: ['sigBunny2', 'sigBunny3'], bias: [0.05, 0.05, 0, 0.1],
    d: ['长长的耳朵能听到很远处的声音。', '围着叶子围巾，能乘着风跳得很高很远。', '月光下披着轻纱起舞，据说见到它的人会得到好运。'],
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'quickhit'], [10, 'slam'], [16, 'focus'], [20, 'headbutt'], [32, 'megaBeam']] },
  bird: { t: 'normal', b: [40, 48, 35, 72], cr: 200, xp: 42, evo: [11, 24], names: ['啾啾雀', '疾风雀', '苍穹翎凰'], sig: ['sigBird2', 'sigBird3'], bias: [0, 0.1, 0, 0.1],
    d: ['清晨成群在树梢上歌唱的小鸟。', '翅膀变得修长有力，能追上山间的疾风。', '翎羽流光溢彩的天空之凰，振翅便能卷起飓风。'],
    learn: [[1, 'scratch'], [1, 'glare'], [6, 'quickhit'], [11, 'slam'], [17, 'focus'], [21, 'headbutt'], [33, 'megaBeam']] },
  lizard: { t: 'fire', b: [55, 65, 50, 50], cr: 90, xp: 70, evo: [14, 28], names: ['熔岩蜥', '烈鳞蜥', '炎翼龙'], sig: ['sigLizard2', 'sigLizard3'], bias: [0.05, 0.1, 0.05, 0],
    d: ['背上的棘刺像熔岩一样炽热。', '鳞片烧得通红，甩尾时会溅出火星。', '展开熔岩之翼的火龙，能从天空召唤炎之流星。'],
    learn: [[1, 'scratch'], [1, 'ember'], [9, 'glare'], [14, 'flameRush'], [19, 'pebble'], [24, 'flamethrower'], [33, 'blaze'], [38, 'inferno']] },
  jelly: { t: 'water', b: [55, 45, 55, 50], cr: 100, xp: 66, evo: [14, 28], names: ['晶水母', '虹光水母', '星海水母'], sig: ['sigJelly2', 'sigJelly3'], bias: [0.1, 0, 0.05, 0],
    d: ['晶莹剔透的身体在阳光下闪闪发光。', '伞盖折射出彩虹般的光芒，令人目眩神迷。', '体内仿佛装着一片星空，在深海中发出极光。'],
    learn: [[1, 'splash'], [1, 'growl'], [7, 'bubble'], [12, 'thunderWave'], [16, 'torrent'], [24, 'iceBeam'], [32, 'tidal'], [38, 'hydro']] },
  shroom: { t: 'grass', b: [58, 50, 55, 35], cr: 150, xp: 52, evo: [13, 27], names: ['菇菇伞', '苔盾菇', '森灵菇贤'], sig: ['sigShroom2', 'sigShroom3'], bias: [0.1, 0, 0.1, -0.05],
    d: ['雨后会从草丛里冒出来，伞盖上有白色斑点。', '背着长满青苔的木盾，是森林的小卫士。', '手持发光藤杖的森林贤者，守护着古老的秘密。'],
    learn: [[1, 'tackle'], [1, 'vine'], [8, 'growl'], [12, 'razorLeaf'], [16, 'leafBlade'], [22, 'focus'], [31, 'bloom'], [37, 'solar']] },
  beetle: { t: 'electric', b: [50, 60, 60, 40], cr: 90, xp: 68, evo: [14, 28], names: ['磁光虫', '磁翼甲', '雷甲武神'], sig: ['sigBeetle2', 'sigBeetle3'], bias: [0, 0.1, 0.1, -0.05],
    d: ['头上的磁角能吸附铁屑，夜里会发出微光。', '长出了闪着电光的透明翅膀，飞行时嗡嗡作响。', '身披雷电铠甲的武神，双角之间能凝聚雷霆长枪。'],
    learn: [[1, 'tackle'], [1, 'spark'], [10, 'glare'], [15, 'bolt'], [20, 'headbutt'], [26, 'pebble'], [33, 'storm'], [39, 'railgun']] },
  seal: { t: 'ice', b: [60, 50, 50, 45], cr: 110, xp: 64, evo: [14, 28], names: ['雪团海豹', '霜牙海象', '冰冠海王'], sig: ['sigSeal2', 'sigSeal3'], bias: [0.1, 0.05, 0.05, -0.05],
    d: ['圆滚滚的身体像个雪团，最喜欢在冰面上打滑。', '长出了霜白的獠牙，呼出的气息能瞬间结冰。', '头顶冰晶王冠的北海之王，能唤来漫天冰河。'],
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'iceShard'], [10, 'splash'], [15, 'frostBreath'], [21, 'headbutt'], [26, 'iceBeam'], [34, 'blizzard']] },
  rock: { t: 'rock', b: [55, 60, 70, 30], cr: 110, xp: 66, evo: [14, 28], names: ['砂岩犰', '赤岩犰', '磐岳巨兽'], sig: ['sigRock2', 'sigRock3'], bias: [0.05, 0.05, 0.1, -0.05],
    d: ['背甲像砂岩一样坚硬，遇到危险会缩成一团。', '背甲染上赤红，镶嵌着闪亮的琥珀晶石。', '如山岳般巍峨的巨兽，一跺脚便地动山摇。'],
    learn: [[1, 'tackle'], [1, 'glare'], [5, 'pebble'], [11, 'focus'], [15, 'rockSlide'], [21, 'headbutt'], [27, 'quake'], [35, 'stoneEdge']] }
};
const SPECIES = {};
(function buildSpecies() {
  const SCALE = { fox: [1, 1.05, 1.15], turtle: [0.95, 1.05, 1.18], fawn: [1.05, 1.1, 1.18], volt: [0.9, 1, 1.12], bunny: [0.88, 0.98, 1.08], bird: [0.85, 1.05, 1.2],
    lizard: [1.1, 1.15, 1.28], jelly: [0.95, 1, 1.1], shroom: [0.85, 0.95, 1.08], beetle: [1, 1.08, 1.2], seal: [0.95, 1.05, 1.2], rock: [1, 1.08, 1.25] };
  for (const k in LINES) {
    const L = LINES[k];
    for (let s = 0; s < 3; s++) {
      const id = s ? k + (s + 1) : k; const mul = [1, 1.25, 1.5][s];
      const b = L.b.map((v, i) => Math.round(v * mul * (1 + (s ? L.bias[i] * s : 0))));
      const learn = L.learn.slice(); if (s >= 1) learn.push([L.evo[0], L.sig[0]]); if (s >= 2) learn.push([L.evo[1], L.sig[1]]);
      learn.sort((a, c) => a[0] - c[0]);
      SPECIES[id] = { id, line: k, stage: s, n: L.names[s], t: L.t, b, cr: s === 0 ? L.cr : s === 1 ? Math.max(25, Math.round(L.cr * 0.45)) : 15, xp: Math.round(L.xp * [1, 1.6, 2.3][s]),
        d: L.d[s], learn, evoTo: s < 2 ? k + (s + 2) : null, evoLvl: s < 2 ? L.evo[s] : null, sig: s ? L.sig[s - 1] : null, scale: SCALE[k][s], floaty: k === 'jelly' };
    }
  }
})();
const STARTERS = ['fox', 'turtle', 'fawn'];
// 经验曲线：比 v2 更平缓，保证 10~15 分钟内完成第一次进化
function xpFor(l) { return Math.floor(0.8 * l * l * l); }
function xpGain(enemy, trainer) { const L = enemy.lvl; return Math.round((30 + 10 * L + 0.6 * L * L) * (SPECIES[enemy.sp].xp / 60) * (trainer ? 1.5 : 1)); }
function stats(m) {
  const b = SPECIES[m.sp].b, L = m.lvl;
  return {
    hp: Math.floor(b[0] * 2 * L / 100) + L + 10,
    atk: Math.floor(b[1] * 2 * L / 100) + 5,
    def: Math.floor(b[2] * 2 * L / 100) + 5,
    spd: Math.floor(b[3] * 2 * L / 100) + 5
  };
}
function makeMon(sp, lvl) {
  const learned = SPECIES[sp].learn.filter(e => e[0] <= lvl).map(e => e[1]);
  const uniq = [...new Set(learned)].slice(-4);
  const m = { sp, lvl, xp: xpFor(lvl), hp: 0, moves: uniq.map(id => ({ id, pp: MOVES[id].pp })), status: null };
  m.hp = stats(m).hp;
  return m;
}
const nameOf = m => SPECIES[m.sp].n;
function healMon(m) { m.hp = stats(m).hp; m.moves.forEach(mv => mv.pp = MOVES[mv.id].pp); m.dhp = m.hp; m.status = null; }
const STATUS = { burn: { n: '灼伤', c: '#ff7a3a' }, para: { n: '麻痹', c: '#f2d22a' }, frz: { n: '冰冻', c: '#7fe0ff' } };
const ITEMS = {
  ball: { n: '捕获球', price: 6, d: '投向野生灵兽来收服它。答对数学题可以提高成功率！' },
  superball: { n: '高级球', price: 15, d: '性能更好的捕获球，捕获率 ×1.8。' },
  potion: { n: '回复药', price: 5, d: '恢复一只灵兽 30 点体力。' },
  superpotion: { n: '好伤药', price: 12, d: '恢复一只灵兽 80 点体力。' },
  revive: { n: '复活草', price: 20, d: '让倒下的灵兽恢复一半体力。' },
  hintcard: { n: '提示卡', price: 8, d: '答题时按 H 使用：去掉两个错误选项。' }
};
const ITEM_ORDER = ['ball', 'superball', 'potion', 'superpotion', 'revive', 'hintcard'];
