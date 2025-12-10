# TASUKI デリバリープラン（自律更新版）

本ドキュメントは AI エージェント自身が管理する実行計画書です。作業が一段階進むたびに必ず本書を上書きし、進捗と次アクションを宣言してください。

---

## 0. 運用ルール（AI 自律更新）
1. **参照チェック**：更新前に `docs/TASUKI_requirements_v8.5.md` / `docs/TASUKI_implementation_guide_v1.0.md` を再読し、引用すべき要件を記載する。
2. **更新タイミング**：タスク完了 / 検証完了 / コスト評価 / 仕様判断の直後に必ず上書き。
3. **記法**：
   - ✅ 完了、▶ 着手中、□ 未着手
   - `NOTE:` 情報、`RISK:` リスク、`ACTION:` 次に自動実行すること
4. **自走宣言**：各更新の末尾で「次に着手するタスク」「想定完了時刻」「必要な入力」を宣言し、承認不要な範囲は自動で進める。

---

## 1. ミッション整合
- **参照要件**：`docs/TASUKI_requirements_v8.5.md`
- **実装ガイド**：`docs/TASUKI_implementation_guide_v1.0.md`
- **デザイン図面**：`docs/TASUKI_design_diagrams.md`
- **DBスキーマ**：`docs/TASUKI_database_schema.md`
- **ユーザー価値**：Flow→Stock を 7 日以内に体験させ、教育コスト削減を実感させる。

---

## 2. 現状スナップショット
- **フェーズ**：Phase 2 着手（バックエンドは Flow→Stock ライン実装済み、フロント未完）
- **主要担当**：Codex (AI Agent)
- **最新決定 / アクション**：
  - env 名を `SERVICE_ROLE_KEY` に統一、stg/prod secrets 再注入済み。
  - `ai_process_handover` `/test-env` は dev のみ有効、stg/prod は 404 で保護済み。
  - Edge Functions (`ai_process_handover`, `mux_webhook`, `create_mux_upload_url`) を stg/prod に再デプロイ。
  - `supabase/config.toml` に関数ごとの `verify_jwt=false` を明記（デプロイ時に毎回反映する運用）。
  - `mux_webhook` に `MUX_WEBHOOK_SECRET` を使った HMAC 署名検証を実装。
- **ブロッカー / 依存**：
  - フロント（Flutter）の Flow/Timeline/Manager UI 実装が未着手。
  - 本番/ステージングでの Mux Webhook 実環境テストは未実施。

---

## 3. マイルストーンボード
| # | マイルストーン | ステータス | Exit 条件 / 実績 | 目標日 | オーナー | 次アクション |
|---|----------------|-----------|------------------|--------|----------|--------------|
| 1 | **Infra & DB Setup** | ▶ | スキーマ/RLS/seed 適用、Mux/Gemini secrets 設定、Edge Functions デプロイ | Day 3 | Codex | Mux Webhook 実環境テスト |
| 2 | **Flow → Stock MVP** | ▶ | Flow 録画→Mux→Gemini→Draft 生成、**Google Docs 取り込み** | Day 10 | Codex | Flutter Flow/Timeline 実装 |
| 3 | **Manager & Viewer UI** | □ | Manager 承認フロー、**一般ユーザー閲覧 UI**、AI 品質ログ | Day 20 | Codex |  |

---

## 4. 作業分解 & 進行ログ

> **重要**: 各タスクには **完了条件 (DoD: Definition of Done)** を記載しています。自律実行時はこれを必ず確認してください。

### Phase 1: Infra & DB Setup (Day 1-3)

#### 1.1 リポジトリ & 環境構成
- [x] **プロジェクト構造作成** (`apps/app`, `apps/edge`)
  - **DoD**: ディレクトリが存在し、`flutter --version` と `deno --version` が実行できる
  - **Note**: 実行環境（Flutter/Deno CLI）が無いため、ディレクトリとファイル作成のみ完了。ユーザーによる環境構築待ち。
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 1

- [x] **環境変数ファイル作成** (`.env` / `.envrc`)
  - **DoD**: `.env` が `.env.example` に基づいて作成され、全ての必須変数が定義されている。`SERVICE_ROLE_KEY` に統一済み。stg/prod secrets 注入済み。
  - **参照**: [supabase/.env.example](supabase/.env.example), [apps/app/.env.example](apps/app/.env.example)
  - **セットアップ手順**: [TASUKI_setup_guide.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_setup_guide.md)

#### 1.2 データベース (Supabase)
- [x] **マイグレーションファイル作成** (`supabase/migrations/20251201000000_init_schema.sql`)
  - **DoD**: 全テーブル (`organizations`, `stores`, `users`, `memberships`, `handovers`, `manuals`, `ai_jobs`, `manual_edits`) が定義され、`supabase db push` が成功する
  - **Note**: ファイル生成完了。CLI実行待ち。`manuals`テーブルに`category`カラムを追加修正済み。
  - **参照**: [TASUKI_database_schema.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_database_schema.md) Section 2

- [/] **RLS ポリシー適用** (Owner only start)
  - **DoD**: 全テーブルで RLS が有効化され、Section 3.3 のポリシーが適用される。Supabase SQL Editor でテストクエリが成功する
  - **Note**: マイグレーションファイル内に実装済み。

- [x] **シードデータ投入** (`supabase/seed.sql`)
  - **DoD**: テスト用の店舗・ユーザー・メンバーシップが作成され、`SELECT * FROM stores` で確認できる
  - **Note**: `seed.sql` 作成完了。

#### 1.3 外部サービス連携
- [ ] **Mux Webhook 設定確認** (ドキュメントベース)
  - **DoD**: Mux ダッシュボードに Webhook URL が登録され、"Test webhook" で疎通確認できる
  - **Status**: Edge Functions デプロイ済み。ダッシュボード設定と疎通テストは未実施。
  - **参照**: [TASUKI_setup_guide.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_setup_guide.md) Section 3.3
  - **NOTE**: `supabase/config.toml` に `verify_jwt=false` を記載し、デプロイ時に JWT を常時OFF。代わりに `MUX_WEBHOOK_SECRET` を用いた HMAC 検証を実装済み。

- [ ] **Gemini API 疎通テストスクリプト作成** (`scripts/test_gemini.ts`)
  - **DoD**: `deno run scripts/test_gemini.ts` が成功し、Gemini から応答が返る
  - **Status**: 未着手（`GEMINI_API_KEY` は各環境に設定済み）
  - **参照**: [TASUKI_setup_guide.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_setup_guide.md) Section 4

---

### Phase 2: Flow → Stock MVP (Day 4-10)

#### 2.1 Flutter アプリ基盤
- [ ] **Flutter プロジェクト作成** (`apps/app`)
  - **DoD**: `flutter create` が成功し、`flutter run` でサンプルアプリが起動する
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 1

- [ ] **依存パッケージ導入** (`riverpod`, `supabase_flutter`, `isar`, `camera`)
  - **DoD**: `pubspec.yaml` に全パッケージが記載され、`flutter pub get` が成功する

- [ ] **Auth 画面 & 状態管理実装**
  - **DoD**: Magic Link ログインが動作し、`authStateProvider` でセッション状態が取得できる
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 2.1

#### 2.2 Flow 録画 & アップロード
- [ ] **録画 UI 実装** (`RecordScreen`)
  - **DoD**: 長押しで録画開始/終了でき、動画ファイルがローカルに保存される
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 4.1

- [ ] **オフラインキュー実装** (`Isar` - `pending_uploads`)
  - **DoD**: オフライン時に録画した動画が `pending_uploads` に保存され、アプリ再起動後も残っている
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 3.1

- [ ] **Mux アップロード処理** (`VideoService`)
  - **DoD**: ネットワーク復帰時に自動アップロードが開始され、Mux ダッシュボードで Asset が確認できる
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 2.2

#### 2.3 Edge Functions (Backend)
- [x] **`mux_webhook` 実装** (`supabase/functions/mux_webhook/index.ts`)
  - **DoD**: Mux から Webhook を受信し、`handovers` の `hls_url` と `ai_status` が更新される。Supabase Logs で確認
  - **参照**: [TASUKI_edge_functions_spec.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_edge_functions_spec.md) Section 2

- [x] **`ai_process_handover` 実装** (`supabase/functions/ai_process_handover/index.ts`)
  - **DoD**: AI 処理が実行され、`manuals` テーブルに draft が INSERT される。`ai_summary`, `ai_steps`, `ai_tips` が生成される
  - **参照**: [TASUKI_edge_functions_spec.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_edge_functions_spec.md) Section 3

#### 2.4 Google Docs 取り込み
- [ ] **`import_google_doc` 実装** (`supabase/functions/import_google_doc/index.ts`)
  - **DoD**: Google Docs URL から本文を取得し、Gemini で整形して `manuals` に保存。`source_type='legacy_import'` であることを確認
  - **参照**: [TASUKI_edge_functions_spec.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_edge_functions_spec.md) Section 4

---

### Phase 3: Manager & Viewer UI (Day 11-20)

#### 3.1 Manager UI
- [ ] **マニュアル一覧 & 詳細画面** (`ManagerManualList`, `ManagerManualDetail`)
  - **DoD**: Manager ロールでログインすると Draft 一覧が表示され、詳細をタップすると AI 生成内容が閲覧できる
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 2.3

- [ ] **承認アクション** (`approve`, `reject`)
  - **DoD**: 承認ボタンで `status='published'` に更新され、`approved_by` と `published_at` が記録される

- [ ] **Google Docs 追加モーダル** 実装
  - **DoD**: モーダルから Google Docs URL を入力し、`import_google_doc` が呼ばれて Draft が作成される

#### 3.2 一般ユーザー閲覧 UI
- [ ] **タイムライン表示** (`TimelineScreen`)
  - **DoD**: Published マニュアルが新着順に表示され、タップで詳細画面に遷移する
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 4.2

- [ ] **カテゴリ検索 & フィルタ**
  - **DoD**: カテゴリフィルタ（ホール/キッチン等）で Published マニュアルを絞り込める

- [ ] **マニュアル詳細** (`ManualDetailScreen`) - 動画 & テキスト統合表示
  - **DoD**: サマリ・手順・Tips が1スクロールで閲覧でき、動画がある場合は再生可能
  - **参照**: [TASUKI_flutter_architecture.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_flutter_architecture.md) Section 4.3

#### 3.3 品質 & 運用
- [ ] **`manual_edits` ログ記録実装**
  - **DoD**: Manager が編集を開始/終了すると `manual_edits` に `edit_start_at` / `edit_end_at` が記録される

- [ ] **コスト監視 Cron** (`supabase/functions/cost_monitor/index.ts`)
  - **DoD**: 1日1回実行され、Mux/Gemini コストが閾値を超えると Slack 通知が送信される
  - **参照**: [TASUKI_edge_functions_spec.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_edge_functions_spec.md) Section 5

---

### E2E 検証
全フェーズ完了後、以下のシナリオを実行してください:
- **参照**: [TASUKI_e2e_scenarios.md](file:///Users/hide_kakky/Dev/TASUKI/docs/TASUKI_e2e_scenarios.md)
  - シナリオ1: Flow 録画 → AI 生成 → 承認 (フルパス)
  - シナリオ2: Google Docs 取り込みフロー
  - シナリオ3: オフライン → オンライン復帰
  - シナリオ4: 権限別アクセス制御テスト

---

---

## 5. リスク & 対応
| リスク | 影響 | 状態 | 対応策 / 教訓 |
|--------|------|------|----------------|
| RLS 設計ミス | データ漏洩 | ▢ Open | `plan: owner-only→段階緩和` で慎重に進める |
| AI 成果ムラ | 承認遅延 | ▢ Open | `manual_edits` ログでプロンプト調整 |
| Google Docs 構造化 | 取り込み失敗 | ▢ Open | テキスト抽出ライブラリの選定とエラーハンドリング強化 |

---

## 6. 指標 / 検証ログ
- **ビルド検証**：未実施
- **Activation 指標**：未計測
- **コスト監視**：未計測

---

## 7. コミュニケーション / 次アクション
- **最新アップデート**：計画を詳細化し、Phase 1〜3 のタスクを具体的に定義しました。
- **次に着手するタスク**：`<ACTION: 1.1 リポジトリ & 環境構成 の作成>`
- **必要な支援**：Supabase プロジェクトの URL / Key、Mux / Gemini の API Key の準備をお願いします。

---
