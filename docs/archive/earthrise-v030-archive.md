# 《地出》：保留的 v0.3.0 早期示例

README 将《地出》与《失重的夏天》并列展示：前者体现公开照片叙事、字幕与镜头节奏，后者体现分层运动和局部修改流程。

原成片为 aether-earthrise-v030.mp4，720×1280、24fps、336帧、14秒。按原文件保留，包括原音轨；最新产品演示的静音要求不覆盖该历史原件。来源署名记录为 NASA/Bill Anders，完整来源链接保存在示例 provenance.json 中。

单独分发 aether-moments-earthrise-v030-archive.zip，解压到仓库目录后，文件位于 examples/earthrise-v030/。仓库源码保留轻量封面，历史视频和验收快照位于独立归档包。

播放方式：先解压归档，打开其中的 index.html，点击视频播放按钮；也可用本地播放器打开 aether-earthrise-v030.mp4。README 中的封面进入说明页，ZIP 本身不能直接播放。GitHub 上需同时上传视频或提供实际 Release 视频附件，才能提供有效播放入口；仅上传源码包不包含这段视频。

该包保留原视频、修改后工程快照、patch、QA、清单及独立复核结果。preservation.json 记录原视频 SHA-256。本次未重新渲染，也未重新执行 CodeArts。

历史 CodeArts 执行依据用户回传日志；本机独立复核了成片参数、哈希与部分修改隔离证据，不能表述为本机直接观察了平台会话。回传包缺少原始照片和音轨，因此该归档不是可独立重渲染的完整工程，不应和最新版本源码拼接后声称原样复现通过。详情见归档内 acceptance-review.md。
