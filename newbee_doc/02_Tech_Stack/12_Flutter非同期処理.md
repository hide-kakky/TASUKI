# 12_Flutter非同期処理 (Future/Stream) ⏳

「ユーザー情報はいつ表示されるの？」
通信やファイル読み込みなど、**時間がかかる処理** を扱うための仕組みです。
これを理解しないと、アプリがフリーズしたり、データがないのに画面を表示してエラーになったりします。

## 1. 同期 vs 非同期
- **同期 (Sync)**: レジの行列。前の人の会計が終わるまで、次の人は動けない。アプリが固まる原因。
- **非同期 (Async)**: 整理券。会計処理をお願いして、終わったら呼んでもらう。その間、他のことができる。

## 2. Future (1回だけの値)
「未来のいつか、値が返ってくる（またはエラーになる）」約束手形です。

### async / await
Futureを簡単に扱うための構文です。
`await` をつけると、「処理が終わるまでここで待つ（でもアプリは固まらない）」ことができます。

```dart
// 戻り値は Future<String> になる
Future<String> fetchUserName() async {
  // 3秒待つ（通信のシミュレーション）
  await Future.delayed(Duration(seconds: 3));
  return "Tanaka";
}

void main() async {
  print("開始");
  final name = await fetchUserName(); // 終わるまで待つ
  print("取得完了: $name");
}
```

## 3. Stream (何回も来る値)
「パイプから水が流れ続ける」イメージです。
位置情報の更新、チャットのメッセージ、バッテリー残量など、**連続して値が変わるもの** に使います。

```dart
Stream<int> countUp() async* {
  for (int i = 0; i < 5; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i; // 値を放出する
  }
}
```

## 4. UI での扱い方 (Riverpod)
Flutter/Riverpod では、非同期データを **`AsyncValue`** という型で扱います。
これを使うと、「ロード中」「エラー」「データあり」の3状態をきれいに分岐できます。

```dart
Widget build(BuildContext context, WidgetRef ref) {
  final userAsync = ref.watch(userProvider);

  return userAsync.when(
    data: (user) => Text(user.name),    // データが来た！
    loading: () => CircularProgressIndicator(), // ロード中...
    error: (err, stack) => Text('エラー: $err'), // エラー！
  );
}
```
昔は `FutureBuilder` を使っていましたが、今は `AsyncValue` (`ref.watch`) が圧倒的に楽で安全です。
