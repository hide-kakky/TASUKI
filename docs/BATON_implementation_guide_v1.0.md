# BATON 実装手引書 v1.0r1

| 項目 | 内容 |
| --- | --- |
| ベース要件 | `docs/BATON_requirements_v8.5.md` |
| 対象期間 | 20 日（Phase1〜3） |
| 想定チーム | Founder/PM + 個人開発メイン（複数人にも対応） |

---

## 0. 全体像（4 レイヤ × 3 フェーズ）
### 0.1 レイヤ定義
1. **インフラ・SaaS 設定**：Supabase, Mux, Gemini, Sentry, Slack 通知。  
2. **データモデル & 権限**：Postgres スキーマ、RLS、RBAC（root〜staff）。  
3. **バックエンドフロー**：Supabase Edge Functions（Webhook / AI 解析 / Cron）。  
4. **フロントエンド**：Flutter アプリ（Auth / Flow UI / Stock UI / Offline）。  

### 0.2 フェーズとゲート
| Phase | 日数 | ゴール | 完了条件（DoD） |
| --- | --- | --- | --- |
| Phase1 | Day1-3 | インフラ・DB の芯を構築 | Supabase スキーマ + RLS 骨組み、Mux/Gemini API と Edge runtime が動く |
| Phase2 | Day4-10 | Flow→Mux→Stock Draft の 1 本線 | 端末 → Mux → Gemini → `manuals.draft` まで E2E 動作 |
| Phase3 | Day11-20 | Manager 承認フローと負債返済 | Manager UI で承認→公開、manual_edits 記録、Services/Repositories 抽象化 |

---

## 1. Phase 1（Day1-3）インフラ & DB の芯
### 1.1 リポジトリ & 環境
- モノレポ（`baton/`）推奨。`apps/app`（Flutter）と `apps/edge` を siblings に配置。  
- `.env` 方針：`direnv` + `.envrc`。Secrets は 1Password or Supabase secrets → Edge Functions へ注入。  
- CI まではローカルで十分だが、`melos` or `justfile` で共通コマンドを定義しておく。  

### 1.2 Supabase プロジェクト
1. プロジェクト作成 → `supabase init`。  
2. テーブル作成（`schema.sql` に定義）：`organizations`, `stores`, `users`, `memberships`, `handovers`, `manuals`, `ai_jobs`, `audit_logs`, `manual_edits`。  
3. `users` は `auth.users` を参照する `profiles` view を推奨（`auth.uid()` 取得を簡単にするため）。  
4. 曖昧な領域は `jsonb meta` を保持して OODA の余地を確保。  

### 1.3 RBAC & RLS 骨組み
- `memberships.role` に `owner/manager/staff` を格納。`root/admin` は別テーブル or Supabase `auth.users.raw_app_meta_data`.  
- 初期 RLS 方針：`owner` のみ読み取り可（`auth.uid()` と `memberships.role='owner'` を突き合わせ）。  
- `handovers` / `manuals` は `store_id` ベースでアクセス制御。`root` はサービスロールキーで `alter policy` によるバイパス。  
- RLS を ON にしたら、Supabase SQL Editor で必ず SELECT/INSERT テストを実施。  

### 1.4 Mux セットアップ
- アカウント作成 → トークン発行。  
- MVP は **シンプル direct upload + パブリック再生 URL** を採用。将来サイン済み URL に切替予定。  
- Webhook URL（例：`https://<project>.functions.supabase.co/mux_webhook`）を Mux 設定に登録。  
- アセット作成時に `playback_id` と `asset_id` を取得できるようイベントタイプを有効化。  

### 1.5 Gemini 設定
- Google Cloud プロジェクトを作成し Gemini 1.5/3 を有効化。  
- API キーは Supabase Edge Functions に `supabase secrets set GEMINI_API_KEY=...` で登録。  
- 出力言語はユーザー `language` を参照して決めるため、Edge 側で `locale` を受け取れるようにする。  

### 1.6 Phase1 チェックリスト
- [ ] レポジトリ構成と `.env` 方針のドキュメント化  
- [ ] Supabase スキーマ + RLS（owner のみ）  
- [ ] Mux アップロード & Webhook 疎通テスト  
- [ ] Gemini API キー & Hello world 呼び出し  
- [ ] Sentry DSN を Flutter / Edge に仮設定  

---

## 2. Phase 2（Day4-10）Flow → Stock の 1 本線
### 2.1 Flutter アプリ基盤
- `flutter create baton_app` → `riverpod`, `supabase_flutter`, `camera`, `image_picker`, `permission_handler`, `isar` を導入。  
- 画面構成：`SplashScreen`（セッション確認）→ `AuthScreen`（Magic Link）→ `HomeTimelineScreen`。  
- Supabase Auth：メールリンクでログイン、`supabase.auth.onAuthStateChange` を購読。  

### 2.2 Flow 録画〜アップロード
1. **UI**：長押しボタン + 録画タイマー + アップロード状況バッジ。  
2. **ローカルキュー**：`isar` に `pending_uploads(id, file_path, store_id, user_id, created_at, retry_count, checksum)`。  
3. **アップロード Worker**：  
   - アプリ起動時 + 5 分間隔で実行。  
   - ネットワーク確認（`connectivity_plus`）。OK なら FIFO で Mux にアップロード。  
   - 成功後 `handovers` に INSERT（`ai_status='pending_upload'`）。  
4. **Optimistic UI**：`handovers` INSERT 直後にタイムラインへ仮カード追加。Edge からの更新を Supabase Realtime で受信。  
5. **失敗リカバリ**：`retry_count` を持たせ、3 回失敗でユーザー通知。  

### 2.3 Edge Functions（TypeScript）
#### mux_webhook
- 入力：Mux からのイベント（`asset_id`, `playback_ids`, `status` など）。  
- 処理：対応する `handover` を `asset_id` で検索し、`hls_url`, `thumbnail_url`, `ai_status='ready_for_ai'` を更新。  
- その後 `ai_process_handover` を非同期キック（`supabase.functions.invoke` or Supabase Cron）。  

#### ai_process_handover
- 入力：`handover_id`。  
- 処理フロー：  
  1. `handovers` から `hls_url` と `language` 情報を取得。  
  2. Gemini へ `system prompt + user prompt` を送信し、要約/手順/Tips を取得。  
  3. `manuals` または `handovers` 拡張テーブルに `draft` として保存。  
  4. `ai_status='draft_created'`, `ai_jobs` を更新。失敗時は `ai_status='failed'` + リトライ。  
- 例外は Sentry と `ai_jobs.error_code` に記録。  

### 2.4 テスト & DoD
- 端末で Flow 録画 → タイムライン仮カード → 30〜90 秒内に draft 作成 → Supabase で確認。  
- オフライン→オンライン遷移時に自動アップロードされること。  
- Webhook 冪等性：同一イベントを 2 回送っても状態が壊れないことを確認。  

---

## 3. Phase 3（Day11-20）承認フロー & 負債返済
### 3.1 Manager UI（Flutter）
- `ManualListScreen`：`draft/published` フィルタ、検索、ソート。  
- `ManualDetailScreen`：AI 生成コンテンツ、動画サムネ、承認/差戻しボタン。  
- Manager のみ操作可能（`memberships.role` を取得し `state.role >= manager` で制御）。  
- 承認時：`manuals.status='published'`, `approved_by`, `published_at` を設定。  

### 3.2 AI 品質ログ
- 編集開始/終了を計測する `manual_edits` テーブルを利用。  
- Flutter 側で編集モード開始時に API へ `start` を記録、保存時に `end` を送信。  
- 差分カテゴリ（`typo`, `translation`, `missing_step`, `safety_issue` など）を選択式で記録。  

### 3.3 負債返済（L0→L1 最小リファクタ）
- **VideoService**：Mux SDK 呼び出しを集約。メソッド例：`upload(File file, Meta meta)`, `getPlaybackUrl(assetId)`.  
- **AiService**：Gemini リクエストを集約し、`prompt` と `locale` を明示的に扱う。  
- **Repository**：`HandoverRepository`, `ManualRepository` を導入。Supabase クエリを共通化し、将来 Cloud SQL に差し替え可能な形にする。  
- **エラーハンドリング**：Service 層で共通例外を投げ、UI 側は SnackBar + 再試行。  

### 3.4 コミットメント
- Phase3 終了時点で「Flow → Draft → 承認 → 公開 → Metrics 記録」まで 1 時間以内にデモ可能な状態にする。  
- コスト監視スクリプトを Edge Cron で 1 日 1 回実行し、Mux/Gemini 推定コストと ARPU 比を Slack へ投稿。  

---

## 4. コスト & メトリクス実装 Tips
### 4.1 コスト監視
- Supabase から月次の Flow 数を取得し、Mux/Gemini の従量単価を掛けて推定。  
- `mux_cost_ratio = (mux_unit_cost * flow_count) / ARPU`。閾値を越えたら `warnings` テーブルに記録。  
- Cron → Slack Webhook（Incoming Webhook）で通知。  

### 4.2 PMF 指標
- Supabase SQL 例：  
  ```sql
  select store_id,
         count(*) filter (where flow_to_stock_success) as flow_stock_count,
         count(*) filter (where manager_approved) as approved_count
  from daily_metrics
  where date between current_date - interval '7 day' and current_date;
  ```
- BigQuery 連携は Phase3 以降。初期は Supabase ダッシュボードで十分。  

### 4.3 オブザーバビリティ
- Flutter：`SentryFlutter.init`, `Logger` で重要イベントを残す。  
- Edge：`console.log(JSON.stringify(event))` + Supabase `log_metrics` テーブル。  
- 重要メトリクス：Flow 投稿数、アップロード失敗数、AI 失敗数、Manager 承認率。  

---

## 5. 実装チェックリスト（総括）
| Step | 内容 | 担当 | ステータス |
| --- | --- | --- | --- |
| 0 | Git リポジトリ、Supabase プロジェクト、Mux/Gemini/Sentry アカウント | PM/Dev |  |
| 1 | DB & RBAC：テーブル作成、roles 方針、厳しめ RLS | Backend |  |
| 2 | Flutter ベース：Auth→Home、タイムラインダミー、録画 UI 骨組み | Frontend |  |
| 3 | Mux 連携：アップロード、`handovers` 作成、Optimistic UI | Frontend + Backend |  |
| 4 | Edge & Gemini：`mux_webhook`, `ai_process_handover`, draft 保存 | Backend |  |
| 5 | Manager フロー：一覧、詳細、承認、ロール判定 | Frontend |  |
| 6 | 負債返済：VideoService/AiService、Repository 化 | 全員 |  |
| 7 | コスト監視 & メトリクス：Cron + Slack、ダッシュボード | Backend |  |

---

## 6. 未決事項 & 深掘りポイント
| 項目 | 内容 | 期限 |
| --- | --- | --- |
| プロンプト最適化 | Gemini へ渡すフォーマット（動画リンク + 店舗文脈 + 期待フォーマット） | Phase2 終了前にドラフト確定 |
| 多言語サポート | `users.language` と `manuals` のロケール戦略 | Phase3 で最小実装 |
| 店舗権限の衝突 | Owner/Manager を複数店舗跨ぎで持つ場合の UI 表現 | Phase2 後半で検証 |
| SSO/2FA | 将来の要望に備え構成をどうするか | PMF 後（Phase4） |

---

## 7. 参考ドキュメント
- 要件定義：`docs/BATON_requirements_v8.5.md`  
- CODEX 誘導：`CODEX_PROMPT.md`, `agent.md`, `plan.md`  
- Slack / Sentry / Supabase CLI のセットアップメモは `docs/ops/`（別途作成予定）  

この手引書に沿って Phase ごとの成果物・テストを明確にし、チーム全体が 7 日以内の教育コスト削減体験を再現できる状態を保つ。

