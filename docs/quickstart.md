# Windows 11 复现

前提：Node.js 22+、FFmpeg 和 ffprobe 在 PATH；Windows 存在 C:/Windows/Fonts/simhei.ttf。首次自行安装工具可能需要联网，工程本身不联网、不含 npm 依赖、不调用付费 API。

在工程目录 PowerShell 执行：

```powershell
npm test
npm run demo
node src/cli.mjs validate demo/project.json
node src/cli.mjs verify demo/project.json
```

demo/build/film.mp4 是 6 秒静音合成测试，非审美演示。demo/project.json 是可编辑工程入口。真实照片使用时新建独立工程目录，把 PNG/JPEG 放入 assets，复制并编辑 project.json 中事实、分镜与路径。不要运行 demo 覆盖自己的工程。

```powershell
node src/cli.mjs render '你的工程/project.json'
node src/cli.mjs verify '你的工程/project.json'
```

宿主 Agent 读取 SKILL.md 后承担文字分镜和自然语言修改。仅 CLI 不会自动理解故事。v0.3.0 支持一条本地音轨和三种照片运动，详见 media-v030.md；无需声音或模型 API 凭证。

CodeArts 安装路径依官方文档为项目根目录 .codeartsdoer/skills/aether-moments/。将本源码包的 SKILL.md、src、docs、package.json、tests 复制到该目录（排除 demo、日志与缓存），在码道会话明确要求读取此 Skill。路径已由官方文档核对，实际加载与执行仍需在码道登录环境验收。

官方技能文档：https://support.huaweicloud.com/intl/zh-cn/usermanual-codeartsagent/codeartsagent_ug_0024.html 。后续实测步骤见 codearts.md。
