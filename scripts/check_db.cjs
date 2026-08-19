const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying Supabase database...');
  console.log('supabaseUrl:', supabaseUrl);
  
  // 1. Get booksy_session
  const { data: session, error: err1 } = await supabase
    .from('booksy_session')
    .select('*')
    .eq('id', 'default');
  
  if (err1) {
    console.error('Error fetching booksy_session:', err1);
  } else {
    console.log('\n--- BOOKSY_SESSION ---');
    console.log(JSON.stringify(session, null, 2));
  }

  // 2. Get last 10 booksy_sync_log
  const { data: logs, error: err2 } = await supabase
    .from('booksy_sync_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (err2) {
    console.error('Error fetching booksy_sync_log:', err2);
  } else {
    console.log('\n--- LAST 10 BOOKSY_SYNC_LOGS ---');
    console.log(JSON.stringify(logs, null, 2));
  }
}

main().catch(console.error);
