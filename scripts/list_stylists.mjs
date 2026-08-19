// scripts/list_stylists.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main(){
  const {data, error} = await supabase.from('stylists').select('id, name');
  console.log('All stylists:', data, 'error:', error);
}

main().catch(e=>console.error(e));
