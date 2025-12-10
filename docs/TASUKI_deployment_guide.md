# TASUKI デプロイガイド

本ドキュメントは、TASUKIを本番環境にデプロイするための完全な手順を提供します。

---

## 1. 環境構成

TASUKIは以下の3つの環境を推奨します:

| 環境 | 用途 | Supabase Project | URL例 |
|------|------|------------------|-------|
| **Development** | ローカル開発 | `localhost` | `localhost` |
| **Staging** | 本番前検証 | `tasuki-staging` | `tasuki-staging.vercel.app` |
| **Production** | 本番環境 | `tasuki-prod` | `tasuki.com` |

---

## 2. Staging環境構築

### 2.1 Supabase Staging プロジェクト作成

```bash
# 1. Supabase CLI でStagingプロジェクト作成
supabase projects create tasuki-staging --org-id YOUR_ORG_ID

# 2. プロジェクトリンク
supabase link --project-ref YOUR_STAGING_PROJECT_REF

# 3. データベーススキーマ適用
supabase db push

# 4. シードデータ投入
supabase db seed
```

### 2.2 環境変数設定 (Staging)

`.env.staging`ファイルを作成:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_STAGING_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SERVICE_ROLE_KEY=eyJhbG... # Secretsに登録

# Mux (Staging専用アカウント推奨)
MUX_TOKEN_ID=staging-token-id
MUX_TOKEN_SECRET=staging-token-secret
MUX_WEBHOOK_SECRET=staging-webhook-secret

# Gemini
GEMINI_API_KEY=AIzaSy... # 同じキーでOK

# Sentry
SENTRY_DSN_FLUTTER=https://...@sentry.io/staging
SENTRY_DSN_EDGE=https://...@sentry.io/staging

# Environment
ENVIRONMENT=staging
```

### 2.3 Edge Functions デプロイ (Staging)

```bash
# Secrets登録
supabase secrets set --env-file .env.staging

# Functions デプロイ
supabase functions deploy mux_webhook --project-ref YOUR_STAGING_PROJECT_REF
supabase functions deploy ai_process_handover --project-ref YOUR_STAGING_PROJECT_REF
supabase functions deploy import_google_doc --project-ref YOUR_STAGING_PROJECT_REF
```

### 2.4 Flutter アプリビルド (Staging)

```bash
# Android
flutter build apk --flavor staging --dart-define=ENVIRONMENT=staging

# iOS
flutter build ios --flavor staging --dart-define=ENVIRONMENT=staging

# TestFlight / Firebase App Distribution にアップロード
```

---

## 3. Production環境構築

### 3.1 Supabase Production プロジェクト作成

```bash
supabase projects create tasuki-production --org-id YOUR_ORG_ID
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
supabase db push
```

### 3.2 環境変数設定 (Production)

`.env.production`ファイルを作成し、同様の手順で設定。

**重要**: Production では以下に注意:
- Mux は別アカウント (本番用)
- Sentry は別プロジェクト
- 強力なパスワードとシークレットキー

### 3.3 Production デプロイチェックリスト

- [ ] RLS ポリシーが有効化されている
- [ ] Service Role Key が安全に管理されている
- [ ] Mux Webhook URL が正しい
- [ ] Gemini API クォータが十分
- [ ] Sentry エラー監視が有効
- [ ] バックアップが設定されている

---

## 4. CI/CD パイプライン (GitHub Actions)

### 4.1 `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-edge-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Deploy Edge Functions
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase link --project-ref ${{ secrets.STAGING_PROJECT_REF }}
          supabase functions deploy mux_webhook
          supabase functions deploy ai_process_handover
          supabase functions deploy import_google_doc

  deploy-flutter:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'

      - name: Build Android
        run: |
          flutter build apk --flavor staging

      - name: Upload to Firebase App Distribution
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID }}
          token: ${{ secrets.FIREBASE_TOKEN }}
          file: build/app/outputs/apk/staging/release/app-staging-release.apk
```

### 4.2 `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-edge-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Edge Functions
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase link --project-ref ${{ secrets.PRODUCTION_PROJECT_REF }}
          supabase functions deploy

  deploy-flutter:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build for App Store
        run: |
          flutter build ipa --flavor production

      - name: Upload to App Store Connect
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: 'build/ios/ipa/*.ipa'
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}
```

---

## 5. ゼロダウンタイムマイグレーション

### 5.1 基本戦略

1. **Backward Compatible な変更**: 新しいカラム追加は問題なし
2. **Breaking Changes**: 段階的移行

### 5.2 カラム追加の例

```sql
-- Step 1: カラム追加 (Nullable)
ALTER TABLE manuals ADD COLUMN priority INTEGER;

-- Step 2: アプリデプロイ (新カラム使用開始)
-- アプリがデプロイされてから実行

-- Step 3: デフォルト値設定
UPDATE manuals SET priority = 5 WHERE priority IS NULL;
ALTER TABLE manuals ALTER COLUMN priority SET NOT NULL;
ALTER TABLE manuals ALTER COLUMN priority SET DEFAULT 5;
```

### 5.3 カラム削除の例

```sql
-- Step 1: アプリ側で使用停止 (デプロイ)

-- Step 2: カラム削除
ALTER TABLE manuals DROP COLUMN old_column;
```

---

## 6. ロールバック手順

### 6.1 Edge Functions ロールバック

```bash
# 過去のバージョンにロールバック
supabase functions deploy mux_webhook --version PREVIOUS_VERSION

# または、gitで前のコミットに戻してデプロイ
git checkout PREVIOUS_COMMIT
supabase functions deploy
```

### 6.2 データベースロールバック

```bash
# マイグレーション履歴確認
supabase migration list

# 特定のマイグレーションまでロールバック
supabase db reset --version 20251130000000
```

### 6.3 Flutter アプリロールバック

- **App Store**: 前バージョンを再提出
- **Google Play**: ロールバック機能使用
- **TestFlight**: 古いビルド番号を再有効化

---

## 7. デプロイチェックリスト

### Staging デプロイ前
- [ ] ローカルでテスト完了
- [ ] Lintエラーなし
- [ ] E2Eテスト成功

### Staging デプロイ後
- [ ] Flow録画→AI生成→承認フロー確認
- [ ] Google Docs取り込み確認
- [ ] オフライン動作確認

### Production デプロイ前
- [ ] Staging で1週間以上稼働
- [ ] 重大なバグなし
- [ ] パフォーマンステスト完了
- [ ] セキュリティ監査完了

### Production デプロイ後
- [ ] Sentry でエラー監視
- [ ] コスト監視アラート確認
- [ ] 実ユーザーで動作確認

---

このガイドに従うことで、安全かつ確実にTASUKIを本番環境にデプロイできます。
