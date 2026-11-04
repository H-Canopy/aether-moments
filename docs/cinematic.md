# v0.4.0：连续镜头与转场

本功能位于 Skill 本身：SKILL.md → 分镜协议 → src/cli.mjs → core.mjs → cinematic.mjs。与普通照片流程使用同一组 init / validate / patch / render / verify 命令，没有独立 MV 渲染入口。

在 version=1 工程中增加 `presentation: "cinematic"`。默认 classic 保留旧版完整照片与字幕逻辑。`captionMode` 可为 burn（默认）或 none（画面中不烧录字幕，仍保留事实与文字记录）。

## 镜头参数

```json
{
  "id": "street",
  "asset": "assets/03.png",
  "caption": "虚构街道上物体悬浮。",
  "seconds": 5.625,
  "factIds": ["f3"],
  "camera": {
    "zoom": [1.03, 1.11],
    "pan": [[0.40, 0.52], [0.62, 0.48]],
    "easing": "linear"
  },
  "transition": {"type": "dissolve", "seconds": 0.625}
}
```

camera.zoom 范围1..2，pan 的两组坐标为归一化取景位置0..1。linear 在镜头中保持持续运动；smooth 为首尾缓动。显式 camera 会按目标比例裁切源图，Agent 必须检查主体和构图。没有显式 camera 时保留照片边界，并使用保护留白。

transition 属于当前幕到下一幕的转场。支持 cut（时长0）、dissolve（交叉溶解）、smoothleft（平滑横向过渡）；时长按帧量化。最后一幕没有下一幕，必须为cut/0或省略。重叠最多为相邻任一幕的一半，相邻重叠不得消耗整幕。

**最终帧数 = 各幕帧数之和 − 转场重叠帧数之和**。validate、render、verify 共用同一时间轴规划器，不能简单把 seconds 相加当成最终片长。分镜精确位置保存在 manifest.timeline。

## 自然语言局部修改

“街道到列车的转场再慢一点”可映射为：

```json
{"sceneId":"street","changes":{"transition":{"type":"dissolve","seconds":0.625}}}
```

由宿主 Agent 写入 patch.json，并执行：

```text
node src/cli.mjs patch <project.json> <patch.json>
node src/cli.mjs render <project.json>
node src/cli.mjs verify <project.json>
```

转场不属于原分镜像素缓存键：只改转场时复用源分镜，重新合成并核对最终时长；改 camera 时只重渲染目标分镜。manifest.renderedScenes / reusedScenes 记录实际执行情况。不能将“整片完全不重渲染”作为承诺。

画面不再逐幕淡入黑场，转场统一由合成器负责。composition.ffgraph 保存实际使用的 FFmpeg 合成表达式及哈希。结尾可选顶层 endTitle；相应字幕和素材说明在合成阶段绘制，不破坏源镜头缓存。

## Agent 的镜头设计职责

先确定视觉焦点与运动方向，再选择转场。连贯段落保持取景方向一致，linear 避免每幕都停下再启动；较长溶解用于空间和情绪变化，cut 只用于明确的节奏意图。不得给所有素材盲目套同一种转场并宣称“丝滑”。注意重叠期间双影、主体相互遮挡、画面密度和照片取景。

改动转场长度后，重算音乐位置与总片长；必要时让 Agent 调整镜头秒数，以保留目标片长。不得为了对拍而偷偷裁掉用户指定的内容。

## QA 与能力边界

自动检查实际解码帧数、视频/音频时长、工程和素材哈希、当前渲染模块版本、合成图及时间轴一致性。红蓝色块测试验证真实混合像素，局部修改测试验证缓存复用。

自动检查不保证主观流畅性。需要打开转场前、中、后的实际帧检查双影与构图，并播放视频检查节奏。现阶段不含光流变形、跨图物体身份追踪或图生视频；动态仍来自代码相机和剪辑。

依赖真实 FFmpeg/ffprobe；使用本机 FFmpeg 9 的 xfade 与 zoompan。当前 v0.4.0 在 Windows 本机验证，未在 CodeArts 回归，不将旧版平台验收冒充新版已测。
