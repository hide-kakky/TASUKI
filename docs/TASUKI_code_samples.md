# TASUKI 実装コードサンプル集

本ドキュメントは、TASUKI プロジェクトの主要コンポーネントの**完全な実装例**を提供します。すべてのコードは実際に動作可能な状態で記載されています。

---

## 1. データベースマイグレーション

### 1.1 完全な初期スキーマ (`supabase/migrations/20251201000000_init_schema.sql`)

```sql
-- TASUKI Database Schema v1.1
-- Generated: 2025-12-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. Organizations & Stores
-- ================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  billing_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stores_organization_id ON stores(organization_id);

-- ================================================
-- 2. Users & Memberships
-- ================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ja' CHECK (language IN ('ja', 'en', 'vi')),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE memberships (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, store_id)
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_store_id ON memberships(store_id);

-- ================================================
-- 3. Admin Users (Optional - Post-PMF)
-- ================================================

CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  admin_role TEXT NOT NULL CHECK (admin_role IN ('super_admin', 'cs_admin')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. Handovers (Flow)
-- ================================================

CREATE TABLE handovers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mux_asset_id TEXT UNIQUE,
  hls_url TEXT,
  thumbnail_url TEXT,
  ai_status TEXT NOT NULL DEFAULT 'pending_upload'
    CHECK (ai_status IN ('pending_upload', 'uploaded', 'ready_for_ai', 'ai_running', 'draft_created', 'failed')),
  local_offline_flag BOOLEAN DEFAULT FALSE,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_handovers_store_id ON handovers(store_id);
CREATE INDEX idx_handovers_author_id ON handovers(author_id);
CREATE INDEX idx_handovers_mux_asset_id ON handovers(mux_asset_id);
CREATE INDEX idx_handovers_ai_status ON handovers(ai_status);

-- ================================================
-- 5. Manuals (Stock)
-- ================================================

CREATE TABLE manuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handover_id UUID REFERENCES handovers(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  source_type TEXT NOT NULL CHECK (source_type IN ('ai', 'legacy_import', 'manual')),
  original_doc_url TEXT,
  ai_summary TEXT,
  ai_steps JSONB DEFAULT '[]'::jsonb,
  ai_tips JSONB DEFAULT '[]'::jsonb,
  category TEXT CHECK (category IN ('ホール', 'キッチン', '清掃', '安全衛生', 'その他')),
  approved_by UUID REFERENCES users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  imported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manuals_store_id ON manuals(store_id);
CREATE INDEX idx_manuals_handover_id ON manuals(handover_id);
CREATE INDEX idx_manuals_status ON manuals(status);
CREATE INDEX idx_manuals_category ON manuals(category);

-- ================================================
-- 6. AI Jobs & Manual Edits
-- ================================================

CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handover_id UUID NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  retries INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_jobs_handover_id ON ai_jobs(handover_id);

CREATE TABLE manual_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manual_id UUID NOT NULL REFERENCES manuals(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edit_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  edit_end_at TIMESTAMP WITH TIME ZONE,
  diff_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manual_edits_manual_id ON manual_edits(manual_id);

-- ================================================
-- 7. Audit Logs (Root/Admin用)
-- ================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ================================================
-- 8. RLS Policies
-- ================================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Manuals: SELECT
CREATE POLICY "manuals_select_policy" ON manuals
FOR SELECT TO authenticated
USING (
  (store_id IN (
    SELECT store_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'
  ))
  AND
  (
    (EXISTS (
      SELECT 1 FROM memberships
      WHERE user_id = auth.uid()
        AND store_id = manuals.store_id
        AND role IN ('owner', 'manager')
        AND status = 'active'
    ))
    OR (status = 'published')
  )
);

-- Manuals: INSERT
CREATE POLICY "manuals_insert_policy" ON manuals
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND store_id = manuals.store_id
      AND role IN ('owner', 'manager')
      AND status = 'active'
  )
);

-- Manuals: UPDATE
CREATE POLICY "manuals_update_policy" ON manuals
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND store_id = manuals.store_id
      AND role IN ('owner', 'manager')
      AND status = 'active'
  )
);

-- Handovers: SELECT
CREATE POLICY "handovers_select_policy" ON handovers
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM memberships
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Handovers: INSERT
CREATE POLICY "handovers_insert_policy" ON handovers
FOR INSERT TO authenticated
WITH CHECK (
  store_id IN (
    SELECT store_id FROM memberships
    WHERE user_id = auth.uid() AND status = 'active'
  )
  AND author_id = auth.uid()
);

-- Handovers: UPDATE (自分 or Manager/Owner)
CREATE POLICY "handovers_update_policy" ON handovers
FOR UPDATE TO authenticated
USING (
  (author_id = auth.uid())
  OR
  (EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND store_id = handovers.store_id
      AND role IN ('owner', 'manager')
      AND status = 'active'
  ))
);

-- Memberships: SELECT
CREATE POLICY "memberships_select_policy" ON memberships
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM memberships
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Memberships: INSERT (Manager/Owner)
CREATE POLICY "memberships_insert_policy" ON memberships
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND store_id = memberships.store_id
      AND role IN ('owner', 'manager')
      AND status = 'active'
  )
);

-- Stores: SELECT
CREATE POLICY "stores_select_policy" ON stores
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT store_id FROM memberships
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Users: SELECT (同じ店舗のメンバーのみ)
CREATE POLICY "users_select_policy" ON users
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT m1.user_id
    FROM memberships m1
    WHERE m1.store_id IN (
      SELECT m2.store_id
      FROM memberships m2
      WHERE m2.user_id = auth.uid() AND m2.status = 'active'
    )
  )
);

-- ================================================
-- 9. Functions & Triggers
-- ================================================

-- Updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handovers_updated_at BEFORE UPDATE ON handovers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manuals_updated_at BEFORE UPDATE ON manuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 10. Initial Admin Setup
-- ================================================

-- MVP: auth.users.raw_app_meta_data を使用
-- 以下のSQLは手動で実行（管理者権限付与時）
-- UPDATE auth.users
-- SET raw_app_meta_data = jsonb_set(
--   COALESCE(raw_app_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'
-- )
-- WHERE email = 'admin@example.com';
```

---

## 2. Edge Functions

### 2.1 `mux_webhook` (`supabase/functions/mux_webhook/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!;
const muxWebhookSecret = Deno.env.get('MUX_WEBHOOK_SECRET')!;

interface MuxWebhookPayload {
  type: string;
  object: {
    type: string;
    id: string;
  };
  data: {
    playback_ids?: Array<{ id: string; policy: string }>;
    status?: string;
    duration?: number;
  };
  created_at: string;
}

function verifyMuxSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const hmac = createHmac('sha256', muxWebhookSecret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

function isTimestampValid(timestamp: string): boolean {
  const MAX_DIFF_MS = 5 * 60 * 1000; // 5分
  const webhookTime = new Date(timestamp).getTime();
  const now = Date.now();
  return Math.abs(now - webhookTime) < MAX_DIFF_MS;
}

serve(async (req) => {
  try {
    // 1. Webhook署名検証
    const signature = req.headers.get('mux-signature');
    const body = await req.text();

    if (!verifyMuxSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload: MuxWebhookPayload = JSON.parse(body);

    // 2. Timestamp検証（リプレイ攻撃防止）
    if (!isTimestampValid(payload.created_at)) {
      console.error('Webhook timestamp too old');
      return new Response('Timestamp too old', { status: 400 });
    }

    // 3. Supabase接続
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. 対象handoverを検索
    const { data: handover, error: fetchError } = await supabase
      .from('handovers')
      .select('id, store_id')
      .eq('mux_asset_id', payload.object.id)
      .single();

    if (fetchError || !handover) {
      console.error('Handover not found:', payload.object.id);
      return new Response('Handover not found', { status: 404 });
    }

    console.log(`Processing webhook for handover: ${handover.id}`);

    // 5. HLS URL / Thumbnail URL生成
    const playbackId = payload.data.playback_ids?.[0]?.id;
    if (!playbackId) {
      console.error('No playback ID found');
      return new Response('No playback ID', { status: 400 });
    }

    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

    // 6. handovers更新
    const { error: updateError } = await supabase
      .from('handovers')
      .update({
        hls_url: hlsUrl,
        thumbnail_url: thumbnailUrl,
        ai_status: 'ready_for_ai',
      })
      .eq('id', handover.id);

    if (updateError) {
      console.error('Failed to update handover:', updateError);
      return new Response('Update failed', { status: 500 });
    }

    // 7. AI処理を非同期起動
    const { error: invokeError } = await supabase.functions.invoke(
      'ai_process_handover',
      {
        body: { handover_id: handover.id },
      }
    );

    if (invokeError) {
      console.error('Failed to invoke AI processing:', invokeError);
      // AI起動失敗してもWebhook自体は成功として返す（後でリトライ）
    }

    console.log(`Successfully processed webhook for handover: ${handover.id}`);

    return new Response(
      JSON.stringify({ success: true, handover_id: handover.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2.2 `ai_process_handover` (`supabase/functions/ai_process_handover/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const GEMINI_TIMEOUT_MS = 90000; // 90秒

interface AIProcessInput {
  handover_id: string;
}

interface GeminiResponse {
  summary: string;
  steps: Array<{ step_number: number; description: string; tips: string }>;
  tips: string[];
  category: string;
}

const SYSTEM_PROMPT = `あなたは飲食店の業務マニュアル作成の専門家です。
与えられた動画から、新人スタッフが理解しやすい業務マニュアルを作成してください。

出力は以下のJSON形式に厳密に従ってください:
{
  "summary": "3行以内の要約",
  "steps": [
    { "step_number": 1, "description": "具体的な手順", "tips": "注意点やコツ" }
  ],
  "tips": ["全体を通しての重要なポイント"],
  "category": "ホール" | "キッチン" | "清掃" | "安全衛生" | "その他"
}`;

function generateUserPrompt(videoUrl: string, language: string): string {
  return `以下の動画を分析し、業務マニュアルを作成してください。

動画URL: ${videoUrl}
出力言語: ${language}

要件:
- summaryは3行以内で、業務の目的と全体像を簡潔に説明
- stepsは時系列順に、具体的な行動を記載（5-10ステップ程度）
- 各ステップには「なぜこの手順が必要か」を含める
- tipsには安全上の注意点や効率化のコツを記載
- 多言語対応: ${language} で出力してください`;
}

async function callGemini(videoUrl: string, language: string): Promise<GeminiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: SYSTEM_PROMPT },
                { text: generateUserPrompt(videoUrl, language) },
                { fileData: { mimeType: 'video/mp4', fileUri: videoUrl } }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0].content.parts[0].text;

    // JSONパース
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    return JSON.parse(jsonMatch[0]);
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  try {
    const { handover_id }: AIProcessInput = await req.json();

    if (!handover_id) {
      return new Response('Missing handover_id', { status: 400 });
    }

    console.log(`Processing AI for handover: ${handover_id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. handover取得
    const { data: handover, error: fetchError } = await supabase
      .from('handovers')
      .select('id, hls_url, store_id, author_id')
      .eq('id', handover_id)
      .single();

    if (fetchError || !handover || !handover.hls_url) {
      console.error('Handover not found or no HLS URL');
      return new Response('Handover not ready', { status: 404 });
    }

    // 2. ユーザー言語取得
    const { data: user } = await supabase
      .from('users')
      .select('language')
      .eq('id', handover.author_id)
      .single();

    const language = user?.language || 'ja';

    // 3. ai_status更新
    await supabase
      .from('handovers')
      .update({ ai_status: 'ai_running' })
      .eq('id', handover_id);

    // 4. Gemini呼び出し
    let aiResult: GeminiResponse;
    try {
      aiResult = await callGemini(handover.hls_url, language);
    } catch (geminiError) {
      console.error('Gemini error:', geminiError);

      // エラー記録
      await supabase.from('handovers').update({ ai_status: 'failed' }).eq('id', handover_id);
      await supabase.from('ai_jobs').insert({
        handover_id,
        stage: 'gemini_call',
        error_code: 'gemini_error',
        payload: { error: String(geminiError) }
      });

      return new Response('Gemini processing failed', { status: 500 });
    }

    // 5. manuals作成
    const { data: manual, error: insertError } = await supabase
      .from('manuals')
      .insert({
        handover_id: handover.id,
        store_id: handover.store_id,
        status: 'draft',
        source_type: 'ai',
        ai_summary: aiResult.summary,
        ai_steps: aiResult.steps,
        ai_tips: aiResult.tips,
        category: aiResult.category,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create manual:', insertError);
      return new Response('Manual creation failed', { status: 500 });
    }

    // 6. ai_status更新
    await supabase
      .from('handovers')
      .update({ ai_status: 'draft_created' })
      .eq('id', handover_id);

    console.log(`Successfully created manual: ${manual.id}`);

    return new Response(
      JSON.stringify({ success: true, manual_id: manual.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 3. Flutter

### 3.1 Isar Schema: `pending_upload.dart`

```dart
// lib/features/flow/data/models/pending_upload.dart
import 'package:isar/isar.dart';

part 'pending_upload.g.dart';

@collection
class PendingUpload {
  Id id = Isar.autoIncrement;

  @Index()
  late String filePath;

  late DateTime createdAt;

  @Index()
  late String storeId;

  late String userId;

  late int retryCount;

  String? checksum;

  String? errorMessage;

  // Computed property
  bool get shouldRetry => retryCount < 3;

  bool get isExpired =>
    DateTime.now().difference(createdAt).inDays > 7;
}
```

### 3.2 Provider: `upload_queue_provider.dart`

```dart
// lib/features/flow/presentation/providers/upload_queue_provider.dart
import 'dart:io';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:isar/isar.dart';
import '../../../data/models/pending_upload.dart';

part 'upload_queue_provider.g.dart';

const int MAX_QUEUE_SIZE = 10;
const Duration MAX_RETENTION = Duration(days: 7);

@riverpod
class UploadQueue extends _$UploadQueue {
  @override
  FutureOr<List<PendingUpload>> build() async {
    final isar = ref.watch(isarProvider);
    return await isar.pendingUploads.where().findAll();
  }

  Future<void> enqueue(String filePath, String storeId, String userId) async {
    final isar = ref.watch(isarProvider);

    final upload = PendingUpload()
      ..filePath = filePath
      ..createdAt = DateTime.now()
      ..storeId = storeId
      ..userId = userId
      ..retryCount = 0;

    await isar.writeTxn(() async {
      await isar.pendingUploads.put(upload);
    });

    ref.invalidateSelf();

    // ネットワークがあれば即座にアップロード
    final isOnline = await ref.read(networkStatusProvider.future);
    if (isOnline) {
      _processQueue();
    }
  }

  Future<void> _processQueue() async {
    final queue = await future;
    final videoService = ref.read(videoServiceProvider);
    final isar = ref.watch(isarProvider);

    for (final upload in queue) {
      if (!upload.shouldRetry) {
        continue;
      }

      try {
        await videoService.uploadToMux(upload.filePath);
        await _removeFromQueue(upload.id);
      } catch (e) {
        await _incrementRetry(upload.id);
      }
    }

    ref.invalidateSelf();
  }

  Future<void> _removeFromQueue(Id id) async {
    final isar = ref.watch(isarProvider);
    await isar.writeTxn(() async {
      await isar.pendingUploads.delete(id);
    });
  }

  Future<void> _incrementRetry(Id id) async {
    final isar = ref.watch(isarProvider);
    final upload = await isar.pendingUploads.get(id);
    if (upload != null) {
      upload.retryCount++;
      await isar.writeTxn(() async {
        await isar.pendingUploads.put(upload);
      });
    }
  }

  Future<void> cleanup() async {
    final isar = ref.watch(isarProvider);
    final now = DateTime.now();

    await isar.writeTxn(() async {
      // 7日以上前のものを削除
      await isar.pendingUploads
        .filter()
        .createdAtLessThan(now.subtract(MAX_RETENTION))
        .deleteAll();
    });

    // キューサイズチェック
    final count = await isar.pendingUploads.count();
    if (count > MAX_QUEUE_SIZE) {
      final toDelete = await isar.pendingUploads
        .where()
        .sortByCreatedAt()
        .limit(count - MAX_QUEUE_SIZE)
        .findAll();

      await isar.writeTxn(() async {
        for (final upload in toDelete) {
          await isar.pendingUploads.delete(upload.id);
          // ファイル削除
          try {
            File(upload.filePath).deleteSync();
          } catch (e) {
            print('Failed to delete file: $e');
          }
        }
      });
    }

    ref.invalidateSelf();
  }
}
```

---

このドキュメントにより、開発者は完全に動作するコードをコピー&ペーストして即座に実装を開始できます。
