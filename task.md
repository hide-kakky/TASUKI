# TASUKI Implementation Task List

## Phase 1: Infra & DB Setup (Day 1-3)
- [x] **Project Initialization**
    - [x] Create project structure (`apps/app`, `apps/edge`)
    - [x] Create `.env` file
- [x] **Database (Supabase)**
    - [x] Create migration files (Schema & RLS)
    - [x] Create `seed.sql`
    - [x] Apply migrations and seed (`supabase start` / `db reset`)
- [x] **Edge Functions**
    - [x] Implement `mux_webhook`
    - [x] Implement `ai_process_handover`
    - [x] Implement shared utilities (`supabase-client`, `gemini-client`, `error-handler`)

## Phase 2: Flow → Stock MVP (Day 4-10)
- [x] **Flutter Architecture**
    - [x] Create Flutter project (`apps/app`)
    - [x] Install dependencies (`riverpod`, `supabase_flutter`, `isar`, etc.)
- [/] **Flutter Implementation**
    - [ ] `main.dart` & App initialization
    - [ ] **Authentication**
        - [ ] Login Screen (Magic Link)
        - [ ] Auth State Management (Riverpod)
    - [x] **Flow (Video Recording)**
        - [x] Camera/Recorder UI
        - [x] Offline Queue (`pending_uploads` in Isar)
        - [x] Mux Upload Logic
    - [ ] **Timeline/Home**
        - [ ] Fetch & Display Handovers/Manuals
- [/] **Backend Integration**
    - [x] Verify Webhook reception (Impl done)
    - [x] Verify AI Processing (Impl done)

## Phase 3: Manager & Viewer UI (Day 11-20)
- [ ] **Manager UI** (Details TBD)
- [ ] **Viewer UI** (Details TBD)
