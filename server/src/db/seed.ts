import { db } from '../config/database'
import { categories, products, productImages, productVariants, users, addresses, orders, orderItems, cartItems } from './schema'
import { v4 as uuidv4 } from '../utils/uuid'
import { eq, sql } from 'drizzle-orm'
import { hashPassword } from '../utils/password'

async function seed() {
  console.log('🌱 Seeding database...\n')

  const categoryData = [
    { nameEn: 'Handbags', nameZh: '手袋', sortOrder: 1 },
    { nameEn: 'Wallets', nameZh: '钱包', sortOrder: 2 },
    { nameEn: 'Accessories', nameZh: '配饰', sortOrder: 3 },
    { nameEn: 'Belts', nameZh: '腰带', sortOrder: 4 },
    { nameEn: 'Travel Bags', nameZh: '旅行袋', sortOrder: 5 },
  ]

  const categoryIds: Record<string, string> = {}
  for (const cat of categoryData) {
    const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.nameEn, cat.nameEn)).limit(1)
    if (existing.length > 0) {
      categoryIds[cat.nameEn] = existing[0].id
      console.log(`⏭️ Category already exists: ${cat.nameEn} / ${cat.nameZh}`)
    } else {
      const id = uuidv4()
      categoryIds[cat.nameEn] = id
      await db.insert(categories).values({
        id,
        nameEn: cat.nameEn,
        nameZh: cat.nameZh,
        sortOrder: cat.sortOrder,
        isActive: 1,
      })
      console.log(`✅ Category created: ${cat.nameEn} / ${cat.nameZh}`)
    }
  }

  const subCategoryData = [
    { nameEn: 'Tote Bags', nameZh: '托特包', parentId: categoryIds['Handbags'], sortOrder: 1 },
    { nameEn: 'Crossbody Bags', nameZh: '斜挎包', parentId: categoryIds['Handbags'], sortOrder: 2 },
    { nameEn: 'Shoulder Bags', nameZh: '单肩包', parentId: categoryIds['Handbags'], sortOrder: 3 },
    { nameEn: 'Mini Bags', nameZh: '迷你包', parentId: categoryIds['Handbags'], sortOrder: 4 },
    { nameEn: 'Card Wallets', nameZh: '卡包', parentId: categoryIds['Wallets'], sortOrder: 1 },
    { nameEn: 'Coin Purses', nameZh: '零钱包', parentId: categoryIds['Wallets'], sortOrder: 2 },
    { nameEn: 'Travel Wallets', nameZh: '旅行钱包', parentId: categoryIds['Wallets'], sortOrder: 3 },
  ]

  for (const subCat of subCategoryData) {
    const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.nameEn, subCat.nameEn)).limit(1)
    if (existing.length === 0) {
      await db.insert(categories).values({
        id: uuidv4(),
        nameEn: subCat.nameEn,
        nameZh: subCat.nameZh,
        parentId: subCat.parentId,
        sortOrder: subCat.sortOrder,
        isActive: 1,
      })
      console.log(`✅ Subcategory created: ${subCat.nameEn} / ${subCat.nameZh} (parent: ${subCat.parentId?.slice(0, 8)}...)`)
    } else {
      console.log(`⏭️ Subcategory already exists: ${subCat.nameEn} / ${subCat.nameZh}`)
    }
  }

  const categoryId = categoryIds['Handbags']

  const existingProductCount = await db.select({ count: sql<number>`count(*)` }).from(products)
  const hasProducts = Number(existingProductCount[0].count) > 0

  if (hasProducts) {
    console.log('⏭️ Products already exist, skipping product seed')
  } else {

  const productData = [
    {
      nameEn: 'Classic Tote Bag',
      nameZh: '经典托特包',
      slug: 'classic-tote-bag',
      series: 'classic' as const,
      descriptionEn: 'A timeless classic tote bag crafted from premium Italian leather. Perfect for everyday use.',
      descriptionZh: '采用优质意大利皮革打造，经典设计永不过时，适合日常使用。',
      material: '意大利头层牛皮',
      storyEn: 'Inspired by the timeless elegance of Milan fashion houses.',
      storyZh: '灵感源自米兰时装屋的永恒优雅。',
      basePrice: '2800.00',
      stock: 100,
      isBestseller: 1,
      isActive: 1,
      sortOrder: 1,
      colors: [
        { name: '经典黑', hex: '#1a1a1a' },
        { name: '焦糖棕', hex: '#C89460' },
        { name: '象牙白', hex: '#F5F0E8' },
      ],
      sizes: ['小号', '中号', '大号'],
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
        'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600',
      ],
    },
    {
      nameEn: 'Luxe Crossbody',
      nameZh: '轻奢斜挎包',
      slug: 'luxe-crossbody',
      series: 'luxe' as const,
      descriptionEn: 'Elegant crossbody bag with gold-plated hardware. The perfect companion for evening occasions.',
      descriptionZh: '优雅斜挎包搭配镀金五金件，是晚宴场合的完美伴侣。',
      material: '小羊皮',
      storyEn: 'Designed for the modern woman who moves between boardrooms and cocktail parties.',
      storyZh: '专为在会议室与鸡尾酒会之间自如切换的现代女性设计。',
      basePrice: '3600.00',
      stock: 100,
      isBestseller: 1,
      isActive: 1,
      sortOrder: 2,
      colors: [
        { name: '午夜蓝', hex: '#191970' },
        { name: '酒红', hex: '#722F37' },
        { name: '香槟金', hex: '#F7E7CE' },
      ],
      sizes: ['均码'],
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
        'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600',
      ],
    },
    {
      nameEn: 'Travel Weekender',
      nameZh: '旅行周末包',
      slug: 'travel-weekender',
      series: 'travel' as const,
      descriptionEn: 'Spacious weekender bag crafted from durable canvas with leather trim. Your ideal travel companion.',
      descriptionZh: '宽敞的周末旅行包，采用耐用帆布搭配皮革饰边，是理想的旅行伴侣。',
      material: '帆布 + 牛皮饰边',
      storyEn: 'Built for the wanderlust soul, ready for spontaneous getaways.',
      storyZh: '为热爱旅行的灵魂而生，随时准备开启一场说走就走的旅行。',
      basePrice: '4200.00',
      stock: 100,
      isBestseller: 0,
      isActive: 1,
      sortOrder: 3,
      colors: [
        { name: '军绿', hex: '#4B5320' },
        { name: '深灰', hex: '#404040' },
      ],
      sizes: ['标准'],
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600',
      ],
    },
    {
      nameEn: 'Mini Bucket Bag',
      nameZh: '迷你水桶包',
      slug: 'mini-bucket-bag',
      series: 'classic' as const,
      descriptionEn: 'Charming mini bucket bag with drawstring closure. Compact yet surprisingly spacious.',
      descriptionZh: '迷人的迷你水桶包，抽绳收口设计，小巧却出奇能装。',
      material: '荔枝纹牛皮',
      storyEn: 'A playful twist on the classic bucket silhouette, crafted for the young at heart.',
      storyZh: '经典水桶包的俏皮演绎，为永远年轻的心而打造。',
      basePrice: '2200.00',
      stock: 100,
      isBestseller: 1,
      isActive: 1,
      sortOrder: 4,
      colors: [
        { name: '樱花粉', hex: '#FFB7C5' },
        { name: '雾霾蓝', hex: '#6A8CA6' },
        { name: '经典黑', hex: '#1a1a1a' },
      ],
      sizes: ['迷你', '小号'],
      images: [
        'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600',
        'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600',
      ],
    },
    {
      nameEn: 'Executive Briefcase',
      nameZh: '商务公文包',
      slug: 'executive-briefcase',
      series: 'luxe' as const,
      descriptionEn: 'Premium leather briefcase designed for the modern executive. Laptop compartment included.',
      descriptionZh: '高级皮革公文包，专为现代商务人士设计，内含笔记本电脑隔层。',
      material: '顶级牛皮',
      storyEn: 'Where craftsmanship meets ambition — power dressing for your daily commute.',
      storyZh: '匠心与野心的交汇 — 为每日通勤赋予力量感。',
      basePrice: '5800.00',
      stock: 100,
      isBestseller: 0,
      isActive: 1,
      sortOrder: 5,
      colors: [
        { name: '深棕', hex: '#3E2723' },
        { name: '经典黑', hex: '#1a1a1a' },
      ],
      sizes: ['14寸', '15.6寸'],
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600',
      ],
    },
  ]

  for (const p of productData) {
    const productId = uuidv4()
    const { colors, sizes, images, ...productFields } = p

    await db.insert(products).values({
      id: productId,
      ...productFields,
      categoryId,
    })

    if (images.length > 0) {
      await db.insert(productImages).values(
        images.map((url, index) => ({
          id: uuidv4(),
          productId,
          url,
          altText: `${p.nameEn} image ${index + 1}`,
          sortOrder: index,
          isPrimary: index === 0 ? 1 : 0,
        }))
      )
    }

    if (colors.length > 0 && sizes.length > 0) {
      const variantValues = []
      for (const color of colors) {
        for (const size of sizes) {
          variantValues.push({
            id: uuidv4(),
            productId,
            colorName: color.name,
            colorHex: color.hex,
            size: size,
            sku: `${p.slug}-${color.name.toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase()}`,
            priceAdjustment: '0.00',
            stockQuantity: Math.floor(Math.random() * 50) + 20,
            lowStockThreshold: 5,
            isActive: 1,
          })
        }
      }
      await db.insert(productVariants).values(variantValues)
    }

    console.log(`✅ Product created: ${p.nameEn} (${colors.length} colors × ${sizes.length} sizes)`)
  }

  console.log(`\n🎉 Seed complete! ${productData.length} products created.`)
  }

  let testUserId: string
  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, 'customer@example.com')).limit(1)

  if (existingUser.length > 0) {
    testUserId = existingUser[0].id
    console.log('⏭️ Test user already exists: customer@example.com')
  } else {
    testUserId = uuidv4()
    const passwordHash = await hashPassword('password123')

    await db.insert(users).values({
      id: testUserId,
      email: 'customer@example.com',
      passwordHash,
      firstName: '小明',
      lastName: '王',
      phone: '13800138000',
      role: 'customer',
      status: 'active',
      preferredLanguage: 'zh',
    })
    console.log('✅ Test user created: customer@example.com / password123')
  }

  const existingAddress = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, testUserId)).limit(1)
  let addressId: string

  if (existingAddress.length > 0) {
    addressId = existingAddress[0].id
    console.log('⏭️ Test address already exists')
  } else {
    addressId = uuidv4()
    await db.insert(addresses).values({
      id: addressId,
      userId: testUserId,
      type: 'shipping',
      firstName: '小明',
      lastName: '王',
      line1: '中山路100号',
      city: '上海',
      state: '上海市',
      postalCode: '200000',
      country: 'CN',
      phone: '13800138000',
      isDefault: 1,
    })
    console.log('✅ Test address created')
  }

  const existingOrdersCount = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, testUserId))

  if (Number(existingOrdersCount[0].count) > 0) {
    console.log('⏭️ Test orders already exist, skipping')
    console.log(`\n🎉 All seed data complete!`)
    process.exit(0)
    return
  }

  const variantResults = await db.select({
    id: productVariants.id,
    productId: productVariants.productId,
    productNameEn: products.nameEn,
    colorName: productVariants.colorName,
    colorHex: productVariants.colorHex,
    size: productVariants.size,
    basePrice: products.basePrice,
    priceAdjustment: productVariants.priceAdjustment,
    stockQuantity: productVariants.stockQuantity,
  })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(products.isActive, 1))
    .limit(10)

  if (variantResults.length === 0) {
    console.log('⚠️ No product variants found, skipping test orders')
    process.exit(0)
    return
  }

  const orderStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const
  const daysAgo = [0, 1, 2, 3, 5, 7]

  for (let i = 0; i < orderStatuses.length; i++) {
    const orderId = uuidv4()
    const status = orderStatuses[i]
    const variant = variantResults[i % variantResults.length]
    const price = Number(variant.basePrice) + Number(variant.priceAdjustment)
    const quantity = Math.floor(Math.random() * 3) + 1

    await db.insert(orders).values({
      id: orderId,
      orderNumber: `AXO${Date.now() + i}`,
      userId: testUserId,
      shippingAddressId: addressId,
      billingAddressId: addressId,
      status,
      currency: 'USD',
      subtotal: (price * quantity).toString(),
      shippingCost: '10.00',
      taxAmount: (price * quantity * 0.08).toFixed(2),
      discountAmount: '0.00',
      total: (price * quantity + 10 + price * quantity * 0.08).toFixed(2),
      createdAt: new Date(Date.now() - daysAgo[i] * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })

    await db.insert(orderItems).values({
      id: uuidv4(),
      orderId,
      productId: variant.productId,
      variantId: variant.id,
      productName: variant.productNameEn,
      variantDescription: `${variant.colorName} / ${variant.size}`,
      quantity,
      unitPrice: price.toString(),
      totalPrice: (price * quantity).toString(),
      createdAt: new Date(),
    })

    console.log(`✅ Test order created: ${orderId.slice(0, 8)}... | ${status} | ${variant.productNameEn}`)
  }

  console.log(`\n🎉 All seed data complete! ${orderStatuses.length} test orders created.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
