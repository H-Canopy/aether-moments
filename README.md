# AETHER Moments

**给几张照片，讲一段故事。和 Agent 一起，把它做成可以继续修改的影像。**

[![test](https://github.com/H-Canopy/aether-moments/actions/workflows/test.yml/badge.svg)](https://github.com/H-Canopy/aether-moments/actions/workflows/test.yml)
[![node](https://img.shields.io/badge/node-%E2%89%A522-3c873a?style=flat-square)](package.json)
[![status](https://img.shields.io/badge/status-prototype-d97757?style=flat-square)](#验证状态)
[![license](https://img.shields.io/badge/license-MIT-3c873a?style=flat-square)](LICENSE)

AETHER Moments 是一个本地 Agent Skill：宿主 Agent 理解故事、组织分镜，本仓库负责素材校验、程序化渲染、技术检查和局部修改。交付是一整个可继续编辑的工程，不只是 MP4。

---

## 两个演示

### 01 · 《失重的夏天》 · 52 秒 · 产品流程

https://github.com/user-attachments/assets/eec50f9e-2a2f-4b33-b642-ff54a168205c

放图 → 分镜 → 成片 → 局部修改前后对比。

> 界面是预先编排的流程回放；成片与修改由本 Skill 实际执行。素材为 AI 生成、故事虚构，演示视频静音。

### 02 · 《地出》 · 22 秒 · 影像方向试作

https://github.com/user-attachments/assets/589b39fe-fe9d-4253-a226-575db4ab6e4e

1968 年 12 月 24 日，阿波罗 8 号，一张来自月球轨道的照片。

> 公开史料（NASA / Bill Anders），1280×720 横屏，原创程序音轨。版式引擎在 [`experiments/visual-treatment/`](experiments/visual-treatment/)，**尚未并入主线**；本仓库的 `src/` 不包含 title / editorial / hero 版式。

---

## 从输入到交付

```text
照片 + 故事 ──► 宿主 Agent 编排分镜 ──► Skill 校验与渲染
                                              │
                   自然语言修改 ◄── 可编辑工程 + 视频 + 技术 QA
```

例如："把这些照片做成一段温柔的旅行回忆，保留我写的故事。第二个镜头再多停留两秒。"

普通使用者通过宿主 Agent 提交素材和需求；下面的命令供开发者验证执行层。

## 能做什么

| 能力 | 当前实现 |
|---|---|
| 照片与故事成片 | 事实引用、字幕、照片运动与可编辑分镜 |
| 连续镜头与转场 | 相机平移缩放、cut / dissolve / smoothleft 转场，重叠帧参与总时长 |
| 独立图层运动 | 透明 PNG、三次贝塞尔路径、浮动、旋转、缩放与接触点锚定 |
| 局部修改 | 宿主 Agent 生成指定场景的 patch，保留历史、复用缓存 |
| 技术 QA | 尺寸、帧数、时长、解码、工程与素材哈希、时间轴与音轨一致性 |
| 声音 | 静音，或用户提供的一条本地音轨 |

宿主 Agent 负责自然语言理解、视觉判断和叙事；CLI 不内置语言模型。技术 QA 不替代故事事实、构图、流畅度或审美检查。透明素材需外部提供；当前为 2.5D，不含自动抠图、任意三维运动或物理模拟。

## 快速开始

需要 **Node.js 22+**、PATH 上的 **FFmpeg / ffprobe**，以及一个中文字体。

默认读取 Windows 的 `C:/Windows/Fonts/simhei.ttf`；其他系统把 `AETHER_FONT` 设为合法字体的绝对路径。无需 `npm install`，无付费模型 API 依赖。

```powershell
node src/cli.mjs doctor      # 检查 node / ffmpeg / ffprobe / 字体
npm run demo                 # 生成三幕合成测试工程，实际渲染并验证
npm run test                 # 23 项 Node 测试
```

已有工程：

```powershell
node src/cli.mjs validate '<工程绝对路径>/project.json'
node src/cli.mjs render   '<工程绝对路径>/project.json'
node src/cli.mjs verify   '<工程绝对路径>/project.json'
node src/cli.mjs patch    '<工程绝对路径>/project.json' '<patch.json>'
# patch 后重新 render / verify
```

## 目录

```text
aether-moments/
├─ SKILL.md                     # Agent 调用入口
├─ src/
│  ├─ core.mjs                  # 校验、缓存、合成、QA
│  ├─ cinematic.mjs             # 相机与转场时间轴
│  ├─ layers.mjs                # 透明主体、路径、锚点
│  └─ workflow.mjs              # doctor / init / preview
├─ tests/                       # 23 项 Node 测试
├─ docs/                        # 协议、能力、边界；archive/ 为历史记录
├─ assets/showcase/             # 两个演示视频与海报
├─ experiments/
│  └─ visual-treatment/         # 横屏版式试作（独立分支，未并入主线）
└─ scripts/silence-video.mjs    # 去掉交付视频的音轨
```

## 验证状态

- 本机 Node 测试 **23 项通过、0 项失败**（2026-11-04，Windows，Node 24.14.1 / FFmpeg 9.0.1），原始输出见 [docs/test-results.txt](docs/test-results.txt)。
- GitHub Actions 在 Ubuntu + FFmpeg + Noto CJK 上运行同一套测试；CI 结果以 badge 为准。
- 演示片的成片与局部修改由本 Skill 实际渲染，验收记录随演示工程提供。
- **未完成**：真实个人照片案例、CodeArts 当前版本回归、在线 Agent 前端。技术检查通过不等于审美或事实审核通过。

## 文档

| 入口 | 内容 |
|---|---|
| [Agent 工作流](docs/agent-workflow.md) | 素材导入、事实整理、渲染与交付 |
| [基础协议](docs/protocol.md) | 分镜字段 |
| [连续镜头](docs/cinematic.md) | 相机、转场、时间轴 |
| [独立图层](docs/layers.md) | 透明 PNG 与运动路径 |
| [缩放与锚点](docs/anchor-scale.md) | 主体缩放、接触点及限制 |
| [声音与媒体](docs/media-v030.md) | 音轨及媒体验收 |
| [产品演示](docs/product-demo.md) | 界面模板、静音输出与证据 |
| [平台集成](docs/codearts.md) | CodeArts 目录与验收步骤 |
| [研究与边界](docs/research.md) | 授权、原创边界、阶段调查 |
| [视觉试作](experiments/visual-treatment/README.md) | 横屏版式实验（未并入主线） |

## 授权与来源

代码采用 **MIT License**，见 [LICENSE](LICENSE)——可自由使用、修改、分发，保留版权声明即可。

**示例媒体不在 MIT 范围内**：`assets/showcase/` 与 `experiments/` 中的照片、音轨仅用于演示，按各自来源授权。NASA / Library of Congress 素材为公有领域，署名见对应 `provenance.json`；演示 UI 的素材为 AI 生成、故事虚构。

本项目为独立实现，参考过 Huashu Motion、Remotion Skills 的公开资料，没有捆绑其源码或运行时。Node.js、FFmpeg/ffprobe 和字体由本机提供，不随仓库分发。

---

## English

**Photos and a story, turned into an editable film with your Agent.**

AETHER Moments is a local Agent Skill for personal memory films. The host Agent handles narrative and natural-language requests; this toolkit validates assets, renders storyboards, applies scoped edits, reuses scene caches and checks technical output.

- Cinematic camera moves, cuts/dissolves/slide transitions with real timeline math.
- Transparent layers with bezier paths, rotation, bob and contact-point anchoring.
- Scoped patches with history and per-scene cache reuse.
- Deterministic FFmpeg rendering with technical QA. No npm runtime deps, no paid model API.

Requires Node.js 22+, FFmpeg/ffprobe and a local CJK font. `npm test` runs 23 checks. Released under the MIT License; sample media keeps its own terms.
