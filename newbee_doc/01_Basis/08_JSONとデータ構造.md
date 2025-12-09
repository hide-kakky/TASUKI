# 08_JSONとデータ構造 📦

APIと会話するための「共通言語」である JSON について学びます。
アプリ開発の9割は JSON のやり取りです。

## 1. JSON (JavaScript Object Notation) とは？
データをテキストで表現するための軽量なフォーマットです。
人間にも読みやすく、機械も解析しやすいのが特徴です。

### 基本ルール
- `{}`: オブジェクト（データの塊）
- `[]`: 配列（リスト）
- `"key": value`: キーと値のペア。キーは必ずダブルクォート `"` で囲む。

```json
{
  "id": 1,
  "name": "Tanaka",
  "is_admin": true,
  "skills": ["Flutter", "Supabase"],
  "address": {
    "city": "Tokyo",
    "zip": "100-0001"
  }
}
```

## 2. Dart (Flutter) との対応
JSON はそのままでは Dart で使えません。クラス（型）に変換する必要があります。

| JSON | Dart |
|---|---|
| `{}` Object | `Map<String, dynamic>` または `Class` |
| `[]` Array | `List<dynamic>` |
| `"string"` | `String` |
| `123` | `int` / `double` |
| `true` | `bool` |
| `null` | `null` |

## 3. 実践: JSONのパース (Serialization)
サーバーから受け取った JSON を Dart のクラスに変換することを「デシリアライズ」、逆を「シリアライズ」と呼びます。

```dart
// 1. クラス定義
class User {
  final String name;
  final int age;

  User({required this.name, required this.age});

  // 2. JSONから変換 (factory constructor)
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      name: json['name'] as String,
      age: json['age'] as int,
    );
  }

  // 3. JSONへ変換
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'age': age,
    };
  }
}
```
TASUKI では `freezed` というパッケージを使って、これらのコードを自動生成しています。
