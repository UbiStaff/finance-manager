# 个人收支管理系统

本项目是一个基于 Web 的个人记账系统，支持收支记录、分类统计、报表展示、数据导入/导出，并内置隐私脱敏能力。

## 技术栈
- 前端：React + TypeScript + Vite + Tailwind CSS
- 后端：Node.js (Express) + Prisma ORM
- 数据库：SQL Server（Azure SQL Edge，Docker 运行）
- 图表：Recharts

## 功能特性
- 收支记录：金额、类型（收入/支出）、日期、备注、分类、账户标签
- 分类统计：按月、按分类、按账户统计；饼图/柱状图可视化
- 数据导入：支持支付宝 CSV（GBK/UTF-8）、微信 XLSX；自动匹配分类与账户
- 数据导出：支持导出 Excel/CSV（可扩展）
- 自定义管理：在“管理分类/账户”页面新增/删除分类与账户
- 隐私与脱敏：
  - 自动将银行卡等账户名脱敏为如“建设银行储蓄卡（1234）”“银行卡 ****1234”
  - 针对“工商银行储蓄卡(7934)”示例进行了定向映射为“建设银行储蓄卡（1234）”

## 快速开始
- 一键启动：
  - 运行 `./start.sh`
  - 脚本会：启动 Docker 数据库 → 同步 Prisma Schema → 启动前后端开发服务
  - 前端地址：`http://localhost:5173`
  - 后端 API：`http://localhost:3001`

- 首次准备：
  - 安装依赖：`npm install`
  - 启动 Docker Desktop
  - 如需手动启动数据库：`docker-compose -p finance-system up -d`

## 目录结构
```
api/                 后端服务（Express 路由、导入逻辑等）
  routes/            业务路由（transactions/categories/accounts）
  server.ts          开发环境服务入口
  app.ts             应用与中间件注册
prisma/              数据模型与迁移
  schema.prisma      Prisma Schema，SQL Server Provider
  seed.ts            初始数据（中文分类与账户）
scripts/             实用脚本
  reset_transactions.ts  清空交易并生成100条匿名化测试数据
  mask_accounts.ts       批量脱敏账户名称
  rename_account.ts      将“工商银行储蓄卡(7934)”重命名为“建设银行储蓄卡（1234）”
src/                 前端代码（React + Vite）
  pages/             页面（Home、Settings）
  components/        组件（Dashboard、TransactionForm、TransactionList）
start.sh             一键启动脚本
CHANGELOG.md         版本日志（v1.0.0）
```

## 数据导入指引
- 首页右上角点击“导入 Excel/CSV”：
  - 支付宝 CSV：自动识别 GBK/UTF-8 编码，解析表头（交易时间/交易分类/收付方式等），过滤失败订单与“不计收支”
  - 微信 XLSX：解析表头（交易时间/交易类型/收支/金额(元)/支付方式/商品等）并转为系统字段
  - 分类/账户：若账单中的名称在系统中不存在，会自动创建；账户名会脱敏
  - 去重：以时间、金额、账户、备注进行简单去重，避免重复入账

## API 概览
- `GET /api/transactions`：查询交易（含分类、账户）
- `POST /api/transactions`：新增交易
- `DELETE /api/transactions/:id`：删除交易
- `POST /api/transactions/import`：导入文件（multipart/form-data）
- `GET /api/categories` / `POST /api/categories` / `DELETE /api/categories/:id`
- `GET /api/accounts` / `POST /api/accounts` / `DELETE /api/accounts/:id`

## 开发与测试
- 启动开发服务：`npm run dev`
- 生成测试数据：`npx tsx scripts/reset_transactions.ts`
- 批量脱敏账户：`npx tsx scripts/mask_accounts.ts`
- 定向重命名账户：`npx tsx scripts/rename_account.ts`

## 环境变量
- `.env` 中的数据库连接：
  - `DATABASE_URL="sqlserver://sa:StrongPassword123!@localhost:1434;database=master"`
  - 如端口被占用，可在 `docker-compose.yml` 修改为 `1434:1433`

## 版本日志
- 详见 `CHANGELOG.md`（当前版本 v1.0.0）

## 许可
- 个人学习与使用许可，可根据需要自行调整。

---
**English README**: See `README.md` (with bilingual links).
