# 视觉试作：横屏版式

这是一份**独立分支**，不是主线的一部分：它在 v0.3.0 的核心上增加了 `layout: title / editorial / hero`、`heading`、`kicker`、显式 `crop` 和程序音轨，用来验证"档案影像"的横屏版式。

《地出》22 秒样片就是用它渲染的。根目录的 `src/` 不包含这些字段；两边共用同一套 `validate / render / verify / patch` 命令形态，但代码尚未合并。

## 运行

需要 Node 22+、FFmpeg/ffprobe 和中文字体（同主仓库）。

```powershell
node src/cli.mjs render examples/earthrise/project.json
node src/cli.mjs verify examples/earthrise/project.json
```

输出 `examples/earthrise/build/film.mp4`：1280×720、24fps、22 秒，带原创程序音轨（`assets/score.wav`）。照片来源 NASA / Bill Anders，见 `examples/earthrise/provenance.json`。

## 边界

- 版式目前只验证了横屏与这一组素材，未验证长文本、极端画幅和竖屏。
- 与主线是两套代码，不参与根目录 `npm test`；合并前不要把它当作 v0.6.1 的已完成能力。
- 设计意图与取舍见 [visual-treatment.md](visual-treatment.md)。
