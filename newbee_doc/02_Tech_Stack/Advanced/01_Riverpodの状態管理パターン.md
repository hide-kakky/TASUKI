# Flutter上級編: Riverpodによる状態管理の極意 🌊

「動くアプリ」から「保守しやすいアプリ」へ。
Riverpod を使いこなし、予測可能でテスト容易なコードを書くための実践パターンです。

## 1. なぜ Provider を使うのか？
単に「どこからでも変数にアクセスしたい」だけなら Global 変数で十分です。
Provider を使う本当の理由は **「依存性の注入 (Dependency Injection)」** と **「リアクティブな更新」** です。

### 依存性の注入 (DI)
```dart
// 悪い例: 直接依存 (テスト時にモックできない)
final repository = AuthRepository();
```

```dart
// 良い例: Provider経由 (テスト時にoverride可能)
final authRepositoryProvider = Provider((ref) => AuthRepository());
```

## 2. 実践的な Provider パターン

### A. Repository / Service の提供 (`Provider`)
状態を持たないロジッククラスや、外部サービスのクライアントを提供します。
```dart
final apiServiceProvider = Provider<ApiService>((ref) {
  // 他のProviderに依存することも可能
  final client = ref.watch(dioProvider);
  return ApiService(client);
});
```

### B. 画面の状態管理 (`NotifierProvider` / `AsyncNotifierProvider`)
昔は `StateProvider` や `ChangeNotifier` が使われましたが、現在は **`Notifier` / `AsyncNotifier`** が推奨です。

```dart
// 非同期で初期化される状態 (例: ユーザー情報取得)
@riverpod
class UserProfile extends _$UserProfile {
  @override
  Future<User> build() async {
    // 初期化処理
    return await fetchUser();
  }

  // 状態変更メソッド
  Future<void> updateName(String name) async {
    state = const AsyncValue.loading(); // ローディング中にする
    state = await AsyncValue.guard(() async {
      await api.updateUser(name);
      return await fetchUser(); // 最新状態を取得
    });
  }
}
```

## 3. `ref.watch` vs `ref.read`
- **`ref.watch`**: 値が変わったら再ビルド・再実行したい場所で使う（`build` メソッド内など）。
- **`ref.read`**: 値を「一回だけ」取得したい、またはアクションを起こしたい場所で使う（ボタンの `onPressed` コールバック内など）。

> [!WARNING]
> `build` メソッド内で `ref.read` を使うのはアンチパターンです。状態変更を検知できず、バグの温床になります。

## 4. パフォーマンスチューニング
`ConsumerWidget` は便利ですが、巨大なウィジェットツリーの根元で再ビルドが走ると重くなります。

- **`select` を使う**: オブジェクトの一部だけが変わった時に再ビルドする。
```dart
// user.age が変わった時だけ再ビルド
final age = ref.watch(userProvider.select((user) => user.age));
```
- **ウィジェットを分割する**: 頻繁に更新される部分は、小さなウィジェット（`Consumer`）として切り出す。

## まとめ
- 状態は `Notifier` でカプセル化する。
- UI は `AsyncValue` (`data`, `loading`, `error`) をハンドリングするだけにする。
- ロジックと UI を明確に分離することが、堅牢なアプリへの第一歩です。
