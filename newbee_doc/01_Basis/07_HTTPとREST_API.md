# 07_HTTPとREST_API入門 🌐

Webアプリ開発の基礎となる「通信のルール」について学びます。
ブラウザやアプリは、サーバーとどのように会話しているのでしょうか？

## 1. HTTPとは？
HyperText Transfer Protocol の略で、「リクエスト（お願い）」と「レスポンス（返事）」のキャッチボールです。

- **Client (アプリ)**: 「ユーザー情報をください！」 (Request)
- **Server (Supabase)**: 「はい、これです `{ "name": "Tanaka" }`」 (Response)

## 2. HTTPメソッド (動詞)
リクエストには「何をしたいか」を表す動詞が含まれます。

| メソッド | 意味 | SQLでの対応 | 例 |
|---|---|---|---|
| **GET** | データを**取得**したい | SELECT | ユーザー一覧を見る |
| **POST** | データを**新規登録**したい | INSERT | 新しい動画をアップする |
| **PUT** | データを**置き換え**たい | UPDATE (全置換) | プロフィールを更新する |
| **PATCH** | データの一部を**修正**したい | UPDATE (部分) | ステータスだけ変更する |
| **DELETE** | データを**削除**したい | DELETE | 投稿を消す |

## 3. ステータスコード (返事の種類)
サーバーからの返事は、3桁の数字で分類されます。

- **2xx (成功)**
  - `200 OK`: 成功！
  - `201 Created`: 作成成功！
- **4xx (クライアントのミス)**
  - `400 Bad Request`: 送り方がおかしいよ（パラメータ不足など）
  - `401 Unauthorized`: 誰？（ログインしてない）
  - `403 Forbidden`: ダメ！（権限がない）
  - `404 Not Found`: ないよ（URL間違い）
- **5xx (サーバーのミス)**
  - `500 Internal Server Error`: サーバー内でエラーが起きた（バグなど）
  - `503 Service Unavailable`: サーバーがダウン中

## 4. REST (Representational State Transfer)
「良いAPI」を作るための設計思想です。
「URLは**名詞**、操作は**メソッド**で」というのが基本ルールです。

| 悪い例 (動詞がURLに入っている) | 良い例 (RESTful) |
|---|---|
| `POST /create_user` | `POST /users` |
| `GET /get_user?id=1` | `GET /users/1` |
| `POST /update_user?id=1` | `PATCH /users/1` |
| `POST /delete_user?id=1` | `DELETE /users/1` |

Flutter開発では、`repository` 層などのメソッド名もこれに合わせて `getUsers()`, `createUser()` と命名するのが一般的です。
