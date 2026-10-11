# 开源维护约定

public/ 是后台前端源码，app/api/ 是服务端接口，index.html 是 GitHub Pages 开发资料入口。dist/ 仅是 Vinext 构建输出，不直接编辑。GitHub Pages 不运行 D1 接口，运行演示指向 README 中的 Sites 地址。

先读 CONTEXT.md、UX-CONTRACT.md 与 docs/ARCHITECTURE.md。规范化数据是公开只读基线；匿名访客修改只写自己的沙盒快照，不自动回写业务表。公开角色切换不构成生产鉴权。资产来源只读，无转卡、退款执行与真实支付。

公开版本仅允许虚构 SQL、源码、接口设计与示例。禁止上传 Word、真实系统资料、个人资料、凭据、.env、node_modules、.wrangler 或本地运行状态。不接入 AI Application Hub。

Cloudflare D1 迁移只含 schema，seed 独立且幂等。请求不得创建或修改表；已应用迁移不得修改。公开 .openai/hosting.json 仅为本地 DB 绑定占位，部署到自己的 Sites 时再填自己的项目。

适用检查：npm run build、node scripts/test-api.mjs、python database/verify-reference-data.py。业务接口状态以 docs/integration/ 与 OpenAPI 为准，不把待对接设计标为已实现。
