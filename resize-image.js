import sharp from 'sharp';
import * as fs from 'fs';

const imagePaths = [
  './public/assets/images/Mundos/Ar1.png',
  './public/assets/images/fases/Ar1.png',
];

async function resizeImages() {
  for (const imagePath of imagePaths) {
    if (fs.existsSync(imagePath)) {
      try {
        const metadata = await sharp(imagePath).metadata();
        
        if (metadata.width && metadata.height) {
          const newWidth = metadata.width - 10;
          const newHeight = metadata.height - 10;
          
          console.log(`Redimensionando ${imagePath}`);
          console.log(`  De: ${metadata.width}x${metadata.height}`);
          console.log(`  Para: ${newWidth}x${newHeight}`);
          
          await sharp(imagePath)
            .resize(newWidth, newHeight, { fit: 'fill' })
            .toFile(imagePath);
            
          console.log(`  ✓ Concluído\n`);
        }
      } catch (error) {
        console.error(`Erro ao redimensionar ${imagePath}:`, error.message);
      }
    } else {
      console.log(`Arquivo não encontrado: ${imagePath}`);
    }
  }
  console.log('Processo finalizado!');
}

resizeImages();
