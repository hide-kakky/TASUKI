# K8s上級編: HelmとGitOpsによる運用自動化 ⚓️

マニフェストファイルを一つ一つ手書きして `kubectl apply` するのは小規模なら良いですが、大規模・多環境（Dev/Stg/Prod）になると破綻します。
それを解決するモダンな運用スタイルを学びます。

## 1. Helm (ヘルム): K8sのパッケージマネージャー
「macOSにHomebrew」、「Node.jsにnpm」があるように、「KubernetesにはHelm」があります。

### 課題
「Webアプリ + DB + Redis」というセットを、Dev環境とProd環境の両方に作りたい。
マニフェストをコピペして `replicas: 1` を `replicas: 10` に書き換える...というのはミスのもとです。

### 解決策 (Helm Charts)
Helmでは、マニフェストの雛形（テンプレート）を用意し、環境ごとの違いを `values.yaml` という設定ファイルで注入します。

```yaml
# deployment.yaml (Template)
replicas: {{ .Values.replicaCount }}
image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
```

```yaml
# values-prod.yaml
replicaCount: 10
image:
  tag: "v1.0.0"
```

コマンド一発でインストールできます。
```bash
helm install my-app ./charts/my-app -f values-prod.yaml
```

## 2. GitOps (ギットオプス)
**「Gitリポジトリの状態 = 本番環境の状態」を自動同期する** 運用手法です。
代表的なツール: **ArgoCD**, Flux

### 従来のデプロイ (Push型)
1. 開発者が手元で `kubectl apply` を打つ。
2. CIサーバーから `kubectl apply` を打つ。
   → 「今クラスターがどうなってるか」は、誰かが勝手にコマンドを打つと変わってしまう。

### GitOpsのデプロイ (Pull型)
1. 開発者は**Gitのマニフェストを変更してPushするだけ**。クラスターには触らない。
2. ArgoCD（K8sの中に住んでいるエージェント）が、「Gitと今の状態が違う！」と検知する。
3. ArgoCDが自動でクラスターをGitの状態に同期（Sync）させる。

### メリット
- **証跡**: 「誰がいつ何を変更したか」がGitのコミットログとして100%残る。
- **切り戻し**: 障害が起きたら `git revert` してマージすれば、ArgoCDが勝手に前のバージョンに戻してくれる。
- **セキュリティ**: 開発者に本番環境への強力な権限（kubectl）を配る必要がなくなる。

## まとめ
上級者のK8s運用は、**「人間が直接コマンドを打たない」** 環境を目指します。
全てをコード（Git）で管理し、適用は自動化ツールに任せる。これが **Infrastructure as Code (IaC)** の最終形です。
