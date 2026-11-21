# v4 进度记录（用于中断后恢复）
- [x] M1 答错 NPC 老师动画讲解（mathq 解析数据 + tutor.js）
- [x] M2 火影风战斗演出（结印/特写/连击/奥义槽/奥义过场）
- [x] M3 技能扩充 + 学招选择界面 + 技能导师
- [x] M4 阴阳师风音乐重写
- [x] M5 新灵兽 + 稀有度 + 异色 + 图鉴
- [x] M6 测试、截图、README、zip（e2e 4K file:// 全通过、无控制台错误；mathq 146646 / explain 132126 / world 通过；README v4）

## 笔记
- 新灵兽原图：/workspace/mg_assets_src/v4/*.jpg，抠图脚本 /workspace/process4.py（rembg），输出到 assets/*.webp（已完成 27 张 + teacher）
- 新系列：moth otter owl cat golem dragon（三阶）, crane koi tanuki（二阶）, qilin whale zhulong（传说单阶）
- 测试：node tests/explain.test.js / mathq.test.js / world.test.js；截图 tests/tutor_shots.js（输出 screenshots_v4）
- Playwright: node_modules 软链到 /workspace/mg3/node_modules，Chrome=/usr/bin/google-chrome

## M2 + M5（数据部分）完成 — 战斗演出 & 新灵兽
- js/cinema.js：分级技能特写（普通 0.55s / 招牌 0.95s / 终极 1.5s / 奥义 2.7s），书法逐字招式名 + 朱印、眼部特写条、泼墨转场、奥义异空间背景、白闪
- 连击（答对后普通技能 2~5 段，分段伤害、HITS 计数器）、冲击帧（反色/黑白集中线）、击倒慢动作、碎石、镜头旋转/推轨、灵气
- 奥义槽（答对 +25、神速/竞赛 +10、命中/受击充能），满槽后招式菜单出现【奥义】，需连答两题；对手奥义可答题防御（伤害 ×0.4）
- 新动作 blink（瞬身）、新特效 clones/talisman/needles/ink 等，每条进化链招式按专属配色重新着色
- data.js：24 条进化链 63 种灵兽，稀有度 普通/稀有/史诗/传说，异色 1/64，属性进阶技能，招牌技 ×2+，每线独有奥义 + 属性通用奥义
- 图鉴（菜单/按 P），三处传说神社（金色竞赛试炼 3 题对 2 题）
- 测试：tests/cinema_shots.js、tests/v4_shots.js 无控制台错误

## M3 完成（e9ce031）
- 学习第 5 个招式时弹出选择界面（选择遗忘哪个 / 放弃），战斗中暂停队列
- 每个城镇一位招式导师：3 题对 2 题即可学会遗忘招式、招牌技、属性进阶招式
- 进化领悟的新招式进入待学习队列，回到地图后逐个选择

## M4 完成 — 阴阳师风格音乐重写
- 新乐器：筝 / 三味线（Karplus-Strong 拨弦合成）、尺八 / 龙笛（气息噪声 + 滑音 + 延迟颤音）、太鼓 / 大太鼓 / 缔太鼓 / 拍子木、钲（非谐波泛音）、神乐铃、弦乐铺底、808 现代节拍
- 调式：都节（in）、阳旋（yo）、平调子、律、小调五声；旋律全部由种子动机生成（A A' B A + 变奏段 C C' A'' B'），原创
- 17 首：标题、城镇、7 个地区各一首、普通战斗、稀有/史诗战斗、传说战斗、训练师对决、进化、胜利、星老师讲解、答题
- 动态分层：低血量 / 奥义槽满 / 奥义演出时加入太鼓连打、现代节拍和八度重奏；每 8 小节太鼓过门
- 新音效：talk/chalk/tutor_in（星老师）、cutin/sigcut/ult（技能特写/奥义）、slash、gauge
- tests/music_test.js：17 首曲目均能生成并发声，无控制台错误
