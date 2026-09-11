import { supabaseAdmin } from '../config/supabase.js';

async function fixRls() {
  console.log('Ensuring profiles RLS allows admin and users...');
  // Check if we can insert/upsert directly
  const testId = '4f741439-52c9-4106-8b5f-8a26e6bdfcb9';
  const { data, error } = await supabaseAdmin.from('profiles').select('id, name').eq('id', testId).single();
  console.log('Test profile query:', data, 'Error:', error);
}

fixRls();
