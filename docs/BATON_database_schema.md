# BATON データベース設計書 v1.0

本ドキュメントは、BATON プロジェクト（v8.6 要件準拠）のデータベース構造、テーブル定義、およびセキュリティ設計（RLS）を詳細に記述したものです。

## 1. ER 図 (Entity Relationship Diagram)

```mermaid
erDiagram
    organizations ||--|{ stores : "has many"
    stores ||--|{ users : "belongs to (via memberships)"
    stores ||--|{ handovers : "owns"
    stores ||--|{ manuals : "owns"

    users ||--|{ memberships : "has role in"
    users ||--|{ handovers : "authors"
    users ||--|{ manual_edits : "edits"

    handovers ||--o| manuals : "generates (1:0..1)"
    handovers ||--|{ ai_jobs : "processed by"

    manuals ||--|{ manual_edits : "has history"

    organizations {
        uuid id PK
        string name
        string plan
        jsonb billing_meta
        timestamp created_at
    }

    stores {
        uuid id PK
        uuid organization_id FK
        string name
        string timezone
        timestamp created_at
    }

    users {
        uuid id PK "References auth.users"
        string display_name
        string language
        jsonb meta
        timestamp created_at
    }

    memberships {
        uuid user_id PK, FK
        uuid store_id PK, FK
        string role "owner/manager/staff"
        string status "active/invited"
        timestamp created_at
    }

    handovers {
        uuid id PK
        uuid store_id FK
        uuid author_id FK
        string mux_asset_id
        string hls_url
        string thumbnail_url
        string ai_status "pending/ready/running/draft/failed"
        boolean local_offline_flag
        timestamp captured_at
        timestamp created_at
    }

    manuals {
        uuid id PK
        uuid handover_id FK "Nullable (Google Docs import)"
        uuid store_id FK
        string status "draft/published"
        string source_type "ai/legacy_import"
        string original_doc_url "For legacy_import"
        text ai_summary
        jsonb ai_steps
        jsonb ai_tips
        uuid approved_by FK
        timestamp published_at
        timestamp imported_at
        timestamp created_at
    }

    ai_jobs {
        uuid id PK
        uuid handover_id FK
        string stage
        int retries
        string error_code
        jsonb payload
        timestamp created_at
    }

    manual_edits {
        uuid id PK
        uuid manual_id FK
        uuid editor_id FK
        timestamp edit_start_at
        timestamp edit_end_at
        jsonb diff_summary
    }
```

---

## 2. テーブル定義詳細

### 2.1 組織・権限基盤

#### `organizations`
テナント（契約主体）を管理します。
- **id**: UUID (PK)
- **name**: テナント名
- **plan**: 契約プラン (例: `free`, `pro`)
- **billing_meta**: Stripe Customer ID 等

#### `stores`
実際の店舗単位。データ分離の境界（Tenant Isolation）となります。
- **id**: UUID (PK)
- **organization_id**: UUID (FK)
- **name**: 店舗名
- **timezone**: 店舗のタイムゾーン (例: `Asia/Tokyo`)

#### `users`
アプリケーションユーザー。Supabase Auth (`auth.users`) と 1:1 で紐付きます。
- **id**: UUID (PK, `auth.users.id` 参照)
- **display_name**: 表示名
- **language**: 使用言語 (例: `ja`, `en`, `vi`) - AI 出力言語の基準

#### `memberships`
ユーザーの店舗への所属とロールを管理します。
- **user_id**: UUID (PK, FK)
- **store_id**: UUID (PK, FK)
- **role**: 権限ロール (`owner`, `manager`, `staff`)
- **status**: 招待状態 (`active`, `invited`, `disabled`)

---

## 2.2 Flow & Stock (Core Data)

#### `handovers`
現場からアップロードされた動画（Flow）の実体。
- **id**: UUID (PK)
- **store_id**: UUID (FK) - RLS の基準
- **author_id**: UUID (FK) - 撮影者
- **mux_asset_id**: Mux の Asset ID
- **hls_url**: 動画再生 URL (Mux)
- **thumbnail_url**: サムネイル画像 URL
- **ai_status**: AI 処理ステータス
    - `pending_upload`: アップロード待ち
    - `uploaded`: アップロード完了
    - `ready_for_ai`: Webhook 受信済み
    - `ai_running`: Gemini 処理中
    - `draft_created`: マニュアル生成完了
    - `failed`: 処理失敗
- **local_offline_flag**: オフライン投稿かどうかのフラグ

#### `manuals`
マニュアル（Stock）の実体。AI 生成または Google Docs 取り込みにより作成されます。
- **id**: UUID (PK)
- **handover_id**: UUID (FK, Nullable) - 動画由来の場合に紐付け
- **store_id**: UUID (FK) - RLS の基準
- **status**: 公開ステータス
    - `draft`: 下書き（Manager のみ閲覧可）
    - `published`: 公開済み（Staff も閲覧可）
- **source_type**: 作成元
    - `ai`: 動画から AI 生成
    - `legacy_import`: Google Docs 等から取り込み
    - `manual`: 完全手動作成（将来用）
- **original_doc_url**: Google Docs の URL（`legacy_import` 時）
- **ai_summary**: 3行要約 (Text)
- **ai_steps**: 手順リスト (JSONB Array)
- **ai_tips**: コツ・ポイント (JSONB Array)
- **approved_by**: 承認者 (UUID)
- **published_at**: 公開日時

---

## 2.3 システム・ログ

#### `ai_jobs`
非同期 AI 処理のジョブキューおよび履歴。
- **id**: UUID (PK)
- **handover_id**: UUID (FK)
- **stage**: 処理ステージ
- **retries**: リトライ回数
- **error_code**: エラーコード

#### `manual_edits`
マニュアル編集の監査ログおよび品質評価用データ。
- **manual_id**: UUID (FK)
- **editor_id**: UUID (FK)
- **diff_summary**: 変更内容のサマリ（AI プロンプト改善用）

---

## 3. セキュリティ設計 (RLS & RBAC)

Supabase の Row Level Security (RLS) を使用し、データベース層で堅牢なアクセス制御を実現します。

### 3.1 基本ポリシー
1.  **Tenant Isolation**: 全てのクエリは `store_id` でフィルタリングされ、他店舗のデータは一切見えない。
2.  **Deny by Default**: 明示的に許可された操作以外は全て拒否。

### 3.2 ロール別権限マトリクス

| テーブル | Owner | Manager | Staff | 備考 |
| :--- | :---: | :---: | :---: | :--- |
| `organizations` | R | R | - | 自組織のみ |
| `stores` | R/W | R | R | 所属店舗のみ |
| `users` | R | R | R | 同一店舗のメンバーのみ |
| `handovers` | R/W | R/W | C/R | Staff は自分の投稿のみ編集可(要検討) |
| `manuals` | R/W | R/W | R | **Staff は `published` のみ閲覧可** |
| `manual_edits` | R | R | - | |

### 3.3 RLS ポリシー実装イメージ (Pseudo-code)

```sql
-- manuals テーブルの閲覧ポリシー
CREATE POLICY "Enable read access for store members" ON "public"."manuals"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  (store_id IN (
    SELECT store_id FROM memberships WHERE user_id = auth.uid()
  ))
  AND
  (
    -- Manager以上は全て閲覧可
    (EXISTS (
      SELECT 1 FROM memberships
      WHERE user_id = auth.uid() AND store_id = manuals.store_id AND role IN ('owner', 'manager')
    ))
    OR
    -- Staffは公開済みのみ閲覧可
    (status = 'published')
  )
);
```
