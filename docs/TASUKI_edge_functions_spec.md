# TASUKI Edge Functions 詳細仕様書

本ドキュメントは、Supabase Edge Functions の実装仕様を詳細に定義します。

---

## 1. 共通設計

### 1.1 ディレクトリ構成
```
supabase/
├── functions/
│   ├── _shared/
│   │   ├── supabase-client.ts    # Supabaseクライアント初期化
│   │   ├── gemini-client.ts      # Gemini API ラッパー
│   │   ├── error-handler.ts      # 共通エラーハンドリング
│   │   └── types.ts               # 共通型定義
│   ├── mux_webhook/
│   │   └── index.ts
│   ├── ai_process_handover/
│   │   └── index.ts
│   ├── import_google_doc/
│   │   └── index.ts
│   └── cost_monitor/
│       └── index.ts
```

### 1.2 共通エラーハンドリングパターン
```typescript
// _shared/error-handler.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly retryable: boolean = false
  ) {
    super(message);
  }
}

export function handleError(error: unknown): Response {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: error.statusCode }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500 }
  );
}
```

### 1.3 冪等性保証
全てのEdge Functionsは冪等性を保証します:
- `handover_id` / `asset_id` をユニークキーとして使用
- `INSERT ... ON CONFLICT DO UPDATE` パターン
- Webhook署名検証によるリプレイ攻撃防止

---

## 2. mux_webhook

### 2.1 概要
Muxからの動画処理完了Webhookを受信し、`handovers` テーブルを更新します。

### 2.2 I/O 仕様

#### Input (Webhook Payload)
```typescript
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
    duration?: number;
    tracks: Array<{
      type: 'video' | 'audio';
      max_width?: number;
      max_height?: number;
    }>;
  };
  created_at: string;
}
```

#### Output
```typescript
interface MuxWebhookResponse {
  success: boolean;
  handover_id?: string;
  message: string;
}
```

### 2.3 処理フロー
```typescript
// supabase/functions/mux_webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '../_shared/supabase-client.ts';
import { handleError, AppError } from '../_shared/error-handler.ts';

serve(async (req) => {
  try {
    // 1. Webhook署名検証
    const signature = req.headers.get('mux-signature');
    if (!verifyMuxSignature(req, signature)) {
      throw new AppError('INVALID_SIGNATURE', 'Invalid webhook signature', 401);
    }

    const payload: MuxWebhookPayload = await req.json();

    // 2. 対象handoverを検索
    const supabase = createClient(Deno.env.get('SERVICE_ROLE_KEY')!);
    const { data: handover, error } = await supabase
      .from('handovers')
      .select('id, store_id')
      .eq('mux_asset_id', payload.object.id)
      .single();

    if (error || !handover) {
      throw new AppError('HANDOVER_NOT_FOUND', 'Handover not found', 404);
    }

    // 3. HLS URL / Thumbnail URL を生成
    const playbackId = payload.data.playback_ids[0]?.id;
    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

    // 4. handovers 更新
    await supabase
      .from('handovers')
      .update({
        hls_url: hlsUrl,
        thumbnail_url: thumbnailUrl,
        ai_status: 'ready_for_ai',
        updated_at: new Date().toISOString(),
      })
      .eq('id', handover.id);

    // 5. ai_process_handover を非同期起動
    await supabase.functions.invoke('ai_process_handover', {
      body: { handover_id: handover.id },
    });

    return new Response(
      JSON.stringify({ success: true, handover_id: handover.id }),
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
});
```

---

## 3. ai_process_handover

### 3.1 概要
`handover` から動画を取得し、Gemini AIで解析してマニュアル（draft）を生成します。

### 3.2 I/O 仕様

#### Input
```typescript
interface AiProcessHandoverInput {
  handover_id: string;
}
```

#### Output
```typescript
interface AiProcessHandoverOutput {
  success: boolean;
  manual_id?: string;
  error?: string;
}
```

### 3.3 Gemini プロンプトテンプレート

#### System Prompt
```typescript
const SYSTEM_PROMPT = `あなたは飲食店の業務マニュアル作成の専門家です。
与えられた動画から、新人スタッフが理解しやすい業務マニュアルを作成してください。

出力は以下のJSON形式に厳密に従ってください:
{
  "summary": "3行以内の要約",
  "steps": [
    { "step_number": 1, "description": "具体的な手順", "tips": "注意点やコツ" }
  ],
  "tips": [
    "全体を通しての重要なポイント"
  ],
  "category": "ホール" | "キッチン" | "清掃" | "安全衛生" | "その他"
}`;
```

#### User Prompt
```typescript
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
```

### 3.4 処理フロー
```typescript
// supabase/functions/ai_process_handover/index.ts
serve(async (req) => {
  try {
    const { handover_id }: AiProcessHandoverInput = await req.json();
    const supabase = createClient(Deno.env.get('SERVICE_ROLE_KEY')!);

    // 1. handover 取得
    const { data: handover } = await supabase
      .from('handovers')
      .select('id, hls_url, store_id, author_id')
      .eq('id', handover_id)
      .single();

    // 2. ユーザー言語取得
    const { data: user } = await supabase
      .from('users')
      .select('language')
      .eq('id', handover.author_id)
      .single();

    const language = user?.language || 'ja';

    // 3. ai_status を 'ai_running' に更新
    await supabase
      .from('handovers')
      .update({ ai_status: 'ai_running' })
      .eq('id', handover_id);

    // 4. Gemini API呼び出し
    const aiResult = await callGemini(handover.hls_url, language);

    // 5. manuals に draft 保存
    const { data: manual } = await supabase
      .from('manuals')
      .insert({
        handover_id: handover.id,
        store_id: handover.store_id,
        status: 'draft',
        source_type: 'ai',
        ai_summary: aiResult.summary,
        ai_steps: aiResult.steps,
        ai_tips: aiResult.tips,
      })
      .select()
      .single();

    // 6. ai_status を 'draft_created' に更新
    await supabase
      .from('handovers')
      .update({ ai_status: 'draft_created' })
      .eq('id', handover_id);

    return new Response(
      JSON.stringify({ success: true, manual_id: manual.id }),
      { status: 200 }
    );
  } catch (error) {
    // エラー時は ai_status を 'failed' に
    await supabase
      .from('handovers')
      .update({ ai_status: 'failed' })
      .eq('id', handover_id);

    return handleError(error);
  }
});
```

---

## 4. import_google_doc

### 4.1 概要
Google Docs URLから本文を取得し、Geminiで整形してマニュアルを作成します。

### 4.2 I/O 仕様

#### Input
```typescript
interface ImportGoogleDocInput {
  google_doc_url: string;
  store_id: string;
  user_id: string;
  use_ai_formatting: boolean;
  category?: string;
}
```

#### Output
```typescript
interface ImportGoogleDocOutput {
  success: boolean;
  manual_id?: string;
  message: string;
}
```

### 4.3 Google Docs テキスト抽出方法
**採用方針**: Google Docs API（推奨）または Cheerio（フォールバック）

```typescript
async function fetchGoogleDocContent(url: string): Promise<string> {
  // URLから Document ID を抽出
  const docId = extractDocId(url);

  // 方法1: Google Docs API (推奨)
  // - documents.get API を使用
  // - 認証: Service Account または OAuth

  // 方法2: Cheerio (フォールバック)
  // - 公開設定のドキュメントのみ
  // - /export?format=txt でプレーンテキスト取得

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const response = await fetch(exportUrl);
  return await response.text();
}
```

### 4.4 Gemini プロンプト（整形用）
```typescript
const GOOGLE_DOC_FORMAT_PROMPT = `以下のテキストは既存の業務マニュアルです。
これを以下のJSON形式に整形してください:

{
  "summary": "3行以内の要約",
  "steps": [
    { "step_number": 1, "description": "手順", "tips": "注意点" }
  ],
  "tips": ["全体のポイント"],
  "category": "カテゴリ"
}

元のテキスト:
{{RAW_TEXT}}`;
```

---

## 5. cost_monitor (Cron)

### 5.1 概要
Mux / Gemini のコスト推定を計算し、閾値超過時にSlack通知します。

### 5.2 実行頻度
1日1回（Supabase Cron設定）

### 5.3 処理フロー
```typescript
serve(async () => {
  // 1. 月次のFlow数を集計
  const flowCount = await getMonthlyFlowCount();

  // 2. Mux/Gemini の単価を元にコスト推定
  const muxCost = flowCount * 0.05; // 仮の単価
  const geminiCost = flowCount * 0.10; // 仮の単価

  // 3. ARPU比を計算
  const arpu = Number(Deno.env.get('ARPU')) || 3000;
  const muxRatio = (muxCost / arpu) * 100;
  const geminiRatio = (geminiCost / arpu) * 100;

  // 4. 閾値チェック
  if (muxRatio > 15 || geminiRatio > 20) {
    await sendSlackAlert({ muxRatio, geminiRatio });
  }
});
```

---

## 6. エラーハンドリング戦略

### 6.1 リトライポリシー
| エラー種別 | リトライ | 最大回数 | 間隔 |
|-----------|---------|---------|------|
| ネットワークエラー | ✅ | 3 | Exponential Backoff |
| AI API タイムアウト | ✅ | 2 | 60秒 |
| Webhook 署名エラー | ❌ | - | - |
| データ不整合 | ❌ | - | - |

### 6.2 ログ記録
全てのエラーは以下の情報とともに記録:
- `error_code`: エラー種別
- `handover_id` / `manual_id`: 対象リソース
- `retry_count`: リトライ回数
- `stack_trace`: スタックトレース（Sentry連携）

---

このドキュメントに従って実装することで、Edge Functions の動作が完全に定義され、AIエージェントの自律実装が可能になります。
