# 一间自己的房间 · 独立网站

这是直接在浏览器访问的三维个人主页。页面托管在 GitHub Pages，登录与记录存储使用 Supabase，无需 GPT 或 Sites 登录。

预期地址：https://super-lazy-boy.github.io/

## 房间交互

首件纪念摆件 TARDIS 已放在放映角柜顶靠书架的一端，朝室内转 15°。旁边的纪念录像带、播放机与抽屉分别留出空间；录像带插入动画跟随播放机的新位置。模型保留原审核版的 171 个实体部件，以共享实例绘制，木纹与做旧使用模型自身坐标，缩放摆放后仍保持原有质感。

电脑端移动鼠标即可轻轻环顾；在桌面、书架或影音区停留约 0.34 秒，会平滑靠近对应区域。离开区域后约 0.54 秒返回总览。上方导航也可悬停或点击切换，Esc 返回总览。

在电脑屏幕内阅读、点击和输入时，镜头保持稳定；打开记录或播放取放动画时暂停自动切换。手机端继续使用点击进入、拖动观察和双指缩放。

鼠标交互参考 [Henry Heffernan](https://henryheffernan.com/) 的视角跟随与屏幕靠近方式，扩展到三个区域；房间模型与实现保持独立。

## 修改内容

网站右上角「GitHub 登录」供站主和访客使用。只有 `super-lazy-boy` 对应的 GitHub 固定身份可添加、编辑、归档、导入或上传阅读、观影及工作记录；访客只能管理自己留下的便签。权限由数据库验证，不能通过修改网页状态获取。

## 留言角

留言角是独立区域，有自己的地毯、边几、绿植与落地便签板。鼠标停留或点击导航「留言角」靠近，再点击便签板展开留言；页脚也保留入口。未登录也可以阅读；使用 GitHub 登录后，可留下 1–280 字的公开留言，选择奶油黄、鼠尾草绿、浅陶粉或雾紫纸张。公开签名取自 GitHub，留言不支持 HTML。每人每分钟最多新增一张，可以编辑自己的现有便签。

便签板上预览最近四张，展开后每次翻看 24 张。站主可以暂停新增和编辑（已有便签继续展示），删除任意便签或从「回收夹」恢复；不能修改他人的原文。访客不能删除、修改他人便签或操作开关。数据库不向浏览者返回作者账户 ID、邮箱或登录信息。登录后会回到原先浏览的区域。

登录后，在「翻页角」点一本空白书本，只能创建阅读记录；在「放映角」点空白录像带，只能创建影视记录。已有记录可以打开后编辑；其类型不能改换。电脑里继续管理研究、想法与「很多知识」。

每条新记录默认「仅自己」，可以改为「公开」。记录和封面存入数据库及私有素材库，不进入 GitHub 仓库。选择公开后直接更新，无需重新发布页面。退出登录会清除当前页面里的私密记录。素材采用短期访问链接；退出后不要转发先前打开的私密素材链接。

数据库迁移和账户配置见 [登录与权限配置](supabase/README.md)。

个人介绍和兴趣放在 `content/profile.json`；手动录入的记录由 Supabase 管理。`content/public-records.json` 仅保留经过审核的公开静态备份，后台暂不可用时展示。
初始记录为空，白色书本和录像带是预留位置，不是已读、已看记录。

下面是公开静态备份的格式，不会自动覆盖数据库里的在线记录。AI 批量导入在线记录时应使用数据库连接，或整理成「导入备份」支持的格式后由站主在网站中导入。每条记录必须有唯一 ID。

```json
{
  "version": 1,
  "records": [
    {
      "id": "reading-001",
      "kind": "book",
      "title": "在这里填写书名",
      "creator": "作者",
      "date": "2026-10-20",
      "body": "我的阅读记录。",
      "color": "#81917a",
      "visibility": "public",
      "rating": 4,
      "tags": "阅读, 随想"
    }
  ]
}
```

`kind` 可用：`book`（书）、`movie`（电影）、`game`（游戏）、`research`（研究工作）、`idea`（研究想法）、`knowledge`（很多知识）。

可选字段：`year`、`progress`（`planned` / `in-progress` / `finished`）、`coverUrl`、`trailerUrl`。封面放在 `public/media/` 后，使用 `./media/文件名.jpg`，也可以使用公开 HTTPS 地址。预告片支持 YouTube 链接，点击后才加载。

摆件后续可逐个审核，再放入 `public/media/`：设置 `modelUrl` 为 `./media/文件名.glb`，并设置 `modelVisible: true`。可选 `modelPlacement`：`books-top`、`books-middle`、`cinema-left`、`cinema-right`；`modelScale` 范围 0.1–1.5，`modelRotation` 为角度。

GitHub 公开仓库和发布文件里的内容都可以被他人读取。仅自己可见的记录应保留在私人数据中，不要加入此文件。构建会拒绝标记为 private 的记录、后台导出字段和重复 ID。不要直接把后台导出的完整 JSON 复制过来。

## 本地预览与生成

安装 Node.js 24 后，在独立源码包目录运行：

```text
npm ci
npm run test:public
npm run test:interaction
npm run build:github
npm run preview
```

打开命令显示的本地网址。`docs/` 就是可部署的网站文件。需要 HTTP 服务预览，不能直接双击 index.html。

## 发布到原 GitHub 网址

仓库： https://github.com/super-lazy-boy/super-lazy-boy.github.io

网站： https://super-lazy-boy.github.io/

本项目在 main 分支维护源码，将生成的网页提交到 docs/。GitHub Pages 的发布源使用 Deploy from a branch → main → /docs。无需 GPT、Sites 登录或自定义工作流权限。

日常更新流程：

1. 修改 content/profile.json 或 content/public-records.json，也可以请 AI 整理后修改。
2. 运行 npm run test:public 和 npm run build:github。
3. 本地检查后，将源文件和 docs/ 一起提交到 main；GitHub 会发布新的 docs/ 文件。

只提交源文件不会重新生成网页，记录修改后需要执行构建。仅自己可见的内容不要放进公开仓库。不要将 Sites 后台项目整体推送到此仓库。

发布方式依据 [GitHub Pages 发布源说明](https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 维护边界

- 独立版支持 GitHub 登录、站主记录管理和访客便签；不依赖 GPT 或 Sites 登录。
- 已导入 89 本读书记录和 1137 条观影记录，封面存放在公开媒体目录；每条记录保留固定实体位置，后续可以继续由 AI 整理导入。
- 角色纪念摆件逐个制作、审核后加入。当前已加入审核通过的第九／十任时期 TARDIS 外观手办。
- 浏览器若不能运行 WebGL，可通过记录入口查看书籍和影视文字内容。
