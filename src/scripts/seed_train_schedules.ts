import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { INITIAL_TRAIN_SCHEDULES } from '../db/train-seed-data.js';

async function seedTrainSchedules() {
  console.log('🚄 Seeding Train Schedules database table in Supabase...');

  // 1. Seed In-Memory Store
  if (!inMemoryStore.trainSchedules) {
    inMemoryStore.trainSchedules = new Map();
  }
  for (const train of INITIAL_TRAIN_SCHEDULES) {
    inMemoryStore.trainSchedules.set(train.id, train);
  }
  console.log(`✅ In-memory store populated with ${inMemoryStore.trainSchedules.size} train schedules.`);

  // 2. Seed Supabase Database Table
  if (isSupabaseConfigured()) {
    try {
      // Check existing count
      const { data: existing, error: countErr } = await supabaseAdmin
        .from('train_schedules')
        .select('id');

      if (countErr) {
        console.error('❌ Supabase error reading train_schedules:', countErr.message);
      } else {
        if (existing && existing.length > 0) {
          console.log(`🧹 Clearing ${existing.length} existing rows from Supabase train_schedules...`);
          await supabaseAdmin.from('train_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const rowsToInsert = INITIAL_TRAIN_SCHEDULES.map((train) => ({
          train_no: train.train_no,
          train_name: train.train_name,
          service_type: train.service_type,
          direction: train.direction,
          corridor_section: train.corridor_section,
          station: train.station,
          line_type: train.line_type,
          scheduled_slot: train.scheduled_slot,
          origin: train.origin,
          destination: train.destination,
          frequency_minutes: train.frequency_minutes || 5,
          priority_tier: train.priority_tier || 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('train_schedules')
          .insert(rowsToInsert)
          .select();

        if (insertErr) {
          console.error('❌ Failed to insert train schedules into Supabase:', insertErr.message);
        } else {
          console.log(`🎉 Successfully inserted ${inserted?.length || rowsToInsert.length} train schedules into Supabase 'train_schedules' table!`);
        }
      }
    } catch (dbErr) {
      console.warn('Supabase seeding error:', dbErr);
    }
  }

  console.log('✅ Train Schedules seeding script completed successfully.');
}

seedTrainSchedules()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
