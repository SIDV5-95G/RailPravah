import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let adminClient: SupabaseClient<any> | null = null;

export const getSupabaseAdmin = (): SupabaseClient<any> => {
  if (!adminClient) {
    adminClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
};

export const createUserClient = (accessToken: string): SupabaseClient<any> => {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );
};

export const createAuthClient = (): SupabaseClient<any> => {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

export const supabaseAdmin = getSupabaseAdmin();
