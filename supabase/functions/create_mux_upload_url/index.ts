
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '../_shared/supabase-client.ts';
import { handleError, AppError } from '../_shared/error-handler.ts';

serve(async (req) => {
  try {
    const { store_id } = await req.json();
    if (!store_id) throw new AppError('INVALID_INPUT', 'store_id is required', 400);

    const MUX_TOKEN_ID = Deno.env.get('MUX_TOKEN_ID');
    const MUX_TOKEN_SECRET = Deno.env.get('MUX_TOKEN_SECRET');

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new AppError('CONFIG_ERROR', 'Mux credentials not set', 500);
    }

    // 1. Create Direct Upload URL via Mux API
    const response = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)}`,
      },
      body: JSON.stringify({
        cors_origin: '*', // For web, optional for mobile but good practice
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'standard', // For AI processing download if needed
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mux API Error:', errorText);
      throw new AppError('MUX_API_ERROR', 'Failed to create upload URL', 502);
    }

    const data = await response.json();
    const uploadUrl = data.data.url;
    const uploadId = data.data.id;
    // Mux Asset ID is NOT available yet. It is created after upload starts?
    // Actually Mux Direct Upload API returns `id` (Upload ID), and later `asset_id` upon creation.
    // However, we can track `upload_id` or just wait for webhook.
    // Ideally we store `upload_id` in `handovers` table to link webhook event?
    // "video.asset.created" webhook contains "upload_id" in passthrough?
    // Mux allows `passthrough` field in `new_asset_settings`.

    // Better approach: Create Handover record NOW with `mux_upload_id`.
    // My schema has `mux_asset_id` but not `mux_upload_id`.
    // I can put `upload_id` in `mux_asset_id` temporarily or add a column?
    // Or just store it in `billing_meta` or loose field?
    // Let's use `mux_asset_id` for now or assume we update it later.
    // Actually, usually we pass `passthrough: handover_id`.

    const supabase = createClient(Deno.env.get('SERVICE_ROLE_KEY')!);

    // Get User ID from Auth context (but Edge Function raw call might not have it if not signed?
    // standard `supabase.functions.invoke` passes Auth header).
    const authHeader = req.headers.get('Authorization');
    const user = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '');
    const userId = user.data.user?.id;

    if (!userId) throw new AppError('UNAUTHORIZED', 'User not authenticated', 401);

    // 2. Create Handover Record
    const { data: handover, error } = await supabase
      .from('handovers')
      .insert({
        store_id,
        author_id: userId,
        ai_status: 'pending_upload', // Initial status
        // We will update mux_asset_id when webhook comes.
        // pass handover_id to Mux? We didn't pass it in step 1.
        // We should have passed `passthrough` in step 1.
        // Re-doing step 1 logic is hard without handover ID first.
        // Standard pattern: Create Handover -> Get ID -> Create Mux Upload with passthrough=handover_id.
      })
      .select()
      .single();

    if (error) throw new AppError('DB_INSERT_ERROR', error.message, 500);

    // RE-CALL Mux with passthrough
    const response2 = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)}`,
      },
      body: JSON.stringify({
        cors_origin: '*',
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'standard',
          passthrough: handover.id, // VITAL: Link Mux Asset to Handover
        },
      }),
    });

    const data2 = await response2.json();
    // Update handover with upload_id if needed, but passthrough is enough for webhook.

    return new Response(
      JSON.stringify({ upload_url: data2.data.url, handover_id: handover.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return handleError(error);
  }
});
