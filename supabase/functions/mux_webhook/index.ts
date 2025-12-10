
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '../_shared/supabase-client.ts';
import { handleError, AppError } from '../_shared/error-handler.ts';

async function verifyMuxSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const secret = Deno.env.get('MUX_WEBHOOK_SECRET');
  if (!secret || !signatureHeader) return false;

  // Mux signature format: t=timestamp,v1=signature
  const parts = signatureHeader.split(',').map((p) => p.trim());
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const sigPart = parts.find((p) => p.startsWith('v1='));
  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.replace('t=', '');
  const signature = sigPart.replace('v1=', '');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(`${timestamp}.${rawBody}`);
  const mac = await crypto.subtle.sign('HMAC', key, data);
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // constant-time compare
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

interface MuxWebhookPayload {
  type: 'video.asset.ready' | 'video.asset.created';
  object: {
    type: 'asset';
    id: string;  // Mux Asset ID
  };
  data: {
    playback_ids: Array<{
      id: string;
      policy: 'public' | 'signed';
    }>;
    status: 'ready' | 'preparing' | 'errored';
  };
  created_at: string;
}

serve(async (req) => {
  try {
    // 1. Webhook Signature Verification
    const rawBody = await req.text();
    const signature = req.headers.get('mux-signature');
    const valid = await verifyMuxSignature(rawBody, signature);
    if (!valid) {
      throw new AppError('INVALID_SIGNATURE', 'Invalid webhook signature', 401);
    }

    const payload: MuxWebhookPayload = JSON.parse(rawBody);
    console.log(`Received webhook: ${payload.type} for asset ${payload.object.id}`);

    if (payload.type !== 'video.asset.ready') {
        return new Response(JSON.stringify({ message: 'Ignored event type' }), { status: 200 });
    }

    // 2. Find target handover
    const supabase = createClient(Deno.env.get('SERVICE_ROLE_KEY')!);
    const { data: handover, error } = await supabase
      .from('handovers')
      .select('id, store_id')
      .eq('mux_asset_id', payload.object.id)
      .single();

    if (error || !handover) {
      console.warn(`Handover not found for asset ${payload.object.id}`);
      // Return 200 to avoid Mux retrying indefinitely if it's a legitimate "not ours" event?
      // Or throw 404. Spec says throw.
      throw new AppError('HANDOVER_NOT_FOUND', 'Handover not found', 404);
    }

    // 3. Generate URLs
    const playbackId = payload.data.playback_ids?.[0]?.id;
    if (!playbackId) throw new AppError('NO_PLAYBACK_ID', 'No playback ID found', 400);

    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

    // 4. Update handovers
    const { error: updateError } = await supabase
      .from('handovers')
      .update({
        hls_url: hlsUrl,
        thumbnail_url: thumbnailUrl,
        ai_status: 'ready_for_ai',
        // updated_at: new Date().toISOString(), // DB triggers usually handle this
      })
      .eq('id', handover.id);

    if (updateError) throw new AppError('DB_UPDATE_ERROR', updateError.message, 500);

    // 5. Invoke ai_process_handover
    const { error: invokeError } = await supabase.functions.invoke('ai_process_handover', {
      body: { handover_id: handover.id },
    });

    if (invokeError) console.error('Failed to trigger AI process:', invokeError);

    return new Response(
      JSON.stringify({ success: true, handover_id: handover.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});
