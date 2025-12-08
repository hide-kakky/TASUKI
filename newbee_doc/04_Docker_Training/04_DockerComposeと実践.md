# 04. Docker Composeと実践 🎼

これまでは `docker run` で1つずつコンテナを起動していましたが、実際の開発（TASUKIのようなアプリ）では、
- Webサーバー
- データベース
- 認証サーバー
- ファイルストレージ
など、複数のコンテナを連携させる必要があります。

これをコマンドだけで管理するのは大変です。そこで登場するのが **Docker Compose** です。

## 1. Docker Composeとは
「どのイメージを」「どの設定で」「どう連携させて」動かすかを、`docker-compose.yml` という設定ファイルにまとめて書くツールです。

いわば、**「システム全体の設計図」** です。

## 2. TASUKIプロジェクトでの実例
TASUKIプロジェクトでは、バックエンド基盤である **Supabase** をローカルで動かすために Docker Compose が使われています。

（注: 現在は `supabase start` コマンドが裏で隠蔽してくれていますが、仕組みを知っておくことは重要です）

### 架空の docker-compose.yml 例
もし手動でWebサーバーとDBを連携させるとしたら、このようなファイルになります。

```yaml
version: "3.8"
services:
  # 1つ目のサービス: Webアプリ
  web:
    image: my-custom-nginx
    ports:
      - "8080:80"
    depends_on:
      - db  # dbが起動してから自分を起動する

  # 2つ目のサービス: データベース
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: mysecretpassword
```

このファイルがあれば、以下の魔法のコマンド一発で全システムが立ち上がります。

## 3. 基本コマンド

### 起動 (Up)
```bash
docker compose up -d
```
設定ファイルに書かれた全コンテナを、順序を守って起動します。`-d` はバックグラウンド実行です。

### 停止・削除 (Down)
```bash
docker compose down
```
起動した全コンテナを停止し、削除まで行います。

## 4. この学習のゴール
これで、Dockerの基礎知識は十分です！

TASUKIの開発において、以下のことが理解できていれば合格点です：
- 「環境構築手順書」の代わりに、`docker-compose.yml`（やそれをラップしたツール）がある。
- コマンド一つで、本番と同じ環境が自分のPCに出来上がる。
- 「コンテナ消しちゃった！」→ 大丈夫、イメージがあるから何度でも作り直せる。

さあ、自信を持って開発に戻りましょう！🚀
