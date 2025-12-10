# 04_Docker_Training Companion（実行例とトラブルシュート）

## よく使うコマンドと成功判定
- `docker ps` : コンテナ一覧。期待=STATUSがUp。
- `docker images` : イメージ一覧。期待=タグ付きで存在。
- `docker run --rm hello-world` : 初回動作確認。期待=Hello from Docker!が出る。
- `docker compose up -d` : 複数コンテナ起動。期待=Exitコード0、`docker compose ps`でUp。
- ログ例:
```
$ docker run --rm hello-world
Hello from Docker!
This message shows that your installation appears to be working correctly.
```
- compose実行例:
```
$ docker compose up -d
 ✔ Network project_default  Created
 ✔ Container db            Started
 ✔ Container api           Started
```

## トラブルシュートQ&A
- ポート競合: 「bind: address already in use」→ 使われているポートを`lsof -i :<port>`で確認し変更。
- Permission denied: マウント先の権限を確認、`--user`指定や`chown`で対応。
- イメージが重い: マルチステージビルドに切り替え、ベースイメージを軽量化。
- ネットワーク疎通: コンテナ内で`curl http://api:3000/health`を試す。
- ボリューム確認: `docker volume ls` / `docker inspect <volume>`でマウント先を確認。

## ミニ課題回答例
- ボリューム永続化: `docker volume create data-vol` → `docker run -v data-vol:/data alpine sh -c "echo ok > /data/test"` → 再起動後も`cat /data/test`で確認。
- 軽量化差分: `node:18`と`node:18-alpine`をbuildし、`docker images`でサイズを比較。
- 成功判定チェック:
- [ ] コンテナUp/Downを確認し、不要コンテナは`docker rm`で整理
- [ ] ボリューム/ネットワークを意識し、名前付きで管理
- [ ] イメージサイズを意識し、タグを付けて管理
