# 02_CI/CDパイプライン構築 🔄

私のマシンでは動いた (Works on my machine) を撲滅する技術。
GitHub Actions を例に、プロフェッショナルなパイプラインを解説します。

## 1. CI (Continuous Integration - 継続的インテグレーション)
「毎日、毎時間、コードを統合し続ける」こと。
PRを出すたびに、自動的に品質チェックを行います。

### 典型的なCIフロー
1. **Lint / Analyze**: 文法ミスやスタイルの乱れチェック。
2. **Test**: Unit / Widget テストの実行。
3. **Build**: 実際にビルドが通るか確認。

```yaml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter analyze
      - run: flutter test
```

## 2. CD (Continuous Delivery / Deployment)
「いつでもリリースできる状態を保つ」または「自動でリリースする」こと。

### 典型的なCDフロー (mainマージ後)
1. **Deploy to Dev**: 開発環境へデプロイ。社内確認用。
2. **Deploy to Staging**: 本番そっくりの環境へデプロイ。最終確認。
3. **Deploy to Prod**: 本番環境（App Store Connect / Firebase App Distribution）へアップロード。

### 鍵の管理 (Secrets)
証明書やAPIキーなどの秘密情報は、リポジトリには絶対コミットしません。
GitHub Secrets機能などを使い、CIサーバー実行時にのみ環境変数として注入します。

## 3. キャッシュによる高速化
CIは毎回「真っさらなUbuntu」環境で動くので、`flutter pub get` などを毎回やると遅いです。
`actions/cache` を使って、依存パッケージのダウンロード時間を短縮するのがチューニングの第一歩です。

## 4. バッジの魔力
READMEに貼ってある `build: passing` の緑色のバッジ。
あれがあるだけで、プロジェクトの信頼性とメンテナンス状態が可視化されます。
CIを導入したら、ぜひ貼りましょう。

---

## 📚 用語集 (Glossary)

| 用語 | 意味 | 関連 |
|------|------|-----|
| **CI** | 継続的インテグレーション | 自動テスト・自動チェック |
| **CD** | 継続的デリバリー/デプロイ | 自動配布 |
| **Pipeline (パイプライン)** | 一連の自動処理の流れ | build → test → deploy |
| **Workflow** | GitHub Actionsの定義ファイル | `.github/workflows/ci.yml` |
| **Artifact** | 成果物 | ビルドされたapkやipaファイル |
| **Runner** | ジョブを実行するサーバー | GitHubが用意してくれる |
| **Lint** | 静的解析 | コードの見た目や間違いチェック |

## 🛠️ コマンド集 (CI commands)

| コマンド | 説明 |
|---|---|
| `flutter analyze` | コードの静的解析を実行する |
| `flutter test` | テストを実行する |
| `flutter build apk` | Androidアプリをビルドする |
| `flutter build ipa` | iOSアプリをビルドする |

