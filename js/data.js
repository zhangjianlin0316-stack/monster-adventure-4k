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
// ================== v4：新增通用招式（丰富技能池）==================
Object.assign(MOVES, {
  swiftStar: { n: '流星镖', t: 'normal', p: 60, acc: 100, pp: 20, fx: { m: 'cast', k: 'stars' } },
  shadowClone: { n: '影分身连击', t: 'normal', p: 75, acc: 95, pp: 10, hits: 5, fx: { m: 'blink', k: 'clones' } },
  gigaImpact: { n: '破天冲', t: 'normal', p: 120, acc: 85, pp: 5, fx: { m: 'dash', k: 'gigaimpact' } },
  fireFang: { n: '炎牙', t: 'fire', p: 65, acc: 95, pp: 15, st: ['burn', 10], fx: { m: 'lunge', k: 'firefang' } },
  heatWave: { n: '热风', t: 'fire', p: 95, acc: 90, pp: 10, st: ['burn', 10], fx: { m: 'roar', k: 'heatwave', w: 'heat' } },
  aquaJet: { n: '水流斩', t: 'water', p: 50, acc: 100, pp: 20, prio: 1, fx: { m: 'blink', k: 'aquajet' } },
  waterPulse: { n: '水之波动', t: 'water', p: 75, acc: 95, pp: 15, fx: { m: 'cast', k: 'waterpulse' } },
  seedBomb: { n: '种子炸弹', t: 'grass', p: 80, acc: 95, pp: 15, fx: { m: 'cast', k: 'seedbomb' } },
  leafStorm: { n: '叶风暴', t: 'grass', p: 120, acc: 85, pp: 5, fx: { m: 'roar', k: 'leafstorm', w: 'petals' } },
  thunderFang: { n: '雷牙', t: 'electric', p: 65, acc: 95, pp: 15, st: ['para', 10], fx: { m: 'lunge', k: 'thunderfang' } },
  voltTackle: { n: '雷光冲', t: 'electric', p: 95, acc: 90, pp: 10, fx: { m: 'blink', k: 'volttackle' } },
  iceFang: { n: '冰牙', t: 'ice', p: 65, acc: 95, pp: 15, st: ['frz', 10], fx: { m: 'lunge', k: 'frostfang' } },
  iceSpear: { n: '冰枪连射', t: 'ice', p: 85, acc: 95, pp: 10, hits: 3, fx: { m: 'cast', k: 'icespear' } },
  rockBlast: { n: '岩石连弹', t: 'rock', p: 75, acc: 90, pp: 10, hits: 3, fx: { m: 'cast', k: 'rockblast' } },
  meteorFist: { n: '陨石拳', t: 'rock', p: 100, acc: 85, pp: 5, fx: { m: 'jump', k: 'meteorfist' } }
});
// 各属性的进阶通用技能（自动加入同属性灵兽的升级表）
const TYPE_LEARN = {
  normal: [[13, 'swiftStar'], [23, 'shadowClone'], [42, 'gigaImpact']],
  fire: [[17, 'fireFang'], [27, 'heatWave'], [23, 'shadowClone']],
  water: [[11, 'aquaJet'], [19, 'waterPulse'], [40, 'shadowClone']],
  grass: [[19, 'seedBomb'], [40, 'leafStorm'], [13, 'swiftStar']],
  electric: [[12, 'thunderFang'], [29, 'voltTackle'], [23, 'swiftStar']],
  ice: [[13, 'iceFang'], [23, 'iceSpear'], [32, 'waterPulse']],
  rock: [[17, 'rockBlast'], [31, 'meteorFist'], [24, 'gigaImpact']]
};
// 稀有度：普通 / 稀有 / 史诗 / 传说
const RARITY = {
  common: { n: '普通', c: '#b8c4d8', w: 1, bonus: 1, shine: 0 },
  rare: { n: '稀有', c: '#5fb0ff', w: 0.45, bonus: 1.04, shine: 1 },
  epic: { n: '史诗', c: '#c77dff', w: 0.18, bonus: 1.08, shine: 2 },
  legend: { n: '传说', c: '#ffb020', w: 0, bonus: 1.0, shine: 3 }
};
const RAR_ORDER = ['common', 'rare', 'epic', 'legend'];
// ================== v4：新增 12 条灵兽进化链 ==================
Object.assign(LINES, {
  moth: { t: 'electric', rar: 'common', b: [42, 52, 40, 72], cr: 160, xp: 54, evo: [13, 27], names: ['萤灯蛾', '月辉蛾', '星灯羽后'], sig: ['sigMoth2', 'sigMoth3'], bias: [0, 0.05, 0, 0.1],
    d: ['夜里提着一盏小萤灯在草丛间飞舞，鳞粉带着微弱的电。', '翅膀上的花纹像满月一样发光，扇动时洒下噼啪作响的光尘。', '羽翼如星空般铺展的灯蛾女王，能把夜空点亮成白昼。'],
    learn: [[1, 'tackle'], [1, 'glare'], [5, 'spark'], [9, 'thunderWave'], [15, 'bolt'], [24, 'storm'], [34, 'railgun']] },
  otter: { t: 'water', rar: 'common', b: [50, 58, 45, 62], cr: 170, xp: 54, evo: [12, 26], names: ['溪石獭', '浪刃獭', '潮汐獭王'], sig: ['sigOtter2', 'sigOtter3'], bias: [0, 0.1, 0, 0.05],
    d: ['抱着一块圆溜溜的溪石，用它敲开贝壳。', '学会了用水流凝成双刃，在河中来去如风。', '手握潮汐三叉戟的河川之王，能号令百川归海。'],
    learn: [[1, 'scratch'], [1, 'growl'], [4, 'splash'], [8, 'quickhit'], [14, 'torrent'], [21, 'slam'], [30, 'tidal'], [37, 'hydro']] },
  owl: { t: 'ice', rar: 'rare', b: [55, 52, 50, 56], cr: 80, xp: 66, evo: [15, 30], names: ['雪眠鸮', '霜羽鸮', '极光冰鸮'], sig: ['sigOwl2', 'sigOwl3'], bias: [0, 0.05, 0.05, 0.05],
    d: ['白天总是眯着眼打瞌睡，夜里却能看清千米外的雪花。', '羽毛结满霜花，振翅时会落下一阵细雪。', '翼展间流动着极光的冰鸮，传说它守护着永夜的雪原。'],
    learn: [[1, 'scratch'], [1, 'glare'], [5, 'iceShard'], [10, 'quickhit'], [16, 'frostBreath'], [26, 'iceBeam'], [36, 'blizzard']] },
  cat: { t: 'normal', rar: 'epic', b: [48, 68, 44, 82], cr: 35, xp: 78, evo: [16, 32], names: ['灵纹猫', '幻影猫', '千面灵猫'], sig: ['sigCat2', 'sigCat3'], bias: [0, 0.1, 0, 0.1],
    d: ['额头有神秘的灵纹，总在月圆之夜出现。', '能分出数道幻影迷惑对手，没人知道哪一个是真身。', '身后漂浮着千张灵符面具，每一张都是它的一个化身。'],
    learn: [[1, 'scratch'], [1, 'glare'], [6, 'quickhit'], [11, 'slam'], [18, 'focus'], [27, 'headbutt'], [36, 'megaBeam']] },
  golem: { t: 'rock', rar: 'rare', b: [62, 62, 78, 25], cr: 85, xp: 70, evo: [15, 30], names: ['苔石偶', '青岩偶', '翠岳巨像'], sig: ['sigGolem2', 'sigGolem3'], bias: [0.1, 0.05, 0.1, -0.05],
    d: ['身上长满青苔的小石偶，喜欢晒太阳。', '岩石身躯镶嵌着青色晶石，力大无穷。', '背负整座小山的守护巨像，沉睡时会被误认为是一座山峰。'],
    learn: [[1, 'tackle'], [1, 'glare'], [5, 'pebble'], [11, 'focus'], [16, 'rockSlide'], [22, 'headbutt'], [28, 'quake'], [36, 'stoneEdge']] },
  dragon: { t: 'water', rar: 'epic', b: [56, 66, 56, 62], cr: 30, xp: 82, evo: [18, 35], names: ['墨鳞幼龙', '墨云蛟', '苍墨天龙'], sig: ['sigDragon2', 'sigDragon3'], bias: [0.05, 0.1, 0.05, 0.05],
    d: ['鳞片像刚研好的墨，游过之处会留下淡淡的墨痕。', '能在云中穿行的墨蛟，吐息可化作墨色水雾。', '画卷中走出的天龙，一声龙吟便能泼墨成雨。'],
    learn: [[1, 'tackle'], [1, 'glare'], [5, 'splash'], [10, 'bubble'], [15, 'torrent'], [22, 'headbutt'], [28, 'iceBeam'], [34, 'tidal'], [40, 'hydro']] },
  crane: { t: 'normal', rar: 'epic', b: [55, 62, 52, 74], cr: 40, xp: 80, evo: [22], names: ['白羽鹤', '祥云仙鹤'], sig: ['sigCrane2', 'sigCrane2b'], bias: [0, 0.1, 0.05, 0.1],
    d: ['亭亭玉立的白鹤，喜欢在清晨的湖边起舞。', '踏着祥云飞翔的仙鹤，羽翼所过之处会降下好运。'],
    learn: [[1, 'scratch'], [1, 'growl'], [6, 'quickhit'], [12, 'slam'], [18, 'focus'], [28, 'headbutt'], [36, 'megaBeam']] },
  koi: { t: 'water', rar: 'rare', b: [40, 42, 52, 62], cr: 110, xp: 60, evo: [20], names: ['锦鳞鲤', '化龙金鲤'], sig: ['sigKoi2', 'sigKoi2b'], bias: [0.25, 0.35, 0.15, 0.1],
    d: ['红白相间的锦鲤，传说跃过瀑布就能化身为龙。', '跃过龙门的金鲤化作金龙，全身鳞片闪耀着黄金的光芒。'],
    learn: [[1, 'splash'], [1, 'growl'], [6, 'bubble'], [12, 'quickhit'], [17, 'torrent'], [26, 'tidal'], [36, 'hydro']] },
  tanuki: { t: 'grass', rar: 'rare', b: [56, 55, 55, 58], cr: 100, xp: 62, evo: [18], names: ['叶笛狸', '百变狸仙'], sig: ['sigTanuki2', 'sigTanuki2b'], bias: [0.05, 0.1, 0.05, 0.1],
    d: ['头顶一片树叶，吹响叶笛时周围会开出小花。', '顶着荷叶斗笠的狸仙，用一片叶子就能变成任何东西。'],
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'vine'], [9, 'razorLeaf'], [15, 'leafBlade'], [24, 'focus'], [32, 'bloom'], [38, 'solar']] },
  qilin: { t: 'electric', rar: 'legend', b: [90, 105, 90, 100], cr: 3, xp: 140, evo: [], names: ['霆角麒麟'], sig: ['sigQilin', 'sigQilinB'], bias: [0, 0, 0, 0],
    d: ['头生雷霆之角的祥瑞神兽，只在电闪雷鸣的夜晚现身于古老神社。'],
    learn: [[1, 'spark'], [1, 'bolt'], [20, 'thunderWave'], [30, 'storm'], [40, 'railgun']] },
  whale: { t: 'water', rar: 'legend', b: [115, 88, 100, 70], cr: 3, xp: 140, evo: [], names: ['天渊星鲸'], sig: ['sigWhale', 'sigWhaleB'], bias: [0, 0, 0, 0],
    d: ['在云海中遨游的星之巨鲸，背上承载着一座漂浮的小岛。'],
    learn: [[1, 'splash'], [1, 'torrent'], [20, 'iceBeam'], [30, 'tidal'], [40, 'hydro']] },
  zhulong: { t: 'fire', rar: 'legend', b: [95, 112, 85, 95], cr: 3, xp: 140, evo: [], names: ['烛炎神龙'], sig: ['sigZhulong', 'sigZhulongB'], bias: [0, 0, 0, 0],
    d: ['口衔烛火的赤色神龙，睁眼为昼、闭眼为夜，栖息在火山深处。'],
    learn: [[1, 'ember'], [1, 'flamethrower'], [20, 'focus'], [30, 'blaze'], [40, 'inferno']] }
});
['fox', 'turtle', 'fawn', 'lizard', 'jelly', 'beetle', 'seal'].forEach(k => LINES[k].rar = 'rare');
['volt', 'bunny', 'bird', 'shroom', 'rock'].forEach(k => LINES[k].rar = 'common');
// ================== v4：招牌技 ×2+ 与 奥义 ==================
// 每条进化链的配色（用于给特效重新着色，让每只灵兽的招式都独一无二）
const LINE_COL = {
  fox: ['#ffe080', '#ff4a1a'], turtle: ['#d8f4ff', '#1f6fd8'], fawn: ['#ffd8ea', '#3fae4a'], volt: ['#fffbd0', '#ffc81a'], bunny: ['#ffffff', '#c8b8ff'], bird: ['#ffffff', '#5ab8ff'],
  lizard: ['#ffd060', '#d8280a'], jelly: ['#ffffff', '#ff7ad8'], shroom: ['#f0ffb0', '#6aba3a'], beetle: ['#fff36a', '#9a5aff'], seal: ['#ffffff', '#5ac8f0'], rock: ['#ffc890', '#b0502a'],
  moth: ['#fff8c0', '#ffb43a'], otter: ['#e0f6ff', '#2a9ad8'], owl: ['#ffffff', '#8ad8ff'], cat: ['#f0d8ff', '#9a4aff'], golem: ['#d0ffc0', '#4a8a5a'], dragon: ['#e8f0ff', '#2a3a6a'],
  crane: ['#ffffff', '#ff6a6a'], koi: ['#fff0a0', '#ffa020'], tanuki: ['#e0ffb0', '#5aa03a'], qilin: ['#fffbd0', '#4ad8ff'], whale: ['#e8f4ff', '#5a6aff'], zhulong: ['#fff0a0', '#ff2a0a']
};
// [名称, 动作, 基础特效, 威力, 附加效果]
const SIGX = {
  moth: { s2: ['鳞粉雷光', 'cast', 'cloudbomb', 85, { st: ['para', 30] }], s3: ['星灯审判', 'charge', 'megathunder', 130, { st: ['para', 30], w: 'night' }] },
  otter: { s2: ['激流双刃', 'blink', 'leafslash', 85, {}], s3: ['潮汐王怒', 'roar', 'tsunami', 130, { w: 'rain' }] },
  owl: { s2: ['霜羽风暴', 'cast', 'blizzard', 85, { st: ['frz', 20] }], s3: ['极光冰翼', 'charge', 'aurora', 130, { st: ['frz', 20], w: 'snow' }] },
  cat: { s2: ['幻影猫步', 'blink', 'clones', 85, { hits: 3 }], s3: ['千面灵符', 'cast', 'talisman', 130, { w: 'night' }] },
  golem: { s2: ['青岩铁壁拳', 'jump', 'meteorfist', 85, { self: { stat: 'def', d: 1 } }], s3: ['翠岳崩山', 'roar', 'earthsplit', 130, {}] },
  dragon: { s2: ['墨云吐息', 'cast', 'inkbreath', 85, {}], s3: ['苍墨龙卷', 'roar', 'inkvortex', 130, { w: 'rain' }] },
  crane: { s2: ['仙鹤云翔', 'blink', 'galewing', 90, { prio: 1 }], s2b: ['鹤唳九霄', 'roar', 'hurricane', 120, { w: 'wind' }] },
  koi: { s2: ['金鳞跃龙门', 'jump', 'gigaimpact', 95, {}], s2b: ['锦鲤化龙波', 'charge', 'hydrobeam', 125, { w: 'rain' }] },
  tanuki: { s2: ['百变叶幻术', 'cast', 'leaves', 90, { eff: { stat: 'atk', d: -1, ch: 50 } }], s2b: ['狸仙大变身', 'jump', 'forestwrath', 120, { heal: 0.2 }] },
  qilin: { s2: ['霆角冲锋', 'blink', 'volttackle', 100, { st: ['para', 30] }], s2b: ['麒麟雷步', 'roar', 'megathunder', 130, { w: 'storm' }] },
  whale: { s2: ['星鲸吐息', 'charge', 'hydrobeam', 100, {}], s2b: ['天渊潮汐', 'roar', 'tsunami', 130, { w: 'rain' }] },
  zhulong: { s2: ['烛火龙息', 'cast', 'flamestream', 100, { st: ['burn', 30] }], s2b: ['烛照九幽', 'roar', 'meteor', 130, { w: 'heat' }] }
};
// 二阶追加招牌技 B、三阶追加招牌技 C、奥义 U（每条线独有）
const EXTRA = {
  fox: [['狐火幻舞', 'spin', 'firetornado'], ['焰尾千本针', 'cast', 'needles'], ['九尾天狐焰', 'sky', 'tail']],
  turtle: [['泡沫镜甲击', 'charge', 'bubbles'], ['深渊水龙炮', 'charge', 'hydrobeam'], ['玄武沧海', 'wave', 'shard']],
  fawn: [['百花鹿鸣', 'roar', 'petalstorm'], ['千藤缚灵', 'cast', 'vinebind'], ['樱吹雪神域', 'vortex', 'petal']],
  volt: [['静电绵云阵', 'cast', 'cloudbomb'], ['雷云连环爆', 'roar', 'thunder'], ['天雷万钧', 'sky', 'bolt']],
  bunny: [['月影连踢', 'blink', 'multikick'], ['风叶回旋斩', 'spin', 'leafslash'], ['月兔千影舞', 'clones', 'star']],
  bird: [['苍羽连闪', 'blink', 'galewing'], ['天穹翎刃', 'cast', 'needles'], ['凤鸣九天', 'vortex', 'leaf']],
  lizard: [['熔岩鳞爆', 'cast', 'explosion'], ['炎龙尾斩', 'spin', 'tailwhip'], ['焚天炎龙陨', 'sky', 'meteor']],
  jelly: [['虹光触须', 'lunge', 'vinewhip'], ['星海涡流', 'spin', 'whirlpool'], ['极光星河', 'beam', 'star']],
  shroom: [['孢子迷雾阵', 'cast', 'sporebomb'], ['菇贤藤杖击', 'jump', 'vinewhip'], ['森罗万象界', 'area', 'leaf']],
  beetle: [['磁暴角冲', 'blink', 'volttackle'], ['雷甲千击', 'charge', 'clones'], ['雷神天罚', 'sky', 'bolt']],
  seal: [['冰面滑翔撞', 'dash', 'frostfang'], ['冰冠冲击波', 'roar', 'blizzard'], ['绝对零度', 'area', 'shard']],
  rock: [['琥珀晶石弹', 'cast', 'rockblast'], ['赤岩大回旋', 'spin', 'rollout'], ['山岳崩天', 'sky', 'rock']],
  moth: [['萤火流光', 'cast', 'stars'], ['月辉鳞粉雷', 'roar', 'thunder'], ['星灯天幕', 'beam', 'star']],
  otter: [['浪刃双斩', 'blink', 'aquajet'], ['潮汐三叉戟', 'charge', 'thunderlance'], ['万浪归海', 'wave', 'drop']],
  owl: [['霜羽飞刃', 'cast', 'icespear'], ['极光冰羽阵', 'roar', 'glacier'], ['极夜冰封', 'vortex', 'shard']],
  cat: [['幻影分身爪', 'blink', 'clones'], ['灵符爆裂', 'cast', 'talisman'], ['千影灵猫阵', 'clones', 'star']],
  golem: [['青苔重拳', 'jump', 'impact'], ['翠岳崩落', 'roar', 'rockslide'], ['大地守护神', 'sky', 'rock']],
  dragon: [['墨云龙爪', 'blink', 'inkclaw'], ['泼墨龙卷', 'roar', 'inkvortex'], ['苍墨天龙吟', 'ink', 'drop']],
  crane: [null, null, ['祥云万里', 'vortex', 'leaf']],
  koi: [null, null, ['金龙破浪', 'wave', 'drop']],
  tanuki: [null, null, ['万叶幻化', 'area', 'leaf']],
  qilin: [null, null, ['麒麟踏雷', 'sky', 'bolt']],
  whale: [null, null, ['星海倒悬', 'wave', 'star']],
  zhulong: [null, null, ['烛龙焚世', 'sky', 'meteor']]
};
// 未进化灵兽也能用的属性通用奥义
const TYPE_ULT = { normal: ['流星千击', 'clones', 'star'], fire: ['烈焰旋风弹', 'vortex', 'ember'], water: ['激流龙卷', 'vortex', 'drop'], grass: ['万叶飞花', 'vortex', 'leaf'],
  electric: ['落雷之阵', 'sky', 'bolt'], ice: ['冰晶飞雪', 'vortex', 'shard'], rock: ['巨岩天降', 'sky', 'rock'] };
const TYPE_ULT_COL = { normal: ['#ffffff', '#ffd23a'], fire: ['#ffd060', '#ff3a10'], water: ['#d8f4ff', '#1f6fd8'], grass: ['#e0ffb0', '#2f8a2a'], electric: ['#fffbd0', '#ffd23a'], ice: ['#ffffff', '#66ccee'], rock: ['#ffd8a0', '#7a4a1a'] };
const ULT_MOTION = { sky: 'roar', wave: 'roar', vortex: 'spin', beam: 'charge', area: 'jump', clones: 'blink', ink: 'roar' };
function ultMove(id, n, t, kind, pk, col) {
  MOVES[id] = { n: '奥义·' + n, t, p: 150, acc: 100, pp: 1, ult: 1, fx: { m: ULT_MOTION[kind], k: id, base: 'ult_' + kind, pk, col, sig: 3 } };
}
(function buildSigMoves() {
  const cap = s => s[0].toUpperCase() + s.slice(1);
  for (const k in SIGX) for (const key in SIGX[k]) {
    const [n, m, base, p, ex] = SIGX[k][key], L = LINES[k], id = L.sig[key === 's3' || key === 's2b' ? 1 : 0];
    const sig = key === 's3' || key === 's2b' ? 2 : 1;
    MOVES[id] = Object.assign({ n, t: L.t, p, acc: sig === 2 ? 90 : 95, pp: sig === 2 ? 5 : 10 }, ex, { fx: { m, k: id, base, col: LINE_COL[k], sig, w: ex.w } });
    delete MOVES[id].w;
  }
  for (const k in EXTRA) {
    const L = LINES[k], [B, C, U] = EXTRA[k];
    if (B) MOVES['sig' + cap(k) + 'B'] = { n: B[0], t: L.t, p: 95, acc: 95, pp: 8, fx: { m: B[1], k: 'sig' + cap(k) + 'B', base: B[2], col: LINE_COL[k], sig: 1 } };
    if (C) MOVES['sig' + cap(k) + 'C'] = { n: C[0], t: L.t, p: 115, acc: 90, pp: 5, fx: { m: C[1], k: 'sig' + cap(k) + 'C', base: C[2], col: LINE_COL[k], sig: 2 } };
    ultMove('ult' + cap(k), U[0], L.t, U[1], U[2], LINE_COL[k]);
  }
  for (const t in TYPE_ULT) ultMove('ultT' + cap(t), TYPE_ULT[t][0], t, TYPE_ULT[t][1], TYPE_ULT[t][2], TYPE_ULT_COL[t]);
})();
const SPECIES = {};
(function buildSpecies() {
  const SCALE = { fox: [1, 1.05, 1.15], turtle: [0.95, 1.05, 1.18], fawn: [1.05, 1.1, 1.18], volt: [0.9, 1, 1.12], bunny: [0.88, 0.98, 1.08], bird: [0.85, 1.05, 1.2],
    lizard: [1.1, 1.15, 1.28], jelly: [0.95, 1, 1.1], shroom: [0.85, 0.95, 1.08], beetle: [1, 1.08, 1.2], seal: [0.95, 1.05, 1.2], rock: [1, 1.08, 1.25],
    moth: [0.85, 1, 1.15], otter: [0.9, 1.02, 1.15], owl: [0.88, 1.02, 1.18], cat: [0.88, 1.0, 1.15], golem: [0.95, 1.1, 1.3], dragon: [0.95, 1.1, 1.3],
    crane: [1.0, 1.2], koi: [0.85, 1.25], tanuki: [0.92, 1.1], qilin: [1.3], whale: [1.35], zhulong: [1.35] };
  const cap = s => s[0].toUpperCase() + s.slice(1);
  for (const k in LINES) {
    const L = LINES[k], N = L.names.length, R = RARITY[L.rar || 'common'];
    const typeL = (TYPE_LEARN[L.t] || []).filter(e => !L.learn.some(x => x[1] === e[1]));
    for (let s = 0; s < N; s++) {
      const id = s ? k + (s + 1) : k; const mul = N === 1 ? 1 : N === 2 ? [1, 1.4][s] : [1, 1.25, 1.5][s];
      const b = L.b.map((v, i) => Math.round(v * mul * R.bonus * (1 + (s ? L.bias[i] * (N === 2 ? 1.5 : s) : 0))));
      const learn = L.learn.concat(typeL);
      const sigs = [];
      if (N === 3) {
        if (s >= 1) { learn.push([L.evo[0], L.sig[0]], [L.evo[0] + 5, 'sig' + cap(k) + 'B']); sigs.push(L.sig[0], 'sig' + cap(k) + 'B'); }
        if (s >= 2) { learn.push([L.evo[1], L.sig[1]], [L.evo[1] + 4, 'sig' + cap(k) + 'C']); sigs.push(L.sig[1], 'sig' + cap(k) + 'C'); }
      } else if (N === 2) {
        if (s >= 1) { learn.push([L.evo[0], L.sig[0]], [L.evo[0] + 6, L.sig[1]]); sigs.push(L.sig[0], L.sig[1]); }
      } else { learn.push([1, L.sig[0]], [36, L.sig[1]]); sigs.push(L.sig[0], L.sig[1]); }
      learn.sort((a, c) => a[0] - c[0]);
      const evolved = s >= 1 || N === 1;
      SPECIES[id] = { id, line: k, stage: s, stages: N, n: L.names[s], t: L.t, b, rar: L.rar || 'common',
        cr: N === 1 ? L.cr : s === 0 ? L.cr : s === 1 ? Math.max(20, Math.round(L.cr * 0.45)) : 12, xp: Math.round(L.xp * [1, 1.6, 2.3][s]),
        d: L.d[s], learn, evoTo: s < N - 1 ? k + (s + 2) : null, evoLvl: s < N - 1 ? L.evo[s] : null, sig: s ? L.sig[s - 1] : (N === 1 ? L.sig[0] : null), sigs,
        ult: evolved ? 'ult' + cap(k) : 'ultT' + cap(L.t), scale: SCALE[k][s], floaty: k === 'jelly' || k === 'whale' || k === 'koi' || k === 'moth' };
    }
  }
})();
const DEX_ORDER = Object.keys(SPECIES);
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
