# TASUKI Newbee Documents 🔰

このディレクトリは、TASUKIプロジェクトに参加する開発者（特に初学者）向けの学習資料をまとめたものです。
基礎から実践まで、段階的に知識を深められるように構成されています。

## 目次 (Index)

🧭 まずは: [総合ガイド](00_overview.md) / [用語ミニ辞典](glossary.md)  
難易度目安: ★=初級 / ★★=中級 / ★★★=上級  
各項目の括弧内にキーワードと学びのゴールを添えています。

### 📂 01_Basis (基礎知識)
ガイド: [00_index.md](01_Basis/00_index.md)
まずはここから読み進めて、全体像と言葉の定義を理解しましょう。
- [01_プログラミングとは](01_Basis/01_プログラミングとは.md)（★ 基本概念/コンピュータの役割）
- [02_TASUKIアプリの全体像](01_Basis/02_TASUKIアプリの全体像.md)（★ アーキテクチャ/登場サービス）
- [03_開発環境の理解](01_Basis/03_開発環境の理解.md)（★ IDE/CLI/依存関係）
- [04_データベースとは](01_Basis/04_データベースとは.md)（★ RDBと用語）
- [05_フロントエンドとバックエンド](01_Basis/05_フロントエンドとバックエンド.md)（★ 役割分担/リクエストの流れ）
- [06_APIとは](01_Basis/06_APIとは.md)（★ APIの目的/利用例）
- [07_HTTPとREST_API](01_Basis/07_HTTPとREST_API.md)（★ HTTPメソッド/ステータスコード）
- [08_JSONとデータ構造](01_Basis/08_JSONとデータ構造.md)（★ JSON書式/配列・オブジェクト）
- [09_認証と認可の仕組み](01_Basis/09_認証と認可の仕組み.md)（★★ 認証vs認可/JWT）
- [10_ターミナルとシェル操作入門](01_Basis/10_ターミナルとシェル操作入門.md)（★ CLI基本コマンド）
- [11_コードの読み方](01_Basis/11_コードの読み方.md)（★ 追跡手順/リーディングのコツ）
- [12_OSとプロセスについて](01_Basis/12_OSとプロセスについて.md)（★★ プロセス/スレッド/システムコール）
- [13_ネットワークとセキュリティ](01_Basis/13_ネットワークとセキュリティ.md)（★★ TLS/証明書/脅威モデル）
- [14_アルゴリズムとデータ構造](01_Basis/14_アルゴリズムとデータ構造.md)（★★ 計算量/基本構造体）

### 📚 02_Tech_Stack (技術スタック)
ガイド: [00_index.md](02_Tech_Stack/00_index.md)

<img src="https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white" /> <img src="https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white" /> <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" /> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /> <img src="https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white" />

- **[01_アーキテクチャと技術スタック図解](02_Tech_Stack/01_アーキテクチャと技術スタック図解.md)**（★ 全体像/採用技術マップ）
- [02_Flutterとモバイルアプリ](02_Tech_Stack/02_Flutterとモバイルアプリ.md)（★ UI構成/ビルドフロー）
- [03_Supabaseとバックエンド](02_Tech_Stack/03_Supabaseとバックエンド.md)（★ BaaS/API/認証基盤）
- [04_AIとGemini](02_Tech_Stack/04_AIとGemini.md)（★ LLM連携/プロンプト概要）
- [05_動画処理とMux](02_Tech_Stack/05_動画処理とMux.md)（★★ 動画アップロード/配信経路）
- [06_Flutterレイアウト入門](02_Tech_Stack/06_Flutterレイアウト入門.md)（★ ウィジェット/レイアウト基本）
- [07_Flutter非同期処理 (Future/Stream)](02_Tech_Stack/07_Flutter非同期処理.md)（★★ 非同期/Stream設計）
- [08_Widgetライフサイクル](02_Tech_Stack/08_Widgetライフサイクル.md)（★★ ライフサイクル/状態管理の勘所）
- [09_Dart言語の基礎](02_Tech_Stack/09_Dart言語の基礎.md)（★ 言語文法/型/コレクション）
- [10_Supabase_SQL入門](02_Tech_Stack/10_Supabase_SQL入門.md)（★ SQL基本/クエリ練習）
- [11_アニメーション完全ガイド](02_Tech_Stack/11_アニメーション完全ガイド.md)（★★ トランジション/カーブ）
- [12_カスタム描画とRenderObject](02_Tech_Stack/12_カスタム描画とRenderObject.md)（★★★ 描画パイプライン/低レベルAPI）
- [13_プラットフォーム連携(MethodChannel)](02_Tech_Stack/13_プラットフォーム連携(MethodChannel).md)（★★ ネイティブ連携/チャネル設計）
- [14_Riverpodの状態管理パターン](02_Tech_Stack/14_Riverpodの状態管理パターン.md)（★★ Provider設計/スコープ）
- [15_Supabase設計とセキュリティ](02_Tech_Stack/15_Supabase設計とセキュリティ.md)（★★ RLS/スキーマ設計）
- [16_PostgreSQL内部構造とチューニング](02_Tech_Stack/16_PostgreSQL内部構造とチューニング.md)（★★★ インデックス/プランナー）
- [17_システム設計とスケーラビリティ](02_Tech_Stack/17_システム設計とスケーラビリティ.md)（★★★ 可用性/分散パターン）
- [18_Flutterパフォーマンス最適化](02_Tech_Stack/18_Flutterパフォーマンス最適化.md)（★★★ Rebuild抑制/測定）
- [19_国際化(i18n)対応](02_Tech_Stack/19_国際化(i18n)対応.md)（★★ 文言管理/ロケール設計）

### 📂 03_Process (開発フロー)
ガイド: [00_index.md](03_Process/00_index.md)
実際の開発の流れやテストについての指針です。
- [01_実装の流れ](03_Process/01_実装の流れ.md)（★ タスク分解/PR作成）
- [02_テストと環境分離](03_Process/02_テストと環境分離.md)（★ 環境構成/テストピラミッド）
- [03_コードレビューの歩き方](03_Process/03_コードレビューの歩き方.md)（★ レビュー観点/コメント例）
- [04_良いIssueの書き方](03_Process/04_良いIssueの書き方.md)（★ テンプレ/受入基準）
- [05_デバッグの基本](03_Process/05_デバッグの基本.md)（★ 事象再現/切り分け）
- [06_テスト戦略完全ガイド](03_Process/06_テスト戦略完全ガイド.md)（★★ テスト計画/カバレッジ設計）
- [07_アーキテクチャと依存注入](03_Process/07_アーキテクチャと依存注入.md)（★★★ レイヤリング/DIパターン）
- [08_CI_CDパイプライン構築](03_Process/08_CI_CDパイプライン構築.md)（★★ CI設計/自動化）
- [09_SREと可観測性](03_Process/09_SREと可観測性.md)（★★★ SLI/SLO/Observability）

### 📂 04_Docker_Training (Docker完全攻略) 🐳
ガイド: [00_index.md](04_Docker_Training/00_index.md)
開発環境構築に不可欠なDockerについて、手を動かしながら学ぶハンズオン形式の教材です。
1. [01_Dockerの基本概念](04_Docker_Training/01_Dockerの基本概念.md)（★ イメージ/コンテナの基礎）
2. [02_基本コマンドハンズオン](04_Docker_Training/02_基本コマンドハンズオン.md)（★ run/build/push）
3. [03_Dockerfileによる自作イメージ](04_Docker_Training/03_Dockerfileによる自作イメージ.md)（★★ ベースイメージ/レイヤ）
4. [04_DockerComposeと実践](04_Docker_Training/04_DockerComposeと実践.md)（★★ 複数サービス連携）
5. [05_Dockerネットワークとデータ永続化](04_Docker_Training/05_Dockerネットワークとデータ永続化.md)（★★ ボリューム/ネットワーク）
6. [06_マルチステージビルドと軽量化](04_Docker_Training/06_マルチステージビルドと軽量化.md)（★★★ イメージ最適化）
7. [07_コンテナセキュリティ](04_Docker_Training/07_コンテナセキュリティ.md)（★★★ 権限/署名/スキャン） (New! ✨)

### 📂 05_Kubernetes_Training (K8s入門) ☸️
ガイド: [00_index.md](05_Kubernetes_Training/00_index.md)
大規模システムの運用を支えるKubernetesの基礎概念です。
1. [01_K8sの基本概念](05_Kubernetes_Training/01_K8sの基本概念.md)（★ 用語/コントロールプレーン）
2. [02_主要リソース](05_Kubernetes_Training/02_主要リソース.md)（★ Pod/Service/ConfigMap）
3. [03_マニフェストファイル](05_Kubernetes_Training/03_マニフェストファイル.md)（★ YAML記述/適用手順）
4. [04_Podのデバッグ手法](05_Kubernetes_Training/04_Podのデバッグ手法.md)（★★ ログ/ポートフォワード）
5. [05_HelmとGitOps](05_Kubernetes_Training/05_HelmとGitOps.md)（★★★ デプロイ自動化/リリース管理）

### 📂 06_Git_Github_Training (Git/GitHub入門) 🐈
ガイド: [00_index.md](06_Git_Github_Training/00_index.md)
チーム開発に必須のバージョン管理システムについて学びます。
1. [01_Gitの基本概念](06_Git_Github_Training/01_Gitの基本概念.md)（★ コミット/ブランチの仕組み）
2. [02_基本コマンドとフロー](06_Git_Github_Training/02_基本コマンドとフロー.md)（★ add/commit/push/pull）
3. [03_GitHubとチーム開発](06_Git_Github_Training/03_GitHubとチーム開発.md)（★ PR運用/レビュー）
4. [04_ブランチ戦略](06_Git_Github_Training/04_ブランチ戦略.md)（★★ GitFlow/Trunk-Based）
5. [05_リベースとCI_CD](06_Git_Github_Training/05_リベースとCI_CD.md)（★★★ Rebase/自動テスト連携）
6. [06_Git内部構造入門](06_Git_Github_Training/06_Git内部構造入門.md)（★★★ オブジェクトDB/差分表現） (New! ✨)

---

## 学習の進め方
1. 一通り目を通す（完全に理解しなくてもOK）
2. 実際の開発タスクに取り掛かる
3. 分からない言葉が出てきたらここに戻ってくる
