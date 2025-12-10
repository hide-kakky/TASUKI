# 04_Podのデバッグ手法 🩺

「K8sにデプロイしたけど動かない...」
Docker単体より複雑なK8s環境での、トラブルシューティングの基本コマンドです。

## 1. 状態を見る (`get`, `describe`)

### Pod一覧とステータス
```bash
kubectl get pods
```
- `Running`: 正常。
- `Pending`: 準備中、またはリソース不足で置く場所がない。
- `CrashLoopBackOff`: 起動→即死 を繰り返している。プログラムにバグがある可能性大。
- `ImagePullBackOff`: Dockerイメージが見つからない、認証エラー。

### 詳細情報を見る
```bash
kubectl describe pod [ポッド名]
```
一番下の **Events** セクションを見ます。「メモリ不足で殺された」「ボリュームのマウントに失敗した」などの理由が書いてあります。

## 2. ログを見る (`logs`)
プログラムが吐いた標準出力（printなど）を見ます。

```bash
kubectl logs [ポッド名]
kubectl logs -f [ポッド名] # リアルタイム監視 (tail -f)
```
Podの中にコンテナが複数ある場合は `-c [コンテナ名]` で指定します。

## 3. 中に入る (`exec`)
どうしてもわからない時は、動いているコンテナの中に入って調査します。

```bash
kubectl exec -it [ポッド名] -- /bin/bash
```
中に入ったら:
- `ls` 設定ファイルはあるか？
- `curl localhost:8080` 自分自身にアクセスできるか？
- `ping db` データベースに届くか？
などを確認します。

## 4. 上級技: ポートフォワード
K8sの中にあるDBや管理画面を、手元のPCから直接触りたい時に使います。

```bash
kubectl port-forward [ポッド名] 5432:5432
```
これで、K8s内のPostgresに手元のPCから `localhost:5432` で接続できるようになります。デバッグに最強です。

---

## 📚 用語集 (Glossary)

| 用語 | 意味 | 補足 |
|------|------|-----|
| **Pending** | 保留中 | 場所空き待ち or 準備中 |
| **CrashLoopBackOff** | 起動するがすぐ死ぬ | 「起動→エラー終了」の無限ループ |
| **ImagePullBackOff** | イメージ取れない | イメージ名間違い or 権限なし |
| **Events** | イベントログ | `describe` で見れる「何が起きたか」の履歴 |
| **Port Forward** | ポート転送 | トンネルを掘ってローカルから接続する技 |

## 🛠️ コマンド集 (Debug)

| コマンド | 説明 |
|---|---|
| `kubectl logs [pod]` | ログを表示 |
| `kubectl logs -f [pod]` | ログを流し見 (follow) |
| `kubectl exec -it [pod] -- [cmd]` | コンテナの中でコマンドを実行 |
| `kubectl port-forward [pod] [local]:[remote]` | ローカルへのポート転送を開始 |
