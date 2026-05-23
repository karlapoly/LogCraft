import * as fs from 'fs';
import * as path from 'path';

// Dinâmico import para sharp
const sharp = await import('sharp');

const imagePaths = [
  './public/assets/images/Mundos/Ar1.png',
  './public/assets/images/fases/Ar1.png',
  './dist/assets/images/Mundos/Ar1.png',
  './dist/assets/images/fases/Ar1.png',
];

async function resizeImages() {
  for (const imagePath of imagePaths) {
    if (fs.existsSync(imagePath)) {
      try {
        const image = sharp.default(imagePath);
        const metadata = await image.metadata();
        
        if (metadata.width && metadata.height) {
          const newWidth = metadata.width - 10;
          const newHeight = metadata.height - 10;
          
          console.log(`Redimensionando ${imagePath}`);
          console.log(`  De: ${metadata.width}x${metadata.height}`);
          console.log(`  Para: ${newWidth}x${newHeight}`);
          
          await sharp.default(imagePath)
            .resize(newWidth, newHeight, { fit: 'fill' })
            .toFile(imagePath);
            
          console.log(`  ✓ Concluído\n`);
        }
      } catch (error) {
        console.error(`Erro ao redimensionar ${imagePath}:`, error);
      }
    }
  }
}

resizeImages();
