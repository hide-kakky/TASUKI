# 03. Dockerfileによる自作イメージ 🏗️

既存のイメージ（`nginx`など）を使うだけでなく、自分のプログラムや設定を含めた「オリジナルのイメージ」を作る方法を学びます。その設計図となるのが `Dockerfile` です。

## 1. 準備
任意の場所に作業用フォルダ（例: `docker-practice`）を作成し、その中に以下の2つのファイルを作成してください。

### index.html
表示させたいWebページの中身です。
```html
<!DOCTYPE html>
<html>
<body>
    <h1>Hello TASUKI Developers! 🚀</h1>
    <p>This is my custom container.</p>
</body>
</html>
```

### Dockerfile
拡張子なしの `Dockerfile` という名前で作成します。これが設計図です。
```dockerfile
# 1. ベースイメージを指定（既存のnginxを使う）
FROM nginx:latest

# 2. ホスト（自分のPC）の index.html を、コンテナ内の所定の場所にコピー
COPY index.html /usr/share/nginx/html/index.html
```

## 2. ビルド (Build)
設計図（Dockerfile）から金型（イメージ）を作成します。

ターミナルで、これらのファイルがあるディレクトリに移動し、以下を実行します。

```bash
# ドット(.) は「現在のディレクトリのDockerfileを使う」という意味
# -t はイメージに名前をつけるタグ付けオプション
docker build -t my-custom-nginx .
```

完了したら `docker images` で確認してみてください。`my-custom-nginx` というイメージができているはずです。

## 3. 実行 (Run)
自作したイメージを動かしてみましょう。

```bash
docker run -d -p 8888:80 --name my-custom-app my-custom-nginx
```

ブラウザで [http://localhost:8888](http://localhost:8888) を開いてください。
"Hello TASUKI Developers!" と表示されましたか？

これがDocker開発の基本フローです：
1. **書く**: コードとDockerfileを書く
2. **ビルド**: イメージを作成
3. **実行**: コンテナとして動かす

## 4. なぜこれがすごいのか？
この `Dockerfile` と `index.html` さえあれば、チームメンバーの誰でも、OSがMacでもWindowsでも、**コマンド一発で全く同じWebサーバーを再現**できます。
「手順書を見ながらサーバー構築」という辛い作業が、コード（Dockerfile）によって自動化されたのです。

## 次のステップ
アプリが複雑になると、Webサーバーだけでなく、データベース（DB）なども必要になります。
複数のコンテナをまとめて管理する `Docker Compose` について学びましょう。
