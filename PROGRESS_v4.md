# v4 进度记录（用于中断后恢复）
- [x] M1 答错 NPC 老师动画讲解（mathq 解析数据 + tutor.js）
- [ ] M2 火影风战斗演出（结印/特写/连击/奥义槽/奥义过场）
- [ ] M3 技能扩充 + 学招选择界面 + 技能导师
- [ ] M4 阴阳师风音乐重写
- [ ] M5 新灵兽 + 稀有度 + 异色 + 图鉴
- [ ] M6 测试、截图、README、zip

## 笔记
- 新灵兽原图：/workspace/mg_assets_src/v4/*.jpg，抠图脚本 /workspace/process4.py（rembg），输出到 assets/*.webp（已完成 27 张 + teacher）
- 新系列：moth otter owl cat golem dragon（三阶）, crane koi tanuki（二阶）, qilin whale zhulong（传说单阶）
- 测试：node tests/explain.test.js / mathq.test.js / world.test.js；截图 tests/tutor_shots.js（输出 screenshots_v4）
- Playwright: node_modules 软链到 /workspace/mg3/node_modules，Chrome=/usr/bin/google-chrome
