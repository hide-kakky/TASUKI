
import { createClient as createSupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const createClient = (supabaseKey: string) => {
  const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '';
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
};
