# 14_Dart言語の基礎 🎯

Flutter を書くための言語 Dart の特徴的な機能を学びます。
他の言語経験者でも「？」となりやすいポイントをまとめました。

## 1. Null Safety (ぬるぽ回避)
Dart は「変数はデフォルトで `null` になれない」という安全設計です。

```dart
String name = "Tanaka";
name = null; // エラー！ (Non-nullable)

String? nickname = "Taro"; // '?' をつけると null OK
nickname = null; // OK
```

### 便利演算子
- `??`: null なら右の値を使う
  - `String display = nickname ?? "Guest";`
- `?.`: null じゃなければアクセスする
  - `int? length = nickname?.length;`
- `!`: 絶対に null じゃないと誓う（強制アンラップ）
  - `int length = nickname!.length;` // nullだったらクラッシュするので注意！

## 2. final vs const
どちらも「再代入できない変数」ですが、微妙に違います。

- **final**: **実行時**に決まる定数。
  - プログラムが動いてから決まる値（通信結果、現在時刻など）。
  - `final now = DateTime.now();`
- **const**: **コンパイル時**に決まる定数。
  - プログラムを書いた時点で確定している値。パフォーマンスが良い。
  - `const pi = 3.14;`
  - Widgetのコンストラクタによくつける (`const Text("Hello")`)。これにより、再描画時にインスタンスを使い回して高速化してくれる。

## 3. コレクション (List, Map) の操作
forループを書くより、高階関数（map, where）を使うのがDart流です。

```dart
final numbers = [1, 2, 3, 4, 5];

// 2倍にする (map)
final doubled = numbers.map((n) => n * 2).toList(); // [2, 4, 6, 8, 10]

// 偶数だけ残す (where)
final evens = numbers.where((n) => n % 2 == 0).toList(); // [2, 4]

// 条件を満たすものが存在するか (any)
final hasFive = numbers.any((n) => n == 5); // true
```

## 4. カスケード記法 (..)
オブジェクトに対して連続して操作を行う記法です。

```dart
// 普通の書き方
var paint = Paint();
paint.color = Colors.black;
paint.strokeCap = StrokeCap.round;

// カスケード
var paint = Paint()
  ..color = Colors.black
  ..strokeCap = StrokeCap.round;
```
インスタンス生成と設定をまとめて書けるので、コードがスッキリします。

---

## 📚 用語集 (Glossary)

| 用語 | 意味 | 例 |
|------|------|-----|
| **Null Safety** | Null参照エラーを防ぐ仕組み | `String?` vs `String` |
| **final** | 一度しか代入できない変数 | Javaのfinalと同じ |
| **const** | コンパイル時に決まる定数 | C++のconstに近い |
| **late** | 初期化を遅らせるキーワード | `late String name;` |
| **Arrow Function (アロー関数)** | `=>` で書く短い関数 | `(x) => x * 2` |
| **Cascade (カスケード)** | `..` で連続呼び出し | ビルダーパターンに近い |

## 🛠️ コマンド集 (Dart CLI)

| コマンド | 説明 |
|---|---|
| `dart run` | Dartファイルを実行する |
| `dart format` | コードを綺麗に整形する |
| `dart fix` | 自動修正を適用する |
| `dart pub add <package>` | ライブラリを追加する |
