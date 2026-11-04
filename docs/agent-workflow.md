# Agent 执行指南

用户只需给照片、故事与想改的地方。不要让用户编写 JSON、运行命令或操作渲染器。以下步骤由宿主 Agent 执行。

先运行 `node src/cli.mjs doctor`。缺少组件则定位原因，能自行解决的环境问题直接处理；账户登录等必须本人完成的步骤才交给用户。

照片导入前由 Agent 查看照片并整理事实：把“故事原文”“照片中可见内容”“尚不确定的信息”区分开。故事没有提供时间、关系或事件原因时，不据图推断。文字可以精简与重排，不能增加新事实。每幕保留可追溯的 factIds。

Agent 在工作目录编写 intake.json：结构同 project.json，asset 可以是本机绝对路径或相对 intake 的路径。填入 facts 和 scenes，并可写 sources（来源及许可说明）和 exampleKind（user-supplied / public-documentary / synthetic）。执行 `node src/cli.mjs init <intake.json> <新工程目录>`，工具复制照片到工程。已有目录不会被覆盖。

默认每幕 3–5 秒，每句字幕聚焦一个故事细节，阅读速度过快则增加停留或拆幕。照片不足时允许重复使用同一张，不生成虚构旧照片。没有素材仍可完善 Skill 与使用明确标注的公开资料案例验证，不把素材缺失当作整个开发工作停止的原因。

执行 render、verify、preview。打开关键帧检查文字、构图和照片对应关系。交付 preview.html、project.json、assets、history 和视频，附上客观检查状态与未通过项。preview.html 可离线编辑字幕和时长、下载新 project.json；用户用自然语言修改时仍由 Agent 调用 patch。

局部修改先确定稳定幕 ID。文字改动需要重新对照事实，节奏改动检查全文总长；保持无关幕不变。运行 patch → render → verify → preview，比较 manifest.sceneKeys，确认只有目标幕缓存失效。保留此前工程历史，不要求用户理解缓存和 JSON。

当前支持完整入框、独立字幕区、淡入，以及 still / push / pull 三种照片运动；可接入一条合法本地音轨。参数与项目范围声音修改见 media-v030.md。多轨混音、自动配乐、语音生成及更丰富的视觉编排仍未实现。
