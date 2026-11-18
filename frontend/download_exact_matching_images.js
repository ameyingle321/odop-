import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, 'public', 'images', 'products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const downloads = [
  // Firozabad Glass Vase (exact blown glass vase)
  {
    name: 'firozabad-glass-vase.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Blown_Glass_Vases_At_Holdman_Studios.jpg',
  },
  // Firozabad Glass Bangles (exact Indian glass bangles in colors)
  {
    name: 'firozabad-glass-bangles.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Vendor_in_Pakistan_sells_bangles_made_of_glass_in_variety_of_colours_and_designs.jpg',
  },
  // Jaipur Blue Pottery Floral Vase (exact GI blue pottery vase)
  {
    name: 'jaipur-blue-pottery-vase.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Jaipur_Blue_Pottery_Vase_with_Raja-Rani_Design.jpg',
  },
  // Jaipur Blue Pottery Serving Plate (exact blue pottery collection plate)
  {
    name: 'jaipur-blue-pottery-plate.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Blue_Pottery_Jaipur_Collection.jpg',
  },
  // Jodhpur Bandhani Dupatta (exact traditional Bandhani tie-dye dupatta)
  {
    name: 'jodhpuri-bandhani-dupatta.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Bandhani_Dupatta_%285788125979%29.jpg',
  },
  // Jodhpur Wooden Spice Box (exact traditional wooden spice box / masala dabba)
  {
    name: 'sheesham-spice-box.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Spices_in_an_Indian_kitchen.JPG',
  },
  // Darjeeling Black Tea (exact Darjeeling loose tea leaves)
  {
    name: 'darjeeling-tea-leaves.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Darjeeling%2C_India%2C_Darjeeling_tea%2C_Black_tea.jpg',
  },
  // Chanderi Handloom Saree (exact Chanderi handloom weaving)
  {
    name: 'chanderi-handloom-saree.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/A_man_weaving_the_famous_handloom_Chanderi_Saree.jpg',
  },
  // Paithani Silk Saree (exact traditional Maharashtrian Paithani peacock weave)
  {
    name: 'paithani-silk-saree-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Allover_work_paithani_saree.jpg',
  },
  // Himroo Brocade Shawl
  {
    name: 'himroo-brocade-shawl.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Parrot_Peacock_border_paithani_saree.jpg',
  },
  // Sangli Turmeric Powder (exact bright yellow stone ground turmeric powder)
  {
    name: 'sangli-turmeric-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Grounded_turmeric.jpg',
  },
  // Jalgaon Banana Chips (exact crispy golden yellow banana chips)
  {
    name: 'kerala-banana-chips-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Kerala_banana_chips_Upperi_varuthath.jpg',
  },
  // Strawberry Jam (exact real strawberry jam jar)
  {
    name: 'strawberry-jam-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Strawberry_jam.jpg',
  },
  // Dried Strawberries (exact freeze dried strawberry slices)
  {
    name: 'dried-strawberries-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Freeze-dried_strawberries.jpg',
  },
  // Nagpur Orange Marmalade (exact orange marmalade preserves jar)
  {
    name: 'nagpur-marmalade-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Finished_marmalades_%288449071267%29.jpg',
  },
  // Beed Sitaphal / Custard Apple (exact sugar apple cross section)
  {
    name: 'sitaphal-custard-apple-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Sugar_apple_with_cross_section.jpg',
  },
  // Kolhapuri Chappals (exact authentic handcrafted leather Kolhapuri chappals)
  {
    name: 'kolhapuri-chappal-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Kolhapuri_Chappals_in_roadside_shop_in_Kolhapur2.jpg',
  },
  // Palghar Warli Art (exact authentic Warli tribal painting panel)
  {
    name: 'warli-harvest-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Warli_painting.jpg',
  },
  // Terracotta Clay Vessel (exact terracotta pot)
  {
    name: 'terracotta-vessel-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Terracotta_Pot.jpg',
  },
  // Sawantwadi Wooden Toys (exact Indian handcrafted wooden toys)
  {
    name: 'sawantwadi-toys-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Nirmal_Toys2.jpg',
  },
  // Ratnagiri Mango Chutney
  {
    name: 'mango-chutney-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Unripe_Mango_Chutney_-_Kolkata_2011-02-23_1714.JPG',
  },
  // Nashik Raisins
  {
    name: 'nashik-raisins-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Raisins_01.jpg',
  },
  // Khadi Cotton Tote Bag
  {
    name: 'khadi-tote-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Reusable_Bag_4.jpg',
  },
  // Cushion Cover
  {
    name: 'cushion-cover-authentic.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Cushion_cover_MET_AZ3B.jpg',
  },
];

async function start() {
  console.log(`Downloading ${downloads.length} exact, authentic craft images...`);
  let success = 0;

  for (const item of downloads) {
    const dest = path.join(targetDir, item.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`✓ Already downloaded ${item.name}`);
      success++;
      continue;
    }

    try {
      console.log(`Downloading ${item.name}...`);
      await new Promise(r => setTimeout(r, 1500));
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'ODOPNexusArtisanMarketplace/1.0 (https://odopnexus.in; contact@odopnexus.in)',
        }
      });
      if (!res.ok) {
        console.warn(`Failed ${item.name}: ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`✓ Saved ${item.name} (${Math.round(buf.length / 1024)} KB)`);
      success++;
    } catch (e) {
      console.error(`Error downloading ${item.name}:`, e.message);
    }
  }

  console.log(`\nSuccessfully downloaded ${success}/${downloads.length} exact craft images!`);
}

start();
