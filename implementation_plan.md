# TASUKI 実装計画 - Phase 2 (MVP)

## ユーザーレビュー必須事項
> [!IMPORTANT]
> **環境修正の必要性**:
> `supabase start` が `Dev/TASUKI` ではなく親ディレクトリの `Dev` で実行された履歴がありました。
> これにより `seed.sql` の警告が発生し、データベース接続ができませんでした。
> **アクション**: 上記は `supabase stop` と `Dev/TASUKI` での再起動により解消済みです。

## ゴール (目的)
**Flow (動画) → Stock (マニュアル)** のコアループを実装する。
1. ユーザーはログインできる (Magic Link)。
2. ユーザーは "Flow" 動画を撮影できる。
3. 動画は Mux にアップロードされ、Gemini (Edge Functions) によって処理され、"Stock" マニュアルが作成される。

## 変更内容

### バックエンド (Supabase)
Phase 1 で実装済み。
- [x] Schema & RLS
- [x] Edge Functions (`mux_webhook`, `ai_process_handover`)

### フロントエンド (Flutter) `apps/app`

#### 1. アプリ初期化 ([NEW] `lib/main.dart`)
- `ProviderScope` (Riverpod) のセットアップ
- `Supabase` の初期化
- `Isar` (ローカルDB) の初期化

#### 2. 認証機能
- [NEW] `lib/features/auth/presentation/auth_screen.dart`: Magic Link ログイン UI。
- [NEW] `lib/features/auth/application/auth_notifier.dart`: Auth 状態管理。

#### 3. Flow (撮影機能)
- [NEW] `lib/features/flow/presentation/record_screen.dart`: 長押し録画ボタン付きカメラ画面。
- [NEW] `lib/features/flow/application/video_service.dart`: Mux アップロードロジック。
- [NEW] `lib/features/flow/data/upload_queue.dart`: オフラインキュー用 Isar スキーマ。

#### 4. タイムライン (ホーム画面)
- [NEW] `lib/features/home/presentation/timeline_screen.dart`: Handovers/Manuals 一覧（仮実装）。

## 検証計画

### 手動検証
1. **環境確認**: `supabase status` が `TASUKI` で稼働していることを確認。
2. **シードデータ**: `SELECT * FROM stores` でデータが返ることを確認。
3. **アプリ起動**: `flutter run` でアプリを起動。
4. **ログイン**: `staff1@test.tasuki.com` でログイン (Magic Link)。
5. **撮影**: 5秒程度の動画を撮影 -> `handovers` テーブルにレコードが作成されることを確認。
