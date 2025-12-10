# TASUKI インフラ構築ガイド v1.0

本ドキュメントは、TASUKI プロジェクトの開発および本番環境のセットアップ手順書です。

## 1. 必要なアカウントとツール
- **Supabase**: Backend / DB / Auth
- **Mux**: Video Hosting / Streaming
- **Google Cloud (Gemini API)**: AI Processing
- **Sentry**: Error Monitoring (Optional for MVP)
- **Docker**: Local Development (Supabase CLI)

## 2. 環境変数 (.env)

プロジェクトルートに環境ごとの `.env` ファイルを作成してください。
**注意**: API キーなどの機密情報は絶対に Git にコミットしないでください。

- `.env` (ローカル開発用)
- `.env.staging` (Staging用)
- `.env.prod` (Production用)

```bash
# Supabase (Local or Remote)
SUPABASE_URL="https://<project>.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SERVICE_ROLE_KEY="eyJ..." # Edge Functions 用 (Server-side only)

# Mux
MUX_TOKEN_ID="your-mux-token-id"
MUX_TOKEN_SECRET="your-mux-token-secret"
MUX_WEBHOOK_SECRET="your-mux-webhook-secret"

# Gemini (Google AI)
GEMINI_API_KEY="AIza..."

# App Config
APP_ENV="development" # development | staging | production
```

## 3. Supabase セットアップ

### 3.1 プロジェクト作成
環境ごとにプロジェクトを作成します。

1. **Production**: `tasuki-prod`
2. **Staging**: `tasuki-staging`
3. **Development**: `localhost` (Supabase CLI)

各環境で Database Password を設定し、安全に保管してください。

### 3.2 データベース構築
`docs/TASUKI_database_schema.md` に基づき、テーブルと RLS を作成します。
マイグレーションファイル (`supabase/migrations/`) を使用して適用することを推奨します。

```bash
supabase link --project-ref <project-id>
supabase db push
```

### 3.3 Auth 設定
- **Providers**: Email (Magic Link) を有効化。
- **Redirect URLs**: アプリのディープリンクスキーム (例: `io.baton.app://login-callback`) を追加。

### 3.4 Storage 設定
- Bucket: `thumbnails` (Public)
- Policy: Authenticated users can upload, Public can read.

## 4. Mux セットアップ

1. **API Token**: "Full Access" ではなく、必要なスコープ (Video Read/Write) を持つトークンを発行。
2. **Webhook**:
   - URL: `https://<supabase-project>.functions.supabase.co/mux_webhook`
   - Events: `video.asset.created`, `video.asset.ready`, `video.asset.errored`

## 5. Gemini (Google AI) セットアップ

1. Google AI Studio または Google Cloud Console で API キーを取得。
2. Supabase Edge Functions の Secrets に登録。

```bash
supabase secrets set GEMINI_API_KEY=AIza...
```

## 6. Edge Functions デプロイ

環境を指定してデプロイします。

```bash
# Staging へのデプロイ
supabase functions deploy mux_webhook --project-ref <staging-project-ref>
supabase functions deploy ai_process_handover --project-ref <staging-project-ref>
supabase functions deploy import_google_doc --project-ref <staging-project-ref>

# Production へのデプロイ (慎重に!)
supabase functions deploy mux_webhook --project-ref <prod-project-ref>
# ...
```

## 7. ローカル開発環境

Supabase CLI を使用してローカルスタックを起動します。

```bash
supabase start
supabase status # API URL, DB URL 等を確認
```

ローカルで Edge Functions をテストする場合:
```bash
supabase functions serve
```
