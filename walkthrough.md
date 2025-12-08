
# TASUKI Phase 2 MVP 検証ガイド

## 前提条件
- `supabase start` が `Dev/TASUKI` ディレクトリで稼働中であること。
- `apps/app` ディレクトリで `flutter pub get` が実行済みであること。
- iOS シミュレーターまたは Android エミュレーターが稼働中であること（カメラ機能が必要。iOSシミュレーターはカメラ非対応のため、実機またはWebcam設定済みのAndroidエミュレーターを使用してください）。

## 手順

### 1. アプリ起動
```bash
cd apps/app
flutter run
```

### 2. ログイン
1. アプリが起動すると **認証画面 (Auth Screen)** が表示されます。
2. `staff1@test.tasuki.com` (シードデータに含まれるユーザー) を入力します。
3. "Send Magic Link" をタップします。
4. Supabase のログ（`supabase start` を実行したターミナル）または In-App Browser (http://127.0.0.1:54324) でログインリンクを確認します。
5. リンクをクリックしてログインします。

### 3. 動画撮影 (Flow)
1. **タイムライン画面** が表示されます。
2. 画面右下の **カメラ** ボタンをタップします。
3. カメラ/マイクの権限許可ダイアログが表示されたら許可します。
4. 赤いボタンを **長押し** して録画を開始します（シミュレーション）。
5. 指を離すと録画が停止します。
6. スナックバーに "Recorded... Uploading..." と表示されるのを確認します。

### 4. バックエンド確認
1. **Supabase ダッシュボード**: `handovers` テーブルを確認します。`ai_status` が `uploaded` になっている新しいレコードがあるはずです。
2. **Edge Function**: `create_mux_upload_url` 関数が呼び出されたことを確認します（Supabase ログ）。
3. **Mux**: Mux のダッシュボード（実際のキーを使用している場合）でアセットが作成されたか確認します。ローカル/モック環境の場合は、`handovers` テーブルの更新をもって確認とします。

## トラブルシューティング
- **権限エラー**: `Info.plist` / `AndroidManifest.xml` の編集が正しく適用されているか確認してください。
- **アップロードエラー**: `supabase start` が実行中であり、`create_mux_upload_url` がデプロイ（Serve）されているか確認してください。
