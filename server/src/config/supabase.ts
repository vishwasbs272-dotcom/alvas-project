import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server or root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('[SUPABASE] Connected successfully to Supabase instance:', supabaseUrl);
  } catch (err) {
    console.warn('[SUPABASE] Failed to initialize Supabase client, falling back to local JSON store:', err);
    supabaseClient = null;
  }
} else {
  console.log('[SUPABASE] No valid Supabase credentials configured. Using deterministic Local JSON Store.');
}

export const getSupabase = (): SupabaseClient | null => supabaseClient;
