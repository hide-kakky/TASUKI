# BATON 要件定義書 v8.5（正式・統合版 / Full Spec）

- Date: 2025-11-24
- Author: 柿澤（Founder / PM）
- Status: Formal Specification (Engineering-Ready)

---

## 1. プロダクト定義（Project Definition）

### 1.1 ミッション
BATON は、飲食店の「引き継ぎ」「暗黙知」「教育」の高度な属人化を、Flow（現場入力）→ Stock（知識化）の自動パイプラインで資産化する AI ネイティブ業務 OS である。目的はただひとつ：「新人が辞めない店を技術でつくる」。そのために、7 日以内に「教育コストが下がった」と実感できる UX を提供する。

### 1.2 VDS（Vision / Design / Strategy）
- **Vision**
  - 名もなき貢献が消えない職場をつくる
  - 多国籍・多店舗環境でも誤解のないコミュニケーションを支える
- **Design**
  - Zero-Friction Input（押すだけ・撮るだけ）
  - Text-First UX（動画 → 文字 → 構造化）
  - Safety First（AI 評価＝PMF 後、心理的安全性を損なわない）
  - Layered Abstraction（作りすぎない／拡張できる）
- **Strategy**
  - MVP は Flow→Stock に限定
  - PMF 判定指標は M3 Retention（チャーン率）
  - AI 評価（Evaluation）は Phase 4 で解禁
  - 技術的負債は「意図的に持ち」、Phase2 で 40% を負債返済へ
  - コスト管理（AI/Mux）は ARPU 比で閾値を明示

## 2. 技術アーキテクチャ（Golden Stack + OODA 最適化）

### 2.1 Golden Stack
| レイヤ | 技術 |
| --- | --- |
| Frontend | Flutter + Riverpod + isar |
| Backend | Supabase（Auth / RLS / PostgreSQL / Edge / Storage） |
| Video | Mux（アップロード・HLS・サムネ自動生成） |
| AI | Gemini 3（要約・翻訳・構造化） |

**理由**
- 個人開発で最速
- RLS・Auth が完成している
- Mux によって動画基盤を “ゼロ構築” にできる
- 将来 GCP（Cloud SQL / Vertex / Cloud Run）へ卒業可能

## 3. 抽象化レイヤ（開発速度 × スケールの両立）
- **Level 0（MVP）**：Supabase CRUD を画面から直接呼び出し。Mux / Gemini は Service 層で分離（必須）。
- **Level 1（運用開始）**：DB アクセスの重複箇所から Repository 化。Edge Functions は 1 ユースケース＝1 ファイル。
- **Level 2（スケール）**：Repository を完全導入。VideoService で Mux ⇄ GCP を切替。AI モデル抽象化レイヤで Gemini ⇄ Vertex/hotfix モデルを切替。RLS + Row Ownership を厳格化。

## 4. RBAC（改訂版：5 階層）
- **root（プラットフォーム最上位）**
  - 全組織・全店舗へのアクセス
  - RLS バイパス
  - Schema 変更
  - AI モデル切替
  - 不正組織の凍結
  - → “開発者専用”（あなたのみ）
- **admin（プラットフォーム管理者）**
  - 組織作成/停止
  - Owner の再発行
  - 店舗の復元
  - 組織単位の監査ログ参照
  - → 将来の CS/運営担当向け
- **owner（組織の代表者）**
  - 店舗作成・削除
  - manager 任命
  - プラン変更
  - 全 Flow/Stock 閲覧
- **manager（店長）**
  - Stock 承認
  - スタッフ招待
  - マニュアル管理
- **staff**
  - Flow 投稿
  - Stock 閲覧

## 5. ドメインモデル

### 5.1 テナント構造
- organizations
- stores
- users
- memberships（role / status）

### 5.2 Flow（動画/音声の引き継ぎ）
- **項目**：mux_asset_id / hls_url / thumbnail_url / ai_status / local_offline_flag
- **動線**：長押し録画 → Optimistic UI → 自動再送 → Stock へ

### 5.3 Stock（マニュアル化）
- ai_summary
- ai_steps
- ai_tips
- status（draft / approved / published）

### 5.4 Evaluation（MVP では凍結）
- AI 貢献抽出
- 月次レポート
- 心理的安全性を損なわない設計が必要

## 6. コア機能要件（MUST / SHOULD / LATER）
- **MUST（MVP）**：長押し録画 / オフライン保存 → 自動再送 / Mux アップロード / Webhook → Edge → Gemini / 要約・手順抽出（Stock） / Manager 承認
- **SHOULD**：タグ検索 / 並び替え / 店舗別設定
- **LATER（PMF 後）**：Evaluation / 行動抽出・月次レポート / LLM モデルの選択自動化

## 7. AI パイプライン（Flow → Stock）
撮影 → Mux 変換（HLS / サムネ） → Webhook → Edge Function → Gemini → 要約・手順抽出 → draft 保存 → Manager 承認で published。

## 8. 非機能要件（NFR）
- **性能**：タイムライン 1 秒以内 / AI 処理 30〜90 秒 / 起動 2 秒以内
- **可用性**：Supabase 99.9% / Mux 99.99% / 完全オフライン対応
- **セキュリティ**：JWT / RLS / 店舗間のデータ隔離 / root/admin の監査ログ
- **コスト閾値（重要）**：Mux コスト=ARPU の 15% 以下、Gemini コスト=ARPU の 20% 以下。超過時は GCP への卒業検討（動画・AI の内製化）。

## 9. Activation（価値を 7 日以内で体験）
- 初回 Flow → 数分で Stock 化
- 店長が「AI が勝手にマニュアルにしてくれた」を体験
- Flow 投稿頻度を先行指標として監視
- Manager 承認率を補助指標に
- → 7 日以内の成功体験が M3 Retention を決定づける

## 10. PMF 判定フレーム
- **主指標**：M3 Retention（チャーン率）
- **先行指標**：1 週間の Flow 投稿数 / Flow→Stock 変換成功率 / Manager 承認率
- **補助指標**：店舗内 DAU / 初回 Stock 化までの時間

## 11. 開発ロードマップ（20 日）
- Day 1–3：Auth / RLS / Mux 接続
- Day 4–7：Flow UI / オフライン対応 / Mux アップロード
- Day 8–10：Webhook / Edge / Gemini 解析
- Day 11–14：Stock 承認フロー
- Day 15–20：負債返済（L0→L1） / UI polishing / QA

## 12. 移行・卒業戦略（Supabase → GCP）
**移行トリガー**：ARR 1 億円 / Mux コスト > 売上 15% / AI コスト > 売上 20% / 店舗数 100 超  
**移行内容**：DB=pg_dump → Cloud SQL / 動画=Mux → GCS + Transcoder / AI=Gemini → Vertex / Backend=Edge → Cloud Run  
VideoService / AIService の抽象化により最小差分で移行可能。

## 13. 結論
BATON v8.5 は、「現場負荷ゼロ × AI 自動化 × 心理的安全性 × スケール設計 × 個人開発で実現可能」を同時に満たす正式な要件定義書である。MVP は Flow→Stock に集中し、OODA と Retention を最優先して最速で市場学習に入り、データの積み上げと共に Evaluation へ段階拡張していく戦略に最適化されている。

