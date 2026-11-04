# v0.3.0 媒体与验收规范

本文件覆盖旧文档中“仅淡入、无音轨”的能力说明。version=1 分镜格式向后兼容。

## 分镜与自然语言修改

每幕可增加 `motion`：`still`（默认）、`push`（缓慢推近）、`pull`（缓慢拉远）。运动范围 6%，预留保护边界；完整保留原照片，不用裁脸的方式填满屏幕。字幕保持独立区域、不随相机缩放。

用户说“第二幕拉远一点”，Agent 映射为：

```json
{"sceneId":"s2","changes":{"motion":"pull"}}
```

修改仍运行 patch → render → verify → preview，保留历史并检查其他幕缓存未变化。离线 preview 现在也可选择这三种运动；页面是分镜编辑器，不播放实际动画，视频才是渲染结果。

## 本地音轨

工程顶层可选字段：`"audio":{"asset":"assets/music.wav","gain":0.25}`。支持 WAV/MP3/M4A/FLAC/OGG；gain 为 0..1。音轨路径必须位于工程内部，大小上限 100MB，并由真实 ffprobe 检查音频流。素材导入 init 会复制 intake 中给出的音轨。

短音轨末尾补静音，长音轨按实际视频帧预算裁切，添加短淡入淡出，AAC 输出。只有一个音轨；可以是用户录音或有权使用的配乐，当前不支持多轨混音、自动配乐或语音生成。

“把音乐调轻”由 Agent 映射为项目范围 patch：

```json
{"scope":"project","changes":{"audio":{"asset":"assets/music.wav","gain":0.15}}}
```

设为 `{"scope":"project","changes":{"audio":null}}` 可去掉声音。音轨/音量修改仅重新封装成片，保留画面缓存。

## QA 与发布

verify 包含原有检查，以及音轨存在性、原音轨内容哈希、音轨时长。音轨存在不等于听感合格：仍需人工听音、核对口播与授权。当前未实现响度合规检测、语义音画同步或人脸识别。

测试 17/17 通过，实际渲染一条 720×1280、24fps、13 秒公开资料案例，音轨为本项目程序生成的三音测试和弦，不是商业音乐，不声称专业配乐完成。案例只证明照片与声音链路，不代表私人记忆验收。

渲染依据 FFmpeg 官方文档 https://ffmpeg.org/ffmpeg-filters.html#zoompan 与 https://ffmpeg.org/ffmpeg-filters.html#apad 。未添加收费服务或运行依赖。

本次开发发生在本机。原 CodeArts 回传证据保留在 integration-evidence；该历史记录不证明 v0.3.0 新功能已在 CodeArts 跑过。新版本仍需平台回归。
