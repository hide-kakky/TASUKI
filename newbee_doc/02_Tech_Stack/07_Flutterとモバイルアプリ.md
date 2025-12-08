# 07. Flutterとモバイルアプリ

## 🎯 このレッスンで学ぶこと

- Flutterとは何か
- モバイルアプリの仕組み
- TASUKIのFlutter設計
- ウィジェット・状態管理・データ永続化

---

## 1. Flutter とは？

### Google が開発したモバイルアプリ開発フレームワーク

**フレームワーク** = アプリ開発を楽にしてくれる「道具箱」

**Flutterのすごいところ**:
```
1つのコード（Dart言語）
  ↓
iOSアプリ ✅
Androidアプリ ✅
Webアプリ ✅
デスクトップアプリ ✅
```

**クロスプラットフォーム** = 複数のプラットホームで動く

---

## 2. ウィジェット（Widget）

Flutterは「全てがウィジェット」です。

### ウィジェット = レゴブロック

```
画面
├── AppBar（上部バー）
│   └── Text("TASUKI")
├── FloatingActionButton（録画ボタン）
│   └── Icon(Icons.videocam)
└── ListView（マニュアル一覧）
    ├── ListTile（マニュアル1）
    ├── ListTile（マニュアル2）
    └── ListTile（マニュアル3）
```

小さいウィジェットを組み合わせて、大きな画面を作ります。

---

## 3. 状態管理（Riverpod）

**状態** = アプリが覚えておく情報

例:
- ログイン中のユーザー
- 表示中のマニュアル
- アップロード進行状況

TASUKIでは **Riverpod** を使います。

```dart
// ログイン状態を管理
@riverpod
User? currentUser(CurrentUserRef ref) {
  return supabase.auth.currentUser;
}

// 画面で使う
final user = ref.watch(currentUserProvider);
print(user.displayName); // "山田太郎"
```

---

## 4. オフライン対応（Isar）

**Isar** = スマホ内のデータベース

```
ネットワークなし
  ↓
録画した動画をIsarに保存
  ↓
ネットワーク復帰
  ↓
Isarから動画を取り出してアップロード
```

---

## 5. TASUKIの主要画面

1. **RecordScreen** - 録画画面
2. **TimelineScreen** - タイムライン
3. **ManualDetailScreen** - マニュアル詳細
4. **ManagerApprovalScreen** - Manager承認画面

---

## 📝 まとめ

- Flutter = クロスプラットフォームフレームワーク
- ウィジェット = 画面を作るレゴブロック
- Riverpod = 状態管理
- Isar = オフライン対応

TASUKIはFlutterで、iOS/Android両対応のアプリを効率的に開発しています！

---

次は「08_Supabaseとバックエンド.md」でバックエンドの詳細を学びます！
