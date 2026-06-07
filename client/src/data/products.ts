import { Product, CollectionCard } from '@/types'
import { IMG } from './mockData'

export const collections: CollectionCard[] = [
  {
    id: 'classic',
    title: '经典系列',
    subtitle: '简约百搭，日常优雅',
    image: '/images/collections/classic.jpg',
    link: '/products?series=classic',
    series: 'classic',
  },
  {
    id: 'luxe',
    title: '轻奢系列',
    subtitle: '精致宴会，高级质感',
    image: '/images/collections/luxe.jpg',
    link: '/products?series=luxe',
    series: 'luxe',
  },
  {
    id: 'travel',
    title: '旅行系列',
    subtitle: '周末出行，实用大容量',
    image: '/images/collections/travel.jpg',
    link: '/products?series=travel',
    series: 'travel',
  },
]

export const products: Product[] = [
  {
    id: 'classic-tote-01',
    name: 'Amelia 经典托特包',
    series: 'classic',
    description: '灵感源自永恒优雅，Amelia托特包以极简线条勾勒出从容姿态。宽敞的内部空间轻松容纳日常所需。',
    price: 1880,
    colors: [
      { name: '奶油白', hex: '#FAF3E0', imageIndex: 0 },
      { name: '焦糖棕', hex: '#C89460', imageIndex: 1 },
      { name: '经典黑', hex: '#2C2C2C', imageIndex: 2 },
    ],
    sizes: ['中号', '大号'],
    material: '意大利头层牛皮',
    images: [
      IMG('minimalist cream leather tote bag, elegant design, premium Italian leather, against warm beige wall, studio lighting, luxury fashion product shot, clean aesthetic'),
      IMG('caramel brown leather tote bag, rich warm tone, sophisticated minimalist design, soft lighting, premium fashion photography'),
      IMG('black minimalist leather tote bag, sleek elegant design, dark sophisticated aesthetic, studio product photography, luxury brand'),
    ],
    story: '每一只Amelia托特包都经过意大利工匠的精心打磨。从选料到缝制，我们坚持使用最优质的植鞣皮革，随着时间的推移，它会逐渐展现属于您的独特韵味。',
    isBestSeller: true,
    category: '托特包',
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
        description: '无论是通勤、约会还是周末出游，Amelia 都能完美融入您的日常造型。可拆卸肩带设计，随心切换手提与肩背两种佩戴方式。',
      },
    ],
  },
  {
    id: 'classic-crossbody-01',
    name: 'Clara 斜挎包',
    series: 'classic',
    description: '轻盈随行的Clara斜挎包，是为都市节奏而生。小巧精致却不失容量，轻松搭配各种风格。',
    price: 1480,
    colors: [
      { name: '奶油白', hex: '#FAF3E0', imageIndex: 0 },
      { name: '橄榄绿', hex: '#6B705C', imageIndex: 1 },
      { name: '陶土色', hex: '#C17E60', imageIndex: 2 },
    ],
    sizes: ['标准'],
    material: '意大利头层牛皮',
    images: [
      IMG('elegant small cream leather crossbody bag, minimalist design, gold chain strap, studio lighting, premium fashion product, clean background'),
      IMG('olive green leather crossbody bag, sophisticated muted tone, elegant minimalist design, premium fashion photography, natural aesthetic'),
      IMG('terracotta orange leather crossbody bag, warm earthy color, elegant design, soft studio lighting, luxury accessory photography'),
    ],
    story: 'Clara斜挎包的设计灵感来自巴黎街头漫步的女性——她们自信、从容，需要一个既美观又实用的伴侣。可调节肩带让您随心切换佩戴方式。',
    isBestSeller: true,
    category: '斜挎包',
    detailImages: [
      {
        image: IMG('leather crossbody bag worn by woman in paris street, elegant lifestyle photography, golden hour lighting, city background, high-end fashion, natural pose'),
        title: '随行城市风景',
        description: '轻盈的Clara斜挎包专为都市漫步而设计。可调节的肩带让您自由切换斜挎与单肩两种方式，完美配合不同造型。',
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
    id: 'classic-shoulder-01',
    name: 'Sophia 肩背包',
    series: 'classic',
    description: 'Sophia肩背包以柔和的弧度与精致的细节，诠释了不费力的优雅。',
    price: 2180,
    colors: [
      { name: '焦糖棕', hex: '#C89460', imageIndex: 0 },
      { name: '深棕', hex: '#3C2415', imageIndex: 1 },
      { name: '奶白', hex: '#FAF7F2', imageIndex: 2 },
    ],
    sizes: ['小号', '中号'],
    material: '意大利小羊皮',
    images: [
      IMG('elegant caramel brown leather shoulder bag, soft feminine curves, premium Italian leather, warm natural lighting, luxury fashion product'),
      IMG('dark brown elegant leather shoulder bag, rich deep tone, sophisticated design, studio photography, premium craftsmanship details'),
      IMG('cream white soft leather shoulder bag, elegant feminine design, bright clean studio shot, luxury accessory photography'),
    ],
    story: 'Sophia，意为"智慧"。我们希望这只包能陪伴您度过每一个充满智慧的时刻——无论是一场重要的会议，还是一次轻松的午后约会。',
    isBestSeller: false,
    category: '肩背包',
    detailImages: [
      {
        image: IMG('soft leather shoulder bag worn casually by woman, relaxed lifestyle photography, warm afternoon sunlight, outdoor cafe setting, elegant natural style'),
        title: '不费力的优雅',
        description: 'Sophia 肩背包以柔和的弧度贴合身体曲线，自然的垂坠感让每一次佩戴都显得从容而优雅。',
      },
      {
        image: IMG('close up of soft lamb leather texture, fine grain, delicate touch, warm natural lighting, macro luxury product photography, premium material detail'),
        title: '柔软小羊皮',
        description: '精选意大利小羊皮，经过特殊的鞣制工艺处理，使其拥有如丝绸般柔滑的触感。轻盈柔软，却保持了出色的结构感。',
      },
      {
        image: IMG('leather shoulder bag interior with multiple compartments, organized storage space, premium fabric lining, craftsmanship detail photography'),
        title: '人性化收纳',
        description: '内部分区经过精心设计，独立的拉链隔层便于存放贵重物品，开放式插袋则方便随手取用手机和交通卡。',
      },
    ],
  },
  {
    id: 'classic-backpack-01',
    name: 'Luna 双肩包',
    series: 'classic',
    description: 'Luna双肩包将实用与美感完美融合，简洁流畅的轮廓让通勤也成为一种享受。',
    price: 2580,
    colors: [
      { name: '经典黑', hex: '#2C2C2C', imageIndex: 0 },
      { name: '焦糖棕', hex: '#C89460', imageIndex: 1 },
    ],
    sizes: ['标准'],
    material: '意大利头层牛皮',
    images: [
      IMG('sleek black leather backpack, minimalist urban design, premium craftsmanship, clean studio lighting, modern luxury accessory'),
      IMG('caramel brown leather backpack, sophisticated warm tone, elegant urban design, soft natural light, premium product photography'),
    ],
    story: 'Luna的设计初衷是为现代都市女性创造一款能够从容应对全天需求的背包。从清晨通勤到晚间小聚，它始终是您最可靠的伙伴。',
    isBestSeller: true,
    category: '双肩包',
    detailImages: [
      {
        image: IMG('woman wearing sleek leather backpack walking in city street, lifestyle fashion photography, modern urban setting, natural lighting, casual elegant style'),
        title: '从容通勤',
        description: 'Luna 双肩包以贴合背部的曲线设计和加厚肩垫，即使装满全天所需，也能让您轻松自在地穿梭于城市之间。',
      },
      {
        image: IMG('leather backpack main compartment open showing laptop sleeve and organizer pockets, functional interior design, premium craftsmanship'),
        title: '智能收纳系统',
        description: '独立的笔记本电脑隔层可容纳15.6寸设备，前仓设有多个功能插袋，让充电宝、数据线、笔记本等物品各得其所。',
      },
      {
        image: IMG('detailed view of leather backpack zipper and stitching, premium craftsmanship, close up of precision sewing, high quality hardware, warm lighting'),
        title: '精湛缝制工艺',
        description: '每一处缝线都由经验丰富的匠人手工完成，针脚均匀紧密。拉链经过严格测试，确保开合顺畅且经久耐用。',
      },
    ],
  },
  {
    id: 'luxe-clutch-01',
    name: 'Aurora 晚宴手包',
    series: 'luxe',
    description: 'Aurora手包以极致的工艺与奢华材质，为您的每一个重要夜晚增添璀璨光芒。',
    price: 3880,
    colors: [
      { name: '香槟金', hex: '#D4A76A', imageIndex: 0 },
      { name: '午夜黑', hex: '#1A1A2E', imageIndex: 1 },
      { name: '玫瑰粉', hex: '#C9A9A6', imageIndex: 2 },
    ],
    sizes: ['标准'],
    material: '意大利小羊皮+缎面内衬',
    images: [
      IMG('luxury champagne gold evening clutch bag, elegant metal clasp, silk interior, dark moody lighting, high fashion editorial photography, premium detail'),
      IMG('black luxury evening clutch bag, sleek dark elegant design, gold accent details, dramatic lighting, high-end fashion photography'),
      IMG('rose pink elegant evening clutch, soft luxurious tones, premium craftsmanship, romantic moody lighting, fashion editorial style'),
    ],
    story: 'Aurora，以极光为名。我们希望每一位佩戴它的女性都能散发出如极光般独特而迷人的光彩。手工镶嵌的金属锁扣，每一个都经过单独打磨。',
    isBestSeller: false,
    category: '手包',
    detailImages: [
      {
        image: IMG('luxury evening clutch bag held by woman in elegant dress, formal event setting, warm ambient lighting, high-end lifestyle fashion photography, sophisticated atmosphere'),
        title: '璀璨夜晚',
        description: 'Aurora 晚宴手包以极致的工艺和奢华材质，为您的每一个重要夜晚增添璀璨光芒。小巧的体型恰好容纳手机、口红和粉饼。',
      },
      {
        image: IMG('close up of intricate gold metal clasp on luxury evening clutch, handcrafted details, sparkling gemstone accent, macro luxury photography, premium craftsmanship'),
        title: '手工镶嵌锁扣',
        description: '每一个金属锁扣都由资深匠人手工打磨和镶嵌，经过反复抛光处理，呈现出镜面般的光泽。精致的细节彰显非凡品位。',
      },
      {
        image: IMG('silk lined interior of luxury evening clutch bag, soft fabric texture, elegant design, premium material detail, warm moody lighting'),
        title: '奢华缎面内衬',
        description: '内部选用高级缎面内衬，手感顺滑细腻，悉心保护您的随身物品。精致的品牌标识烫金工艺，低调中彰显奢华。',
      },
    ],
  },
  {
    id: 'luxe-chain-01',
    name: 'Celeste 链条包',
    series: 'luxe',
    description: 'Celeste链条包以精致的金属链条与柔软皮革的对比，创造出令人过目不忘的视觉张力。',
    price: 3280,
    colors: [
      { name: '象牙白', hex: '#FFFFF0', imageIndex: 0 },
      { name: '酒红', hex: '#722F37', imageIndex: 1 },
    ],
    sizes: ['标准'],
    material: '意大利小羊皮+镀金链条',
    images: [
      IMG('ivory white luxury chain bag, gold chain strap, elegant quilted leather, premium fashion product, bright sophisticated photography'),
      IMG('burgundy red luxury chain bag, gold chain accent, deep rich wine color, elegant evening accessory, premium fashion photography'),
    ],
    story: 'Celeste——意为"天上的、神圣的"。我们希望这只包能成为您衣橱中那颗最亮的星。每一根链条都经过精心抛光，每一处缝线都凝聚着匠人的专注。',
    isBestSeller: true,
    category: '链条包',
    detailImages: [
      {
        image: IMG('luxury chain bag worn by woman in evening dress, gold chain detail, elegant lifestyle photography, warm ambient lighting, high fashion editorial'),
        title: '闪耀日常',
        description: '精致的镀金链条与柔软皮革形成迷人对比。无论是搭配简约通勤装还是优雅晚宴裙，Celeste 都能成为视觉焦点。',
      },
      {
        image: IMG('close up of gold chain strap connecting to leather bag, intricate metalwork detail, macro luxury photography, warm lighting, premium craftsmanship'),
        title: '匠心链条工艺',
        description: '每一根链条都经过手工抛光与防褪色处理，确保长期使用依然保持闪耀光泽。连接处的加固设计大幅提升了承重耐久性。',
      },
    ],
  },
  {
    id: 'luxe-top-handle-01',
    name: 'Margot 手提包',
    series: 'luxe',
    description: 'Margot手提包以建筑般的结构感与雕塑般的轮廓，展现了现代女性的力量与优雅。',
    price: 5880,
    colors: [
      { name: '深棕', hex: '#3C2415', imageIndex: 0 },
      { name: '奶油白', hex: '#FAF3E0', imageIndex: 1 },
      { name: '墨绿', hex: '#2D4A3E', imageIndex: 2 },
    ],
    sizes: ['小号', '中号'],
    material: '意大利顶级Box小牛皮',
    images: [
      IMG('luxury dark brown structured top handle bag, architectural design, premium box leather, elegant studio photography, high fashion aesthetic'),
      IMG('cream white luxury structured handbag, architectural silhouette, premium leather, bright sophisticated product photography'),
      IMG('deep green luxury structured top handle bag, rich emerald tone, architectural design, premium fashion photography, elegant aesthetic'),
    ],
    story: 'Margot的轮廓灵感来自现代建筑的简洁线条。我们选用了最顶级的Box小牛皮，经过特殊工艺处理，使其呈现出镜面般的光泽。每一只Margot都是一件可携带的艺术品。',
    isBestSeller: false,
    category: '手提包',
    detailImages: [
      {
        image: IMG('structured top handle bag held by woman in business attire, elegant professional setting, natural lighting, luxury lifestyle photography, sophisticated'),
        title: '力量与优雅',
        description: 'Margot 以建筑般的结构感诠释现代女性的力量。硬朗的轮廓线条与柔软的皮革质感相得益彰，从容应对各种正式场合。',
      },
      {
        image: IMG('close up of box calf leather surface, mirror-like shine, premium leather texture, macro luxury photography, natural light, sophisticated detail'),
        title: '镜面Box小牛皮',
        description: '精选意大利顶级Box小牛皮，经过特殊镜面工艺处理，呈现出如钢琴漆面般的光泽。皮质紧实而有弹性，长久使用依然保持挺括。',
      },
      {
        image: IMG('luxury handbag interior with silk lining and multiple compartments, organized luxury storage, premium craftsmanship detail photography'),
        title: '精心内里',
        description: '内部采用高级丝缎内衬，触感丝滑。多功能隔层设计方便分区收纳，独立的拉链暗格为贵重物品提供安全保护。',
      },
    ],
  },
  {
    id: 'travel-duffle-01',
    name: 'Naia 旅行袋',
    series: 'travel',
    description: 'Naia旅行袋以宽敞的空间与精致的结构，让每一次出行都成为一场有格调的旅程。',
    price: 2680,
    colors: [
      { name: '焦糖棕', hex: '#C89460', imageIndex: 0 },
      { name: '橄榄绿', hex: '#6B705C', imageIndex: 1 },
    ],
    sizes: ['标准'],
    material: '意大利头层牛皮+帆布拼接',
    images: [
      IMG('stylish caramel leather weekend travel duffle bag, premium craftsmanship, natural lighting, lifestyle photography, warm earthy tones'),
      IMG('olive green leather travel duffle bag, sophisticated muted green, premium materials, natural outdoor setting, lifestyle product photography'),
    ],
    story: 'Naia的设计灵感来自地中海沿岸的周末旅行。宽敞的内部空间搭配多个实用隔层，无论是换洗衣物还是旅途读物，都能井然有序。可拆卸肩带让携带方式更加灵活。',
    isBestSeller: false,
    category: '旅行袋',
    detailImages: [
      {
        image: IMG('leather travel duffle bag packed for weekend trip, lifestyle travel photography, natural outdoor setting, warm sunlight, adventure travel style'),
        title: '周末出发',
        description: 'Naia 旅行袋以宽敞的主仓和多个贴心隔层，让短途旅行变得轻松惬意。可容纳2-3天的出行衣物，满足周末度假的所有需求。',
      },
      {
        image: IMG('canvas and leather hybrid material detail on travel bag, rugged texture, premium craftsmanship close up, outdoor lifestyle photography'),
        title: '帆布拼接工艺',
        description: '底部采用高密度帆布材质，耐磨抗撕裂；主体选用头层牛皮，兼具质感与耐用性。两种材质的拼接处由匠人手工缝制加固。',
      },
    ],
  },
  {
    id: 'travel-tote-01',
    name: 'Vera 出行托特包',
    series: 'travel',
    description: 'Vera出行托特包以大容量与轻便设计，成为周末出行的理想之选。',
    price: 1680,
    colors: [
      { name: '奶油白', hex: '#FAF3E0', imageIndex: 0 },
      { name: '经典黑', hex: '#2C2C2C', imageIndex: 1 },
      { name: '焦糖棕', hex: '#C89460', imageIndex: 2 },
    ],
    sizes: ['标准', '加大'],
    material: '意大利头层牛皮',
    images: [
      IMG('cream white large leather tote travel bag, spacious elegant design, natural sunlight, premium craftsmanship, lifestyle outdoor photography'),
      IMG('black large leather travel tote bag, sleek practical design, clean modern aesthetic, studio product photography'),
      IMG('caramel brown large leather travel tote, warm rich tone, premium craftsmanship, lifestyle outdoor setting, elegant product photography'),
    ],
    story: 'Vera，拉丁语中意为"真实的"。我们相信真正的旅行不需要过多的负担。Vera以极致轻盈的皮革打造，内部设有笔记本电脑专属隔层和隐藏式水杯袋，让您轻装出行。',
    isBestSeller: true,
    category: '托特包',
    detailImages: [
      {
        image: IMG('large leather tote bag carried by woman in airport, travel lifestyle photography, modern travel setting, natural lighting, casual elegant style'),
        title: '轻装出行',
        description: 'Vera 出行托特包以极致轻盈的皮革打造，大容量设计轻松容纳笔记本电脑、换洗衣物和旅行读物，是周末出行的理想伴侣。',
      },
      {
        image: IMG('tote bag interior with laptop sleeve and water bottle pocket, functional travel organization, premium craftsmanship, clean product photography'),
        title: '智能功能分区',
        description: '内置加厚笔记本电脑隔层（适配15.6寸设备）和隐藏式水杯袋，侧边拉链袋可放置护照和机票。贴心设计让旅途更加从容。',
      },
    ],
  },
  {
    id: 'travel-cosmetic-01',
    name: 'Iris 化妆包',
    series: 'travel',
    description: 'Iris化妆包以精巧的分区设计，让您的化妆品井井有条，旅行途中也能从容梳妆。',
    price: 980,
    colors: [
      { name: '陶土色', hex: '#C17E60', imageIndex: 0 },
      { name: '橄榄绿', hex: '#6B705C', imageIndex: 1 },
      { name: '奶白', hex: '#FAF7F2', imageIndex: 2 },
    ],
    sizes: ['标准'],
    material: '意大利小羊皮+防水内衬',
    images: [
      IMG('terracotta orange leather cosmetic pouch, elegant compact design, premium materials, soft studio lighting, luxury accessory photography'),
      IMG('olive green leather makeup bag, sophisticated muted tone, premium craftsmanship, clean elegant product shot'),
      IMG('cream white leather cosmetic pouch, minimalist elegant design, premium soft leather, bright clean product photography'),
    ],
    story: 'Iris以彩虹女神命名，象征多彩与美丽。内部防水内衬让您无需担心液体泄漏，弹性绑带设计可以固定化妆刷，拉链开口方式让取物更加方便。',
    isBestSeller: false,
    category: '化妆包',
    detailImages: [
      {
        image: IMG('elegant leather cosmetic pouch opened showing organized makeup inside, travel organization, soft natural lighting, lifestyle product photography'),
        title: '井然有序',
        description: 'Iris 化妆包内部采用弹性绑带和多个分区设计，让化妆刷、管状护肤品和小物件各归其位。180度展开设计，所有物品一目了然。',
      },
      {
        image: IMG('waterproof lining detail inside leather cosmetic pouch, functional design close up, premium material texture, clean product photography'),
        title: '防水内衬',
        description: '内部采用专业防水涂层内衬，即使不慎泄漏液体也无需担心。易清洁表面只需用湿布轻轻擦拭即可恢复洁净。',
      },
    ],
  },
  {
    id: 'classic-wallet-01',
    name: 'Elena 长款钱包',
    series: 'classic',
    description: 'Elena长款钱包以纤薄精巧的设计，重新定义了日常钱包的概念。',
    price: 1280,
    colors: [
      { name: '焦糖棕', hex: '#C89460', imageIndex: 0 },
      { name: '经典黑', hex: '#2C2C2C', imageIndex: 1 },
      { name: '奶白', hex: '#FAF7F2', imageIndex: 2 },
    ],
    sizes: ['标准'],
    material: '意大利头层牛皮',
    images: [
      IMG('caramel brown slim leather long wallet, elegant minimalist design, premium Italian leather, soft warm lighting, luxury accessory product shot'),
      IMG('black slim elegant leather wallet, sleek sophisticated design, premium craftsmanship, studio product photography'),
      IMG('cream white slim leather wallet, elegant minimalist design, soft premium leather texture, bright clean product photography'),
    ],
    story: 'Elena的设计哲学是"少即是多"。我们去除了一切多余的结构，让钱包变得纤薄而功能齐全。多个卡槽、纸币夹层和拉链零钱袋，一应俱全。',
    isBestSeller: true,
    category: '钱包',
    detailImages: [
      {
        image: IMG('slim leather wallet opened showing multiple card slots and compartments, minimalist design, organized interior, premium craftsmanship close up photography'),
        title: '纤薄大容量',
        description: 'Elena 长款钱包以极致的纤薄设计容纳多达12张卡片、纸币和零钱。创新的嵌入式卡槽设计让卡片取放更加顺手。',
      },
      {
        image: IMG('close up of fine leather texture on slim wallet, natural grain detail, warm macro photography, premium Italian leather quality, luxury detail'),
        title: '意大利植鞣皮',
        description: '选用意大利优质植鞣牛皮，随着使用时间的推移，皮革会逐渐形成独一无二的蜜色包浆，记录您的生活印记。',
      },
    ],
  },
  {
    id: 'luxe-card-01',
    name: 'Stella 卡包',
    series: 'luxe',
    description: 'Stella卡包以极致的纤薄设计，满足现代女性的极简生活需求。',
    price: 980,
    colors: [
      { name: '酒红', hex: '#722F37', imageIndex: 0 },
      { name: '象牙白', hex: '#FFFFF0', imageIndex: 1 },
    ],
    sizes: ['标准'],
    material: '意大利小羊皮',
    images: [
      IMG('burgundy red slim leather card holder, elegant compact design, premium craftsmanship, soft luxurious lighting, fashion accessory photography'),
      IMG('ivory white slim leather card holder, minimalist elegant design, premium soft leather, bright clean product photography'),
    ],
    story: 'Stella，意为"星辰"。在数字支付的时代，我们希望您的实体卡片同样有一个精致的家。极简的设计，却承载着我们对手工艺的极致追求。',
    isBestSeller: false,
    category: '卡包',
    detailImages: [
      {
        image: IMG('slim leather card holder held in hand, minimalist design, everyday carry, natural lighting, lifestyle photography, premium accessory'),
        title: '极简随身',
        description: 'Stella 卡包以超纤薄的体型完美贴合口袋，可容纳4-6张常用卡片。即使在最紧凑的牛仔裤口袋里也几乎感觉不到它的存在。',
      },
      {
        image: IMG('close up of fine stitching on leather card holder, precision craftsmanship detail, macro photography, premium quality, warm natural lighting'),
        title: '精密缝线',
        description: '每一针每一线都由匠人精心缝制，采用高强度蜡线，针脚均匀紧实。边缘经过反复打磨和封边处理，确保经久耐用。',
      },
    ],
  },
]

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id)

export const getProductsBySeries = (series: string): Product[] =>
  products.filter((p) => p.series === series)

export const getBestSellers = (): Product[] =>
  products.filter((p) => p.isBestSeller)
