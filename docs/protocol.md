# 分镜协议 v1

project.json 是工程真源，UTF-8 JSON，可通过任意编辑器修改。完整示例由 `npm run demo` 创建。

| 字段 | 约束 |
|---|---|
| version | 1 |
| title | 工程名称，当前不烧录 |
| width / height | 320..1920 偶数 |
| fps | 24 / 25 / 30 |
| facts | 非空数组，每项 id 唯一、text 为用户原始事实 |
| scenes | 1..30 幕，总长不超过 180 秒 |
| scenes[].id | 稳定的字母数字、下划线或连字符标识，不随排序变更 |
| asset | 工程内相对路径 PNG/JPEG；真实路径不得越界，单图 <=30MB |
| caption | 单行非空 <=36 字符；长故事由 Agent 分成多幕，不静默截断 |
| seconds | 1..20，最终帧数 round(seconds * fps) |
| factIds | 引用 facts 的事实编号；只验证引用存在，语义真实性由 Agent 与用户检查 |

patch.json 只允许 sceneId + changes，changes 允许 caption / seconds / asset / factIds。未知字段拒绝。无效修改不写源文件；成功修改保存完整上一版与变更记录到 history/。撤销时取 previous 恢复 project.json，再重新渲染校验。

渲染适配器当前只有 ffmpeg-v1：完整适配画布、字幕、短淡入、无音轨。每幕缓存键含分镜、素材内容、字体内容、编码器版本和输出尺寸。局部修改只重渲染变更幕，再拼接。build/manifest.json 记录工程、素材相关键和视频哈希；verify 会拒绝过期视频。未实现 Huashu 或 Remotion 运行时适配器，不应宣称已有。

宿主 Agent 负责自然语言理解与叙事。本 CLI 是执行层，不是独立聊天应用，不内置视觉识别、故事生成模型或自由自然语言解析器。
