# 清除 Stripe 和 Airwallex 残余引用

## 概述
继续之前的工作，清除前端代码中所有 Stripe 和 Airwallex 的残余引用。后端已完成，只剩余前端文件和测试文件需要修改。

## 当前状态
根据 Grep 搜索，前端仍有 20 处 stripe/airwallex 引用：

| 文件 | 行号 | 内容 |
|------|------|------|
| `client/src/pages/admin/ReturnsPage.tsx` | 85-87 | `paymentProviderLabels` 包含 stripe 和 airwallex |
| `client/src/services/api.ts` | 231 | `CreateOrderRequest.paymentProvider` 类型含 `'airwallex'` |
| `client/src/services/api.ts` | 687 | `PaymentIntentResponse.data.airwallexRedirectUrl` |
| `client/src/services/api.ts` | 713 | `paymentApi.createIntent` 参数类型含 `'airwallex'` |
| `client/src/services/adminOrderService.ts` | 168,170 | `paymentLabels` 含 stripe 和 airwallex |
| `client/src/services/mockApi.ts` | 36 | `CreateOrderRequest.paymentProvider` 含 `'stripe'` 和 `'airwallex'` |
| `client/src/data/mockData.ts` | 34 | `MockOrder.paymentMethod` 类型含 `'stripe'` 和 `'airwallex'` |
| `client/src/data/mockData.ts` | 143,185,256 | 模拟数据使用 `'stripe'` 和 `'airwallex'` |
| `client/src/data/mockData.ts` | 322 | `createMockOrder` 默认值 `'stripe'` |
| `client/src/index.css` | 103-127 | Stripe CSS hack（隐藏安全横幅） |
| `client/src/store/__tests__/orderSubmission.test.ts` | 56,115 | 测试中使用 `'stripe'` 作为 paymentProvider |

## 修改计划

### 1. `client/src/pages/admin/ReturnsPage.tsx`
- 移除 `stripe: 'Stripe (信用卡)'` 和 `airwallex: 'Airwallex'`
- 添加 `lianlianpay: 'LianLian Pay'`

### 2. `client/src/services/api.ts`
- `CreateOrderRequest.paymentProvider` 类型：`'paypal' | 'airwallex' | 'lianlianpay'` → `'paypal' | 'lianlianpay'`
- `PaymentIntentResponse.data` 移除 `airwallexRedirectUrl` 字段
- `paymentApi.createIntent` 参数类型：`'paypal' | 'airwallex' | 'lianlianpay'` → `'paypal' | 'lianlianpay'`

### 3. `client/src/services/adminOrderService.ts`
- `paymentLabels` 移除 `stripe: 'Stripe'` 和 `airwallex: 'Airwallex'`
- 添加 `lianlianpay: 'LianLian Pay'`

### 4. `client/src/services/mockApi.ts`
- `CreateOrderRequest.paymentProvider` 类型：`'stripe' | 'paypal' | 'airwallex'` → `'paypal' | 'lianlianpay'`

### 5. `client/src/data/mockData.ts`
- `MockOrder.paymentMethod` 类型：`'stripe' | 'paypal' | 'airwallex'` → `'paypal' | 'lianlianpay'`
- 模拟订单数据：`'stripe'` → `'paypal'`，`'airwallex'` → `'lianlianpay'`
- `createMockOrder` 默认值：`'stripe'` → `'paypal'`

### 6. `client/src/index.css`
- 移除 Stripe CSS hack（第 103-127 行），包括：
  - `/* Hide browser auto-fill security warning in Stripe Payment Element */` 注释及 autofill 样式
  - `/* Hide Stripe security warning banner */` 注释及 `.stripe-el-banner` 等选择器
  - `/* Additional styles to hide warning messages */` 注释及 `div[style*="security"]` 等选择器
- 保留 `input:-webkit-autofill` 样式（通用浏览器样式，非 Stripe 专属）

### 7. `client/src/store/__tests__/orderSubmission.test.ts`
- `paymentProvider: 'stripe' as const` → `paymentProvider: 'paypal' as const`（2处）

### 8. 后续步骤
- 运行 `pnpm install` 更新 lock 文件
- 运行 `pnpm check`（tsc --noEmit）验证类型检查通过

## 不修改的文件
- `server/src/db/migrations/*` - 数据库迁移文件是历史记录，不应修改
- `server/src/db/init-db.sql` - 初始化 SQL 保留历史兼容
- `server/src/db/migrations/meta/*` - 快照文件是历史记录

## 验证
- Grep 搜索 `client/src` 中不再有 stripe/airwallex 引用（迁移文件除外）
- `pnpm check` 编译无错误
