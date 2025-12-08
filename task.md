# TASUKI 実装タスクリスト

## Phase 1: インフラ & DB セットアップ (Day 1-3)
- [x] **プロジェクト初期化**
    - [x] プロジェクト構成作成 (`apps/app`, `apps/edge`)
    - [x] `.env` ファイル作成
- [x] **データベース (Supabase)**
    - [x] マイグレーションファイル作成 (Schema & RLS)
    - [x] `seed.sql` 作成
    - [x] マイグレーションとシードデータの適用 (`supabase start` / `db reset`)
- [x] **Edge Functions**
    - [x] `mux_webhook` 実装
    - [x] `ai_process_handover` 実装
    - [x] 共有ユーティリティ実装 (`supabase-client`, `gemini-client`, `error-handler`)

## Phase 2: Flow → Stock MVP (Day 4-10)
- [x] **Flutter アーキテクチャ**
    - [x] Flutter プロジェクト作成 (`apps/app`)
    - [x] 依存パッケージインストール (`riverpod`, `supabase_flutter`, `isar`, etc.)
- [/] **Flutter アプリ実装**
    - [x] `main.dart` & アプリ初期化
    - [x] **認証**
        - [x] ログイン画面 (Magic Link)
        - [x] Auth 状態管理 (Riverpod)
    - [x] **Flow (動画撮影)**
        - [x] カメラ/レコーダー UI
        - [x] オフラインキュー (`pending_uploads` in Isar)
        - [x] Mux アップロードロジック
    - [ ] **タイムライン/ホーム**
        - [ ] Handovers/Manuals の取得と表示
- [/] **バックエンド連携**
    - [x] Webhook 受信確認 (実装完了)
    - [x] AI 処理確認 (実装完了)

## Phase 3: Manager & Viewer UI (Day 11-20)
- [ ] **管理者 UI** (詳細未定)
- [ ] **閲覧者 UI** (詳細未定)
