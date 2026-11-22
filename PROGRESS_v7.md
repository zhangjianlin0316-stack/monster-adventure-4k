# v7 进度：真正的骨骼动画（全部 63 只）

用户要求（t9u/t10u）：像王者荣耀那样的真骨骼动画，大幅度四肢动作；直接铺开到全部 63 只。

## 方案
- tools/rig/rigs*.json：每只灵兽的骨骼点（0–10 网格坐标）：身体/头/四肢(上下两节)/尾巴链/耳朵/翅膀/手臂/触手/脊椎链
- tools/rig/build.py（venv: /workspace/ttsenv/bin/python，需 opencv/scipy）：按骨骼胶囊体最近距离把原画像素分给各部件 → 连通性修正 → 关节重叠帽 → 被遮挡区域补色 → assets/rig/<sp>.webp 图集 + js/rigs.js
- js/skel.js：自写骨骼运行时（层级矩阵、关键帧包络+缓动、片段 idle/walk/attack/special/ult/hit/knock/dodge/victory/faint、交叉淡入、事件 hit/roar、眨眼眼皮画在头部骨骼上）
- drawCreature（js/util.js）：有骨骼数据且尺寸≥120px 时走骨骼绘制，否则回退 v6
- 检查：tests/skel_sheet.js（SP=a,b 每只各动作关键帧表 → /tmp/skel）；/tmp/rigdbg/<sp>.jpg 部件分配图

## 里程碑
- [ ] R1 运行时 + 四足（fox/fawn/cat 线）
- [ ] R2 其余四足/双足/鸟/蛇形/漂浮 全部 63 只
- [ ] R3 战斗/大地图/图鉴接入片段（出招、招牌、奥义、受击、闪避、胜利、倒下、跟随行走）+ 事件同步
- [ ] R4 测试、演示视频 docs/v7_skeletal_demo.mp4、Pages

## 记录
- 已绑定：fox fox2 fox3 fawn fawn2 fawn3 cat cat2 cat3
