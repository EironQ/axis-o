import { db } from '../config/database'
import { banners } from './schema'
import { v4 as uuidv4 } from '../utils/uuid'

const bannerData = [
  {
    id: uuidv4(),
    image: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20leather%20handbag%20collection%20elegant%20fashion%20banner%20golden%20hour%20lighting%20premium%20quality%20minimalist%20design&image_size=landscape_16_9',
    title: '2024 春季新品系列',
    subtitle: '匠心打造，优雅永恒',
    link: '/products?category=new-arrivals',
    linkText: '探索新品',
    tags: '新品,春季,精选',
    sortOrder: 1,
    isActive: 1,
  },
  {
    id: uuidv4(),
    image: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20leather%20accessories%20sale%20promotion%20red%20ribbon%20elegant%20display%20premium%20quality%20fashion&image_size=landscape_16_9',
    title: '限时特惠',
    subtitle: '精选商品低至7折起',
    link: '/products?sale=true',
    linkText: '立即抢购',
    tags: '促销,折扣,限时',
    sortOrder: 2,
    isActive: 1,
  },
  {
    id: uuidv4(),
    image: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20travel%20bag%20leather%20luggage%20premium%20quality%20adventure%20journey%20elegant%20design&image_size=landscape_16_9',
    title: '旅行系列',
    subtitle: '伴您探索世界的每一个角落',
    link: '/products?category=travel',
    linkText: '查看系列',
    tags: '旅行,箱包,精选',
    sortOrder: 3,
    isActive: 1,
  },
  {
    id: uuidv4(),
    image: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20leather%20wallet%20collection%20premium%20quality%20elegant%20minimalist%20design%20close%20up%20shot&image_size=landscape_16_9',
    title: '精致配饰',
    subtitle: '细节之处，彰显品味',
    link: '/products?category=accessories',
    linkText: '浏览配饰',
    tags: '配饰,钱包,精致',
    sortOrder: 4,
    isActive: 1,
  },
  {
    id: uuidv4(),
    image: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20brand%20story%20craftsmanship%20workshop%20artisan%20hands%20leather%20craft%20premium%20quality&image_size=landscape_16_9',
    title: '匠心传承',
    subtitle: '每一件作品都是对品质的执着追求',
    link: '/about',
    linkText: '了解品牌',
    tags: '品牌故事,匠心,工艺',
    sortOrder: 5,
    isActive: 1,
  },
]

async function seedBanners() {
  console.log('=== 插入 Banner Mock 数据 ===\n')

  try {
    // 清空现有数据
    await db.delete(banners)
    console.log('已清空现有 banner 数据')

    // 插入新数据
    await db.insert(banners).values(bannerData)
    console.log(`成功插入 ${bannerData.length} 条 banner 数据`)

    // 验证
    const result = await db.select({ title: banners.title, sortOrder: banners.sortOrder }).from(banners).orderBy(banners.sortOrder)
    console.log('\n已插入的 Banner 列表:')
    result.forEach((banner, index) => {
      console.log(`${index + 1}. ${banner.title} (排序: ${banner.sortOrder})`)
    })

    console.log('\n=== Banner 数据插入完成 ===')
    
  } catch (error) {
    console.error('❌ 插入失败:', error)
    process.exit(1)
  }
}

seedBanners()