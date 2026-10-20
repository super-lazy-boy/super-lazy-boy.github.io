# 一间自己的房间 · 独立网站

这是直接在浏览器访问的三维个人主页。GitHub Pages 版本无需 GPT、Sites 登录或后台服务。

预期地址：https://super-lazy-boy.github.io/

## 修改内容

个人介绍和兴趣放在 `content/profile.json`；公开阅读、影视、游戏和研究记录放在 `content/public-records.json`。
目前记录为空，白色书本和录像带是预留位置，不是已读、已看记录。

可以让 AI 按下面格式批量整理数据，再检查后发布。每条记录必须有唯一 ID。

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

- 独立版只展示公开内容，没有网站登录、在线编辑或私密记录存储。
- 豆瓣批量整理可后续由 AI 完成，不需要在网站中加入批量导入按钮；本次尚未导入豆瓣记录。
- 所有角色纪念摆件仍需逐个制作、审核，当前没有擅自加入未审核角色模型。
- 浏览器若不能运行 WebGL，可通过记录入口查看书籍和影视文字内容。
