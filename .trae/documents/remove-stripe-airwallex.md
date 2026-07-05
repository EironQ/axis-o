# 移除 Stripe 和 Airwallex 支付提供商

## Context
连连支付需要交接入费暂时无法使用，Stripe 和 Airwallex 也需要清除。项目只保留 PayPal 和 Lianlianpay（已注释待启用）。

## 关键决策
- **AirwallexPaymentForm 复用问题**: 该组件同时被 Lianlianpay 使用，需重命名为 `RedirectPaymentForm`
- **数据库 enum 策略**: 不修改 MySQL enum，保留 stripe/airwallex 作为合法值（兼容历史数据），只在应用层阻止新建
- **Lianlianpay 支付选项**: 移除 Stripe/Airwallex 后需取消注释 Lianlianpay 选项

## 实施步骤

### 1. 重命名 AirwallexPaymentForm → RedirectPaymentForm
- 创建 `client/src/components/checkout/RedirectPaymentForm.tsx`（从 AirwallexPaymentForm 复制，简化 provider 逻辑）
- 删除 `client/src/components/checkout/AirwallexPaymentForm.tsx`
- 删除 `client/src/components/checkout/StripePaymentForm.tsx`

### 2. 删除后端服务文件
- 删除 `server/src/services/payment/stripe.ts`
- 删除 `server/src/services/payment/airwallex.ts`
- 删除 `server/.env.airwallex.template`

### 3. 修改 PaymentController（改动量最大）
- 移除 Stripe/Airwallex import
- `createPaymentIntent`: 默认 provider 改为 paypal，移除 stripe/airwallex 分支，保留 paypal/lianlianpay
- 移除 `handleWebhook`（Stripe webhook）
- 移除 `handleAirwallexNotify`
- 移除 `syncPaymentIntentToDatabase`（Stripe 专用）
- 移除 `extractFee`（Stripe 专用）
- 退款方法：移除 stripe/airwallex 分支
- 类型定义中移除 'stripe' | 'airwallex'

### 4. 修改其他后端文件
- `OrderController.ts`: 移除 Stripe/Airwallex import 和退款分支
- `return/index.ts`: 移除 Stripe/Airwallex import 和退款分支
- `SettingsController.ts`: 移除 7 个 stripe/airwallex 设置项
- `payment.routes.ts`: 移除 `/webhook` 和 `/airwallex/notify` 路由

### 5. 修改后端配置与 Schema
- `env.ts`: 移除 7 个 Stripe/Airwallex 环境变量
- `schema/index.ts`: provider enum 改为 `['paypal', 'lianlianpay']`
- `schemas.ts`: zod enum 改为 `['paypal', 'lianlianpay']`
- `update-settings.ts`: 移除 airwallex 设置项
- `shared/src/index.ts`: PaymentProvider 类型改为 `'paypal' | 'lianlianpay'`
- `app.ts`: 移除 CSP 中 `api.stripe.com`，移除 Stripe webhook raw body 中间件

### 6. 修改前端文件
- `CheckoutPage.tsx`: 
  - import 改为 RedirectPaymentForm
  - 支付方式列表：移除 airwallex，取消注释 lianlianpay
  - 支付表单渲染：移除 stripe/airwallex 分支
  - 类型定义移除 stripe/airwallex
- `SettingsPage.tsx`: 移除 stripe/airwallex 设置 UI
- `OrderDetailPage.tsx`: 简化 provider 显示逻辑
- `PaymentEventsPage.tsx`: 移除 stripe/airwallex badge，加 lianlianpay
- `ReturnsPage.tsx`: 移除 stripe/airwallex label，加 lianlianpay
- `api.ts`: 移除 stripe/airwallex 类型和字段
- `mockApi.ts`: 移除 stripe/airwallex 类型
- `adminOrderService.ts`: 移除 stripe/airwallex label
- `mockData.ts`: 移除 stripe/airwallex 类型
- `index.css`: 移除 Stripe CSS hack

### 7. 修改 i18n 文件
- `zh.json` / `en.json`: 移除 stripeUnavailable，更新 paymentMethods 文本

### 8. 移除 NPM 依赖
- Server: `stripe`
- Client: `@stripe/react-stripe-js`, `@stripe/stripe-js`

### 9. 数据库清理（可选）
- 从 settings 表删除 stripe/airwallex 配置项

## 验证方式
1. 启动项目，确认前后端编译无错误
2. 结账页面只显示 PayPal 和 LianLian Pay 选项
3. 后台设置页面不再显示 Stripe/Airwallex 配置
4. 支付事件/退货页面不再显示 Stripe/Airwallex 标签
5. 已有订单详情仍能正确显示历史 provider 信息
