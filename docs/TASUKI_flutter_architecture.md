# TASUKI Flutter アーキテクチャ設計書

本ドキュメントは、Flutter アプリケーション（`apps/app`）の詳細設計を定義します。

---

## 1. ディレクトリ構成

```
apps/app/
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── config/
│   │   │   └── env.dart                    # 環境変数管理
│   │   ├── router/
│   │   │   └── app_router.dart             # ルーティング定義
│   │   └── theme/
│   │       └── app_theme.dart              # テーマ定義
│   ├── features/
│   │   ├── auth/
│   │   │   ├── presentation/
│   │   │   │   ├── screens/
│   │   │   │   │   └── auth_screen.dart
│   │   │   │   └── providers/
│   │   │   │       └── auth_provider.dart
│   │   │   └── data/
│   │   │       └── auth_repository.dart
│   │   ├── flow/                           # Flow 録画機能
│   │   │   ├── presentation/
│   │   │   │   ├── screens/
│   │   │   │   │   ├── record_screen.dart
│   │   │   │   │   └── upload_queue_screen.dart
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── record_button.dart
│   │   │   │   │   └── upload_progress_indicator.dart
│   │   │   │   └── providers/
│   │   │   │       ├── camera_provider.dart
│   │   │   │       └── upload_queue_provider.dart
│   │   │   └── data/
│   │   │       ├── models/
│   │   │       │   └── pending_upload.dart
│   │   │       └── services/
│   │   │           ├── video_service.dart  # Mux SDK ラッパー
│   │   │           └── offline_queue_service.dart
│   │   ├── manual/                         # マニュアル閲覧
│   │   │   ├── presentation/
│   │   │   │   ├── screens/
│   │   │   │   │   ├── timeline_screen.dart
│   │   │   │   │   ├── manual_list_screen.dart
│   │   │   │   │   └── manual_detail_screen.dart
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── manual_card.dart
│   │   │   │   │   └── category_filter.dart
│   │   │   │   └── providers/
│   │   │   │       └── manual_provider.dart
│   │   │   └── data/
│   │   │       ├── models/
│   │   │       │   └── manual.dart
│   │   │       └── repositories/
│   │   │           └── manual_repository.dart
│   │   └── manager/                        # Manager 専用機能
│   │       ├── presentation/
│   │       │   ├── screens/
│   │       │   │   ├── stock_list_screen.dart
│   │       │   │   ├── stock_detail_screen.dart
│   │       │   │   └── import_modal.dart
│   │       │   └── providers/
│   │       │       └── manager_provider.dart
│   │       └── data/
│   │           └── repositories/
│   │               └── manager_repository.dart
│   └── shared/
│       ├── models/
│       │   ├── user.dart
│       │   └── store.dart
│       ├── providers/
│       │   └── supabase_provider.dart
│       └── utils/
│           ├── offline_detector.dart
│           └── logger.dart
└── test/
```

---

## 2. Riverpod Provider 設計

### 2.1 Provider 階層構造
```dart
// lib/shared/providers/supabase_provider.dart
@riverpod
SupabaseClient supabase(SupabaseRef ref) {
  return SupabaseClient(
    Env.supabaseUrl,
    Env.supabaseAnonKey,
  );
}

@riverpod
Stream<AuthState> authState(AuthStateRef ref) {
  final supabase = ref.watch(supabaseProvider);
  return supabase.auth.onAuthStateChange;
}

@riverpod
User? currentUser(CurrentUserRef ref) {
  final authState = ref.watch(authStateProvider).valueOrNull;
  return authState?.session?.user;
}
```

### 2.2 Flow 録画の Provider
```dart
// lib/features/flow/presentation/providers/camera_provider.dart
@riverpod
class Camera extends _$Camera {
  CameraController? _controller;

  @override
  FutureOr<CameraState> build() async {
    // カメラ初期化
    final cameras = await availableCameras();
    _controller = CameraController(
      cameras.first,
      ResolutionPreset.high,
    );
    await _controller!.initialize();

    return CameraState.ready;
  }

  Future<XFile> startRecording() async {
    await _controller!.startVideoRecording();
    // ... 録画処理
  }

  Future<void> stopRecording() async {
    final file = await _controller!.stopVideoRecording();
    // オフラインキューに追加
    await ref.read(uploadQueueProvider.notifier).enqueue(file);
  }
}

// lib/features/flow/presentation/providers/upload_queue_provider.dart
@riverpod
class UploadQueue extends _$UploadQueue {
  @override
  FutureOr<List<PendingUpload>> build() async {
    final isar = ref.watch(isarProvider);
    return await isar.pendingUploads.where().findAll();
  }

  Future<void> enqueue(XFile file) async {
    final isar = ref.watch(isarProvider);
    final upload = PendingUpload(
      filePath: file.path,
      createdAt: DateTime.now(),
    );

    await isar.writeTxn(() async {
      await isar.pendingUploads.put(upload);
    });

    ref.invalidateSelf();

    // ネットワークがあれば即座にアップロード
    if (await ref.read(networkStatusProvider.future)) {
      _processQueue();
    }
  }

  Future<void> _processQueue() async {
    final queue = await future;
    final videoService = ref.read(videoServiceProvider);

    for (final upload in queue) {
      try {
        await videoService.uploadToMux(upload.filePath);
        await _removeFromQueue(upload.id);
      } catch (e) {
        // エラー時はリトライカウント増加
        await _incrementRetry(upload.id);
      }
    }
  }
}
```

### 2.3 Manual 閲覧の Provider
```dart
// lib/features/manual/presentation/providers/manual_provider.dart
@riverpod
class Manuals extends _$Manuals {
  @override
  FutureOr<List<Manual>> build({
    String? category,
    ManualStatus? status,
  }) async {
    final repository = ref.watch(manualRepositoryProvider);
    return await repository.getManuals(
      category: category,
      status: status ?? ManualStatus.published,
    );
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}

// Manager専用: Draft 取得
@riverpod
FutureOr<List<Manual>> draftManuals(DraftManualsRef ref) async {
  final repository = ref.watch(manualRepositoryProvider);
  return await repository.getManuals(status: ManualStatus.draft);
}
```

---

## 3. Isar スキーマ定義

### 3.1 pending_uploads (オフラインキュー)
```dart
// lib/features/flow/data/models/pending_upload.dart
import 'package:isar/isar.dart';

part 'pending_upload.g.dart';

@collection
class PendingUpload {
  Id id = Isar.autoIncrement;

  @Index()
  late String filePath;

  late DateTime createdAt;

  @Index()
  late String storeId;

  late String userId;

  late int retryCount;

  String? checksum; // 重複検知用

  String? errorMessage;

  // Computed property
  bool get shouldRetry => retryCount < 3;
}
```

### 3.2 cached_manual (オフライン閲覧用キャッシュ)
```dart
// lib/features/manual/data/models/cached_manual.dart
@collection
class CachedManual {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String manualId; // Supabase の UUID

  late String title;

  late String aiSummary;

  late String aiStepsJson; // JSON文字列として保存

  late String aiTipsJson;

  String? thumbnailLocalPath; // ダウンロード済みサムネ

  late DateTime cachedAt;

  late DateTime lastAccessedAt;
}
```

---

## 4. 主要画面のWidget構成例

### 4.1 RecordScreen (Flow 録画)
```dart
// lib/features/flow/presentation/screens/record_screen.dart
class RecordScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cameraState = ref.watch(cameraProvider);

    return Scaffold(
      body: Stack(
        children: [
          // カメラプレビュー
          cameraState.when(
            data: (_) => CameraPreview(ref.read(cameraProvider.notifier)._controller!),
            loading: () => CircularProgressIndicator(),
            error: (e, _) => ErrorWidget(e),
          ),

          // 録画ボタン
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: RecordButton(
                onLongPressStart: () => ref.read(cameraProvider.notifier).startRecording(),
                onLongPressEnd: () => ref.read(cameraProvider.notifier).stopRecording(),
              ),
            ),
          ),

          // アップロード状態表示
          Positioned(
            top: 60,
            right: 20,
            child: UploadQueueIndicator(),
          ),
        ],
      ),
    );
  }
}
```

### 4.2 TimelineScreen (マニュアル タイムライン)
```dart
// lib/features/manual/presentation/screens/timeline_screen.dart
class TimelineScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final manuals = ref.watch(manualsProvider());

    return Scaffold(
      appBar: AppBar(
        title: Text('タイムライン'),
        actions: [
          // カテゴリフィルタ
          CategoryFilterButton(),
        ],
      ),
      body: manuals.when(
        data: (manuals) => RefreshIndicator(
          onRefresh: () => ref.read(manualsProvider().notifier).refresh(),
          child: ListView.builder(
            itemCount: manuals.length,
            itemBuilder: (context, index) => ManualCard(manual: manuals[index]),
          ),
        ),
        loading: () => Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(error: e),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/record'),
        child: Icon(Icons.videocam),
      ),
    );
  }
}
```

### 4.3 ManualDetailScreen (マニュアル詳細)
```dart
// lib/features/manual/presentation/screens/manual_detail_screen.dart
class ManualDetailScreen extends ConsumerWidget {
  final String manualId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final manual = ref.watch(manualProvider(manualId));

    return Scaffold(
      body: manual.when(
        data: (manual) => CustomScrollView(
          slivers: [
            // 動画 or サムネイル
            SliverAppBar(
              expandedHeight: 200,
              flexibleSpace: manual.hlsUrl != null
                  ? VideoPlayer(url: manual.hlsUrl!)
                  : Image.network(manual.thumbnailUrl ?? ''),
            ),

            // コンテンツ
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // カテゴリバッジ
                    CategoryBadge(category: manual.category),
                    SizedBox(height: 8),

                    // サマリ
                    Text(manual.aiSummary, style: Theme.of(context).textTheme.bodyLarge),
                    SizedBox(height: 24),

                    // 手順
                    Text('手順', style: Theme.of(context).textTheme.titleLarge),
                    ...manual.aiSteps.map((step) => StepCard(step: step)),

                    // Tips
                    Text('ポイント', style: Theme.of(context).textTheme.titleLarge),
                    ...manual.aiTips.map((tip) => TipCard(tip: tip)),
                  ],
                ),
              ),
            ),
          ],
        ),
        loading: () => Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(error: e),
      ),
    );
  }
}
```

---

## 5. オフライン対応

### 5.1 ネットワーク状態監視
```dart
// lib/shared/providers/network_status_provider.dart
@riverpod
Stream<bool> networkStatus(NetworkStatusRef ref) async* {
  final connectivity = Connectivity();

  await for (final result in connectivity.onConnectivityChanged) {
    yield result != ConnectivityResult.none;
  }
}
```

### 5.2 アップロードワーカー
```dart
// アプリ起動時 + 定期実行
void _initializeUploadWorker(WidgetRef ref) {
  // 起動時に即実行
  ref.read(uploadQueueProvider.notifier)._processQueue();

  // ネットワーク復帰時に実行
  ref.listen(networkStatusProvider, (previous, next) {
    if (next.value == true) {
      ref.read(uploadQueueProvider.notifier)._processQueue();
    }
  });

  // 5分ごとに定期実行
  Timer.periodic(Duration(minutes: 5), (_) {
    ref.read(uploadQueueProvider.notifier)._processQueue();
  });
}
```

---

## 6. 状態管理パターン

### 6.1 Optimistic UI
```dart
// Flow投稿時
Future<void> postFlow(XFile video) async {
  // 1. 即座にタイムラインに仮カード表示
  final tempHandover = Handover.temporary(videoPath: video.path);
  _optimisticHandovers.add(tempHandover);
  ref.invalidateSelf();

  // 2. バックグラウンドでアップロード
  try {
    final handoverId = await _uploadToMux(video);

    // 3. Supabase に INSERT
    await _createHandover(handoverId);

    // 4. 仮カードを削除、実データに置き換え
    _optimisticHandovers.remove(tempHandover);
  } catch (e) {
    // エラー時は仮カードにエラー表示
    tempHandover.status = HandoverStatus.failed;
  }
}
```

---

このドキュメントに従って実装することで、Flutter アプリケーションの構造が明確になり、AIエージェントによる自律実装が可能になります。
