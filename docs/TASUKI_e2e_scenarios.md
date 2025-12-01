# TASUKI E2Eテストシナリオ

本ドキュメントは、TASUKI の主要ユースケースに対するE2Eテストシナリオを定義します。

---

## 1. Flow 録画 → AI 生成 → 承認 (フルパス)

### 1.1 シナリオ概要
Staff が動画を録画し、AI が自動でマニュアル化し、Manager が承認するまでの一連の流れを検証します。

### 1.2 前提条件
- テスト用店舗 (`test_store`) が存在
- テストユーザー:
  - `staff_user@test.com` (role: staff)
  - `manager_user@test.com` (role: manager)
- Mux Webhook が正常に動作
- Gemini API が利用可能

### 1.3 テスト手順

#### Step 1: Staff - Flow 録画
1. `staff_user` でログイン
2. TimelineScreen で録画ボタン（FloatingActionButton）をタップ
3. RecordScreen に遷移
4. 録画ボタンを長押し（10秒間）
5. 長押しを離すと録画終了
6. **期待結果**:
   - タイムラインに仮カード表示（Optimistic UI）
   - `pending_uploads` に保存される
   - ステータス: "アップロード中"

#### Step 2: バックグラウンド処理
7. アップロードが完了するまで待機（最大60秒）
8. **期待結果**:
   - Mux にアップロード成功
   - `handovers` テーブルに INSERT
   - `ai_status = 'pending_upload'` → `'uploaded'`

#### Step 3: Webhook → AI 処理
9. Mux Webhook が `mux_webhook` Edge Function を呼び出し
10. `ai_process_handover` が自動実行
11. **期待結果**:
   - `handovers.ai_status` が `'ready_for_ai'` → `'ai_running'` → `'draft_created'`
   - `manuals` テーブルに draft 作成
   - `ai_summary`, `ai_steps`, `ai_tips` が生成される

#### Step 4: Manager - Draft 確認
12. `manager_user` でログイン
13. Manager 専用タブ（StockListScreen）に移動
14. Draft 一覧から先ほどのマニュアルをタップ
15. **期待結果**:
   - Draft 詳細が表示される
   - AI 生成のサマリ・手順・Tips が確認できる
   - 承認ボタンと差戻しボタンが表示される

#### Step 5: Manager - 承認
16. 承認ボタンをタップ
17. **期待結果**:
   - `manuals.status` が `'draft'` → `'published'`
   - `approved_by` と `published_at` が記録される
   - タイムラインに公開マニュアルとして表示される

#### Step 6: Staff - 公開マニュアル閲覧
18. `staff_user` のアプリを再確認
19. タイムラインに新しいマニュアルが表示される
20. タップして詳細を確認
21. **期待結果**:
   - サマリ・手順・Tips が閲覧できる
   - 動画も再生可能

### 1.4 計測項目
- 録画開始からdraft作成までの時間（目標: 30〜90秒）
- AI生成の品質（手順数、Tips数）
- エラー発生率

---

## 2. Google Docs 取り込みフロー

### 2.1 シナリオ概要
Manager が既存の Google Docs マニュアルを TASUKI に取り込むフローを検証します。

### 2.2 前提条件
- テスト用 Google Docs が公開設定で存在
- `manager_user` でログイン済み

### 2.3 テスト手順

#### Step 1: Manager - マニュアル追加モーダル起動
1. StockListScreen で「追加」ボタンをタップ
2. ImportModal が表示される

#### Step 2: Google Docs URL 入力
3. Google Docs の共有リンクを貼り付け
4. カテゴリを選択（例: "キッチン"）
5. "AI 整形を使用" スイッチを ON
6. 作成ボタンをタップ

#### Step 3: Edge Function 処理
7. `import_google_doc` が実行される
8. Google Docs からテキスト取得
9. Gemini で整形（サマリ・手順・Tips 生成）
10. **期待結果**:
   - `manuals` に `source_type='legacy_import'` で保存
   - `original_doc_url` が記録される
   - `status='draft'`

#### Step 4: Draft 確認と承認
11. Draft 一覧に新しいマニュアルが表示される
12. 詳細を確認し、承認
13. **期待結果**:
   - Google Docs 由来のマニュアルが公開される
   - 一般ユーザーも閲覧可能になる

### 2.4 計測項目
- Google Docs 取得の成功率
- AI整形の品質
- エラー時のリトライ挙動

---

## 3. オフライン → オンライン復帰シナリオ

### 3.1 シナリオ概要
オフライン時に録画した動画が、ネットワーク復帰時に自動アップロードされることを検証します。

### 3.2 前提条件
- `staff_user` でログイン済み
- ネットワーク接続可能

### 3.3 テスト手順

#### Step 1: オフライン状態で録画
1. デバイスを機内モードに設定
2. Flow 録画を実行（10秒間）
3. **期待結果**:
   - `pending_uploads` に保存
   - タイムラインに "オフライン投稿" バッジ付きカード表示

#### Step 2: オンライン復帰
4. 機内モードを解除
5. アプリがネットワーク復帰を検知
6. **期待結果**:
   - 自動的にアップロード開始
   - ステータスが "アップロード中" に変化

#### Step 3: アップロード完了確認
7. アップロードが完了するまで待機
8. **期待結果**:
   - `pending_uploads` から削除される
   - `handovers` に INSERT
   - AI 処理が通常通り実行される

### 3.4 計測項目
- ネットワーク復帰検知の速度
- リトライ回数（3回まで）
- 失敗時のエラーメッセージ表示

---

## 4. 権限別アクセス制御テスト

### 4.1 シナリオ概要
Staff / Manager / Owner の権限に応じて、適切なアクセス制御が行われることを検証します。

### 4.2 テストケース一覧

| ユーザー | 操作 | 期待結果 |
|---------|------|---------|
| Staff | Draft マニュアル閲覧 | ❌ アクセス拒否（RLS） |
| Staff | Published マニュアル閲覧 | ✅ 閲覧可能 |
| Staff | マニュアル承認 | ❌ UI非表示 |
| Manager | Draft マニュアル閲覧 | ✅ 閲覧可能 |
| Manager | マニュアル承認 | ✅ 承認可能 |
| Manager | 他店舗のマニュアル | ❌ アクセス拒否（RLS） |
| Owner | 全マニュアル閲覧 | ✅ 全て閲覧可能 |

### 4.3 テスト手順例（Staff → Draft 閲覧拒否）
1. `staff_user` でログイン
2. Draft マニュアルのIDを直接URLで指定
3. アクセスを試みる
4. **期待結果**:
   - RLS により SELECT が拒否される
   - "権限がありません" エラー表示

---

## 5. AI 品質計測テスト

### 5.1 シナリオ概要
Manager がマニュアルを編集した際、編集時間と修正内容が `manual_edits` に記録されることを検証します。

### 5.2 テスト手順

#### Step 1: Draft マニュアルの編集
1. `manager_user` でログイン
2. Draft 詳細画面で編集ボタンをタップ
3. **期待結果**:
   - `manual_edits` に `edit_start_at` が記録される

#### Step 2: 内容修正
4. AI 生成のサマリを修正（例: 誤字訂正）
5. 手順を1つ追加
6. 保存ボタンをタップ
7. **期待結果**:
   - `edit_end_at` が記録される
   - `diff_summary` に修正カテゴリ（例: `typo`, `missing_step`）が保存される

#### Step 3: メトリクス確認
8. Supabase ダッシュボードで `manual_edits` を確認
9. **期待結果**:
   - 編集時間（秒数）が計算可能
   - 修正カテゴリが集計可能（将来のプロンプト改善に利用）

---

## 6. コスト監視アラートテスト

### 6.1 シナリオ概要
Mux / Gemini のコストが閾値を超えた際、Slack 通知が送信されることを検証します。

### 6.2 テスト手順

#### Step 1: コスト監視 Cron 手動実行
1. Supabase Functions から `cost_monitor` を手動実行
2. または、Cron スケジュールを待つ

#### Step 2: 閾値超過シミュレーション
3. テストデータで大量の Flow を作成（100件以上）
4. 推定コストが Mux 15% または Gemini 20% を超えるように設定

#### Step 3: Slack 通知確認
5. **期待結果**:
   - Slack Incoming Webhook が呼ばれる
   - 通知内容:
     - 現在の Mux コスト比（例: 18%）
     - 現在の Gemini コスト比（例: 22%）
     - 警告メッセージ

---

## 7. 負荷テスト（Bonus）

### 7.1 シナリオ概要
複数ユーザーが同時に Flow を投稿した際の挙動を検証します。

### 7.2 テスト条件
- 10ユーザーが同時に録画開始
- 各動画: 30秒

### 7.3 期待結果
- 全ての動画がアップロード成功
- AI 処理が順次実行される（キューイング）
- エラー率 < 5%

---

これらのE2Eシナリオを実行することで、TASUKI の主要機能が正常に動作し、AIエージェントの自律実装が成功したことを検証できます。
