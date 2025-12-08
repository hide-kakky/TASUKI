# 08. Supabaseとバックエンド

## 🎯 このレッスンで学ぶこと

- Supabaseとは何か
- BaaS（Backend as a Service）
- RLS（Row Level Security）
- Edge Functions

---

## 1. Supabase = Firebaseのオープンソース版

**BaaS** = Backend as a Service

バックエンド機能を全部提供してくれるサービス：
- PostgreSQL（データベース）
- 認証（Auth）
- ストレージ（Storage）
- Edge Functions（サーバー処理）
- リアルタイム通信

---

## 2. RLS（Row Level Security）

**行レベルセキュリティ** = データベース層での権限管理

```sql
-- Staffは自分の店舗のpublishedマニュアルのみ閲覧可
CREATE POLICY "staff_view_published"
ON manuals FOR SELECT
TO authenticated
USING (
  store_id IN (SELECT store_id FROM memberships WHERE user_id = auth.uid())
  AND status = 'published'
);
```

**すごいところ**: アプリ側で権限チェック不要！データベースが自動で制御！

---

## 3. Edge Functions = サーバーレス関数

```
TypeScript で関数を書く
  ↓
Supabase にデプロイ
  ↓
HTTPリクエストで呼び出せる
```

TASUKIの例:
- `mux_webhook` - Mux Webhook受信
- `ai_process_handover` - AI処理
- `import_google_doc` - Google Docs取り込み

---

## 4. 認証（Auth）

```dart
// Magic Link ログイン
await supabase.auth.signInWithOtp(email: 'user@example.com');

// セッション確認
final user = supabase.auth.currentUser;
```

メールだけでログイン可能（パスワード不要）！

---

## 📝 まとめ

- Supabase = BaaS（バックエンド一式提供）
- RLS = 行レベルセキュリティ（最強）
- Edge Functions = TypeScriptでサーバー処理
- 認証 = Magic Link対応

TASUKIのバックエンドはSupabaseで完結！

---

次は「09_AIとGemini.md」でAI技術を学びます！
