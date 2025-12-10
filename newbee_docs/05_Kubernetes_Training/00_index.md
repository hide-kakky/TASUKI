# 05_Kubernetes_Training 学習ガイド 🧭

ゴール: K8sの基本リソースとデプロイの流れを理解し、GitOpsまでの道筋を掴む。

## 推奨順とミッション
所要時間の目安: 1本15〜20分。  
前提: Docker基礎（04_Training 01〜04）を終えていること。
1. 01_K8sの基本概念（★）  
   - ミッション: コントロールプレーンとワーカーノードの役割を1行ずつ。
2. 02_主要リソース（★）  
   - ミッション: Pod/Service/ConfigMap/Secretを用途付きで1行ずつ説明。
3. 03_マニフェストファイル（★）  
   - ミッション: Podマニフェストの必須フィールド(apiVersion/kind/metadata/spec)を書き出す。
4. 04_Podのデバッグ手法（★★）  
   - ミッション: `kubectl logs`, `kubectl exec`, `kubectl describe`の使いどころを1行ずつ。
5. 05_HelmとGitOps（★★★）  
   - ミッション: HelmチャートとGitOpsの違いを1文で説明。

## 進捗チェック
- [ ] 01〜02 読了＆主要リソースの役割を説明
- [ ] 03〜04 読了＆kubectlコマンドでPod操作を試す
- [ ] 05 読了＆Helm/GitOpsの違いを一言で言える

## 速習のコツ
- Minikubeやkindなど手元のK8sでコマンドを試すと定着が早い。
- リソースの関係は図にすると覚えやすい（Pod→Deployment→Service）。
