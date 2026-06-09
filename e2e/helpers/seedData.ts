// e2e/helpers/seedData.ts
import { supabase } from '../../src/lib/supabase';

/**
 * Helper to upsert minimal test data into Supabase.
 * Uses `upsert` so that running multiple times is idempotent.
 */
export const supabaseAdmin = {
  async seedStylists() {
    const { error } = await supabase.from('stylists').upsert([
      {
        id: 'test-stylist-1',
        name: 'Test Stylist',
        role: 'Stylist',
        image_url: '',
        specialties: ['Cut', 'Color'],
        description: 'Test stylist for e2e tests',
      },
    ]);
    if (error) console.error('Seed stylists error:', error);
  },
  async seedServices() {
    const { error } = await supabase.from('services').upsert([
      {
        id: 'test-service-1',
        name: 'Test Service',
        category: 'Test',
        price: 100,
        duration_minutes: 60,
        is_hidden: false,
      },
    ]);
    if (error) console.error('Seed services error:', error);
  },
};
