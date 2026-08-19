// insert_missing_stylists.js
// Node script to insert the missing stylists into Supabase
// Run with: node scripts/insert_missing_stylists.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anon key not set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function insertStylists() {
  const stylists = [
    {
      name: 'Dominika',
      role: 'Młodsza stylistka',
      image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      specialties: ['Beauty Treatments'],
      description: 'Specjalistka w zabiegach kosmetycznych.'
    },
    {
      name: 'Anastazja',
      role: 'Stylistka',
      image_url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/resource_photos/78e9d56932034ea3b2cf1838e2bc39ae.jpeg',
      specialties: ['Beauty Treatments'],
      description: 'Specjalistka w zabiegach kosmetycznych.'
    }
  ];

  for (const s of stylists) {
    const { data, error } = await supabase.from('stylists').insert(s);
    if (error) {
      console.error('Error inserting', s.name, ':', error.message);
    } else {
      console.log('Inserted', s.name, ':', data);
    }
  }

  // Insert mapping to Booksy IDs
  const mappings = [
    { booksy_name: 'Dominika', booksy_resource_id: 819977 },
    { booksy_name: 'Anastazja', booksy_resource_id: 821704 }
  ];
  for (const m of mappings) {
    // Retrieve the newly inserted stylist ID
    const { data: stylistData, error: fetchErr } = await supabase
      .from('stylists')
      .select('id')
      .eq('name', m.booksy_name)
      .single();
    if (fetchErr) {
      console.error('Could not fetch stylist ID for', m.booksy_name, fetchErr.message);
      continue;
    }
    const { error: mapErr } = await supabase.from('booksy_stylist_mapping').insert({
      booksy_name: m.booksy_name,
      stylist_id: stylistData.id,
      booksy_resource_id: m.booksy_resource_id
    });
    if (mapErr) {
      console.error('Error inserting mapping for', m.booksy_name, ':', mapErr.message);
    } else {
      console.log('Inserted mapping for', m.booksy_name);
    }
  }
}

insertStylists();
