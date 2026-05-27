import mysql from 'mysql2/promise'
import { v4 as uuidv4 } from '../src/utils/uuid'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: resolve(__dirname, '../.env') })

const IMG = (prompt: string, size = 'square_hd') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`

interface DetailImageSeed {
  title: string
  description: string
  image: string
}

interface ProductSeed {
  slug: string
  detailImages: DetailImageSeed[]
}

const productsSeed: ProductSeed[] = [
  {
    slug: 'classic-tote-bag',
    detailImages: [
      {
        image: IMG('leather tote bag interior detail showing multiple compartments and pockets, elegant organization system, warm brown leather lining, craftsmanship photography'),
        title: '精妙内部分隔',
        description: '内部设有多个插袋和拉链隔层，让您的随身物品井然有序。加厚的内衬确保笔记本电脑等贵重物品得到充分保护。',
      },
      {
        image: IMG('close up of premium italian leather texture on tote bag handle, natural grain, warm lighting, macro photography, luxury craftsmanship detail'),
        title: '顶级植鞣皮革',
        description: '选用意大利托斯卡纳地区顶级植鞣牛皮，每一张皮革都拥有独一无二的天然纹理。随着使用时间的增长，皮革会逐渐形成迷人的复古光泽。',
      },
      {
        image: IMG('woman wearing cream leather tote bag walking in European city street, lifestyle fashion photography, natural sunlight, elegant casual style, high quality street photography'),
        title: '都市优雅伴侣',
        description: '无论是通勤、约会还是周末出游，都能完美融入您的日常造型。可拆卸肩带设计，随心切换手提与肩背两种佩戴方式。',
      },
    ],
  },
  {
    slug: 'luxe-crossbody',
    detailImages: [
      {
        image: IMG('leather crossbody bag worn by woman in paris street, elegant lifestyle photography, golden hour lighting, city background, high-end fashion, natural pose'),
        title: '随行城市风景',
        description: '轻盈的斜挎包专为都市漫步而设计。可调节的肩带让您自由切换斜挎与单肩两种方式，完美配合不同造型。',
      },
      {
        image: IMG('interior of small leather crossbody bag, multiple card slots and zipper compartment, organized layout, premium craftsmanship detail'),
        title: '精巧空间管理',
        description: '虽然外型小巧，内部却巧妙安排了多个卡位和拉链暗格。手机、钥匙、卡包各归其位，翻找物品再也不用手忙脚乱。',
      },
      {
        image: IMG('close up of gold hardware clasp on leather crossbody bag, elegant metal detail, warm lighting, macro luxury product photography'),
        title: '精致五金配件',
        description: '我们选用了经得起时间考验的镀金五金件。每一个锁扣和拉链都经过数千次开合测试，确保长久使用依然顺滑如初。',
      },
    ],
  },
  {
    slug: 'travel-weekender',
    detailImages: [
      {
        image: IMG('leather travel duffle bag packed for weekend trip, lifestyle travel photography, natural outdoor setting, warm sunlight, adventure travel style'),
        title: '周末出发',
        description: '宽敞的主仓和多个贴心隔层，让短途旅行变得轻松惬意。可容纳2-3天的出行衣物，满足周末度假的所有需求。',
      },
      {
        image: IMG('canvas and leather hybrid material detail on travel bag, rugged texture, premium craftsmanship close up, outdoor lifestyle photography'),
        title: '帆布拼接工艺',
        description: '底部采用高密度帆布材质，耐磨抗撕裂；主体选用头层牛皮，兼具质感与耐用性。两种材质的拼接处由匠人手工缝制加固。',
      },
    ],
  },
  {
    slug: 'mini-bucket-bag',
    detailImages: [
      {
        image: IMG('mini bucket bag worn casually, playful lifestyle photography, daytime outdoor setting, natural lighting, modern fashion style'),
        title: '俏皮日常',
        description: '小巧玲珑的迷你水桶包以抽绳收口设计增添趣味感。虽然体型迷你，但内部空间足以容纳手机、钥匙和口红等日常必需品。',
      },
      {
        image: IMG('close up of drawstring closure and leather texture on bucket bag, premium material detail, warm lighting, macro craft photography'),
        title: '抽绳工艺',
        description: '精心设计的抽绳收口系统，顺滑耐用。每一根皮绳都经过手工打磨，保证开合顺畅且不易松脱。',
      },
    ],
  },
  {
    slug: 'executive-briefcase',
    detailImages: [
      {
        image: IMG('executive briefcase held by professional in business setting, corporate lifestyle photography, modern office background, premium quality image'),
        title: '商务风范',
        description: '专为现代商务人士打造的公文包，以简约利落的线条传递专业自信。内部设有加厚笔记本电脑隔层，为您的设备提供全方位保护。',
      },
      {
        image: IMG('organized interior of leather briefcase showing laptop sleeve, card slots and pen holders, functional business design, premium craftsmanship'),
        title: '高效办公收纳',
        description: '精心设计的内部功能分区：笔记本电脑隔层、平板插袋、名片位和笔插一应俱全。让您的工作装备井然有序，从容应对每个商务场合。',
      },
      {
        image: IMG('close up of premium leather texture and precision stitching on luxury briefcase, high-end craftsmanship, macro detail photography, warm natural light'),
        title: '顶级牛皮工艺',
        description: '选用意大利顶级牛皮，皮质细腻坚韧。每一处缝线都经过严格把控，确保公文包在长期使用中依然保持良好的挺括度。',
      },
    ],
  },
]

async function seedDetailImages() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL || 'mysql://root@localhost:3306/axis_o',
    multipleStatements: true,
  })

  try {
    console.log('📦 Connected to database\n')

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`product_detail_images\` (
        \`id\` varchar(36) NOT NULL,
        \`product_id\` varchar(36) NOT NULL,
        \`image\` varchar(500) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_detail_images_product\` (\`product_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log('✅ Table product_detail_images ready\n')

    for (const seed of productsSeed) {
      const [rows]: any = await connection.query(
        'SELECT id, name_zh FROM products WHERE slug = ? AND is_active = 1 LIMIT 1',
        [seed.slug]
      )

      if (rows.length === 0) {
        console.log(`⚠️  Product not found for slug: ${seed.slug}, skipping...`)
        continue
      }

      const productId = rows[0].id
      const productName = rows[0].name_zh

      await connection.query('DELETE FROM product_detail_images WHERE product_id = ?', [productId])

      for (let i = 0; i < seed.detailImages.length; i++) {
        const d = seed.detailImages[i]
        await connection.query(
          'INSERT INTO product_detail_images (id, product_id, image, title, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), productId, d.image, d.title, d.description, i, new Date()]
        )
      }

      console.log(`✅ ${productName} — ${seed.detailImages.length} 张详情图已插入`)
    }

    console.log(`\n🎉 Seed complete!`)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

seedDetailImages()
