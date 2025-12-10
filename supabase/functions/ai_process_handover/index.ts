import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "../_shared/supabase-client.ts";
import { callGemini } from "../_shared/gemini-client.ts";
import { handleError, AppError } from "../_shared/error-handler.ts";

interface AiProcessHandoverInput {
  handover_id: string;
}

// ----------------------------------------------
// メインハンドラー
// ----------------------------------------------
async function mainHandler(req: Request): Promise<Response> {
  try {
    const input: AiProcessHandoverInput = await req.json();
    const { handover_id } = input;

    if (!handover_id) {
      throw new AppError("INVALID_INPUT", "handover_id is required", 400);
    }

    const supabase = createClient(Deno.env.get("SERVICE_ROLE_KEY")!);

    // 1. Fetch Handover
    const { data: handover, error: fetchError } = await supabase
      .from("handovers")
      .select("id, hls_url, store_id, author_id")
      .eq("id", handover_id)
      .single();

    if (fetchError || !handover) {
      throw new AppError("HANDOVER_NOT_FOUND", "Handover not found", 404);
    }
    if (!handover.hls_url) {
      throw new AppError("NO_VIDEO_URL", "Handover has no HLS URL", 400);
    }

    // 2. Fetch User Language
    const { data: user } = await supabase
      .from("users")
      .select("language")
      .eq("id", handover.author_id)
      .single();
    const language = user?.language || "ja";

    // 3. Update status to ai_running
    await supabase
      .from("handovers")
      .update({ ai_status: "ai_running" })
      .eq("id", handover_id);

    // 4. Call Gemini
    const aiResult = await callGemini(handover.hls_url, language);

    // 5. Insert Draft Manual
    const { data: manual, error: insertError } = await supabase
      .from("manuals")
      .insert({
        handover_id: handover.id,
        store_id: handover.store_id,
        status: "draft",
        source_type: "ai",
        ai_summary: aiResult.summary,
        ai_steps: aiResult.steps,
        ai_tips: aiResult.tips,
        category: aiResult.category,
      })
      .select()
      .single();

    if (insertError) {
      console.error("DB Insert Error", insertError);
      throw new AppError("DB_INSERT_ERROR", "Failed to save manual", 500);
    }

    // 6. Update status to draft_created
    await supabase
      .from("handovers")
      .update({ ai_status: "draft_created" })
      .eq("id", handover_id);

    return new Response(
      JSON.stringify({ success: true, manual_id: manual.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error);
  }
}

// ----------------------------------------------
// ルート判定 → test-env → mainHandler
// ----------------------------------------------
serve(async (req: Request) => {
  const url = new URL(req.url);

  // Temporary env check endpoint (no auth) to verify secrets are loaded correctly.
  if (url.pathname.endsWith("/test-env")) {
    const appEnv = Deno.env.get("APP_ENV") ?? "development";
    if (appEnv !== "development") {
      return new Response("Not found", { status: 404 });
    }
    return new Response(
      JSON.stringify(
        {
          gemini: Deno.env.get("GEMINI_API_KEY") ?? "missing",
          mux: Deno.env.get("MUX_TOKEN_ID") ?? "missing",
          env: Deno.env.get("APP_ENV") ?? "missing",
        },
        null,
        2
      ),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return mainHandler(req);
});
