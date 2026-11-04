# 能力、授权与赛规调查（2026-10-30）

## 已查阅的一手资料

- Huashu Motion：https://github.com/alchaincyf/huashu-motion 。本机 0.1.1 文档可读，描述 HTML + GSAP 时间轴、本地浏览器逐帧渲染、可点击局部修改、check / qa、作曲与声音流程。本次仅审阅文档和授权，未跑其渲染器，不能以其宣传替代本原型验证。
- MIT 正文：https://github.com/alchaincyf/huashu-motion/blob/main/LICENSE 。Third-party：https://github.com/alchaincyf/huashu-motion/blob/main/THIRD_PARTY.md 。GSAP 有单独标准许可，字体是各自 OFL；豆子花叔形象明确不用于其他用途。首次语音模型下载也涉及其他许可。
- Remotion Skills：https://github.com/remotion-dev/skills 。它是 Agent 最佳实践与创建/渲染/字幕/编辑指导，不是自动完成个人记忆叙事的独立视频产品。本次根目录未见 LICENSE，raw LICENSE 返回 404，不据此断言可以复制。未复制其 Skill 正文。
- Remotion 引擎：https://github.com/remotion-dev/remotion/blob/main/LICENSE.md 。当前个人、至多 3 名员工营利组织等有免费资格，大组织通常需商业许可；禁止某些引擎衍生转售行为。未来若接入须固定实际版本重新核验，不能说引擎采用 MIT。
- 官方参赛上传说明：https://support.huaweicloud.com/offers-codeartsagent/codeartsagent_offers_0008.html （2026-10-26 更新）。确认可在码道 IDE/网页生成 Skill，经 AI 会话提交市场；它只是官方活动操作文档，未载完整评审与原创条款。
- 上述官方文档链接的赛事正文：https://developer.huaweicloud.com/competition/information/1300000350/introduction 。本次返回 JavaScript 页面，未获取可读规则正文。因此完整规则核验尚未完成。

## 赛规未决项

第三方当前页面称 11 月 16 日截止、允许多次提交并以最新一次为准、至少使用 CodeArts 或 OfficeAce。另有较早转载写 11 月 13 日；不能代替赛事正文确认。暂建议按更早的 11 月 13 日准备完成，11 月 16 日仍是用户提供的暂定日期。多次迭代提交也不等于可以同时评奖多份 Skill。团队人数、多个独立作品能否评奖、评审权重、文件限制、原创声明格式尚待官方账号页面核对。

二手对照（只用于发现差异）：https://www.competehub.dev/en/competitions/huawei1300000350 ，https://chun7.top/archives/1247/ ，https://www.aicpt-memo.cn/detail/huawei-cloud-a7bdf1caa60f485eab8c35ab0dee21e0.html 。不采用其未获一手证实的数值作为通过条件。

## 原创边界与分发

原创实现：本工程的事实引用协议、校验器、分镜缓存、修改审计、渲染适配、验证脚本和个人记忆工作流。Agent 编写，无第三方 Skill 源码复制。通用技术（JSON 分镜、视频拼接、字幕、哈希）不是排他创新声明。

使用系统安装 Node.js 与 FFmpeg/ffprobe，均不随包分发。当前 FFmpeg 构建带 GPL 选项；未来分发二进制必须另行履行对应许可义务。FFmpeg：https://ffmpeg.org/legal.html 。libx264 编码涉及其许可与可能的专利问题，不能作全球无条件商用保证。

Windows simhei.ttf 仅引用本机安装字体，不复制到工程或提交包。真实照片归用户及相关权利人；禁止在测试包放私人照片或凭据。工程内只有合成测试图。此原型未擅自选择整个作品的开源许可；发布前由 AETHER 确认原创代码许可。

当前不是最终高质量产品：静态照片适配 + 淡入 + 字幕，未实现音乐/旁白、景深运动、视觉模型质检、人脸定位、多语言排版与自动叙事模型。自然语言叙事与 patch 翻译依赖宿主 Agent。真实照片、真人易用性、传播反馈、广泛需求尚未测试。CodeArts 真实集成也未完成。
