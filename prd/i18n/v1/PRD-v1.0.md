# AXIS O 中英双语国际化方案 — PRD v1.0

---

## 一、概述

将 AXIS O 电商平台从「纯中文硬编码」升级为**中英双语运行时切换**系统，覆盖前端 UI、产品内容、SEO 元数据、以及后端邮件模板。

| 属性 | 说明 |
|---|---|
| 产品代号 | `i18n` |
| 版本 | 1.0 |
| 状态 | Draft |
| 目标平台 | Web（React + TypeScript + Vite） + 后端 API（Node.js） |
| 预计影响页面 | ~20 个前端页面 + 管理后台 |
| 技术方案 | 轻量自建（不引入第三方 i18n 库） |
| 路由方案 | URL 路径前缀 `/:lang/`（如 `/zh/`、`/en/`） |

---

## 二、目标与非目标

### 目标

| # | 目标 | 度量标准 |
|---|---|---|
| G1 | 所有前端 UI 文案支持 zh/en 运行时切换 | 全站 0 硬编码中文残留 |
| G2 | URL 携带语言前缀，SEO 友好 | Google/百度可分别索引 /zh/ 和 /en/ |
| G3 | 产品/分类名称与描述按语言返回 | 切换语言后产品列表和详情内容同步变更 |
| G4 | 语言偏好持久化，返回用户不留失 | 再次访问自动跳转上次语言 |
| G5 | 后端邮件模板按用户语言渲染 | 订单确认邮件随用户下单时语言发送 |
| G6 | 管理后台可管理双语内容 | 产品编辑支持 zh/en 双字段 |

### 非目标（不在 v1.0 范围）

- 不支持除 zh / en 外的第三种语言
- 不引入第三方 i18n 库（保持零依赖）
- 不改变管理后台的语言（后台仅保留中文）
- 不做多货币联动（货币切换独立于语言）

---

## 三、用户画像与场景

### Persona A — 国际买家 Emma

> Emma 是伦敦的时尚爱好者，通过 Instagram 发现 AXIS O。她不会中文，需要在全英文界面下浏览产品、下单、收货。

### Persona B — 国内用户 张女士

> 张女士通过小红书种草，习惯中文界面。她希望在 `/zh/` 路径下完成从浏览到支付的全部流程。

### 关键场景

1. **首次访问**：Emma 浏览器语言为 en，访问 `axis-o.com` → 自动跳转 `/en/`，全站英文。
2. **手动切换**：张女士分享链接 `/en/products/123` 给朋友 → 朋友在页面右上角切换到中文 → URL 变为 `/zh/products/123`。
3. **下单邮件**：Emma 在英文界面下单 → 收到英文订单确认邮件。张女士在中文界面下单 → 收到中文订单确认邮件。
4. **SEO 收录**：Google 收录 `/en/products` 页面，百度收录 `/zh/products` 页面，各自独立索引。

---

## 四、架构设计

### 4.1 整体架构图

```
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│  URL: /zh/products/123  ←→  /en/products/123     │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│              React Router (v7)                    │
│  /:lang/products/:id                              │
│  /:lang/cart                                      │
│  /:lang/checkout                                  │
│  ...                                              │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│           LanguageProvider (Context)               │
│  - 从 URL 提取 lang                                │
│  - 提供 useTranslation() hook                      │
│  - 提供 useLanguage() 读写                         │
└──────┬──────────────────────┬────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼──────────┐
│  locales/   │    │   API calls          │
│  zh.json    │    │   Header:            │
│  en.json    │    │   Accept-Language: zh│
└─────────────┘    └─────────────────────┘
```

### 4.2 目录结构

```
client/src/
├── i18n/
│   ├── index.ts                # LanguageProvider + useTranslation + useLanguage
│   ├── locales/
│   │   ├── zh.json             # 中文翻译字典
│   │   └── en.json             # 英文翻译字典
│   └── types.ts                # TranslationKey 类型定义
├── context/
│   └── SettingsContext.tsx      # (已有) 扩展 language 状态
├── App.tsx                      # 改造路由，包裹 LanguageProvider
```

### 4.3 翻译字典结构 (`zh.json` / `en.json`)

```json
{
  "common": {
    "loading": "加载中...",
    "error": "出错了",
    "retry": "重试",
    "save": "保存",
    "cancel": "取消",
    "back": "返回"
  },
  "nav": {
    "home": "首页",
    "classic": "经典系列",
    "luxe": "轻奢系列",
    "travel": "旅行系列",
    "about": "关于我们",
    "search": "搜索",
    "cart": "购物车",
    "login": "登录",
    "logout": "退出登录",
    "profile": "个人中心"
  },
  "home": {
    "hero_title": "匠心皮具",
    "hero_subtitle": "每一件都是时间的艺术品",
    "best_sellers": "热销推荐",
    "shop_now": "立即选购"
  },
  "product": {
    "add_to_cart": "加入购物车",
    "buy_now": "立即购买",
    "description": "产品描述",
    "specifications": "规格参数",
    "out_of_stock": "暂时缺货",
    "color": "颜色",
    "size": "尺寸",
    "quantity": "数量"
  },
  "cart": {
    "title": "购物车",
    "empty": "购物车是空的",
    "checkout": "结算",
    "remove": "删除",
    "subtotal": "小计"
  },
  "checkout": {
    "title": "支付",
    "shipping_address": "配送地址",
    "billing_address": "账单地址",
    "shipping_method": "配送方式",
    "standard": "标准配送",
    "express": "加急配送",
    "standard_desc": "3-5个工作日送达",
    "express_desc": "1-2个工作日送达",
    "payment_method": "支付方式",
    "discount_code": "优惠码",
    "notes": "订单备注",
    "place_order": "提交订单",
    "order_summary": "订单摘要",
    "free_shipping": "免运费"
  },
  "auth": {
    "login": "登录",
    "register": "注册",
    "email": "邮箱",
    "password": "密码",
    "confirm_password": "确认密码",
    "forgot_password": "忘记密码",
    "no_account": "还没有账号？",
    "has_account": "已有账号？"
  },
  "order": {
    "title": "我的订单",
    "order_number": "订单编号",
    "status": "状态",
    "total": "总计",
    "view_detail": "查看详情",
    "pending": "待支付",
    "paid": "已支付",
    "processing": "处理中",
    "shipped": "已发货",
    "delivered": "已送达",
    "cancelled": "已取消"
  },
  "footer": {
    "about": "关于 AXIS O",
    "customer_service": "客户服务",
    "shipping": "配送信息",
    "returns": "退换政策",
    "privacy": "隐私政策",
    "terms": "服务条款",
    "follow_us": "关注我们",
    "copyright": "© 2024 AXIS O. 保留所有权利。"
  }
}
```

### 4.4 `useTranslation` Hook 设计

```typescript
// client/src/i18n/index.ts

function useTranslation() {
  const { lang } = useLanguage()

  function t(key: string): string {
    // 从 locales[lang] 按 key 路径取值，如 t('checkout.shipping_address')
    return getNestedValue(translations[lang], key) || key
  }

  return { t, lang }
}
```

用法示例：
```tsx
const { t } = useTranslation()
return <h1>{t('checkout.title')}</h1>  // 中文显示"支付"，英文显示"Checkout"
```

### 4.5 路由改造方案

**改造前：**
```
/                     → HomePage
/products             → ProductListPage
/products/:id         → ProductDetailPage
/cart                 → CartPage
/checkout             → CheckoutPage
...
```

**改造后：**
```
/                     → 重定向到 /{detectedLang}/
/:lang                → HomePage
/:lang/products       → ProductListPage
/:lang/products/:id   → ProductDetailPage
/:lang/cart           → CartPage
/:lang/checkout       → CheckoutPage
...
/admin/*              → (保持不变，不参与 i18n)
```

语言自动检测逻辑：
```typescript
function detectLanguage(): 'zh' | 'en' {
  // 优先级：URL > localStorage > 浏览器语言 > 默认 zh
  const stored = localStorage.getItem('preferred_language')
  if (stored === 'zh' || stored === 'en') return stored
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) return 'zh'
  return 'en'
}
```

### 4.6 API 对接方案

由于后端能力不确定，采用**渐进增强**策略：

| 阶段 | 前端行为 | 后端需求 |
|---|---|---|
| **Phase 1（立即可做）** | 所有 UI 文案通过 `t()` 翻译；产品/分类保持原样 | 无需改动 |
| **Phase 2（后端适配后）** | 请求头携带 `Accept-Language: zh` 或 `en` | 后端按语言返回翻译后的产品名/描述/分类名 |
| **Phase 3（邮件模板）** | 下单时传递 `language` 字段 | 后端根据语言渲染邮件模板 |

---

## 五、页面改造规格

### 5.1 需要改造的页面清单

| 页面 | 文件 | 硬编码中文数量（估计） | 优先级 |
|---|---|---|---|
| Navbar | `components/layout/Navbar.tsx` | ~10 处 | P0 |
| Footer | `components/layout/Footer.tsx` | ~8 处 | P0 |
| HomePage | `pages/HomePage.tsx` | ~12 处 | P0 |
| ProductListPage | `pages/ProductListPage.tsx` | ~8 处 | P0 |
| ProductDetailPage | `pages/ProductDetailPage.tsx` | ~15 处 | P0 |
| ProductCard | `components/products/ProductCard.tsx` | ~4 处 | P0 |
| CartPage | `pages/CartPage.tsx` | ~10 处 | P0 |
| CheckoutPage | `pages/CheckoutPage.tsx` | ~25 处 | P0 |
| LoginPage | `pages/LoginPage.tsx` | ~10 处 | P1 |
| RegisterPage | `pages/RegisterPage.tsx` | ~10 处 | P1 |
| ProfilePage | `pages/ProfilePage.tsx` | ~8 处 | P1 |
| OrderListPage | `pages/OrderListPage.tsx` | ~12 处 | P1 |
| OrderDetailPage | `pages/OrderDetailPage.tsx` | ~15 处 | P1 |
| AddressPage | `pages/AddressPage.tsx` | ~8 处 | P1 |
| ReturnListPage | `pages/ReturnListPage.tsx` | ~10 处 | P2 |
| ReturnDetailPage | `pages/ReturnDetailPage.tsx` | ~10 处 | P2 |
| ReturnCreatePage | `pages/ReturnCreatePage.tsx` | ~10 处 | P2 |
| AboutPage | `pages/AboutPage.tsx` | ~5 处 | P2 |
| Privacy/Terms/Shipping/ReturnPolicy | 4 个政策页面 | ~20 处 | P2 |
| CookieConsent | `components/ui/CookieConsent.tsx` | ~3 处 | P2 |

### 5.2 改造模式示例

**改造前（CheckoutPage）：**
```tsx
<h1>支付</h1>
<p>标准配送 - 3-5个工作日送达</p>
```

**改造后：**
```tsx
const { t } = useTranslation()
// ...
<h1>{t('checkout.title')}</h1>
<p>{t('checkout.standard')} - {t('checkout.standard_desc')}</p>
```

### 5.3 语言切换器 UI

在 Navbar 右上角增加语言切换按钮：

```
┌──────────────────────────────────────┐
│  [🌐 中文 ▾]       🔍  👤  🛒      │
│                  EN / 中文            │
└──────────────────────────────────────┘
```

- 显示当前语言（中文/English）
- 点击展开下拉菜单
- 切换后刷新当前页面到对应语言路径

---

## 六、后端改造需求（API 层）

### 6.1 产品/分类模型扩展

每个可翻译字段拆分为独立列或 JSON：

```sql
-- 方案 A：独立列（推荐，简单直接）
ALTER TABLE products ADD COLUMN name_zh TEXT;
ALTER TABLE products ADD COLUMN name_en TEXT;
ALTER TABLE products ADD COLUMN description_zh TEXT;
ALTER TABLE products ADD COLUMN description_en TEXT;

ALTER TABLE categories ADD COLUMN name_zh TEXT;
ALTER TABLE categories ADD COLUMN name_en TEXT;
ALTER TABLE categories ADD COLUMN description_zh TEXT;
ALTER TABLE categories ADD COLUMN description_en TEXT;
```

API 返回行为：
```json
// GET /api/products?lang=en
{
  "id": "123",
  "name": "Classic Leather Tote",       // name_en
  "description": "Handcrafted...",       // description_en
  "nameZh": "经典皮革托特包",             // name_zh (保留，供管理后台使用)
  "descriptionZh": "匠心打造..."         // description_zh
}
```

### 6.2 邮件模板

```
server/
├── templates/
│   ├── emails/
│   │   ├── zh/
│   │   │   ├── order-confirmation.html
│   │   │   ├── shipping-notification.html
│   │   │   └── ...
│   │   └── en/
│   │       ├── order-confirmation.html
│   │       ├── shipping-notification.html
│   │       └── ...
```

### 6.3 SEO 元数据

管理后台已有 `meta_title_zh/en`、`meta_description_zh/en` 字段，前端在对应语言页面动态设置：

```tsx
useEffect(() => {
  document.title = lang === 'zh' ? store.meta_title_zh : store.meta_title_en
}, [lang, store])
```

---

## 七、实施计划（分阶段）

### Phase 1 — 基础设施 + 核心页面（预估范围最大）

| 任务 ID | 任务 | 优先级 | 说明 |
|---|---|---|---|
| I18N-001 | 创建 `src/i18n/` 目录结构 + LanguageProvider | P0 | 核心基础设施 |
| I18N-002 | 编写 `zh.json` 和 `en.json` 完整翻译字典 | P0 | 全量翻译键值对 |
| I18N-003 | 路由改造：包裹 `/:lang` 前缀 | P0 | App.tsx + 301 重定向 |
| I18N-004 | Navbar 语言切换器 UI | P0 | 右上角下拉 |
| I18N-005 | Navbar + Footer 国际化 | P0 | 导航和页脚文案 |
| I18N-006 | HomePage 国际化 | P0 | 首页全部文案 |
| I18N-007 | ProductListPage + ProductCard 国际化 | P0 | 产品列表页 |
| I18N-008 | ProductDetailPage 国际化 | P0 | 产品详情页 |
| I18N-009 | CartPage 国际化 | P0 | 购物车 |
| I18N-010 | CheckoutPage 国际化 | P0 | 支付页（最复杂） |

### Phase 2 — 用户相关页面

| I18N-011 | LoginPage + RegisterPage 国际化 | P1 |
| I18N-012 | ProfilePage 国际化 | P1 |
| I18N-013 | OrderListPage + OrderDetailPage 国际化 | P1 |
| I18N-014 | AddressPage 国际化 | P1 |
| I18N-015 | API 层增加 Accept-Language 请求头 | P1 |

### Phase 3 — 后端适配 + 剩余页面

| I18N-016 | 产品/分类数据库增加双语字段 | P2 |
| I18N-017 | 后端 API 按语言返回产品/分类内容 | P2 |
| I18N-018 | 管理后台产品编辑页增加双语输入 | P2 |
| I18N-019 | 邮件模板双语化 | P2 |
| I18N-020 | SEO 动态 meta 标签 | P2 |
| I18N-021 | 政策页面（Privacy/Terms/Shipping/ReturnPolicy）国际化 | P2 |
| I18N-022 | 退货相关页面国际化 | P2 |

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| 翻译不完整 | 部分页面出现英文 key 或中文 | 翻译字典维护 Fallback 机制：缺失时回退到 zh |
| URL 变更导致 SEO 影响 | 搜索引擎重新索引 | 旧路径 301 重定向到 `/zh/...` |
| `/:lang` 与现有 API 路由冲突 | 后端路由混乱 | 明确区分：`/api/*` 不走语言前缀 |
| 翻译字典膨胀 | 单文件过大，加载慢 | 按模块拆分为多个 JSON，按需动态 import |
| SSR（如果有需要） | 服务端渲染需感知语言 | v1.0 为纯 CSR，后续版本可扩展 SSR 支持 |

---

## 九、待确认事项

| # | 问题 | 负责人 | 状态 |
|---|---|---|---|
| Q1 | 后端是否支持按 Accept-Language 返回翻译内容 | 后端团队 | ⬜ 待确认 |
| Q2 | 产品/分类数据库是否已有双语字段 | 后端团队 | ⬜ 待确认 |
| Q3 | 邮件模板是否需要双语 | 产品 | ⬜ 待确认 |
| Q4 | SEO meta 是否有专门的 CMS 字段 | 产品 | ⬜ 待确认 |

---

## 十、变更日志

| 版本 | 日期 | 作者 | 变更摘要 |
|---|---|---|---|
| 1.0 | 2026-05-27 | AI Agent | 初始版本：总体架构、路由方案、翻译字典结构、分阶段实施计划、页面改造清单 |

---

## 附录 A：翻译 Key 命名规范

- 使用 `.` 分隔层级：`模块.组件.具体文案`
- 全部小写，用下划线分隔单词
- 示例：`checkout.shipping_address`、`product.add_to_cart`

## 附录 B：语言切换器交互规格

| 状态 | 行为 |
|---|---|
| 默认 | 显示当前语言名称（中文/English） |
| Hover | 展开下拉，高亮当前语言 |
| 点击目标语言 | 替换 URL 中 `/:lang` 段，保存到 localStorage，刷新页面 |
| 移动端 | 与汉堡菜单同级，使用相同动画 |

## 附录 C：测试检查清单

- [ ] 访问 `/` 自动跳转到检测到的语言
- [ ] `/zh/products` 显示中文，`/en/products` 显示英文
- [ ] 切换语言后 URL 正确变化
- [ ] 切换语言后页面内容全部刷新
- [ ] localStorage 保存语言偏好
- [ ] 直接输入英文 URL 不会重定向到中文
- [ ] 管理后台 `/admin/*` 不受语言前缀影响
- [ ] 所有页面的表单验证错误信息正确翻译
- [ ] 订单确认邮件语言与用户下单时界面一致
