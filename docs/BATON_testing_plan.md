# BATON テスト計画書 v1.0

本ドキュメントは、BATON プロジェクトの品質保証（QA）およびテスト戦略をまとめたものです。

## 1. テスト戦略概要

MVP フェーズでは、スピードと品質のバランスを重視し、以下の優先順位でテストを実施します。

1.  **Critical User Journeys (CUJ) の手動 E2E テスト**: ユーザー体験の根幹を守る。
2.  **Edge Functions の単体/統合テスト**: 課金やデータ整合性に関わるロジックを保証。
3.  **UI ウィジェットテスト**: 複雑な UI コンポーネント（録画画面など）の動作確認。

## 2. テスト範囲と手法

### 2.1 Backend (Supabase / Edge Functions)
- **RLS ポリシー**: `supabase test db` を使用し、各ロール（Owner/Manager/Staff）からのアクセス権限を検証。
- **Edge Functions**:
    - Deno のテストフレームワークを使用。
    - モック（Mux/Gemini）を用いたロジック検証。
    - 実際の Webhook ペイロードを用いた統合テスト。

### 2.2 Frontend (Flutter)
- **Unit Test**: Riverpod の Provider、Repository 層のロジック。
- **Widget Test**: 共通コンポーネント、録画 UI の状態遷移。
- **Integration Test**: `integration_test` パッケージを用いた主要フローの自動化（Phase 3 以降推奨）。

### 2.3 Manual QA (手動テスト)
実機を用いた検証。特に「オフライン動作」や「カメラ挙動」はエミュレータでは不十分なため必須。

---

## 3. テストケース一覧 (Phase 1-2)

### 3.1 インフラ・DB (Phase 1)
| ID | カテゴリ | テスト内容 | 期待値 |
| :--- | :--- | :--- | :--- |
| DB-01 | RLS | Staff が他店舗のデータを参照 | 0件またはエラー |
| DB-02 | RLS | Manager が `manuals` を INSERT | 成功 |
| DB-03 | RLS | Staff が `manuals` (draft) を参照 | 0件またはエラー |
| API-01 | Edge | `mux_webhook` に不正な署名を送信 | 401 Unauthorized |

### 3.2 Flow → Stock (Phase 2)
| ID | カテゴリ | テスト内容 | 期待値 |
| :--- | :--- | :--- | :--- |
| APP-01 | Offline | オフラインで録画・投稿 | ローカルキューに保存され、エラーにならない |
| APP-02 | Retry | オンライン復帰後にアプリ起動 | 自動的にアップロードが開始される |
| AI-01 | Gen | 動画処理完了通知を受信 | Gemini が起動し、Draft が作成される |
| AI-02 | Error | Gemini がエラー返却 | `ai_jobs` にエラー記録、リトライ待機 |

### 3.3 Google Docs Import (Phase 2)
| ID | カテゴリ | テスト内容 | 期待値 |
| :--- | :--- | :--- | :--- |
| IMP-01 | Valid | 公開された Google Docs URL を入力 | Draft が作成され、本文が取り込まれる |
| IMP-02 | Invalid | 権限のない URL を入力 | エラーメッセージが表示される |
| IMP-03 | AI | AI 整形 ON で取り込み | Summary/Steps/Tips が構造化されて保存される |

---

## 4. バグ報告・管理
- 発見されたバグは `plan.md` の「リスク & オープン課題」または GitHub Issues に起票する。
- 再現手順、環境（OS/端末）、スクリーンショットを含めること。

## 5. 出荷基準 (DoD)
- 全ての Critical テストケース（Priority: High）が Pass していること。
- 既知の重大なバグ（クラッシュ、データ消失）がないこと。
- `plan.md` の各フェーズ完了条件を満たしていること。
