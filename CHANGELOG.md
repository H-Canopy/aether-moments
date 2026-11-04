# Changelog

## v0.6.1 — 2026-11-04

- 产品演示《失重的夏天》：界面模板、静音交付、局部修改前后对比。
- 静音处理脚本 `scripts/silence-video.mjs`，交付文件真正移除音轨。
- 独立版式试作《地出》：1280×720 横屏、原创程序音轨，位于 `experiments/visual-treatment/`，未并入主线。

## v0.6.0 — 2026-11-03

- 图层缩放与接触点锚定：`scale`、`anchor`，固定透明画布与 4096 上限。
- 列车 4 秒试片与 30 秒整片技术 QA。

## v0.5.0 — 2026-11-02

- 透明主体图层：Alpha 校验、贝塞尔路径、旋转、浮动，最多 4 层。
- 六秒分层试片；图层参数进入缓存键。

## v0.4.0 — 2026-11-01

- 连续镜头：`presentation: "cinematic"`、相机 zoom/pan、cut/dissolve/smoothleft。
- 重叠帧参与最终时长；validate / render / verify 共用时间轴规划器。
