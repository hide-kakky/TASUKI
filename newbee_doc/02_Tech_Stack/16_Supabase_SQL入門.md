# 16_Supabase_SQL入門 🐘

Supabase の裏側は PostgreSQL という強力なリレーショナルデータベース(RDB)です。
SDKを使うとしても、SQLの基礎を知っているとデバッグ力が段違いになります。

## 1. 基本の4大命令 (CRUD)

### SELECT (取得)
```sql
-- usersテーブルから全てのカラム(*)を取得
SELECT * FROM users;

-- 条件で絞り込む
SELECT id, name FROM users WHERE email = 'test@example.com';
```

### INSERT (登録)
```sql
INSERT INTO users (name, email) VALUES ('Tanaka', 'tanaka@test.com');
```

### UPDATE (更新)
**注意: WHEREを忘れると全データが書き換わります！**
```sql
UPDATE handovers SET status = 'done' WHERE id = 123;
```

### DELETE (削除)
**注意: これもWHEREを忘れると全滅します！**
```sql
DELETE FROM tasks WHERE is_completed = true;
```

## 2. テーブル結合 (JOIN)
リレーショナルDBの真骨頂です。
「ユーザー情報」と「そのユーザーが書いた記事」など、分かれたテーブルをくっつけて取得します。

```sql
-- usersテーブルとpostsテーブルを結合
SELECT users.name, posts.title
FROM users
JOIN posts ON users.id = posts.user_id;
```
Supabase SDK だと `.select('name, posts(title)')` のように書くだけでこれを裏でやってくれています。

## 3. Supabase 特有のカラム
TASUKI のテーブルにはよく以下のカラムがあります。

- **created_at**: 作成日時。`default: now()` で自動で入る。
- **updated_at**: 更新日時。通常はTriggerを使って自動更新させる設定をする。
- **id (UUID)**: 世界で重複しないID。`uuid_generate_v4()` で生成。

## 4. SQLエディタの活用
Supabase Dashboard の "SQL Editor" は強力です。
- データの確認
- テストデータの投入
- 複雑な集計クエリの実験
などに気軽に使ってみましょう。壊しても（開発環境なら）リセットすればOKです。
