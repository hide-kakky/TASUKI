# 11_Flutterレイアウト入門 📐

「デザイン通りの画面が作れない...」と悩む人のための、レイアウトの仕組み解説です。
Flutterは「Widgetの中にWidgetを入れる」入れ子構造で画面を作ります。

## 1. 3大レイアウト Widget

### Row (横並び) & Column (縦並び)
基本中の基本です。
- `mainAxisAlignment`: 主軸（並ぶ方向）の配置。真ん中寄せ(`center`)や均等配置(`spaceBetween`)など。
- `crossAxisAlignment`: 交差軸（直角方向）の配置。

```dart
Column(
  mainAxisAlignment: MainAxisAlignment.center, // 縦の真ん中
  crossAxisAlignment: CrossAxisAlignment.start, // 横の左端
  children: [
    Text("Title"),
    Text("Subtitle"),
  ],
)
```

### Stack (重ね合わせ)
画像の上に文字を乗せたい時などに使います。Photoshopのレイヤーと同じです。
`Positioned` Widgetを使って位置を指定します。

```dart
Stack(
  children: [
    Image.network("..."), // 下のレイヤー
    Positioned(
      bottom: 10,
      right: 10,
      child: Text("右下の文字"), // 上のレイヤー
    ),
  ],
)
```

## 2. コンテンツのサイズ調整

### Expanded & Flexible
Row や Column の中で、「残りのスペースを全部埋めたい」時に使います。
これを忘れると、画面端で「黄色と黒の縞々（オーバーフローエラー）」が出ます。

```dart
Row(
  children: [
    Icon(Icons.star),
    Expanded( // 残り幅いっぱいに広がる
      child: Text("すごく長いタイトルでもこれで大丈夫..."),
    ),
    Icon(Icons.arrow_forward),
  ],
)
```

### Container / SizedBox / Padding
- **SizedBox**: 固定サイズを指定したい時、あるいは隙間を開けたい時に使う（推奨）。
- **Padding**: 内側の余白。
- **Container**: 色を塗る、角を丸める、影をつけるなど、装飾が必要な時だけ使う（便利だが重いので乱用注意）。

## 3. レスポンシブ対応の考え方
スマホは機種によって画面サイズが違います。
「絶対配置（x=100, y=200）」ではなく、「相対配置（中央揃え、パディング16px）」で組むのがコツです。

- `MediaQuery.of(context).size` で画面サイズを取得できます。
- `LayoutBuilder` を使うと、親のサイズに応じてレイアウトを変えられます。
