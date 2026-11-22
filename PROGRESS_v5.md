# v5 进度（自动语音 / 口头禅 / 祈愿 / 战斗更生动）

- [x] M1 语音基础 + 星老师神经语音讲解（edge-tts 预生成，按步同步，音量/静音/跳过）
- [x] M2 63 种灵兽口头禅 + 招牌动作 + 战斗台词（语音 + 气泡）
- [x] M3 祈愿（抽卡）系统 + 灵晶货币（只靠答题/每日挑战/探索获得）
- [x] M4 元素反应、灵瞳收集（数学谜题守护）
- [x] M5 战斗动作更丰富（闪避/挑衅/受击）+ 随机趣味事件（含数学）
- [x] M6 测试、截图、README、Pages

## 笔记
- TTS：/workspace/ttsenv/bin/edge-tts（venv），中文神经音色 zh-CN-XiaoxiaoNeural 等
- M1：js/voice_text.js（拆句+数字读法）、js/voice.js（VoicePack/Voice）、voice/tutor.js（1076 片段）。tools/voice_corpus.js → tools/tts_gen.py 生成；tests/voice.test.js 覆盖率 100%，tests/voice_play.js 浏览器播放
- M2：js/mon_voice.js（台词/招牌动作/声线），voice/mons.js（756 条），js/battle_life.js（气泡/姿态/idle），battle.js 挂钩
- M3：js/gacha_core.js（概率/保底，tests/gacha.test.js），js/gacha.js（界面/经济/每日挑战/灵尘），G 键/菜单「祈愿」；星魂 m.cons 每阶 +5%
- 截图测试：tests/v5_shots.js（SECT=talk,dex,wish,…）输出 /workspace/monster-game/screenshots_v5
- M4：battle_life.js 元素附着/反应（10 种原创反应，答对加成），world.js 14 颗灵瞳（独立种子，不影响原地图），答对 2 题 ◆40
- M5：battle_events.js 6 种随机事件（天气/云游先生谜题/斗嘴/转盘/斗舞/流星雨），受击 4 种反应、低血喘气、暴击挑衅；voice/npc.js 事件播报与 NPC 语音（Yunyang/Xiaoyi）
- M6：node 测试（mathq/explain/world/voice/gacha）全过；voice_play、v5_shots（talk/dex/wish/events/oculus）、e2e、cinema_shots 回归均无控制台错误；README v5；Pages 已验证新文件上线
