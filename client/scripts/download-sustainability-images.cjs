const fs = require('fs');
const path = require('path');
const https = require('https');

const imageUrls = [
  {
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sustainable%20fashion%20workshop%20with%20eco%20friendly%20materials%2C%20green%20plants%2C%20natural%20leather%2C%20recycled%20materials%2C%20earth%20tones%2C%20eco%20conscious%20workspace%2C%20luxury%20bag%20making&image_size=landscape_4_3',
    filename: 'eco-friendly-workshop.jpg'
  },
  {
    url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sustainable%20luxury%20bag%20made%20from%20recycled%20materials%2C%20green%20sustainable%20fashion%2C%20eco%20friendly%20products%2C%20natural%20lighting%2C%20minimalist%20aesthetic%2C%20premium%20materials&image_size=landscape_4_3',
    filename: 'recycled-materials.jpg'
  }
];

const outputDir = path.join(__dirname, '../public/images/sustainability');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

imageUrls.forEach(({ url, filename }) => {
  const outputPath = path.join(outputDir, filename);
  const file = fs.createWriteStream(outputPath);
  
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`✅ 已下载并保存: ${filename}`);
    });
  }).on('error', (err) => {
    fs.unlink(outputPath, () => {});
    console.error(`❌ 下载失败 ${filename}:`, err.message);
  });
});

console.log('正在下载可持续发展页面的图片...');