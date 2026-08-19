// scripts/list_services.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('services').select('id, name').order('name');
  if (error) {
    console.error('Error fetching services', error);
    return;
  }
  console.log('Services:', data);
}

main().catch(e => console.error(e));
