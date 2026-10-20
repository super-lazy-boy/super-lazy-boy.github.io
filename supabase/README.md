# 登录与记录权限

项目：`super-lazy-boy-room`，区域：新加坡，项目 ID：`rxundohqfaanmhucmbcq`。
创建时确认的价格为每月 0 美元；后续使用量与套餐以 Supabase 控制台为准。

## 登录配置

1. 在 GitHub 的 Settings → Developer settings → OAuth Apps 创建本网站的登录应用。
2. Homepage URL：`https://super-lazy-boy.github.io/`。
3. Authorization callback URL：`https://rxundohqfaanmhucmbcq.supabase.co/auth/v1/callback`。
4. 注册应用后，在应用详情页复制 Client ID，并点击 Generate a new client secret 生成密钥。它们不是 GitHub 用户名、账号密码或个人访问令牌。将这两项只填写到 Supabase → Authentication → Sign In / Providers → GitHub；启用后保存。不要提交到仓库。
5. Supabase → Authentication → URL Configuration：Site URL 和 Redirect URLs 都添加 `https://super-lazy-boy.github.io/`。
6. 建议关闭 Email、Phone 和匿名登录；仅启用 GitHub。GitHub 的新访客即使完成登录，也没有任何写入权限。

前端仅使用 `content/services.json` 中的项目 URL 和公开 publishable key。构建会拒绝 secret key、旧式 JWT 或额外配置字段。

## 数据库

按编号应用 `migrations/` 中的迁移。第一份包含表、录入函数、账户校验和素材权限；第二份明确撤销 Supabase 默认直接授予匿名角色的写入函数调用权限。迁移各应用一次，迁移记录由 Supabase 管理。

所有记录和站主配置位于非公开的 `room_private` schema，启用 RLS，撤销浏览器角色的表访问权限。公开接口只暴露经过筛选的查询函数；写入、导入和上传必须经过主人身份校验。

主人身份由 Supabase 服务端的 `auth.identities` 中 GitHub provider ID `165765809` 确定。可自行修改的个人资料、显示名称和邮箱不参与授权，也不存在「首个登录者自动成为管理员」。修改主人仅能通过管理控制台修改 `room_private.settings`，网站没有授权其他编辑者的入口。

书本入口只接受 `book`；录像带入口只接受 `movie`（包括电影、剧集）；电脑入口只接受研究、想法和知识。已有记录的种类不可修改，避免跨区域错放。管理导入仍支持历史游戏记录。

私密记录、归档记录、纪念物创作便签和未审核模型不会返回给访客。素材桶 `room-assets` 为私有；只有主人可上传，访客仅能取得公开记录所引用、已允许展示的素材链接。素材链接有效期五分钟，前台定时刷新；已签发链接在到期前仍可能有效。

## 验证

```text
npm run typecheck
node --test scripts/public-records.test.mjs scripts/room-navigation.test.mjs scripts/room-permissions.test.mjs
node scripts/check-backend.mjs
```

权限测试在本地 PostgreSQL 引擎中模拟匿名、其他 GitHub 用户和站主，验证拒绝写入、私密隔离、素材隔离、录入类型限制及归档行为。线上检查只读取公开配置，并尝试一条应被拒绝的未授权写入，不创建测试记录。

线上检查还会确认 OAuth 回调地址、Client ID 没有误填成用户名，以及 GitHub 是否接受授权入口。检查不会输出或保存 OAuth state，也不会代替用户登录；Client secret 和登录后返回地址仍须通过真实登录确认。
