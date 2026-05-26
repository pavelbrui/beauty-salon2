import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  // Clear existing data (optional, for dev)
  await supabase.from('stylists').delete();
  await supabase.from('services').delete();
  await supabase.from('stylist_service_assignments').delete();

  // Insert stylists (including Agnessa)
  const { data: stylistData, error: stylistError } = await supabase.from('stylists').insert([
    { name: 'Agnessa', role: 'Manicure Specialist', description: 'Expert in nail art', photo_url: '' },
    { name: 'Jakub', role: 'Hair Stylist', description: 'Modern cuts', photo_url: '' },
  ]).select('id, name');
  if (stylistError) throw stylistError;

  const agnessa = stylistData?.find(s => s.name === 'Agnessa');
  const jakub = stylistData?.find(s => s.name === 'Jakub');

  // Insert services
  const { data: serviceData, error: serviceError } = await supabase.from('services').insert([
    { name: 'Manicure', category: 'Paznokcie', price: 5000, duration: 45 },
    { name: 'Haircut', category: 'Włosy', price: 8000, duration: 60 },
  ]).select('id, name');
  if (serviceError) throw serviceError;

  const manicure = serviceData?.find(s => s.name === 'Manicure');
  const haircut = serviceData?.find(s => s.name === 'Haircut');

  // Assign services to stylists
  await supabase.from('stylist_service_assignments').insert([
    { stylist_id: agnessa?.id, service_id: manicure?.id },
    { stylist_id: jakub?.id, service_id: haircut?.id },
  ]);

  console.log('✅ Seed data inserted');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
