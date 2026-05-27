# 支付信息配置清单

本文档列出了 AXIS O 项目所需的支付相关配置信息，请您提供以下内容：

---

## 一、Stripe 支付配置

| 配置项 | 说明 | 示例格式 |
|--------|------|----------|
| **STRIPE_SECRET_KEY** | Stripe 秘钥（测试/生产） | `sk_test_xxxxxxxx` 或 `sk_live_xxxxxxxx` |
| **STRIPE_PUBLISHABLE_KEY** | Stripe 公钥（测试/生产） | `pk_test_xxxxxxxx` 或 `pk_live_xxxxxxxx` |
| **STRIPE_WEBHOOK_SECRET** | Webhook 签名密钥 | `whsec_xxxxxxxx` |

**获取方式：**
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 开发模式下使用测试密钥（以 `sk_test_` 开头）
3. 生产环境切换为生产密钥（以 `sk_live_` 开头）
4. 在 Webhooks 设置中创建端点并获取签名密钥

---

## 二、PayPal 支付配置

| 配置项 | 说明 | 示例格式 |
|--------|------|----------|
| **PAYPAL_CLIENT_ID** | PayPal 客户端 ID | `AXxxxxxxxxxx` |
| **PAYPAL_CLIENT_SECRET** | PayPal 客户端秘钥 | `ELxxxxxxxxxx` |
| **PAYPAL_MODE** | 运行模式 | `sandbox`（测试）或 `live`（生产） |

**获取方式：**
1. 登录 [PayPal Developer](https://developer.paypal.com/)
2. 创建 REST API 应用
3. 在应用详情中获取 Client ID 和 Client Secret
4. 测试阶段使用 sandbox 模式

---

## 三、Alipay Global 支付配置

| 配置项 | 说明 | 示例格式 |
|--------|------|----------|
| **ALIPAY_APP_ID** | 支付宝应用 ID | `2021xxxxxxxx` |
| **ALIPAY_PRIVATE_KEY** | RSA 私钥（PEM 格式） | `-----BEGIN RSA PRIVATE KEY-----...` |
| **ALIPAY_PUBLIC_KEY** | 支付宝公钥（PEM 格式） | `-----BEGIN PUBLIC KEY-----...` |

**获取方式：**
1. 登录 [Alipay Global Merchant Portal](https://global.alipay.com/)
2. 创建跨境支付应用
3. 生成 RSA 密钥对（推荐 2048 位）
4. 上传公钥到支付宝后台获取支付宝公钥

---

## 四、邮件服务配置

| 配置项 | 说明 | 示例格式 |
|--------|------|----------|
| **SENDGRID_API_KEY** | SendGrid API 密钥 | `SG.xxxxxxxxxx` |
| **EMAIL_FROM** | 发件人邮箱地址 | `noreply@axiso.com` |

**获取方式：**
1. 登录 [SendGrid Dashboard](https://sendgrid.com/)
2. 创建 API Key（Full Access 权限）
3. 配置发件人邮箱并完成域名验证

---

## 五、配置文件位置

以上信息需要填入以下 `.env` 文件：

```
项目根目录: .env                    # 服务端配置
客户端目录: client/.env             # 客户端配置（如需要）
```

---

## 六、注意事项

1. **安全提醒**：所有密钥信息属于敏感数据，请妥善保管，不要提交到版本控制系统
2. **测试环境**：建议先使用各支付平台的测试密钥完成功能验证
3. **生产环境**：上线前务必切换为生产密钥，并完成支付平台的审核流程
4. **Webhook 配置**：需要在各支付平台配置 Webhook 通知地址，用于异步通知支付结果

---

**待补充状态：**

- [ ] Stripe 配置
- [ ] PayPal 配置
- [ ] Alipay Global 配置
- [ ] SendGrid 邮件配置