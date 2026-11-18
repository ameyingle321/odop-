// backend/scripts/inspect_db.js
import { supabaseAdmin } from '../src/config/supabase.js';

async function check() {
  const { data: districts } = await supabaseAdmin.from('districts').select('id, name, state');
  console.log('Districts count:', districts?.length);
  console.log('Districts sample:', districts?.slice(0, 5));

  const { data: categories } = await supabaseAdmin.from('categories').select('id, name, slug');
  console.log('Categories count:', categories?.length);
  console.log('Categories:', categories);

  const { data: products } = await supabaseAdmin.from('products').select('id, name');
  console.log('Existing products count:', products?.length);
}

check();
