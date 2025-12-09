# 18_カスタム描画とRenderObject 🎨

既存の Widget (`Container`や`Row`) の組み合わせでは作れないUI（グラフ、特殊な図形、手書きキャンバス）を作る方法です。

## 1. CustomPaint
最も手軽なカスタム描画です。
`CustomPainter` クラスを継承し、`paint` メソッドの中に「円を描く」「線を引く」という命令を書きます。

```dart
class MyCirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.blue;
    // 中心に半径50の円を描く
    canvas.drawCircle(Offset(size.width/2, size.height/2), 50, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
```

これを `CustomPaint` Widgetの `painter` プロパティに渡して表示します。

## 2. RenderObject (深淵へ)
Flutterの Widget は、実は「設定書」に過ぎません。
実際に画面レイアウト計算や描画を行っている実働部隊が **RenderObject** です。

- **Widget**: 不変 (Immutable)。UIの構成定義。
- **Element**: 仲介役。WidgetとRenderObjectを紐付ける。
- **RenderObject**: 可変 (Mutable)。サイズ計算 (`performLayout`) や描画 (`paint`) を行う。

通常は Widget だけ触っていればいいですが、「子要素のサイズに応じて親のレイアウトを特殊なルールで決めたい」といった極限のカスタマイズが必要な場合、`RenderObject` を自作することになります。
（標準の `Column` や `Stack` も、内部では `RenderFlex` や `RenderStack` という RenderObject です）

## 3. Shader (シェーダー)
GPU上で動くプログラムです。
Flutter では `FragmentShader` をサポートしており、水面の揺らぎやモザイク処理など、CPUでは処理しきれない超高速なピクセル操作が可能です。
Dart ではなく **GLSL** という言語で記述します。

---

## 📚 用語集 (Glossary)

| 用語 | 意味 | 関連 |
|------|------|-----|
| **Canvas** | お絵かきキャンバス | `drawCircle`, `drawLine` |
| **Paint** | 絵の具・筆の設定 | 色、太さ、塗りつぶしかどうか |
| **Path** | 複雑な線や図形 | ベジェ曲線など |
| **RenderObject** | 描画の実行部隊 | レイアウト計算とペイントを行う |
| **Element** | 中間管理職 | Widgetの変更をRenderObjectに伝える |
| **Shader** | GPUプログラム | ピクセル単位のエフェクト |
| **GLSL** | シェーダー言語 | C言語っぽい構文 |

