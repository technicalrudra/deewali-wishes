import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, options) => fetch(input, { ...options, signal: AbortSignal.timeout(15000) }) },
});
try {
  const { data, error } = await db.from('diwali_stats').select('total_diyas_lit').eq('id', 1).single();
  console.log(error
    ? `Counter table check failed (${error.code || 'network error'}).`
    : `Counter table is available. Current total: ${data.total_diyas_lit}.`);
  // NULL cannot be recorded: the migration rejects it and rolls back without an increment.
  const { error: rpcError } = await db.rpc('record_diya_light', { lighting_event: null });
  const rpcInstalled = rpcError?.code === '23502' || rpcError?.code === '22004';
  console.log(rpcInstalled ? 'Atomic increment RPC is installed; invalid event safely rejected.'
    : `RPC check failed (${rpcError?.code || 'unexpected response'}).`);
  if (error?.code === 'PGRST205' || rpcError?.code === 'PGRST202') {
    console.log('Apply supabase/migrations/001_diya_counter.sql in the Supabase SQL Editor, then run this check again.');
  }
  if (error || !rpcInstalled) process.exitCode = 1;
} catch {
  console.error('Could not reach Supabase. Check the connection and project configuration.');
  process.exitCode = 1;
}
