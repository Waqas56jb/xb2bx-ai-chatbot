import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('URL:', url);
console.log('Key prefix:', key?.slice(0, 12), '…\n');

const sb = createClient(url, key, { auth: { persistSession: false } });

const TABLES = ['suppliers', 'products', 'leads', 'conversations', 'messages', 'rfqs', 'listings', 'support_tickets', 'escalations', 'settings', 'knowledge'];

let ok = 0, missing = 0;
for (const t of TABLES) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    console.log(`✗ ${t.padEnd(16)} ${error.message}`);
    missing++;
  } else {
    console.log(`✓ ${t.padEnd(16)} rows: ${count}`);
    ok++;
  }
}
console.log(`\n${ok}/${TABLES.length} tables OK, ${missing} missing.`);
