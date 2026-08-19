// scripts/check_stylist.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const search = 'paznokci'; // partial name
  const { data, error } = await supabase
    .from('stylists')
    .select('id, name')
    .ilike('name', `%${search}%`);
  console.log('Stylists matching', search, ':', data, 'error', error);
}

main().catch(e=>console.error(e));
