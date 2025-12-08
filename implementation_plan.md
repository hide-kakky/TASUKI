# TASUKI Implementation Plan - Phase 2 (MVP)

## User Review Required
> [!IMPORTANT]
> **Environment Fix Needed**:
> It appears `supabase start` was executed in the parent `Dev` directory instead of `Dev/TASUKI`.
> This caused the `seed.sql` warning and prevents me from connecting to the database.
> **Action**: Please run `supabase stop` in your terminal (at `Dev` directory), then approve this plan. I will then start it correctly in `TASUKI`.

## Goal Description
Implement the **Flow (Video) → Stock (Manual)** core loop.
1. Users can log in (Magic Link).
2. Users can record "Flow" videos.
3. Videos are uploaded to Mux and processed by Gemini (Edge Functions) to create "Stock" manuals.

## Proposed Changes

### Backend (Supabase)
Already implemented (Phase 1).
- [x] Schema & RLS
- [x] Edge Functions (`mux_webhook`, `ai_process_handover`)

### Frontend (Flutter) `apps/app`

#### 1. App Initialization ([NEW] `lib/main.dart`)
- Setup `ProviderScope` (Riverpod)
- Initialize `Supabase`
- Initialize `Isar` (Local DB)

#### 2. Authentication
- [NEW] `lib/features/auth/presentation/auth_screen.dart`: Magic Link login UI.
- [NEW] `lib/features/auth/application/auth_notifier.dart`: Auth state management.

#### 3. Flow (Recording)
- [NEW] `lib/features/flow/presentation/record_screen.dart`: Camera record button (Long press).
- [NEW] `lib/features/flow/application/video_service.dart`: Mux upload logic.
- [NEW] `lib/features/flow/data/upload_queue.dart`: Isar schema for offline queue.

#### 4. Timeline (Home)
- [NEW] `lib/features/home/presentation/timeline_screen.dart`: List of Handovers/Manuals.

## Verification Plan

### Manual Verification
1. **Fix Env**: Confirm `supabase status` shows running in `TASUKI`.
2. **Seed Data**: Verify `SELECT * FROM stores` returns data.
3. **App Launch**: `flutter run` starts the app.
4. **Login**: Login with `staff1@test.tasuki.com` (Magic Link).
5. **Record**: Record a 5s video -> Verify it appears in `handovers` table.
