# TASUKI テストデータ・シナリオ集

本ドキュメントは、TASUKIの実装・テストに使用する具体的なデータとシナリオを提供します。

---

## 1. シードデータ完全版

### 1.1 SQL: 初期データ投入 (`supabase/seed.sql`)

```sql
-- ==========================================
-- 1. Organizations & Stores
-- ==========================================

INSERT INTO organizations (id, name, plan) VALUES
  ('org-test-001', 'テスト飲食グループ', 'pro'),
  ('org-test-002', 'サンプルレストラン株式会社', 'free');

INSERT INTO stores (id, organization_id, name, timezone) VALUES
  ('store-001', 'org-test-001', '銀座本店', 'Asia/Tokyo'),
  ('store-002', 'org-test-001', '渋谷店', 'Asia/Tokyo'),
  ('store-003', 'org-test-002', 'サンプル食堂', 'Asia/Tokyo');

-- ==========================================
-- 2. Users (auth.users は手動作成前提)
-- ==========================================

-- 以下はauth.users作成後に実行
INSERT INTO users (id, display_name, language) VALUES
  ('user-owner-001', '山田太郎（オーナー）', 'ja'),
  ('user-manager-001', '佐藤花子（店長）', 'ja'),
  ('user-manager-002', '鈴木一郎（副店長）', 'ja'),
  ('user-staff-001', 'グエン・ティ・ラン（スタッフ）', 'vi'),
  ('user-staff-002', 'トラン・バン・ミン（スタッフ）', 'vi'),
  ('user-staff-003', '田中次郎（アルバイト）', 'ja');

-- ==========================================
-- 3. Memberships
-- ==========================================

INSERT INTO memberships (user_id, store_id, role, status) VALUES
  -- 銀座本店
  ('user-owner-001', 'store-001', 'owner', 'active'),
  ('user-manager-001', 'store-001', 'manager', 'active'),
  ('user-staff-001', 'store-001', 'staff', 'active'),
  ('user-staff-002', 'store-001', 'staff', 'active'),

  -- 渋谷店
  ('user-owner-001', 'store-002', 'owner', 'active'),
  ('user-manager-002', 'store-002', 'manager', 'active'),
  ('user-staff-003', 'store-002', 'staff', 'active'),

  -- サンプル食堂
  ('user-manager-001', 'store-003', 'manager', 'active');

-- ==========================================
-- 4. Sample Manuals (Published)
-- ==========================================

INSERT INTO manuals (
  id, store_id, status, source_type, category,
  ai_summary, ai_steps, ai_tips, approved_by, published_at
) VALUES
  (
    'manual-001',
    'store-001',
    'published',
    'ai',
    'ホール',
    'お客様からオーダーを伺い、ハンディに入力する基本手順です。笑顔であいさつし、メニューを復唱して確認することが重要です。ドリンクと料理を分けて聞くとスムーズです。',
    '[
      {"step_number": 1, "description": "テーブルに近づき「お決まりですか？」と声をかける", "tips": "笑顔とアイコンタクトが大切"},
      {"step_number": 2, "description": "メモまたはハンディを開く", "tips": ""},
      {"step_number": 3, "description": "まずドリンクを聞く「お飲み物はいかがですか？」", "tips": ""},
      {"step_number": 4, "description": "次に料理を聞く「お料理はお決まりですか？」", "tips": "メニュー番号で確認すると間違いが減る"},
      {"step_number": 5, "description": "復唱して確認「〜と〜でよろしいですか？」", "tips": "アレルギーがないか必ず確認"},
      {"step_number": 6, "description": "ハンディに入力し、オーダーを確定", "tips": ""}
    ]'::jsonb,
    '["笑顔とアイコンタクトが大切", "メニュー番号で確認すると間違いが減る", "アレルギーがないか必ず確認"]'::jsonb,
    'user-manager-001',
    NOW()
  ),
  (
    'manual-002',
    'store-001',
    'published',
    'ai',
    'キッチン',
    '包丁の正しい持ち方と野菜の切り方の基本です。安全に、効率よく作業するために正しいフォームを身につけましょう。指を切らないよう「猫の手」を守ることが最重要です。',
    '[
      {"step_number": 1, "description": "包丁を握り、人差し指を刃の背に添える", "tips": "親指と人差し指で挟むように持つ"},
      {"step_number": 2, "description": "まな板の上に野菜を置く", "tips": "滑らないよう安定させる"},
      {"step_number": 3, "description": "反対の手は「猫の手」（指を丸める）", "tips": "指先が刃に当たらないようにする"},
      {"step_number": 4, "description": "包丁を前後に動かしながら切る", "tips": "力を入れず、刃の重みで切る"},
      {"step_number": 5, "description": "切った野菜をボウルに移す", "tips": ""}
    ]'::jsonb,
    '["包丁は常に刃を下にして扱う", "指を切らないよう「猫の手」を守る", "切れ味の悪い包丁は危険なのでこまめに研ぐ"]'::jsonb,
    'user-manager-001',
    NOW()
  ),
  (
    'manual-003',
    'store-001',
    'published',
    'ai',
    '清掃',
    'テーブルを清潔に保つための基本清掃手順です。お客様が帰られた後、次のお客様をお迎えする前に必ず行います。食べこぼしや水滴を見逃さないことが大切です。',
    '[
      {"step_number": 1, "description": "食器をすべて下げる", "tips": "重ねすぎると割れるので注意"},
      {"step_number": 2, "description": "テーブルの上のゴミを集める", "tips": "おしぼりで大きなゴミを取る"},
      {"step_number": 3, "description": "濡れた布巾でテーブル全体を拭く", "tips": "隅々まで拭く"},
      {"step_number": 4, "description": "乾いた布巾で水気を拭き取る", "tips": "水滴が残らないように"},
      {"step_number": 5, "description": "椅子の座面も拭く", "tips": "食べこぼしがあることが多い"},
      {"step_number": 6, "description": "テーブルセッティングをする", "tips": ""}
    ]'::jsonb,
    '["布巾は清潔なものを使う", "テーブルの下も確認（落とし物があるかも）", "椅子の位置を整える"]'::jsonb,
    'user-manager-001',
    NOW()
  ),
  (
    'manual-004',
    'store-001',
    'published',
    'legacy_import',
    '安全衛生',
    '手洗いは食品衛生の基本中の基本です。調理前、トイレ後、生肉を触った後など、こまめに手を洗いましょう。30秒以上かけて丁寧に洗うことで菌を確実に落とします。',
    '[
      {"step_number": 1, "description": "蛇口をひねり、流水で手を濡らす", "tips": ""},
      {"step_number": 2, "description": "石鹸を手に取る", "tips": "液体石鹸が衛生的"},
      {"step_number": 3, "description": "手のひら、手の甲を洗う（10秒）", "tips": ""},
      {"step_number": 4, "description": "指の間、爪の間を洗う（10秒）", "tips": "爪ブラシを使うとより良い"},
      {"step_number": 5, "description": "手首まで洗う（5秒）", "tips": ""},
      {"step_number": 6, "description": "流水でしっかりすすぐ（5秒）", "tips": "石鹸が残らないように"},
      {"step_number": 7, "description": "ペーパータオルで拭く", "tips": "共用タオルは使わない"}
    ]'::jsonb,
    '["30秒以上かけて洗う", "爪は短く切っておく", "アクセサリーは外す"]'::jsonb,
    'user-manager-001',
    NOW()
  );

-- さらに6件追加（合計10件のサンプルマニュアル）
INSERT INTO manuals (
  id, store_id, status, source_type, category,
  ai_summary, ai_steps, ai_tips, approved_by, published_at
) VALUES
  ('manual-005', 'store-001', 'published', 'ai', 'ホール',
   'レジでの会計処理の基本手順です。金額を確認し、お釣りを間違えないように注意します。',
   '[{"step_number": 1, "description": "レジ画面で合計金額を確認", "tips": ""}, {"step_number": 2, "description": "お客様に金額を伝える", "tips": ""}, {"step_number": 3, "description": "現金またはカードを受け取る", "tips": ""}, {"step_number": 4, "description": "レジに入力し、お釣りを渡す", "tips": "金額を復唱する"}]'::jsonb,
   '["お釣りは必ず確認", "笑顔で「ありがとうございました」"]'::jsonb,
   'user-manager-001', NOW()),

  ('manual-006', 'store-001', 'published', 'ai', 'キッチン',
   'フライパンでの炒め物の基本です。強火で一気に炒めることで美味しく仕上がります。',
   '[{"step_number": 1, "description": "フライパンを強火で熱する", "tips": "油をなじませる"}, {"step_number": 2, "description": "食材を入れる", "tips": "一度に入れすぎない"}, {"step_number": 3, "description": "大きく混ぜながら炒める", "tips": "焦げないように動かし続ける"}, {"step_number": 4, "description": "調味料を加える", "tips": "火を弱めてから"}, {"step_number": 5, "description": "皿に盛り付ける", "tips": ""}]'::jsonb,
   '["強火で短時間", "フライパンは十分に熱する", "火傷に注意"]'::jsonb,
   'user-manager-001', NOW()),

  ('manual-007', 'store-001', 'published', 'ai', '清掃',
   'トイレ清掃の基本手順です。清潔さを保つことがお店の印象に直結します。',
   '[{"step_number": 1, "description": "「清掃中」の札を掛ける", "tips": ""}, {"step_number": 2, "description": "便器内を洗剤で磨く", "tips": "ブラシを使う"}, {"step_number": 3, "description": "便座・便器を拭く", "tips": "専用の布巾で"}, {"step_number": 4, "description": "床を拭く", "tips": "隅まで丁寧に"}, {"step_number": 5, "description": "手洗い場を拭く", "tips": "鏡も拭く"}, {"step_number": 6, "description": "ゴミ箱を確認", "tips": "満杯なら交換"}]'::jsonb,
   '["1時間ごとにチェック", "清掃後は必ず手を洗う"]'::jsonb,
   'user-manager-001', NOW()),

  ('manual-008', 'store-001', 'published', 'legacy_import', 'その他',
   'レジ締めの手順です。1日の売上を確認し、金額を合わせます。',
   '[{"step_number": 1, "description": "レジの「締め」ボタンを押す", "tips": ""}, {"step_number": 2, "description": "レシートを印刷", "tips": ""}, {"step_number": 3, "description": "実際の現金を数える", "tips": "2回確認"}, {"step_number": 4, "description": "レシートと現金が合っているか確認", "tips": ""}, {"step_number": 5, "description": "売上を記録用紙に記入", "tips": ""}, {"step_number": 6, "description": "現金を金庫に入れる", "tips": ""}]'::jsonb,
   '["金額が合わない場合は店長に報告", "釣り銭は翌日分を残す"]'::jsonb,
   'user-manager-001', NOW()),

  ('manual-009', 'store-002', 'published', 'ai', 'ホール',
   'お客様のお見送りの基本です。最後の印象が大切なので、笑顔で丁寧に。',
   '[{"step_number": 1, "description": "ドアまでお見送りする", "tips": "急がずゆっくり歩く"}, {"step_number": 2, "description": "「ありがとうございました」と言う", "tips": "笑顔で"}, {"step_number": 3, "description": "ドアを開ける", "tips": ""}, {"step_number": 4, "description": "「またお越しください」と言う", "tips": ""}, {"step_number": 5, "description": "お客様が見えなくなるまでお辞儀", "tips": ""}]'::jsonb,
   '["最後まで笑顔", "忘れ物がないか確認"]'::jsonb,
   'user-manager-002', NOW()),

  ('manual-010', 'store-002', 'published', 'ai', 'キッチン',
   '食材の冷蔵庫保管温度管理です。食中毒を防ぐために重要です。',
   '[{"step_number": 1, "description": "温度計で冷蔵庫の温度を確認", "tips": "5℃以下が基本"}, {"step_number": 2, "description": "食材ごとに分けて保管", "tips": "生肉は一番下"}, {"step_number": 3, "description": "ラップやフタで密閉", "tips": "乾燥・においうつりを防ぐ"}, {"step_number": 4, "description": "日付ラベルを貼る", "tips": "古いものから使う"}, {"step_number": 5, "description": "記録用紙に温度を記入", "tips": "朝・昼・夜の3回"}]'::jsonb,
   '["冷蔵庫は10℃以下、冷凍は-18℃以下", "ドアの開閉は最小限に"]'::jsonb,
   'user-manager-002', NOW());

-- ==========================================
-- 5. Draft Manuals (テスト用)
-- ==========================================

INSERT INTO manuals (
  id, store_id, status, source_type, category,
  ai_summary, ai_steps, ai_tips
) VALUES
  ('manual-draft-001', 'store-001', 'draft', 'ai', 'ホール',
   'テーブルセッティングの手順（AI生成・未承認）',
   '[{"step_number": 1, "description": "テーブルを拭く", "tips": ""}]'::jsonb,
   '[]'::jsonb);
```

---

## 2. テストユーザー定義

| ID | 名前 | Email | ロール | 店舗 | パスワード (開発用) |
|----|------|-------|-------|------|-------------------|
| user-owner-001 | 山田太郎 | owner@test.tasuki.com | owner | 銀座本店、渋谷店 | TestPass123! |
| user-manager-001 | 佐藤花子 | manager1@test.tasuki.com | manager | 銀座本店 | TestPass123! |
| user-manager-002 | 鈴木一郎 | manager2@test.tasuki.com | manager | 渋谷店 | TestPass123! |
| user-staff-001 | グエン | staff1@test.tasuki.com | staff | 銀座本店 | TestPass123! |
| user-staff-002 | トラン | staff2@test.tasuki.com | staff | 銀座本店 | TestPass123! |
| user-staff-003 | 田中次郎 | staff3@test.tasuki.com | staff | 渋谷店 | TestPass123! |

---

## 3. E2Eテスト実行手順

### 3.1 シナリオ1: Flow録画→AI生成→承認

```bash
# 前提: Staging環境、テストユーザーでログイン済み

# Step 1: Staff (staff1@test.tasuki.com) でログイン
# - Flutter アプリで録画ボタン長押し
# - 10秒間「オーダーの取り方」を実演
# - 録画終了

# Step 2: アップロード確認
# - タイムラインに「アップロード中」カード表示
# - 約30秒後に「AI処理中」に変化

# Step 3: Supabase で確認
supabase db exec "SELECT id, ai_status FROM handovers ORDER BY created_at DESC LIMIT 1"
# 期待: ai_status = 'draft_created'

# Step 4: Manager (manager1@test.tasuki.com) でログイン
# - Draft一覧に新しいマニュアル表示
# - タップして詳細確認
# - 承認ボタン押下

# Step 5: Staff アプリで確認
# - タイムラインに公開マニュアルとして表示
# - タップして詳細閲覧可能
```

### 3.2 シナリオ2: Google Docs取り込み

```bash
# 前提: テスト用 Google Docs を公開設定で作成

# Step 1: Manager でログイン
# - 「マニュアル追加」ボタンタップ
# - Google Docs URL 入力
# - 「AI整形ON」を選択
# - 作成ボタン押下

# Step 2: Draft確認
# - Draft一覧に追加される
# - サマリ・手順・Tipsが生成されている

# Step 3: 承認
# - 内容確認後、承認

# Step 4: 一般Staff で確認
# - 公開マニュアルとして表示
```

---

このテストデータとシナリオにより、TASUKIの全機能を実際のデータで検証できます！
