# 可选的产品演示界面

当用户需要展示 Skill 的使用过程、录制演示片或准备仓库展示时，使用 assets/product-demo/ 的原生 HTML / CSS / JS 模板。普通照片成片无需加载或复制此界面。

模板依次演示输入图片与需求、展开分镜、播放实际成片、展示局部修改前后对比。它是一段预先编排的流程回放，不包含在线模型调用、实时上传或实时渲染接口。输入框的文字不触发任意任务；发送按钮进入准备好的示例。不要将这套前端描述成已实现的在线 Agent 产品。

## 准备一个演示

1. 将模板复制到独立交付目录，保留来源工程。修改 index.html 的标题、界面文案，修改 app.js 的 prompt、titles、notes、镜头时长及播放流程以匹配案例；当前模板按六幕《失重的夏天》编排，不会自动读取任意 project.json。
2. 建立 media/：1.png 至 6.png 对应六幕图片，original.mp4 为真实渲染结果。保持虚构 / 生成素材标识；真实记忆案例使用真实用户授权素材。
3. 由宿主 Agent 将修改需求映射成 patch。复制原工程，保留缓存；实际执行 patch / render / verify。核对未指定场景的 JSON、缓存键与执行清单，再将成片保存为 revised.mp4。不要凭界面动画声称后台完成了工作。
4. 从真实原片和修改片的同一时间区间导出 before-city.mp4、after-city.mp4；避开转场。界面对比区域的名称和叙述须与实际改动一致。
5. 放入 editable-project.zip，包含修改后的 project.json、assets、history；说明需使用本 Skill 渲染。evidence/acceptance.json 保存实际验收，保留 patch/render/verify 输出。更新按钮与路径后逐一验证下载。
6. 本演示采用静音，不添加配乐。可对每个播放文件执行下列命令；复制视频流，删除音频流，验证成功后才替换输出。仅给 video 加 muted 属性不足以移除交付文件内的配乐。

```powershell
node scripts/silence-video.mjs '<输入绝对路径>' '<输出绝对路径>'
```

7. 打开 index.html 或使用 Start.cmd 启动本地静态服务。检查图片加载、成片播放、前后对比同步、重播、下载、移动端溢出及浏览器错误。若导出演示视频，再用 ffprobe 确认无音频流，并完整解码检查。

## 当前实例与边界

完整静音实例单独分发为 aether-moments-v0.6.1-demo.zip，解压后位于 examples/product-demo/。源码包只包含轻量模板、脚本和本说明，不捆绑大视频。

实例真实改动：islands 三层 bob 与 rotation 乘以0.35，其余五幕 JSON 一致；render 记录仅重渲染 islands，其余五幕复用缓存。静音版工程移除 audio 字段和音轨文件；清理旧渲染产物后，重新执行 render / verify，避免工程再次渲染时带回配乐。原始版本工程仍单独保留。

视频是页面录制；页面中制作进度是压缩过的案例回放。任意输入、实时上传、在线 Agent 接口和 CodeArts 新版本回归均不属于此界面已完成的能力。
