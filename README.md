# ClimateCommit｜香港电动巴士

[Live demo 在线演示](https://serendizc.github.io/climatecommit/) · [Download 下载](https://github.com/SeRendizc/climatecommit/releases/latest) · [English walkthrough](DEMO.md)

ClimateCommit compares operating emissions for Hong Kong franchised buses and checks whether official documents support each milestone of the electric-bus subsidy programme. In the hosted demo, **Analyze official update** revalidates two recorded Codex candidates. **Try another document** lets you check the original 2024 announcement or paste your own text.

页面自动播放柴油基线和两种供电情景。点击能耗切换，可看到同一批车换用另一项研究参考值后，减排幅度和供电强度临界点如何变化。所有结果均为等里程替换的年度运营情景估算。公式和来源收在页面底部。

点击「分析官方更新」，从随附立法会答复和真实 Codex 子智能体抽取记录中重新校验引文、批次及阶段。计划推出属于基线已有证据。招标准备是新增证据。订购和交付登记仍待核查。源文件包含已发生的动作和未来目标，页面显示各自状态。

## 演示方式

- **在线和单文件**。GitHub Pages 可直接打开。下载 `ClimateCommit-Demo.html` 后也可双击离线运行。可切换中英、试算能耗、对照两份随附官方材料及粘贴文字。运行 `npm run build:demo` 可由当前源码重建。
- **本地服务**。使用 Node.js 20 或更新版本，在项目目录运行 `npm start`。打开 [本地演示](http://127.0.0.1:4173)。可额外在「试用其他文档」粘贴支持的 info.gov.hk 英文公报链接，在线取正文并使用规则核查。粘贴的自由文本可查找候选引文，来源验证待补。
- **可选实时 Codex**。本地已登录 Codex CLI 时可运行 `CLIMATECOMMIT_CODEX=1 CLIMATECOMMIT_CODEX_TIMEOUT=155000 npm start`。服务只对随附的公开政府快照运行 CLI。完整实时实测约 117 秒，两条候选均通过校验。失败时重新校验已保存的子智能体抽取。现场演示使用默认入口可省去网络等待。

## 核验与参赛

- `npm test` 运行排放、解析、误判和 HTTP 测试。
- `npm run benchmark` 对照六份人工标注的官方回归样本。该集合用于已知行为回归。
- 英文演示稿见 [DEMO.md](DEMO.md)，模型参数见 [model-basis.md](data/model-basis.md)。
- 目标用户试用、实际车队参数校准及跨政策泛化仍待验证。
