
# TASUKI Phase 2 MVP Verification

## Prerequisities
- `supabase start` is running in `Dev/TASUKI`.
- `flutter pub get` has been run in `apps/app`.
- iOS Simulator or Android Emulator is running (Camera support needed. iOS Simulator doesn't support camera, use real device or Android Emulator with webcam).

## Steps

### 1. Launch App
```bash
cd apps/app
flutter run
```

### 2. Login
1. App launches on **Auth Screen**.
2. Enter `staff1@test.tasuki.com` (from seed data).
3. Tap "Send Magic Link".
4. Check Supabase logs (terminal where `supabase start` ran) or In-App Browser (http://127.0.0.1:54324) for the login link.
5. Click the link to login.

### 3. Record Flow
1. You should see the **Timeline Screen**.
2. Tap the floating **Camera** button.
3. Accept Camera/Mic permissions (if prompted).
4. **Long Press** the red button to record (simulated).
5. Release to stop.
6. Observe snackbar: "Recorded... Uploading...".

### 4. Verify Backend
1. **Supabase Dashboard**: Check `handovers` table. You should see a new record with `ai_status: uploaded`.
2. **Edge Function**: The `create_mux_upload_url` function was called (check Supabase logs).
3. **Mux**: Use `curl` or Mux Dashboard to verify asset creation (if you have real keys). For local/mock, verify the `handovers` table update.

## Troubleshooting
- **Missing Permissions**: Ensure `Info.plist` / `AndroidManifest.xml` edits applied correctly.
- **Upload Error**: Ensure `supabase start` is running and `create_mux_upload_url` is deployed/served.
