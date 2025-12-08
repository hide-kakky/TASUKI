# Supabase上級編: 鉄壁のRLSとパフォーマンス設計 🛡️

「動けばいい」データベース設計は、サービスがスケールした瞬間に負債になります。
セキュリティと速度を両立するためのテクニックを学びます。

## 1. RLS (Row Level Security) の落とし穴
RLS は「魔法の盾」ではありません。書き方を間違えると、**全データをスキャンする重いクエリ** になったり、**情報漏洩** の原因になります。

### 悪い例: 複雑すぎるポリシー
```sql
-- 毎回別のテーブルを結合してチェックするのは重い
CREATE POLICY "View own data" ON "products"
USING (
  auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = products.team_id)
);
```

### 良い例: アプリケーション側の工夫 or 冗長化
- JWT (アクセストークン) に `team_id` を含めてしまい、結合を不要にする。
- あるいは、`products` テーブル自体に検索用の `owner_user_id` を持たせる。

## 2. セキュリティ関数 (`security definer`)
通常、Postgresの関数は「実行したユーザーの権限」で動きます。
しかし、`SECURITY DEFINER` を指定すると、「関数を作成した主（特権管理者）」の権限で動かせます。

- **使い所**: ユーザーにはテーブルへの直接アクセス権を与えず、特定のAPI（関数）経由でのみ操作させたい場合。
- **リスク**: 関数内で任意の操作ができるため、厳密なバリデーションが必要。

```sql
CREATE FUNCTION secure_update_balance(amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 特権モード
AS $$
BEGIN
  -- ここで厳しいチェックを行う
  UPDATE accounts SET balance = balance + amount WHERE user_id = auth.uid();
END;
$$;
```

## 3. インデックス設計 (Indexing)
データが数万件を超えると、インデックスのない検索は致命的に遅くなります。

### 必須のインデックス
- **外部キー (Foreign Keys)**: `user_id`, `store_id` など、親テーブルを参照するカラム。
- **検索条件**: `WHERE status = 'pending'` のように頻繁に絞り込むカラム。
- **ソート**: `ORDER BY created_at DESC` するカラム。

```sql
-- AIステータスで頻繁に検索するならインデックスを作る
CREATE INDEX idx_handovers_ai_status ON handovers (ai_status);
```

## 4. Edge Functions の使い分け
Supabase にはロジックを書く場所が2つあります。

| 場所 | DB (PL/pgSQL) | Edge Functions (TypeScript) |
|---|---|---|
| **得意** | データの整合性維持、単純なCRUD操作、トリガー | 外部API連携 (Gemini, Stripe), 複雑な計算 |
| **苦手** | 外部通信、複雑なJSON処理 | 大量のデータ操作（タイムアウト制限あり） |

なんでも Edge Functions に書くのではなく、**「データに近い処理はDBで、外の世界と話す処理はEdgeで」** という分担が基本です。
