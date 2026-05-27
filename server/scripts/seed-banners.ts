import mysql from 'mysql2/promise'
import { v4 as uuidv4 } from '../src/utils/uuid'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: resolve(__dirname, '../.env') })

const IMG = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`

const bannerSeed = [
  {
    image: IMG('luxury fashion handbag collection on cream sage green natural background, eco friendly lifestyle, soft natural lighting, minimalist elegant aesthetic, sustainable fashion'),
    title: 'Fashion That Feels Good & Does Good.',
    subtitle: 'Eco-friendly, ultra-durable, and thoughtfully designed for your on-the-go life.',
    link: '/products',
    linkText: 'Shop the Collection',
    tags: ['♻️ Green Materials', '🧵 Reinforced Stitches', '⚡️ 200g Lightweight'],
    sortOrder: 0,
  },
  {
    image: IMG('elegant woman wearing cream leather handbag walking through modern city streets at golden hour, warm sophisticated tones, luxury fashion editorial style, high-end minimalist aesthetic, natural sophisticated look'),
    title: '简约，而不简单',
    subtitle: '探索 AXIS O 2026 春夏系列',
    link: '/products',
    linkText: '选购新品',
    tags: [],
    sortOrder: 1,
  },
  {
    image: IMG('artisan craftsman hands working on premium leather handbag in workshop, warm natural lighting, authentic craftsmanship, earthy warm tones, luxury brand aesthetic'),
    title: '匠心之作',
    subtitle: '每一针每一线，都是对品质的承诺',
    link: '/about',
    linkText: '了解工艺',
    tags: ['🧵 Hand Stitched', '✨ Premium Leather'],
    sortOrder: 2,
  },
  {
    image: IMG('luxury leather handbags collection displayed on elegant wooden display shelf, soft warm natural lighting, cream beige and caramel color palette, minimalist boutique interior, premium lifestyle product photography'),
    title: '经典新生',
    subtitle: '历久弥新的设计，重新定义日常优雅',
    link: '/products?series=classic',
    linkText: '探索经典',
    tags: [],
    sortOrder: 3,
  },
]

async function main() {
  const url = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/axis_o'
  const conn = await mysql.createConnection(url)

  await conn.execute('DELETE FROM banners')

  for (const banner of bannerSeed) {
    await conn.execute(
      'INSERT INTO banners (id, image, title, subtitle, link, link_text, tags, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
      [
        uuidv4(),
        banner.image,
        banner.title,
        banner.subtitle,
        banner.link,
        banner.linkText,
        banner.tags.length > 0 ? JSON.stringify(banner.tags) : null,
        banner.sortOrder,
      ]
    )
    console.log(`  ✓ ${banner.title}`)
  }

  console.log(`\n✅ 已插入 ${bannerSeed.length} 个 Banner`)
  await conn.end()
}

main().catch(console.error)
