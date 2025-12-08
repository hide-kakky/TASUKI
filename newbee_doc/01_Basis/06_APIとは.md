# 06. APIとは何か？

## 🎯 このレッスンで学ぶこと

- APIの役割
- REST APIの基礎
- TASUKIでのAPI活用
- HTTP通信の仕組み

---

## 1. APIとは「約束事」

### A**P**I = **A**pplication **P**rogramming **I**nterface

**日本語**: アプリケーション・プログラミング・インターフェース

難しいですね😅 もっと簡単に：

**API = プログラム同士が会話するための「約束事」**

### レストランの注文票に例える

```
【ホール】             【注文票（API）】        【キッチン】
お客様                                      シェフ
  ↓                                          ↓
「カレーください」 →  [テーブル5番、カレー1] → カレーを作る
  ↑                                          ↑
カレーが来る      ←  [テーブル5番、完成]   ← 完成
```

**注文票のルール = API**
- どう書くか決まっている
- 誰が見ても分かる
- 間違いがない

---

## 2. なぜAPIが必要か？

### プログラム同士が直接話せたら...

```
❌ 統一ルールがない場合

Flutter: 「マニュアルちょうだい！」
Supabase: 「？？？何のこと？」

Flutter: 「handoverのdataを！」
Supabase: 「handoverって何？」
```

### APIがあれば

```
✅ 約束事がある場合

Flutter: GET /manuals?store_id=1
Supabase: 「あ、店舗1のマニュアルね。はいどうぞ」
        → {id: 10, title: "オーダーの取り方", ...}
```

**API =「こう言ったら、こう返す」という約束**

---

## 3. REST APIの基礎

### REST = **RE**presentational **S**tate **T**ransfer

TASUKIで使っているAPI形式です。

### HTTP メソッド（動詞）

| メソッド | 意味 | 例 |
|---------|------|-----|
| **GET** | 取得する | マニュアル一覧を取得 |
| **POST** | 作成する | 新しいマニュアルを作成 |
| **PUT/PATCH** | 更新する | マニュアルの内容を更新 |
| **DELETE** | 削除する | マニュアルを削除 |

### エンドポイント（URL）

```
https://abcd1234.supabase.co/rest/v1/manuals
        └────┬────┘  └───┬───┘  └──┬──┘
         サーバー      API      テーブル
```

**エンドポイント** = APIにアクセスするためのURL

---

## 4. 具体例：マニュアルを取得する

### リクエスト（要求）

```http
GET /rest/v1/manuals?store_id=eq.1&status=eq.published
Host: abcd1234.supabase.co
Authorization: Bearer eyJhbGciOi...
```

**読み方**:
- `GET` メソッドで
- `/rest/v1/manuals` テーブルから
- `store_id = 1`（店舗1）
- `status = 'published'`（公開済み）
- のデータを取得して

### レスポンス（応答）

```json
[
  {
    "id": 10,
    "title": "オーダーの取り方",
    "ai_summary": "お客様から注文を...",
    "status": "published"
  },
  {
    "id": 11,
    "title": "レジ締め",
    "ai_summary": "1日の売上を...",
    "status": "published"
  }
]
```

**JSON形式** でデータが返ってきます。

---

## 5. ステータスコード（結果）

APIは「成功したか失敗したか」を番号で教えてくれます。

| コード | 意味 | 例 |
|-------|------|-----|
| **200** | 成功 | データ取得成功 |
| **201** | 作成成功 | マニュアル作成成功 |
| **400** | リクエストが間違い | 必須パラメータがない |
| **401** | 認証エラー | ログインしていない |
| **403** | 権限エラー | Staffがdraft閲覧しようとした |
| **404** | 見つからない | 存在しないマニュアルID |
| **500** | サーバーエラー | サーバー側のバグ |

---

## 6. TASUKIでのAPI例

### 例1: マニュアル一覧取得

```typescript
// Flutter側（クライアント）
final manuals = await supabase
  .from('manuals')
  .select()
  .eq('store_id', storeId)
  .eq('status', 'published');

// ↓ 内部的にこうなる

GET /rest/v1/manuals?store_id=eq.5&status=eq.published
```

### 例2: マニュアル承認（Manager）

```typescript
// Manager が承認ボタンを押す
await supabase
  .from('manuals')
  .update({
    status: 'published',
    approved_by: managerId,
    published_at: new Date()
  })
  .eq('id', manualId);

// ↓ 内部的にこうなる

PATCH /rest/v1/manuals?id=eq.10
Content-Type: application/json
{
  "status": "published",
  "approved_by": "user-123",
  "published_at": "2025-12-01T10:00:00Z"
}
```

### 例3: Edge Function呼び出し

```typescript
// AI処理を開始
const { data } = await supabase.functions.invoke(
  'ai_process_handover',
  {
    body: { handover_id: 'handover-456' }
  }
);

// ↓ 内部的にこうなる

POST /functions/v1/ai_process_handover
Content-Type: application/json
{
  "handover_id": "handover-456"
}
```

---

## 7. APIのメリット

### 1. 独立性
```
Flutter変更 → Supabase側は変更不要
Supabase変更 → Flutter側は変更不要（API仕様が同じなら）
```

### 2. 再利用性
```
同じAPIを
  ├ Flutterアプリから呼ぶ
  ├ Webアプリから呼ぶ
  └ 管理画面から呼ぶ
```

### 3. セキュリティ
```
認証トークン必須
  ↓
正しいユーザーのみアクセス可能
```

---

## 8. 重要な専門用語

| 用語 | 意味 | 例 |
|------|------|-----|
| **API** | プログラム間の約束事 | Supabase REST API |
| **REST** | API設計の標準スタイル | GET /manuals |
| **エンドポイント** | APIのURL | `/rest/v1/manuals` |
| **HTTPメソッド** | 操作の種類 | GET, POST, PATCH |
| **ステータスコード** | 結果の番号 | 200, 401, 500 |
| **JSON** | データ交換形式 | `{"id": 1, "name": "太郎"}` |
| **リクエスト** | APIへの要求 | 「データください」 |
| **レスポンス** | APIからの応答 | データ or エラー |

---

## 9. ミニクイズ 🎯

### Q1: APIとは何ですか？
<details>
<summary>答えを見る</summary>

**答え**: プログラム同士が会話するための「約束事」。

どんな形式でリクエストを送り、どんな形式でレスポンスが返ってくるかを定義したもの。

</details>

### Q2: HTTP ステータスコード 403 は何を意味しますか？
<details>
<summary>答えを見る</summary>

**答え**: 権限エラー（Forbidden）

認証はされているが、そのリソースにアクセスする権限がない。

例: Staffがdraftマニュアルにアクセスしようとした

</details>

### Q3: TASUKIで使っているAPI形式は？
<details>
<summary>答えを見る</summary>

**答え**: REST API

Supabase が提供するREST API を使ってデータにアクセスしています。

</details>

---

## 📝 まとめ

- ✅ API = プログラム間の約束事
- ✅ REST API = GET/POST/PATCH/DELETE で操作
- ✅ ステータスコード = 成功/失敗を番号で表現
- ✅ TASUKIはSupabase REST API を活用

---

## 🚀 次のステップ

レベル2完了です！🎉

次は「レベル3: TASUKI固有の技術」に進みます。
- 07_Flutterとモバイルアプリ.md
- 08_Supabaseとバックエンド.md
- 09_AIとGemini.md
- 10_動画処理とMux.md

TASUKIの具体的な技術に踏み込んでいきます！

---

## 💡 ブログに書くなら

```markdown
# APIについて学んだ

## API = プログラム間の約束事
レストランの注文票と同じ。形式が決まっているから、誰でも理解できる。

## REST API
- GET（取得）
- POST（作成）
- PATCH（更新）
- DELETE（削除）

## ステータスコード
- 200: 成功
- 401: 認証エラー
- 403: 権限エラー
- 404: 見つからない

TASUKIではSupabase REST APIを使っている！
```
