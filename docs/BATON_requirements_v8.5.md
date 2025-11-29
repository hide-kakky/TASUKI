# BATON 要件定義書 v8.5r1（正式・統合版 / Full Spec）

| 項目 | 内容 |
| --- | --- |
| Date | 2025-11-24 |
| Author | 柿澤（Founder / PM） |
| Status | Formal Specification（Engineering-Ready） |
| 変更履歴 | `v8.5r1` – 可読性向上と不明点の補足（2025-11-24） |

---

## 0. エグゼクティブサマリ
- BATON は飲食店現場の暗黙知を Flow（現場入力）→ Stock（知識化）で自動資産化する AI ネイティブ OS。  
- 「新人が辞めない店を技術でつくる」ことが唯一の目的。7 日以内に「教育コストが下がった」と実感できる UX を提供する。  
- MVP のスコープは Flow→Stock の 1 本線に集中し、Evaluation は PMF 後に解禁。  
- プライマリ KPI は M3 Retention（チャーン率）。先行指標は Flow 投稿数 / Flow→Stock 変換率 / Manager 承認率。  
- Golden Stack：Frontend=Flutter/Riverpod/isar、Backend=Supabase、Video=Mux、AI=Gemini 3。個人開発速度と将来 GCP への卒業容易性を両立。  
- コストガード：Mux 15%・Gemini 20%（ARPU 比）を越えると内製移行（GCP）を検討。  

---

## 1. ミッション & VDS
### 1.1 Mission
Flow→Stock 自動化により暗黙知を可視化し、7 日以内に教育負荷低下を体感させることで新人離職を抑止する。

### 1.2 Vision / Design / Strategy
- **Vision**：名もなき貢献が消えず、多国籍・多店舗環境でも誤解のない職場を実現。  
- **Design 原則**：Zero-Friction Input、Text-First UX、Safety First（心理的安全性）、Layered Abstraction。  
- **Strategy**：MVP は Flow→Stock に限定。PMF 指標=M3 Retention。技術負債は Phase2 で 40% を返済。AI 評価は Phase4 で解禁。Mux/Gemini コストを ARPU 比で管理。

---

## 2. プロダクトゴールと KPI
### 2.1 Activation 価値
1. Flow 投稿後数分で Stock が AI により自動生成される。  
2. 店長は「AI が勝手にマニュアル化した」という体験を 7 日以内に得る。  
3. Flow 投稿頻度と Manager 承認を並行モニタリングし、成功体験を定量把握。

### 2.2 指標体系
| 種別 | 指標 | 目標 / 備考 |
| --- | --- | --- |
| 主指標 | M3 Retention | チャーン率。Activation 成功が前提。 |
| 先行指標 | 1 週間の Flow 投稿数 | 上昇傾向を維持。 |
| 先行指標 | Flow→Stock 変換成功率 | 90% 以上（AI 処理失敗は自動再送）。 |
| 先行指標 | Manager 承認率 | 承認 or 差戻し完了率 80% 以上。 |
| 補助 | 店舗内 DAU | 店舗ごとのアクティブ率。 |
| 補助 | 初回 Stock 化までの時間 | 7 日以内に 1 回以上。 |
| コストガード | Mux コスト（ARPU 比） | 15% 以下。超過時は VideoService で GCP へ切替検討。 |
| コストガード | Gemini コスト（ARPU 比） | 20% 以下。同上。 |

---

## 3. スコープとリリースフェーズ
### 3.1 フェーズ概要（20 日ロードマップ）
| Phase | 日数 | ゴール | 主担当 |
| --- | --- | --- | --- |
| Phase1（Day1-3） | 3 日 | Supabase/DB/RBAC/Mux/Gemini の芯を構築 | Infra + Backend |
| Phase2（Day4-10） | 7 日 | Flow→Mux→Stock Draft の 1 本線を通す | Frontend + Edge |
| Phase3（Day11-20） | 10 日 | Manager 承認 UI、AI 品質計測、L0→L1 リファクタ | 全員 |

### 3.2 優先度分類
| Priority | 内容 |
| --- | --- |
| **MUST（MVP）** | 長押し録画、オフライン保存→再送、Mux アップロード、Webhook→Edge→Gemini、AI 要約/手順生成、Manager 承認 |
| **SHOULD** | タグ検索、並び替え、店舗別設定 |
| **LATER（PMF 後）** | Evaluation（AI 貢献抽出・月次レポート）、行動抽出、LLM モデル自動選択 |

---

## 4. ペルソナと主要ユースケース
| ペルソナ | 目的 | 主な画面 / アクション |
| --- | --- | --- |
| Staff | 暗黙知の録画・共有。操作は押すだけで終わること。 | Flow 撮影 UI、オフライン投稿キュー、タイムライン |
| Manager | AI が生成したマニュアルの品質確認と承認、スタッフ招待。 | Stock リスト、詳細・承認、メトリクス表示 |
| Owner | 店舗・プラン管理、manager 任命。 | 組織管理画面（Phase1 は最小） |
| Admin（将来） | 組織作成/停止、監査ログ参照。 | Supabase / 管理ツール |
| Root（開発者） | スキーマ変更、AI モデル切替。 | サーバーサイドのみ |

### 4.1 代表的なユーザーフロー
1. **Flow 投稿**：Staff が長押し録画 → 即座にタイムラインへ仮カード表示（Optimistic UI）。  
2. **自動アップロード**：オンライン時は即 Mux、オフライン時は `pending_uploads` に保存しネット復帰で再送。  
3. **AI 変換**：Mux Webhook → Edge Function → Gemini で要約/手順/Tips を作成し draft 保存。  
4. **Manager 承認**：Manager がドラフトを確認、必要なら修正時間を記録しつつ公開。  

---

## 5. アーキテクチャ & 技術選定
### 5.1 Golden Stack
| レイヤ | 採用技術 | 選定理由 |
| --- | --- | --- |
| Frontend | Flutter + Riverpod + isar | モバイル/デスク共通、状態管理とオフライン DB（isar）を両立。 |
| Backend | Supabase（Auth / RLS / PostgreSQL / Edge / Storage） | RLS/認証が揃い、個人開発速度が最速。 |
| Video | Mux（アップロード / HLS / サムネ自動生成） | 動画基盤をゼロ構築にし、Webhook で AI パイプラインを起動。 |
| AI | Gemini 3（要約・翻訳・構造化） | 長文要約と多言語翻訳に強い。将来 Vertex へ移行しやすい。 |
| Monitoring | Sentry | モバイル / Edge 双方のクラッシュ捕捉。 |

### 5.2 抽象化レイヤ
| レベル | 目的 | 実装ガイド |
| --- | --- | --- |
| **L0 (MVP)** | 最短構築 | 画面→Supabase CRUD を直呼び。Mux/Gemini は専用 Service レイヤ必須。 |
| **L1 (運用開始)** | 重複削減 | Repository 導入、Edge Functions は 1 ユースケース=1 ファイル。 |
| **L2 (スケール)** | 切替容易性 | VideoService で Mux/GCP を抽象化、AI モデルも Gemini/Vertex/hotfix 切替。RLS + Row Ownership を厳格化。 |

### 5.3 AI パイプライン（Flow → Stock）
1. 撮影（端末）  
2. Mux で自動 HLS 変換 & サムネ生成  
3. Webhook 受信（Edge Function `mux_webhook`）  
4. Supabase 内 `handovers` 更新（`ai_status='ready_for_ai'`）  
5. `ai_process_handover` が Gemini へリクエスト  
6. 要約・手順・Tips を `manuals` に draft 保存  
7. Manager 承認後 `status='published'`  

性能目標：Mux 変換 + Gemini 推論で 30〜90 秒以内。Webhook→Draft 保存のリトライを Edge 側で実装。

---

## 6. データモデル & RBAC
### 6.1 エンティティ概要
| テーブル | 目的 | 主なカラム（例） |
| --- | --- | --- |
| `organizations` | テナント単位 | `id`, `name`, `plan`, `billing_meta` |
| `stores` | 店舗単位 | `id`, `organization_id`, `name`, `timezone` |
| `users` | アプリユーザー | `id`, `auth_user_id`, `display_name`, `language`, `meta` |
| `memberships` | ユーザー権限 | `user_id`, `store_id`, `role`, `status`, `invited_by` |
| `handovers` | Flow（動画） | `id`, `store_id`, `author_id`, `mux_asset_id`, `hls_url`, `thumbnail_url`, `ai_status`, `local_offline_flag`, `captured_at`, `meta` |
| `manuals` | Stock（AI or 手動） | `id`, `handover_id`, `ai_summary`, `ai_steps`, `ai_tips`, `status`, `approved_by`, `published_at`, `edit_metrics` |
| `ai_jobs` | AI 処理状況 | `id`, `handover_id`, `stage`, `retries`, `error_code`, `payload` |
| `audit_logs` | root/admin 用 | `id`, `actor_id`, `action`, `target`, `payload`, `created_at` |
| `manual_edits` | Manager 修正計測 | `manual_id`, `editor_id`, `edit_start_at`, `edit_end_at`, `diff_summary` |

### 6.2 Flow / Manual ステータス
| フロー | ステータス | 説明 |
| --- | --- | --- |
| Handovers.ai_status | `pending_upload` → `uploaded` → `ready_for_ai` → `ai_running` → `draft_created` → `failed` | `failed` は Edge で自動再送。 |
| Manuals.status | `draft` → `approved` → `published` | Manager が `approved` にすると店舗全員に公開。 |

### 6.3 RBAC（RLS 前提）
| ロール | 権限概要 |
| --- | --- |
| **root** | 全組織アクセス、RLS バイパス、Schema 変更、AI モデル切替、不正組織凍結。開発者専用。 |
| **admin** | 組織作成/停止、Owner 再発行、店舗復元、監査ログ閲覧（CS/運営向け）。 |
| **owner** | 店舗作成/削除、manager 任命、プラン変更、全 Flow/Stock 閲覧。 |
| **manager** | Stock 承認、スタッフ招待、マニュアル管理。 |
| **staff** | Flow 投稿、Stock 閲覧。 |

**RLS 方針**  
- デフォルトは `owner` のみ読み取り可 → 段階的に `manager` / `staff` に開く。  
- `handovers` / `manuals` は同一 `store_id` のメンバーのみアクセス。  
- `root` はサービスロールキーでバイパス。  

---

## 7. 機能要件（詳細）
### 7.1 Flow（スタッフ向け）
- 長押し録画で動画/音声を取得。  
- 離脱フリクションを下げるため UI は押すだけ、録画上限は 120 秒目安（後日調整）。  
- オフライン時は isar の `pending_uploads` に格納し、アプリ再起動 or ネット復帰時に再送。  
- アップロード完了前でもタイムラインに仮カードを表示（Optimistic UI）。  
- `ai_status` をバッジ表示し、`failed` 時は再送ボタンを表示。  

### 7.2 Stock（マネージャー向け）
- `draft` 一覧/フィルタ。  
- 3 行要約、ステップ、Tips をカード表示。  
- Manager は編集 → 承認（`approved`）→ 公開（`published`）を一気に行える。  
- 承認時に `manual_edits` に修正時間、差分カテゴリを記録。  
- ロールチェックは UI + RLS の両方で実施。  

### 7.3 Admin / Owner
- Owner：店舗作成、manager 任命、プラン更新。  
- Admin/root：監査ログ、AI モデル切替。MVP では CLI or Supabase ツールで操作。  

### 7.4 AI 要件
- Gemini 3 で要約/手順/Tips を生成。多言語対応（入力と出力の locale は `users.language` に基づく）。  
- `ai_jobs` で状態を管理し、失敗時は 3 回まで自動リトライ。  
- 店長からの修正を `manual_edits` に保存し、Phase4 で評価モデルへフィードバックできるようにする。  

---

## 8. 非機能要件（NFR）
| 分類 | 目標 / 要件 |
| --- | --- |
| 性能 | タイムライン描画 1 秒以内。アプリ起動 2 秒以内。AI 処理 30〜90 秒。 |
| 可用性 | Supabase 99.9%、Mux 99.99%。完全オフライン投稿（再送）をサポート。 |
| セキュリティ | JWT、RLS、店舗間データ隔離、root/admin 監査ログ。Mux/Gemini API キーは Edge Functions 側で管理。 |
| コスト | Mux 15%、Gemini 20%（ARPU 比）の閾値を毎週チェック。超過時は Video/AI Service を GCP へ差し替える準備。 |
| 信頼性 | Webhook / Edge Function は冪等設計（Mux asset_id / handover_id でロック）。 |

---

## 9. メトリクス & オブザーバビリティ
- **ロギング**：Edge Functions で重要イベント（webhook 受信、AI 失敗）を構造化ログ化。  
- **ダッシュボード**：Flow 投稿数 / 変換数 / 承認数を Supabase SQL か BigQuery で可視化。  
- **コスト監視**：Supabase Edge or Cron で試算 → Slack 通知。Mux 15%、Gemini 20% 突破で警告。  
- **QA 指標**：初回 Stock 化までの日数を追跡し、7 日以内体験が多店舗で再現されているかを棚卸。  

---

## 10. 開発ロードマップ（20 日詳細）
1. **Day1-3**：Auth / RLS / Mux 接続。DB スキーマ & RLS 骨組み。  
2. **Day4-7**：Flow UI、オフライン保存、Mux アップロード、Optimistic UI。  
3. **Day8-10**：Webhook / Edge / Gemini 解析、`manuals` draft 保存。  
4. **Day11-14**：Manager 承認フロー、ロール判定、manual_edits 記録。  
5. **Day15-20**：負債返済（L0→L1 抽象化）、UI ポリッシュ、QA、コスト監視スクリプト。  

---

## 11. 移行・卒業戦略（Supabase → GCP）
### 11.1 トリガー
- ARR 1 億円  
- Mux コスト > 売上 15%  
- AI コスト > 売上 20%  
- 店舗数 100 超  

### 11.2 移行内容
| 項目 | Supabase/Mux からの移行 | 準備（L2 抽象化で対応） |
| --- | --- | --- |
| DB | `pg_dump` → Cloud SQL | Repository 層と型の共通化 |
| 動画 | Mux → GCS + Transcoder | VideoService でエンドポイントを切替 |
| AI | Gemini → Vertex AI | AiService でモデル ID を切替 |
| Backend | Edge Functions → Cloud Run | API 契約を REST 化 |

---

## 12. リスク & オープン課題
| リスク / 課題 | 深掘り・改善内容 | 対応方針 |
| --- | --- | --- |
| RLS 設計の複雑化 | 店舗/組織ロールの被り時のアクセス制御 | Phase1 で「owner のみ許可」から開始し、Step 閉塞を防ぎながら段階的に緩和。 |
| オフライン動画サイズ | 大容量動画の端末保存と再送失敗 | 録画時間を 120 秒目安に制限。将来的に画質設定オプションを検討。 |
| AI 品質ムラ | 店舗/言語別の品質差 | `manual_edits` のログで修正量を可視化し、Gemini プロンプト調整に活用。 |
| コスト超過 | Mux/Gemini 従量課金 | 週次レポート + 閾値超過時の Slack 通知を Phase3 で必須化。 |
| 多国籍利用時の誤解 | 自動翻訳の文脈欠落 | Gemini 出力に `contextual_tips` を追加し、多言語 QA を実施。 |

---

## 13. 結論
BATON v8.5r1 は、現場負荷ゼロ × AI 自動化 × 心理的安全性 × スケール設計を同時に満たす正式な要件定義。MVP は Flow→Stock の一気通貫に集中し、OODA と Retention を最優先で市場学習を実施する。データ蓄積に応じて Evaluation を段階的に開放し、抽象化レイヤにより GCP への卒業も最小差分で実現可能。

