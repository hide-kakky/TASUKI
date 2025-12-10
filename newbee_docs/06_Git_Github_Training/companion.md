# 06_Git_Github_Training Companion（図解・練習シナリオ）

## ブランチ戦略の要点
- Git Flow: develop/release/hotfix。複数リリース線を管理。
- Trunk-Based: main中心、短命ブランチを早期マージ。CI必須。
- 図解（簡略）:
```
Git Flow:    main ---o----o---- (release/hotfix)
             \-- develop -- feature -> merge

Trunk-Based: main --o--o--o
                 \-feature (短命) -> rebase/push -> merge
```

## 競合解消ステップ
1. `git fetch origin`
2. `git rebase origin/main`（またはmerge）
3. 競合ファイルを手で解決し`git add`
4. `git rebase --continue` → テスト実行 → push

## rebase練習シナリオ
- シナリオ: `feature/a`と`feature/b`で同じ行を編集。`feature/a`をmainへマージ後、`feature/b`で`git rebase main`して競合を解決する。
- 確認: 履歴が直列化され、不要なマージコミットがないか。
- 追加練習: `git rebase -i HEAD~3`でコミット整理（squash/fixup）を試す。

## PR自己チェックリスト
- 1PR1テーマか？
- Lint/Unitは通過しているか？
- 破壊的変更は明記したか？
- スクショ/動作キャプチャを付けたか？
- レビュー観点（正しさ/安全性/読みやすさ/テスト）に答えられるか？
- テスト観点（PR用）:
  - [ ] 正常系
  - [ ] エラー/境界
  - [ ] 認証・権限
  - [ ] パフォーマンス影響
  - [ ] ログ/監視への影響
