# TASUKI セットアップガイド

本ドキュメントはTASUKI開発環境をゼロから構築するための完全ガイドです。

---

## 前提条件
- macOS / Linux / Windows (WSL2)
- Node.js 18以上
- Flutter 3.16以上
- Git
- 1Password または同等のシークレット管理ツール (推奨)

---

## 1. リポジトリのクローンと環境変数設定

### 1.1 リポジトリクローン
```bash
git clone https://github.com/hide-kakky/TASUKI.git
cd TASUKI
```

### 1.2 環境変数ファイル作成
環境ごとにファイルを作成します。

```bash
# ローカル開発用 (.gitignore済み)
cp .env.example .env

# (Optional) 環境別ファイル
cp .env.example .env.staging
cp .env.example .env.prod
```

`.env` ファイルを開き、以下のセクションを順次設定していきます（次のステップで取得）。
ローカル開発では `supabase start` で表示される値を `.env` に設定します。

---

## 2. Supabase プロジェクトセットアップ

### 2.1 プロジェクト作成 (環境分離)
本番用と開発用の2つのプロジェクトを作成します。

**1. Production (本番用)**
1. [Supabase](https://supabase.com/) にアクセス
2. "New Project" をクリック
3. プロジェクト名: `tasuki-prod`
4. Database Password を設定（強力なパスワード）
5. Region: `Northeast Asia (Tokyo)` を選択

**2. Staging (開発用)**
1. 同様に新しいプロジェクトを作成
2. プロジェクト名: `tasuki-staging`
3. Region: `Northeast Asia (Tokyo)`

### 2.2 API キー取得
1. プロジェクトダッシュボード → Settings → API
2. 以下をコピーして `.env` に記載:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (⚠️秘匿!) → `SERVICE_ROLE_KEY`

### 2.3 Supabase CLI インストール
```bash
# macOS
brew install supabase/tap/supabase

# Windows / Linux
npm install -g supabase
```

### 2.4 ローカル開発環境の初期化 (推奨)
Supabase CLI を使ってローカル環境を立ち上げます。これにより、安全かつ高速に開発できます。

```bash
# ローカル環境起動
supabase start

# ステータス確認 (API URLやInbucket URLが表示されます)
supabase status
```

**Inbucket (メール確認ツール)**:
ローカル環境ではメールは実際には送信されず、Inbucket に捕捉されます。
- URL: `http://localhost:54324`
- テスト時の認証確認に使用します。

**Auth の扱い（dev方針）**:
- RLS/認証は基本そのまま。テストユーザーで運用し、Magic Link は Inbucket ログで確認する。
- Edge Functions を単体確認するときだけ、ローカルで `--no-verify-jwt` を付けて起動して良い（本番/ステージングでは禁止）。
  ```bash
  supabase functions serve ai_process_handover --env-file supabase/.env --no-verify-jwt
  curl http://127.0.0.1:54321/functions/v1/ai_process_handover/test-env
  ```
- RLSを切る/サービスロールをクライアントへ渡すようなバイパスは禁止。

### 2.5 クラウド環境へのリンク (デプロイ用)
```bash
# Staging環境にリンク
supabase link --project-ref YOUR_STAGING_PROJECT_REF
```

### 2.5 データベーススキーマ適用
```bash
supabase db push
```

---

## 3. Mux セットアップ

### 3.1 アカウント作成
1. [Mux](https://mux.com/) にアクセス
2. アカウント作成 (フリープランで開始可能)

### 3.2 API トークン取得
1. Settings → Access Tokens
2. "Generate new token" をクリック
3. 権限: `Mux Video` → **Full Access**
4. Token ID と Token Secret を `.env` に記載:
   - `MUX_TOKEN_ID`
   - `MUX_TOKEN_SECRET`

### 3.3 Webhook 設定
1. Settings → Webhooks
2. "Create new webhook" をクリック
3. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/mux_webhook`
4. イベントタイプを選択:
   - `video.asset.ready`
   - `video.asset.created`
   - `video.upload.asset_created`
5. Signing Secret をコピー → `.env` の `MUX_WEBHOOK_SECRET`

---

## 4. Gemini AI セットアップ

### 4.1 Google Cloud プロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成: `tasuki-ai`

### 4.2 Gemini API 有効化
1. "APIs & Services" → "Enable APIs and Services"
2. "Generative Language API" を検索 → 有効化

### 4.3 API キー取得
1. "Credentials" → "Create Credentials" → "API Key"
2. 生成されたキーを `.env` に記載:
   - `GEMINI_API_KEY=AIzaSy...`

### 4.4 (Optional) Vertex AI への移行準備
将来のスケール時に備え、Vertex AI も有効化しておくことを推奨:
```bash
gcloud services enable aiplatform.googleapis.com
```

### 4.5 Google Docs API セットアップ (Optional - Google Docs取り込み機能用)

#### 方法1: Service Account (推奨)
1. [Google Cloud Console](https://console.cloud.google.com/) で同じプロジェクトを使用
2. "APIs & Services" → "Enable APIs and Services"
3. "Google Docs API" を検索 → 有効化
4. "Credentials" → "Create Credentials" → "Service Account"
5. Service Account 名: `tasuki-docs-reader`
6. "Keys" → "Add Key" → "Create new key" → JSON形式
7. ダウンロードした JSON ファイルの内容を `.env` に記載:
   ```bash
   GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"..."}'
   ```
8. Supabase Secrets に登録:
   ```bash
   supabase secrets set GOOGLE_SERVICE_ACCOUNT="$(cat service-account.json)"
   ```

#### 方法2: 公開URLからの直接取得 (フォールバック)
Service Accountを設定しない場合、公開設定のドキュメントのみ取り込み可能。
- **制限**: Google Docs が「リンクを知っている全員」に公開されている必要がある
- **実装**: `/export?format=txt` エンドポイントを使用
- **参照**: [TASUKI_constraints_spec.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_constraints_spec.md) Section 6.2


---

## 5. Sentry セットアップ (エラー監視)

### 5.1 アカウント作成
1. [Sentry](https://sentry.io/) にアクセス
2. "Create a new project"
3. Platform: **Flutter** と **Node.js** を別々に作成

### 5.2 DSN 取得
各プロジェクトの Settings → Client Keys (DSN) をコピー:
- Flutter用 → `SENTRY_DSN_FLUTTER`
- Edge Functions用 → `SENTRY_DSN_EDGE`

---

## 6. Flutter アプリケーションセットアップ

### 6.1 依存パッケージインストール
```bash
cd apps/app
flutter pub get
```

### 6.2 Isar スキーマ生成
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 6.3 動作確認
```bash
flutter run
```

---

## 7. Edge Functions デプロイ

### 7.1 Secrets 設定
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set MUX_TOKEN_ID=your_mux_token_id
supabase secrets set MUX_TOKEN_SECRET=your_mux_token_secret
supabase secrets set MUX_WEBHOOK_SECRET=your_webhook_secret
```

### 7.2 Functions デプロイ
```bash
supabase functions deploy mux_webhook
supabase functions deploy ai_process_handover
supabase functions deploy import_google_doc
```

---

## 8. 検証

### 8.1 Supabase 接続確認
```bash
supabase db ping
```

### 8.2 Mux Webhook 疎通確認
Mux ダッシュボード → Settings → Webhooks → "Test webhook" をクリック

### 8.3 Gemini API 疎通確認
```bash
cd scripts
node test_gemini.js
```

---

## 9. トラブルシューティング

### Supabase 接続エラー
- API URLとキーが正しいか確認
- プロジェクトが paused 状態でないか確認

### Mux Webhook が届かない
- Webhook URLが正しいか確認（httpsであること）
- Edge Function がデプロイされているか確認

### Gemini API エラー
- API が有効化されているか確認
- Billing が有効か確認（無料枠でも課金設定が必要な場合あり）

---

## 次のステップ
環境構築が完了したら、[plan.md](file:///Users/hide_kakky/Dev/TASUKI/plan.md) の Phase 1 タスクを開始してください。
