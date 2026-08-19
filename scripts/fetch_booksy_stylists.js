import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const businessId = process.env.BOOKSY_BUSINESS_ID;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: session, error } = await supabase
    .from('booksy_session')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error || !session) {
    console.error("Could not load Booksy session:", error);
    process.exit(1);
  }

  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'pl',
    'content-type': 'application/json;charset=UTF-8',
    'x-access-token': session.access_token,
    'x-api-key': session.api_key || '',
    'x-app-version': '3.0',
    'origin': 'https://booksy.com',
    'referer': 'https://booksy.com/',
  };
  if (session.fingerprint) {
    headers['x-fingerprint'] = session.fingerprint;
  }
  if (session.user_agent) {
    headers['user-agent'] = session.user_agent;
  }

  const weeks = ['2026-06-08', '2026-06-15', '2026-06-22'];
  const targets = [819977, 821704];
  const results = {};
  
  for (const rId of targets) {
    results[rId] = { name: '', schedule: {} };
  }

  for (const week of weeks) {
    const url = `https://pl.booksy.com/core/v2/business_api/me/businesses/${businessId}/shifts/?week_start_date=${week}`;
    console.log(`Fetching: ${url}`);
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const resources = json.schedule?.resources || [];
        const found = resources.filter(r => targets.includes(r.resource.id));
        for (const f of found) {
          const rId = f.resource.id;
          results[rId].name = f.resource.name;
          results[rId].position = f.resource.position;
          results[rId].description = f.resource.description;
          results[rId].photo_url = f.resource.photo_url;
          for (const s of f.schedule) {
            const dateObj = new Date(s.date);
            const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 1 is Monday...
            if (s.working_hours.length > 0) {
              const hoursStr = s.working_hours.map(h => `${h.hour_from}-${h.hour_till}`).join(', ');
              if (!results[rId].schedule[dayOfWeek]) {
                results[rId].schedule[dayOfWeek] = [];
              }
              results[rId].schedule[dayOfWeek].push({ date: s.date, hours: hoursStr });
            }
          }
        }
      } else {
        console.log(`Failed to fetch week ${week}:`, await res.text());
      }
    } catch (e) {
      console.error(`Fetch error for week ${week}:`, e);
    }
  }

  for (const rId of targets) {
    const r = results[rId];
    console.log("========================================");
    console.log(`RESOURCE: ${r.name} (ID: ${rId})`);
    console.log(`Position: ${r.position}`);
    console.log(`Description: ${r.description}`);
    console.log(`Photo URL: ${r.photo_url}`);
    console.log("Weekly Schedule Summary:");
    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    for (let day = 0; day < 7; day++) {
      const entries = r.schedule[day];
      if (entries && entries.length > 0) {
        console.log(`  - ${dayNames[day]} (day_of_week: ${day}):`);
        for (const entry of entries) {
          console.log(`    * ${entry.date}: ${entry.hours}`);
        }
      } else {
        console.log(`  - ${dayNames[day]} (day_of_week: ${day}): brak/wolne`);
      }
    }
  }
}

main();
