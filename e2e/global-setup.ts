// e2e/global-setup.ts
import { supabaseAdmin } from './helpers/seedData';

export default async function globalSetup() {
  // Seed minimal data required for tests
  await supabaseAdmin.seedServices();
  await supabaseAdmin.seedStylists();
}
