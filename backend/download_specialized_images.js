import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.resolve(__dirname, '../frontend/public/images/products');

const IMAGES = [
  {
    filename: 'candied-orange-slices.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Candied_orange_slices.jpg'
  },
  {
    filename: 'aam-papad-fruit-leather.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Aam_Papad.JPG'
  },
  {
    filename: 'indian-coaster-set.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Parchinkari_white_marble_coaster_set_from_Agra_India.jpg'
  },
  {
    filename: 'green-tea-leaves-canister.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Jakseol_green_tea_leaves_2.jpg'
  },
  {
    filename: 'wooden-chess-set.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Wooden_Chess_Board.jpg'
  },
  {
    filename: 'wooden-spinning-top.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Old_wooden_spinning_top%2C_Italy.jpg'
  }
];

async function downloadImages() {
  console.log('Downloading authentic craft photographs...');
  for (const item of IMAGES) {
    const filePath = path.join(TARGET_DIR, item.filename);
    try {
      console.log(`Downloading ${item.filename} from ${item.url}...`);
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'ODOPNexusArtisanMarketplace/1.0 (contact@odopnexus.in; education/showcase)'
        }
      });
      if (!res.ok) {
        console.error(`Failed ${item.filename}: HTTP ${res.status}`);
        continue;
      }
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`✓ Saved ${item.filename} (${buffer.byteLength} bytes)`);
      // Gentle pause to respect rate limits
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.error(`Error downloading ${item.filename}:`, err.message);
    }
  }
  console.log('Done downloading specialized images!');
}

downloadImages();
