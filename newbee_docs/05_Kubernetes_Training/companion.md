# 05_Kubernetes_Training Companion（コマンド例と要点）

## コマンド例
- `kubectl get pods -A` : 全Pod確認。STATUSがRunningか要確認。
- `kubectl logs <pod>` : ログ取得。CrashLoopBackOff時の原因確認。
- `kubectl exec -it <pod> -- sh` : コンテナ内調査。
- `kubectl describe <resource>` : イベントや設定の詳細確認。
- `kubectl get svc,deploy` : ServiceとDeploymentを一覧で確認。
- `kubectl port-forward svc/api 8080:80` : ローカルからServiceへ疎通。
- `kubectl rollout restart deploy/<name>` : 環境変数やConfigMap変更を反映。
- `kubectl top pod` : リソース使用量を確認（metrics-serverが必要）。

## マニフェスト最小例（Pod）
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hello
spec:
  containers:
    - name: app
      image: nginx:alpine
      ports:
        - containerPort: 80
```
- 簡易課題: 上記Podを`kubectl apply -f pod.yaml`で作成し、`kubectl port-forward pod/hello 8080:80`でブラウザ確認。
- 追加課題: 同じPodをDeployment/Serviceに変換し、`kubectl get deploy,svc`で確認。

## トラブルシュートの観点
- Pending: ノード不足やリソース制限。`kubectl describe pod`で理由を確認。
- CrashLoopBackOff: イメージ/環境変数/DB接続を確認。`logs`でエラーを読む。
- Service疎通: `kubectl port-forward`でローカルから叩き、Podへの経路を確認。
- NodePort/Ingress経路: Service → (Ingress/LoadBalancer) → Pod。DNS設定やポート開放を確認。
- ケース別ガイド:
  - イメージPull失敗: `ImagePullBackOff`時はレジストリ認証/タグ名を確認。
  - Readiness失敗: ReadinessProbe設定と依存サービス(DB等)の起動順を確認。
  - Config/Secret反映漏れ: `kubectl rollout restart deploy/<name>`で再起動しつつ`envFrom`/マウントを確認。
-   - CrashLoopで原因不明: `kubectl logs --previous`で直前のコンテナログを取得。

## ミニ課題回答例
- Pod/Service/ConfigMap/Secretの用途: 実行単位/通信入口/設定/機密情報。
- HelmとGitOps: Helm=パッケージ化とデプロイ、GitOps=Gitを単一情報源にし自動同期。
