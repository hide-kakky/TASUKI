// Generate Mux-style mux-signature header for testing mux_webhook.
// Usage:
//   MUX_WEBHOOK_SECRET=... deno run --allow-env scripts/generate_mux_signature.ts
//
// You can override defaults with env vars:
//   MUX_ASSET_ID=test-asset-id
//   MUX_PLAYBACK_ID=test-playback-id
//   MUX_EVENT_TYPE=video.asset.ready
//   MUX_CREATED_AT=2025-12-10T00:00:00Z

const secret = Deno.env.get("MUX_WEBHOOK_SECRET");
if (!secret) {
  console.error("MUX_WEBHOOK_SECRET is required");
  Deno.exit(1);
}

const muxAssetId = Deno.env.get("MUX_ASSET_ID") ?? "test-asset-id";
const playbackId = Deno.env.get("MUX_PLAYBACK_ID") ?? "test-playback-id";
const eventType = Deno.env.get("MUX_EVENT_TYPE") ?? "video.asset.ready";
const createdAt = Deno.env.get("MUX_CREATED_AT") ?? "2025-12-10T00:00:00Z";

const bodyObj = {
  type: eventType,
  object: { type: "asset", id: muxAssetId },
  data: {
    playback_ids: [{ id: playbackId, policy: "public" }],
    status: "ready",
  },
  created_at: createdAt,
};

const body = JSON.stringify(bodyObj);
const t = Math.floor(Date.now() / 1000);
const msg = `${t}.${body}`;

const encoder = new TextEncoder();
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(msg));
const digest = Array.from(new Uint8Array(mac))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

console.log("mux-signature:", `t=${t},v1=${digest}`);
console.log("body:", body);
