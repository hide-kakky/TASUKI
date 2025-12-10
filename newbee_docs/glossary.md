# TASUKI 用語ミニ辞典 📖

主要な用語をサッと確認するための小さな辞典です。対応する教材へのリンクも添えています。

| 用語 | 意味 | 関連教材 |
|------|------|----------|
| API | アプリ間の約束事。入力と出力の型やパスを決めて通信する | 01_Basis/06_APIとは.md |
| REST | HTTPでCRUDを表現する設計スタイル | 01_Basis/07_HTTPとREST_API.md |
| JSON | 軽量データ形式。キーと値の組み合わせ | 01_Basis/08_JSONとデータ構造.md |
| JWT | 署名付きトークンでユーザーを識別 | 01_Basis/09_認証と認可の仕組み.md |
| Auth / Authz | 認証と認可。誰か＋何が許可か | 01_Basis/09_認証と認可の仕組み.md |
| BaaS | Backend as a Service。バックエンドをサービスとして提供 | 02_Tech_Stack/03_Supabaseとバックエンド.md |
| Supabase | 認証・DB・APIを提供するBaaS。PostgreSQLベース | 02_Tech_Stack/03_Supabaseとバックエンド.md |
| RLS | Row Level Security。行単位のアクセス制御 | 02_Tech_Stack/15_Supabase設計とセキュリティ.md |
| Edge Functions | エッジで動くサーバーレス関数 | 02_Tech_Stack/03_Supabaseとバックエンド.md |
| Flutter | クロスプラットフォームUIフレームワーク | 02_Tech_Stack/02_Flutterとモバイルアプリ.md |
| Widget | FlutterのUI構成要素。ツリーで組み立てる | 02_Tech_Stack/08_Widgetライフサイクル.md |
| Riverpod | Flutterの状態管理ライブラリ | 02_Tech_Stack/14_Riverpodの状態管理パターン.md |
| Mux | 動画配信プラットフォーム。HLSで配信 | 02_Tech_Stack/05_動画処理とMux.md |
| HLS | HTTP Live Streaming。動画をチャンクに分けて配信 | 02_Tech_Stack/05_動画処理とMux.md |
| CDN | コンテンツ配信ネットワーク。近いサーバーから高速配信 | 02_Tech_Stack/05_動画処理とMux.md |
| SQL | データ操作言語。select/insert/update/delete | 02_Tech_Stack/10_Supabase_SQL入門.md |
| Index | データ検索を高速化する仕組み | 02_Tech_Stack/16_PostgreSQL内部構造とチューニング.md |
| CI/CD | 継続的インテグレーション/デリバリー | 03_Process/08_CI_CDパイプライン構築.md |
| SLO/SLI | 信頼性目標と指標。SREで使う | 03_Process/09_SREと可観測性.md |
| Observability | 可観測性。ログ/メトリクス/トレースで状態を把握する | 03_Process/09_SREと可観測性.md |
| IaC | Infrastructure as Code。コードでインフラを管理 | 04_Docker_Training/06_マルチステージビルドと軽量化.md, 05_Kubernetes_Training/05_HelmとGitOps.md |
| Container Image | コンテナの元になるテンプレート | 04_Docker_Training/01_Dockerの基本概念.md |
| Volume | コンテナ外にデータを保持する仕組み | 04_Docker_Training/05_Dockerネットワークとデータ永続化.md |
| Helm | K8s用のパッケージマネージャ | 05_Kubernetes_Training/05_HelmとGitOps.md |
| GitOps | Gitを単一の信頼できる情報源にしてデプロイを自動化 | 05_Kubernetes_Training/05_HelmとGitOps.md |
| Git Flow | ブランチ戦略の一種。開発/リリース/ホットフィックスに分ける | 06_Git_Github_Training/04_ブランチ戦略.md |
| Trunk-Based | main中心で短命ブランチをすぐ統合する流儀 | 06_Git_Github_Training/04_ブランチ戦略.md |
| Rebase | 履歴を並び替えて直列化する操作 | 06_Git_Github_Training/05_リベースとCI_CD.md |
| Diff | 変更差分。何が変わったかを示す | 06_Git_Github_Training/02_基本コマンドとフロー.md |

### 逆引き（学びたいこと→教材）
- 「HTTP/REST/ステータスコード」→ 01_Basis/06-07
- 「JSONの書き方」→ 01_Basis/08
- 「認証/認可/RLS」→ 01_Basis/09, 02_Tech_Stack/15
- 「FlutterのUI/非同期」→ 02_Tech_Stack/06-08
- 「動画配信とMux」→ 02_Tech_Stack/05
- 「SQLとDBチューニング」→ 02_Tech_Stack/10,16
- 「PR/レビュー/テスト」→ 03_Process/03-06
- 「Docker/K8sの手順」→ 04_Docker_Training 全体, 05_Kubernetes_Training 全体
- 「Git運用/競合解消」→ 06_Git_Github_Training/02,04,05

困ったときは `Cmd/Ctrl + F` でキーワード検索し、対応する教材へジャンプしてください。
