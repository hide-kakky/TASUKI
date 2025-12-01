# TASUKI 運用ガイド

本ドキュメントは、TASUKIの日常運用、モニタリング、トラブルシューティングの完全ガイドです。

---

## 1. モニタリング設定

### 1.1 Supabase ダッシュボード

監視すべき指標:
- **Database**: 接続数、クエリ実行時間、ディスク使用量
- **Auth**: アクティブユーザー数、ログイン成功/失敗率
- **Edge Functions**: 実行回数、エラー率、実行時間

**アラート設定**:
```sql
-- ディスク使用量が80%を超えたらSlack通知
-- Supabase Dashboard > Database > Usage から設定
```

### 1.2 Mux ダッシュボード

- **Video Usage**: アップロード数、ストリーミング時間
- **Costs**: 月次コスト推移

**コスト監視 Cron** (1日1回実行):
```typescript
// supabase/functions/cost_monitor/index.ts
const monthlyFlowCount = await getMonthlyFlowCount();
const muxCost = monthlyFlowCount * 0.05; // 仮の単価
const geminiCost = monthlyFlowCount * 0.10;

const arpu = 3000;
const muxRatio = (muxCost / arpu) * 100;
const geminiRatio = (geminiCost / arpu) * 100;

if (muxRatio > 15 || geminiRatio > 20) {
  await sendSlackAlert({ muxRatio, geminiRatio });
}
```

### 1.3 Sentry 設定

Flutter:
```dart
// lib/main.dart
await SentryFlutter.init(
  (options) {
    options.dsn = Env.sentryDsnFlutter;
    options.tracesSampleRate = 0.1; // 10%のパフォーマンス計測
    options.environment = Env.environment; // staging / production
  },
  appRunner: () => runApp(MyApp()),
);
```

Edge Functions:
```typescript
import * as Sentry from 'https://deno.land/x/sentry/index.ts';

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN_EDGE'),
  environment: Deno.env.get('ENVIRONMENT'),
});
```

---

## 2. アラート設定

### 2.1 Slack Webhook 連携

```typescript
async function sendSlackAlert(message: string) {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')!;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 TASUKI Alert: ${message}`,
      username: 'TASUKI Bot',
      icon_emoji: ':warning:',
    }),
  });
}
```

### 2.2 アラートトリガー

| アラート | 条件 | 対応 |
|---------|------|------|
| **Muxコスト超過** | ARPU比15%超 | VideoService移行検討 |
| **Geminiコスト超過** | ARPU比20%超 | AIService最適化 |
| **Edge Functionエラー率** | 5%超 | ログ確認、バグ修正 |
| **データベース接続** | 80%超 | コネクションプール調整 |
| **ディスク使用量** | 80%超 | データクリーンアップ |

---

## 3. トラブルシューティング

### 3.1 よくある問題と解決策

#### 問題1: Flow録画がアップロードされない

**症状**: `pending_uploads`に溜まり続ける

**原因**:
- ネットワーク接続不良
- Mux APIトークンエラー
- ファイルサイズ超過

**対応**:
```bash
# 1. Supabase Logs確認
supabase functions logs mux_webhook --tail

# 2. Muxダッシュボードで失敗ログ確認

# 3. pending_uploads の retryCount 確認
SELECT * FROM pending_uploads WHERE retry_count >= 3;

# 4. 手動リトライ実行
-- Flutter側で強制アップロード
```

#### 問題2: AI処理が失敗する

**症状**: `handovers.ai_status = 'failed'`

**原因**:
- Gemini APIクォータ超過
- タイムアウト
- 動画形式エラー

**対応**:
```sql
-- 失敗したhandoverを確認
SELECT h.id, h.ai_status, aj.error_code, aj.payload
FROM handovers h
LEFT JOIN ai_jobs aj ON aj.handover_id = h.id
WHERE h.ai_status = 'failed'
ORDER BY h.created_at DESC;

-- 手動リトライ
-- Supabase Functions から ai_process_handover を手動実行
```

#### 問題3: RLS でアクセスが拒否される

**症状**: `403 Forbidden` または `Row security violation`

**原因**:
- ユーザーのロールが不正
- `memberships.status = 'disabled'`
- 店舗が異なる

**対応**:
```sql
-- ユーザーの memberships 確認
SELECT * FROM memberships WHERE user_id = 'USER_UUID';

-- ロール確認
SELECT u.id, u.display_name, m.store_id, m.role, m.status
FROM users u
JOIN memberships m ON m.user_id = u.id
WHERE u.id = 'USER_UUID';

-- status を active に変更
UPDATE memberships
SET status = 'active'
WHERE user_id = 'USER_UUID' AND store_id = 'STORE_UUID';
```

#### 問題4: Manager承認ボタンが表示されない

**症状**: UIに承認ボタンが出ない

**原因**:
- ロール判定の誤り
- RLSで draft が取得できない

**対応**:
```dart
// Flutter: ロール確認
final membership = await supabase
  .from('memberships')
  .select()
  .eq('user_id', userId)
  .eq('store_id', storeId)
  .single();

print('Role: ${membership['role']}'); // 'manager' or 'owner' のはず
```

---

## 4. バックアップ・リストア手順

### 4.1 データベースバックアップ

Supabaseは自動で毎日バックアップを取得しますが、手動バックアップも可能です:

```bash
# データベース全体のダンプ
supabase db dump -f backup_$(date +%Y%m%d).sql

# 特定テーブルのみ
pg_dump --table=manuals --table=handovers > manuals_backup.sql
```

### 4.2 リストア手順

```bash
# 1. バックアップから復元
supabase db reset
psql -h YOUR_DB_HOST -U postgres -d postgres < backup_20251201.sql

# 2. マイグレーション再適用
supabase db push
```

### 4.3 データクリーンアップ

```sql
-- 7日以上前の failed handovers を削除
DELETE FROM handovers
WHERE ai_status = 'failed'
  AND created_at < NOW() - INTERVAL '7 days';

-- 古い audit_logs を削除 (90日以上前)
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 5. セキュリティチェックリスト

### 5.1 定期チェック (月次)

- [ ] **RLS ポリシー**: すべてのテーブルでRLSが有効
- [ ] **API Key ローテーション**: Mux/Geminiキーを定期更新
- [ ] **不要なユーザー削除**: 退職者のアカウント無効化
- [ ] **監査ログ確認**: 異常なアクセスパターンがないか

### 5.2 RLS 検証スクリプト

```sql
-- RLS が有効か確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- 結果が0件ならOK

-- ポリシー一覧確認
SELECT schemaname, tablename, policyname, permissive
FROM pg_policies
WHERE schemaname = 'public';
```

### 5.3 緊急時の対応

**データ漏洩が疑われる場合**:
1. 該当ユーザーのアカウント無効化
2. 監査ログで不正アクセスを確認
3. RLS ポリシーの修正
4. 影響範囲の特定

```sql
-- ユーザー無効化
UPDATE memberships
SET status = 'disabled'
WHERE user_id = 'SUSPICIOUS_USER_ID';

-- 監査ログ確認
SELECT * FROM audit_logs
WHERE actor_id = 'SUSPICIOUS_USER_ID'
ORDER BY created_at DESC;
```

---

## 6. パフォーマンスチューニング

### 6.1 スロークエリの特定

```sql
-- 実行時間が長いクエリを確認
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 6.2 インデックス追加

```sql
-- 頻繁にフィルタされるカラムにインデックス
CREATE INDEX idx_manuals_created_at ON manuals(created_at DESC);
CREATE INDEX idx_handovers_updated_at ON handovers(updated_at DESC);
```

---

## 7. 日常運用タスク

### 毎日
- [ ] Sentry でエラー確認
- [ ] Slack アラート確認

### 毎週
- [ ] コスト監視レポート確認
- [ ] Flow→Stock 変換率確認

### 毎月
- [ ] セキュリティチェックリスト実施
- [ ] データクリーンアップ
- [ ] バックアップ検証

---

このガイドに従うことで、TASUKIを安定して運用できます。
