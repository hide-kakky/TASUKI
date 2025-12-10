# 19_プラットフォーム連携 (MethodChannel) 🌉

Flutter は万能の画用紙ですが、OS（iOS/Android）の機能を全て持っているわけではありません。
「Flutterからネイティブコード (Swift/Kotlin) を呼び出す」仕組みが MethodChannel です。

## 1. 仕組み
Web APIのリクエストに似ています。
1. Flutter側が「メソッド名」と変な「引数」を送る。
2. OS側（iOS/Android）がそれを受け取り、ネイティブAPIを実行する。
3. 結果をFlutter側に返す。

```dart
// Flutter側
const platform = MethodChannel('com.example.tasuki/battery');
final int batteryLevel = await platform.invokeMethod('getBatteryLevel');
```

```swift
// iOS側 (Swift)
if call.method == "getBatteryLevel" {
  let level = device.batteryLevel
  result(Int(level * 100))
}
```

## 2. 型の変換
Dartの型とネイティブの型は自動変換されます。

- Dart `int` ⇔ Swift `Int` / Kotlin `Int`
- Dart `String` ⇔ Swift `String` / Kotlin `String`
- Dart `Map` ⇔ Swift `Dictionary` / Kotlin `HashMap`

## 3. Pigeon (鳩)
手書きで MethodChannel を書くと、メソッド名のスペルミスや型の不一致でクラッシュしがちです。
**Pigeon** という公式パッケージを使うと、Dartの定義ファイルから Swift/Kotlin のコードを自動生成してくれます。
「型安全な MethodChannel」を実現できるので、実務ではこちらが推奨されます。

## 4. FFI (Foreign Function Interface)
C/C++ や Rust のライブラリを直接呼び出す仕組みです。
MethodChannel は一度メッセージをシリアライズするのでオーバーヘッドがありますが、FFI はメモリを直接共有して呼び出せるため爆速です。
画像処理エンジンやMLモデルを動かす場合に使われます。

---

## 📚 用語集 (Glossary)

| 用語 | 意味 | 関連 |
|------|------|-----|
| **Native Code** | OS本来の言語で書かれたコード | Swift, Kotlin, Java, Obj-C |
| **MethodChannel** | Flutter ⇔ Native の通信 | 非同期で呼び出す |
| **Pigeon** | 型安全な通信コード生成ツール | 公式推奨 |
| **FFI** | C言語などの関数を直接呼ぶ仕組み | 高速 |
| **Plugin** | ネイティブコードを含むパッケージ | `pub.dev` にある多くのライブラリ |
| **JNI** | Java Native Interface | AndroidでC++を呼ぶ仕組み |

