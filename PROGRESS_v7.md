# v7 进度：真正的骨骼动画（全部 63 只）

用户要求（t9u/t10u）：像王者荣耀那样的真骨骼动画，大幅度四肢动作；直接铺开到全部 63 只。

## 方案
- tools/rig/rigs*.json：每只灵兽的骨骼点（0–10 网格坐标）：身体/头/四肢(上下两节)/尾巴链/耳朵/翅膀/手臂/触手/脊椎链
- tools/rig/build.py（venv: /workspace/ttsenv/bin/python，需 opencv/scipy）：按骨骼胶囊体最近距离把原画像素分给各部件 → 连通性修正 → 关节重叠帽 → 被遮挡区域补色 → assets/rig/<sp>.webp 图集 + js/rigs.js
- js/skel.js：自写骨骼运行时（层级矩阵、关键帧包络+缓动、片段 idle/walk/attack/special/ult/hit/knock/dodge/victory/faint、交叉淡入、事件 hit/roar、眨眼眼皮画在头部骨骼上）
- drawCreature（js/util.js）：有骨骼数据且尺寸≥120px 时走骨骼绘制，否则回退 v6
- 检查：tests/skel_sheet.js（SP=a,b 每只各动作关键帧表 → /tmp/skel）；/tmp/rigdbg/<sp>.jpg 部件分配图

## 里程碑
- [x] R1 运行时 + 四足（fox/fawn/cat 线）
- [x] R2 其余四足/双足/鸟/蛇形/漂浮 全部 63 只（tools/rig/rigs_*.json；类型 quad/biped/bird/serpent/float/blob）
- [x] R3 战斗/大地图/图鉴接入片段（出招、招牌、奥义、受击、闪避、胜利、倒下、跟随行走）+ 事件同步
- [x] R4 测试、演示视频 docs/v7_skeletal_demo.mp4、Pages

## 记录
- 已绑定：全部 63 只（tests/skel_overview.js → /tmp/skelov/ov_*.jpg 总览）
- R3 进行中：战斗 skelBattle（出招/奥义/招牌/受击/击飞/闪避/胜利/倒下 + 交叉淡入 + 命中/咆哮事件特效）、跟随灵兽走路、图鉴/祈愿/选择界面展示模式已接入

- R3 完成：修复 softSprite 不认 rgba() 颜色导致烟雾变黑块（闪避/招牌时盖住灵兽）；设置面板新增「灵兽骨骼动画」开关（localStorage ls_skel）；tests/v7_shots.js 战斗截图 94 张无控制台错误；节点测试 mathq/explain/voice/gacha/world 全部通过（数学 0 失败）
- 性能：软件渲染下骨骼绘制 7.0 ms/只，旧版变形 8.3 ms/只（骨骼更快）
- R4 完成：回归 e2e/smoke/cinema_shots/v6_shots/v5_shots/voice_play 全部通过；演示视频 docs/v7_skeletal_demo.mp4（53 秒，1280×720，tests/v7_video.js）；README 更新
