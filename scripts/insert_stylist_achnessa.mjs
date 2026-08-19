// scripts/insert_stylist_achnessa.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('stylists').insert({
    name: 'Achnessa',
    role: 'Manicure stylist',
    image_url: 'https://example.com/placeholder.jpg',
    specialties: [],
  }).select();
  if (error) {
    console.error('❌ Failed to insert stylist Achnessa', error);
  } else {
    console.log('✅ Inserted stylist Achnessa', data);
  }
}

main().catch(e => console.error('❌ Unexpected error', e));
