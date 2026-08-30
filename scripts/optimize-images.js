const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public/imgs';
const outputDir = './public/imgs';

// Screenshots selected for compression.
const imagesToOptimize = [
  'alex_portfolio.png',
  'burnjournals.png',
  'epicclicker.png',
  'ico_website_ss.png',
  'jack_portfolio.png',
  'jackabeyta_pacman.png',
  'jpacontractors.png',
  'junepoint.png',
  'pong.png',
  'Burn-1-portrait.png',
  'Burn-2-portrait.png',
  'Burn-3-portrait.png',
  'Burn-4-portrait.png',
  'iCO-1.png',
  'iCO-2.png',
  'iCO-3.png',
  'iCO-4.png',
  'iCO-5.png',
  'iCO-6.png'
];

async function optimizeImages() {
  for (const filename of imagesToOptimize) {
    const inputPath = path.join(inputDir, filename);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${filename} - file not found`);
      continue;
    }

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Limit wide images to 1200 pixels.
      const maxWidth = 1200;
      const resizeOptions = metadata.width > maxWidth ? { width: maxWidth } : {};

      // Write a compressed temporary PNG.
      await sharp(inputPath)
        .resize(resizeOptions)
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(inputPath.replace('.png', '_optimized.png'));

      // Replace the source only after compression succeeds.
      fs.unlinkSync(inputPath);
      fs.renameSync(inputPath.replace('.png', '_optimized.png'), inputPath);

      const newSize = fs.statSync(inputPath).size;
      console.log(`✓ ${filename}: ${(newSize / 1024).toFixed(0)}KB`);
    } catch (err) {
      console.error(`Error processing ${filename}:`, err.message);
    }
  }

  console.log('\nDone! Images optimized.');
}

optimizeImages();
