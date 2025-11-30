# BATON デザイン図面 v1.0

本ドキュメントは `docs/BATON_requirements_v8.6.md` および `docs/BATON_implementation_guide_v1.0.md` を補完する、開発者向けの視覚的資料です。

## 1. システムシーケンス図

### 1.1 Flow → Stock (動画からの自動生成)
現場スタッフが動画を撮影し、AI がマニュアル化するまでのメインフロー。

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff (App)
    participant Mux as Mux (Video)
    participant DB as Supabase DB
    participant Edge as Edge Functions
    participant Gemini as Gemini 1.5/3
    actor Manager as Manager (App)

    Note over Staff, Mux: Phase 2: Flow Recording
    Staff->>Staff: 録画開始 (長押し)
    Staff->>DB: pending_uploads に保存 (Offline対応)
    Staff->>Mux: 動画アップロード (Background)
    Mux-->>Staff: Upload Complete
    Staff->>DB: handovers INSERT (status='pending_upload')

    Note over Mux, Edge: Phase 2: AI Processing
    Mux->>Edge: Webhook (asset_created / ready)
    Edge->>DB: handovers UPDATE (status='ready_for_ai')
    Edge->>Edge: ai_process_handover 起動 (Async)
    Edge->>DB: handovers (hls_url, language取得)
    Edge->>Gemini: 動画解析リクエスト (System Prompt + User Prompt)
    Gemini-->>Edge: JSON (Summary, Steps, Tips)
    Edge->>DB: manuals INSERT (status='draft', source='ai')

    Note over DB, Manager: Phase 3: Approval
    Manager->>DB: Draft 一覧取得
    DB-->>Manager: Manual List
    Manager->>Manager: 内容確認・修正
    Manager->>DB: manuals UPDATE (status='published')
    DB-->>Staff: タイムラインに表示
```

### 1.2 Google Docs Import (既存マニュアル取り込み)
Manager が既存の Google Docs を取り込むフロー。

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Manager (App)
    participant Edge as Edge Functions
    participant Google as Google Docs
    participant Gemini as Gemini 1.5/3
    participant DB as Supabase DB

    Manager->>Manager: マニュアル追加モーダル
    Manager->>Edge: import_google_doc (url, use_ai=true)

    rect rgb(240, 248, 255)
    Note right of Edge: Server Side Processing
    Edge->>Google: HTML/Text 取得
    Google-->>Edge: Document Content

    alt use_ai is true
        Edge->>Gemini: テキスト整形リクエスト (Summary, Steps, Tips)
        Gemini-->>Edge: JSON
    else use_ai is false
        Edge->>Edge: Raw Text そのまま使用
    end

    Edge->>DB: manuals INSERT (status='draft', source='legacy_import')
    end

    Edge-->>Manager: Success
    Manager->>DB: Draft 確認
    Manager->>DB: manuals UPDATE (status='published')
```

---

## 2. UI 画面遷移図 (Screen Flow)

Flutter アプリの画面構成と遷移。

```mermaid
graph TD
    %% Nodes
    Splash[Splash Screen]
    Auth[Auth Screen]
    Home[Home / Timeline Screen]

    subgraph Flow [Flow Creation]
        Record[Recording Overlay]
        Upload[Upload Queue (Background)]
    end

    subgraph Viewer [Manual Viewer]
        Detail[Manual Detail Screen]
        VideoPlayer[Video Player]
    end

    subgraph Manager [Manager Zone]
        StockList[Stock List Screen]
        StockDetail[Stock Edit/Approve Screen]
        ImportModal[Google Docs Import Modal]
    end

    %% Edges
    Splash -->|Not Logged In| Auth
    Splash -->|Logged In| Home
    Auth --> Home

    Home -->|Long Press| Record
    Record -->|Finish| Home
    Record -.->|Save| Upload

    Home -->|Tap Card| Detail
    Detail -->|Play Video| VideoPlayer

    Home -->|Switch Tab (Manager Only)| StockList
    StockList -->|Tap Draft| StockDetail
    StockList -->|Add Button| ImportModal
    ImportModal -->|Submit| StockList
    StockDetail -->|Approve| Home
```

---

## 3. ステータス遷移図 (State Machine)

### 3.1 Handover (動画) ステータス
`handovers.ai_status` のライフサイクル。

```mermaid
stateDiagram-v2
    [*] --> pending_upload: アプリで録画完了
    pending_upload --> uploaded: Mux アップロード完了
    uploaded --> ready_for_ai: Mux Webhook (Ready) 受信
    ready_for_ai --> ai_running: AI 処理開始
    ai_running --> draft_created: 成功 (Manual 作成)
    ai_running --> failed: エラー (リトライ対象)
    failed --> ai_running: リトライ
    draft_created --> [*]
```

### 3.2 Manual (マニュアル) ステータス
`manuals.status` のライフサイクル。

```mermaid
stateDiagram-v2
    [*] --> draft: AI生成 or Google Docs取り込み
    draft --> approved: Manager 承認 (内部状態)
    approved --> published: 公開 (一般ユーザー閲覧可)
    published --> draft: 修正のため取り下げ
    published --> [*]
```

---

## 4. データモデル関連図 (ERD 簡易版)

主要テーブルの関係性。

```mermaid
erDiagram
    organizations ||--|{ stores : has
    stores ||--|{ users : "belongs to (via memberships)"
    stores ||--|{ handovers : owns
    stores ||--|{ manuals : owns

    users ||--|{ memberships : has
    users ||--|{ handovers : creates

    handovers ||--o| manuals : "generates (1:0..1)"

    manuals {
        uuid id
        string status "draft/published"
        string source_type "ai/legacy_import"
        jsonb ai_steps
        string original_doc_url
    }

    handovers {
        uuid id
        string ai_status
        string mux_asset_id
        string hls_url
    }
```
