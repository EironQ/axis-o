const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  // 首页新图片
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20leather%20handbag%20product%20photography%2C%20elegant%20minimalist%20background%2C%20soft%20lighting%2C%20premium%20quality%2C%20fashion%20accessory&image_size=landscape_16_9', filename: 'hero-banner.jpg', dir: 'home' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20fashion%20boutique%20interior%2C%20elegant%20display%20of%20premium%20bags%2C%20warm%20lighting%2C%20high-end%20retail%20store&image_size=landscape_4_3', filename: 'featured-section.jpg', dir: 'home' },
  
  // 工艺与材质新图片
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=artisan%20craftsman%20hand%20stitching%20leather%2C%20traditional%20craftsmanship%2C%20workshop%20setting%2C%20tools%20and%20materials&image_size=landscape_4_3', filename: 'craftsmanship-detail.jpg', dir: 'craftsmanship' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=premium%20leather%20material%20texture%20closeup%2C%20natural%20grain%2C%20high%20quality%20hides%2C%20luxury%20materials&image_size=landscape_4_3', filename: 'material-texture.jpg', dir: 'craftsmanship' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=handmade%20leather%20bag%20production%20process%2C%20artisan%20workshop%2C%20traditional%20techniques%2C%20craftsmanship&image_size=landscape_4_3', filename: 'production-process.jpg', dir: 'craftsmanship' },
  
  // 可持续发展新图片
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=sustainable%20fashion%20green%20workspace%2C%20eco%20friendly%20materials%2C%20recycled%20fabric%2C%20plants%2C%20natural%20light&image_size=landscape_4_3', filename: 'eco-workspace.jpg', dir: 'sustainability' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=recycled%20materials%20fashion%20products%2C%20sustainable%20luxury%2C%20green%20packaging%2C%20eco%20friendly%20design&image_size=landscape_4_3', filename: 'recycled-products.jpg', dir: 'sustainability' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=carbon%20neutral%20fashion%20production%2C%20solar%20panels%2C%20green%20factory%2C%20sustainable%20manufacturing&image_size=landscape_4_3', filename: 'green-production.jpg', dir: 'sustainability' },
  
  // 关于我们新图片
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20brand%20team%20portrait%2C%20creative%20designers%2C%20modern%20office%2C%20professional%20atmosphere&image_size=landscape_4_3', filename: 'team-photo.jpg', dir: 'about' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=brand%20story%20heritage%2C%20vintage%20craftsmanship%2C%20timeless%20elegance%2C%20luxury%20fashion%20history&image_size=landscape_4_3', filename: 'brand-heritage.jpg', dir: 'about' },
  
  // 产品系列新图片
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20classic%20tote%20bag%2C%20timeless%20design%2C%20premium%20leather%2C%20elegant%20product%20shot&image_size=landscape_4_3', filename: 'classic-collection.jpg', dir: 'collections' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=luxury%20luxe%20handbag%2C%20gold%20accents%2C%20premium%20materials%2C%20high-end%20fashion&image_size=landscape_4_3', filename: 'luxe-collection.jpg', dir: 'collections' },
  { url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=travel%20bag%20collection%2C%20functional%20luxury%2C%20leather%20luggage%2C%20travel%20accessories&image_size=landscape_4_3', filename: 'travel-collection-new.jpg', dir: 'collections' },
];

function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP error! status: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('开始下载新图片...\n');
  
  for (const image of images) {
    const dirPath = path.join(__dirname, '../public/images', image.dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const outputPath = path.join(dirPath, image.filename);
    
    try {
      await downloadImage(image.url, outputPath);
      const stats = fs.statSync(outputPath);
      console.log(`✅ ${image.dir}/${image.filename} - ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (error) {
      console.log(`❌ ${image.dir}/${image.filename} - 下载失败: ${error.message}`);
    }
  }
  
  console.log('\n下载完成！');
}

main().catch(console.error);