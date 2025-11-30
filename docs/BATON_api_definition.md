# BATON API 定義書 v1.0

本ドキュメントは、BATON プロジェクトにおけるサーバーサイド（Supabase Edge Functions）および外部連携（Webhooks）のインターフェース定義です。

## 1. Edge Functions

Supabase Edge Functions は `POST` リクエストで呼び出され、認証には Supabase Auth JWT (`Authorization: Bearer <token>`) を使用します。

### 1.1 `import_google_doc`
Google Docs の共有リンクからコンテンツを取り込み、マニュアルのドラフトを作成します。

- **Endpoint**: `/functions/v1/import_google_doc`
- **Auth**: Required (Role: `manager` or `owner`)

#### Request Body
```json
{
  "google_doc_url": "https://docs.google.com/document/d/...",
  "store_id": "uuid-string",
  "use_ai_formatting": true,
  "category": "ホール" // Optional
}
```

#### Response
```json
// 200 OK
{
  "manual_id": "uuid-string",
  "status": "draft",
  "message": "Successfully imported and drafted."
}
```

#### Errors
- `400 Bad Request`: URL が不正、または `store_id` が欠落。
- `403 Forbidden`: 権限不足。
- `500 Internal Server Error`: Google Docs 取得失敗、または AI 処理エラー。

---

### 1.2 `ai_process_handover`
動画（Handover）のメタデータをもとに Gemini で解析を行い、マニュアルを生成します。
通常は `mux_webhook` から非同期で呼び出されますが、管理画面からの再実行も可能です。

- **Endpoint**: `/functions/v1/ai_process_handover`
- **Auth**: Service Role Key (Internal) or Auth User (Retry)

#### Request Body
```json
{
  "handover_id": "uuid-string"
}
```

#### Response
```json
// 200 OK
{
  "manual_id": "uuid-string",
  "status": "draft_created"
}
```

---

## 2. Webhooks

外部サービスからのイベント通知を受け取るエンドポイントです。

### 2.1 `mux_webhook`
Mux からの動画処理ステータス更新を受け取ります。

- **Endpoint**: `/functions/v1/mux_webhook`
- **Method**: `POST`
- **Signature Header**: `Mux-Signature` (検証必須)

#### Payload (Example)
```json
{
  "type": "video.asset.ready",
  "object": {
    "type": "asset",
    "id": "00ec4...",
    "playback_ids": [
      { "id": "...", "policy": "public" }
    ],
    "status": "ready"
  },
  "data": { ... }
}
```

#### Processing Logic
1.  `Mux-Signature` を検証。
2.  `video.asset.ready` イベントの場合:
    - `handovers` テーブルを `mux_asset_id` で検索。
    - `hls_url`, `thumbnail_url` を更新。
    - `ai_status` を `ready_for_ai` に更新。
    - `ai_process_handover` を非同期で呼び出し。

---

## 3. 共通エラーレスポンス

Edge Functions は以下の形式でエラーを返却します。

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... } // Optional
  }
}
```

| Code | Description |
| :--- | :--- |
| `UNAUTHORIZED` | 認証トークンが無効または期限切れ |
| `FORBIDDEN` | リソースへのアクセス権限がない |
| `VALIDATION_ERROR` | 入力パラメータが不正 |
| `UPSTREAM_ERROR` | 外部サービス（Google/Mux/Gemini）のエラー |
| `INTERNAL_ERROR` | 予期しないサーバーエラー |
