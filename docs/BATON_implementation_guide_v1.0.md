# BATON 実装手引書 v1.0

_要件定義書 v8.5 ベース_

## 0. 全体像：4 レイヤ × 3 フェーズ
- **レイヤ**
  1. インフラ・SaaS 設定：Supabase / Mux / Gemini / Sentry
  2. データモデル・権限：DB スキーマ / RLS / RBAC（root〜staff）
  3. バックエンドフロー：Edge Functions（Webhook / AI 解析）
  4. フロントエンド：Flutter アプリ（Flow UI / Stock UI / Auth）
- **フェーズ**
  1. Phase 1：土台だけ作る（Auth / DB / Mux / Hello World）
  2. Phase 2：Flow → Mux → Stock（下書き）まで “1 本” 通す
  3. Phase 3：マニュアル承認フロー + 負債返済（L0→L1 の最小リファクタ）

---

## 1. Phase 1（Day 1–3）インフラと DB の“芯”構築
### 1-1. リポジトリと環境
- GitHub で monorepo（`baton`）か 2 リポジトリ（`baton-app` / `baton-backend`）か決定。
- `.env` 管理ポリシー（direnv, dotenv, 1Password CLI など）を Phase 1 で明文化。

### 1-2. Supabase プロジェクト作成
- 新規 Supabase プロジェクトを作成し、Postgres スキーマ定義を開始。
- 必須テーブル：
  - `organizations`
  - `stores`
  - `users`（`auth.users` との連携 → view or trigger 化を判断）
  - `memberships`
  - `handovers`（Flow）
  - `manuals`（Stock）
  - `ai_jobs`（AI 処理トラッキング）
  - `audit_logs`（root/admin 用）
- カラム設計は要件 v8.5 ベースで固定。曖昧な領域には `jsonb meta` を持たせて OODA 余地を残す。

### 1-3. RBAC と RLS の骨組み
- ロールマッピング：
  - `root` / `admin`：システム側でフラグ保持（サーバー専用テーブルや metadata）。
  - `owner` / `manager` / `staff`：`memberships.role` に格納。
- RLS 方針を 1 行で決める（例：「handovers は同一 store のメンバーのみ閲覧可」）。
- Supabase で RLS を有効化し、初期は「owner のみ読み取り」など厳しめ設定 → 後で緩める。
- root はサービスロールキーで RLS バイパスする想定を明示。

### 1-4. Mux セットアップ
- アカウント作成、API キー発行。
- アップロード方式を決定（MVP はシンプル direct upload + パブリック再生 URL で十分）。
- アセット作成時の webhook URL を Supabase Edge Functions にルーティングする設計を確立。

### 1-5. Gemini 設定
- Google Cloud プロジェクト作成、Gemini 3（または最新）の API を有効化。
- API キー発行、Supabase Edge Functions へ環境変数として安全に注入する方法を決定。

---

## 2. Phase 2（Day 4–10）Flow → Stock の“1 本線”構築
### 2-1. Flutter アプリ：Auth & ベース構造
- Flutter プロジェクト作成、主要パッケージ導入：
  - `supabase_flutter`
  - `riverpod` or `hooks_riverpod`
  - `camera` / `image_picker` など
  - `isar`（ローカルキュー用。後から導入でも可）
- 基本画面フロー：`SplashScreen → AuthScreen → HomeTimelineScreen`
- Supabase Auth でメールリンク / Magic Link ログインを実装。

### 2-2. Flow 画面（録画 → ローカル保存 → アップロード）
- **ゴール**：長押し録画 → 手を離すとタイムラインに仮カード → バックグラウンドで Mux アップロード。オフラインはローカルキューで再送。
- **実装順**
  1. UI 骨組み：撮影ボタン（長押し）、ダミーのタイムラインカード。
  2. ローカル保存キュー：`isar` に `pending_uploads` テーブル（`file_path` / `store_id` / `user_id` / `created_at`）。
  3. アップロード Worker：アプリ起動時 + interval でネットワーク状況を確認し、順次 Mux へ送信。
  4. 成功時：Supabase の `handovers` に `ai_status='pending'` でレコード作成し Optimistic UI を更新。

### 2-3. Edge Functions：Mux Webhook → Gemini
- **mux_webhook**
  - 受信：`asset_id`, `playback_id` など。
  - 対応 handover を検索し、`hls_url`, `thumbnail_url`, `ai_status='ready_for_ai'` に更新。
  - `ai_process_handover` をキック（同期/非同期どちらでも可）。
- **ai_process_handover**
  - 入力：`handover_id`。
  - `hls_url` を Gemini に渡し要約・手順・Tips を取得。
  - `manuals` or `handovers` 拡張テーブルに draft 保存、`ai_status='draft_created'` に更新。
- 実装言語は TypeScript を推奨。将来 FastAPI へ移行する際はこの関数を移植するだけで済む構造に。

---

## 3. Phase 3（Day 11–20）Stock 承認フロー & 負債返済
### 3-1. Manager 向け UI（Draft → Published）
- `ManualListScreen`：ステータスフィルタ（`draft` / `published`）。
- `ManualDetailScreen`：AI 生成サマリ（3 行要約 / 手順 / 注意ポイント）と「承認して公開」ボタン（manager のみ）。
- ロール制御：`memberships.role` をフェッチし UI 分岐。RLS でも server 側チェックを必須化。

### 3-2. AI 品質検証フロー
- `manual_edits` テーブルで修正時間・差分を計測：
  - `edit_start_at`, `edit_end_at`, `diff_summary` などを記録。
- これにより「AI を使わない場合との比較」を定量化し、v8.5 の「心理的安全性 + 効率」仮説を検証。

### 3-3. 負債返済（L0 → L1）
- VideoService を抽出し、`upload()` / `getPlaybackUrl()` などを集約。Mux SDK 直叩きから脱却。
- AiService を用意し、Gemini 呼び出しロジックを 1 ファイルへ集中させる（Vertex への切替を想定）。
- よく使う DB クエリを Repository 化（`HandoverRepository`, `ManualRepository`）。
- それ以外は MVP では直書きで構わない。

---

## 4. コスト監視とメトリクス
### 4-1. コスト閾値メモ
- 毎月 / 週次で以下を計測（手計算でもよい）：
  - 店舗あたり平均動画投稿数
  - 1 動画あたり Mux + Gemini の従量コスト
  - `Standard Plan (9,800円)` に対する比率
- 将来的には Supabase Edge or Cron を用いて「今月の推定コスト」を Slack 通知。Mux 15% / AI 20% 超過でログ出力 + エスカレーション。

### 4-2. PMF 用メトリクス
- Supabase → BigQuery 連携、もしくは Supabase SQL だけでも可。
- **日次・週次**：Flow 投稿数 / Flow→Stock 変換数 / Manager 承認数
- **月次**：M1 / M3 Retention、店舗ごとの継続率

---

## 5. 実装順チェックリスト
1. **Step 0：準備**
   - Git リポジトリ作成
   - Supabase プロジェクト作成
   - Mux / Gemini / Sentry アカウント取得
2. **Step 1：DB & RBAC**
   - `organizations` / `stores` / `users` / `memberships` / `handovers` / `manuals` 作成
   - roles（root/admin/owner/manager/staff）運用方針確定
   - RLS を厳しめに設定（後で緩める）
3. **Step 2：Flutter ベース**
   - Auth → Home の遷移
   - タイムラインのダミー表示
   - 撮影 UI（処理は未接続で可）
4. **Step 3：Mux 連携**
   - 動画アップロード実装
   - `handovers` レコード作成
   - Optimistic UI 適用
5. **Step 4：Edge & Gemini**
   - `mux_webhook` 関数
   - `ai_process_handover` 関数
   - `manuals` に draft 保存
6. **Step 5：Manager フロー**
   - マニュアル一覧
   - 詳細 & 承認ボタン
   - ロール判定（UI + RLS）
7. **Step 6：負債返済（抽象化）**
   - VideoService 抽出
   - AiService 抽出
   - Repository 化

---

この手引書に沿い、Phase ごとのマイルストーンとコスト監視指標をチームで共有することで、要件定義書 v8.5 の UX ゴール（7 日以内の教育コスト削減体験）に整合した実装を最速で進められる。

