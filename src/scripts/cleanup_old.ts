import { supabaseAdmin } from '../config/supabase.js';

async function cleanupOld() {
  await supabaseAdmin.from('profiles').delete().eq('email', 'system.controller@railpravah.gov.in');
  await supabaseAdmin.from('profiles').delete().eq('email', 'wrk-test-1234@railpravah.gov.in');
  console.log('Cleaned up obsolete test accounts.');
}

cleanupOld();
