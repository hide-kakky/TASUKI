# 02_Tech_Stack Companion（誤解ポイント・実装ミニ課題）

主要技術の理解を早めるための補助資料です。

## 01_アーキテクチャと技術スタック図解
- 誤解: 「MuxとSupabaseが直接つながる」→ Edge Functionsで橋渡し。
- ミニ課題: 動画アップロード〜再生を3行で書く。
- ユースケース図（簡略）:
```
ユーザー → Flutter(UI) → Supabase(Auth/DB/RLS)
                           ↘ Edge Functions → Gemini
ユーザー → 動画アップロード → Mux(エンコード/HLS) → Flutter再生
```
- 最小実装手順:
  1. Supabase Authでログイン
  2. Storageへ動画をPUT
  3. Edge FunctionでMuxアップロードをキック
  4. HLS URLを受け取り、FlutterのVideoプレーヤーで再生
- コード断片（Flutter概略）:
```dart
final supabase = Supabase.instance.client;
final file = File(pickedPath);
await supabase.storage.from('videos').upload('user/$uid.mp4', file);
final res = await supabase.functions.invoke('mux-upload', body: {'path': 'user/$uid.mp4'});
final playbackUrl = res.data['playbackUrl'];
// VideoPlayerController.network(playbackUrl);
```

## 02_Flutterとモバイルアプリ
- 誤解: 「Widgetは画面と1:1」→ ツリーで構成され、入れ子になる。
- ミニ課題: `Scaffold -> Column -> Text/Button`のツリーを手書き。
- 最小実装断片:
```dart
return Scaffold(
  appBar: AppBar(title: const Text('Hello TASUKI')),
  body: Column(children: const [
    Text('Hi'),
    SizedBox(height: 8),
    ElevatedButton(onPressed: null, child: Text('Go')),
  ]),
);
```

## 03_Supabaseとバックエンド
- 誤解: 「BaaSだから設計不要」→ スキーマ/RLS/インデックス設計は必要。
- ミニ課題: Auth・DB・Storage・Edge Functionsの役割を1行ずつ。
- 最小実装手順（Edge Function例）:
```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authUser.id)
  .single();
return Response.json({ profile: data });
```

## 04_AIとGemini
- 誤解: 「LLMに丸投げでOK」→ コンテキスト/制約/評価が必要。
- ミニ課題: プロンプトに入れる「目的・入力形式・出力形式」を書き出す。
- 最小実装手順（擬似）:
```ts
const prompt = `目的: ${goal}\n入力形式: JSON\n出力形式: 要約のみ`;
const result = await gemini.generateContent([{ text: prompt }, { text: userText }]);
return result.response.text();
```

## 05_動画処理とMux
- 誤解: 「アップロードすればすぐ再生」→ エンコード完了まで待つ必要。
- ミニ課題: アップロード→エンコード→HLS配信→再生の時系列を書く。
- コード断片（Edge Function擬似）:
```ts
const upload = await mux.video.Uploads.create({ new_asset_settings: { playback_policy: 'signed' }});
return { uploadUrl: upload.url, playbackId: upload.new_asset_settings.playback_policy };
```
- チェック: エンコード完了Webhookを待ってから再生URLをフロントへ渡す。

## 06_Flutterレイアウト入門
- 誤解: 「Centerで全部OK」→ `Row/Column/Flex`の特性を使う。
- ミニ課題: RowとColumnで同じUIを組んだ場合の違いを書き出す。
- 回答例: Row=横並び・スペース共有、Column=縦並び、Flex=比率指定で柔軟。
- 最小実装断片:
```dart
Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween,
  children: const [Text('左'), Text('右')],
);
```

## 07_Flutter非同期処理
- 誤解: 「FutureとStreamは同じ」→ 単発か連続かで使い分け。
- ミニ課題: `FutureBuilder`と`StreamBuilder`の使い分けを1文で。
- 回答例: 単発取得はFutureBuilder、リアルタイム/連続イベントはStreamBuilder。
- サンプル:
```dart
FutureBuilder(
  future: fetchProfile(),
  builder: (context, snap) => Text('${snap.data?.name ?? "..."}'),
);
```
```dart
StreamBuilder(
  stream: supabase.from('messages').stream(primaryKey: ['id']),
  builder: (context, snap) => ListView(
    children: (snap.data ?? []).map((e) => Text(e['body'] as String)).toList(),
  ),
);
```

## 08_Widgetライフサイクル
- 誤解: 「buildで重い処理OK」→ initStateで初期化し、buildは軽く。
- ミニ課題: initState→build→disposeのタイミングを箇条書き。
- コード断片:
```dart
class Demo extends State<DemoWidget> with SingleTickerProviderStateMixin {
  late final controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
  @override void initState() { super.initState(); controller.forward(); }
  @override Widget build(BuildContext c) => FadeTransition(opacity: controller, child: widget.child);
  @override void dispose() { controller.dispose(); super.dispose(); }
}
```

## 09_Dart言語の基礎
- 誤解: 「varだけで良い」→ `final`/`const`の違い重要。
- ミニ課題: `final now = DateTime.now(); const pi = 3.14;` の違いを書く。
- 例:
```dart
final timestamp = DateTime.now(); // 実行時に決まる
const maxItems = 50; // コンパイル時に決まる
```

## 10_Supabase_SQL入門
- 誤解: 「SQLはSELECTだけ」→ insert/update/deleteと制約まで学ぶ。
- ミニ課題: `select * from profiles limit 5;` など4つの基本クエリを書く。
- 例:
```sql
select * from profiles limit 5;
insert into profiles (id, name) values ('uid', 'Alice');
update profiles set name='Bob' where id='uid';
delete from profiles where id='uid';
```

## 11_アニメーション完全ガイド
- 誤解: 「AnimationControllerは省略可」→ 制御と破棄が必要。
- ミニ課題: DurationとCurveを指定したアニメーションの流れを書く。

## 12_カスタム描画とRenderObject
- 誤解: 「CustomPainterだけで十分」→ RenderObjectは低レベル描画用。
- ミニ課題: Paintフェーズで行う処理を1行にまとめる。

## 13_プラットフォーム連携(MethodChannel)
- 誤解: 「プラグイン任せでOK」→ チャンネル名/メソッド名の設計が重要。
- ミニ課題: Flutter→Androidで呼ぶメソッド名を1つ設計する。

## 14_Riverpodの状態管理パターン
- 誤解: 「グローバルProviderで済む」→ スコープ分割で責務を分ける。
- ミニ課題: Providerのライフサイクルを1文で説明。

## 15_Supabase設計とセキュリティ
- 誤解: 「RLSは面倒だから無効」→ 本番では必須。ロール設計が要。
- ミニ課題: RLSを有効にする理由を1文で。
- チェックリスト: ポリシーで`auth.uid()`を使う / 公開テーブルは限定 / ストレージのバケット権限確認。
- アンチパターン: 全テーブルに`grant all to anon`、ポリシー未設定のまま本番へ。

## 16_PostgreSQL内部構造とチューニング
- 誤解: 「インデックスは多いほど良い」→ 書き込みコスト増。
- ミニ課題: インデックスが効かないケース（LIKE先頭ワイルドカード等）を書く。
- チェックリスト: EXPLAINで実行計画確認 / 必要なカラムだけインデックス / 過剰な複合インデックスを避ける。
- アンチパターン: `WHERE lower(col) LIKE '%abc%'`でB-Treeを無効化。

## 17_システム設計とスケーラビリティ
- 誤解: 「マイクロサービスが正解」→ トレードオフを評価する。
- ミニ課題: 垂直分割と水平分割の違いを1行ずつ。
- チェックリスト: SLA/開発速度/チーム構造を考慮 / 監視・トレーシングの計画。
- アンチパターン: 早期に細分化して運用コスト爆増。

## 18_Flutterパフォーマンス最適化
- 誤解: 「Statefulにすれば安全」→ Rebuildコストが増える。
- ミニ課題: Rebuild抑制テクニック（const/Keys/Selectorなど）を1つ書く。
- チェックリスト: const活用 / ListView.builder使用 / selectで部分的にlisten / DevToolsでRebuild回数確認。

## 19_国際化(i18n)対応
- 誤解: 「後から翻訳すれば良い」→ 初期からキー管理とロケール設計が必要。
- ミニ課題: 翻訳キーの命名規則を1行で決める。
- アンチパターン: 文字列直書き、キーの粒度がバラバラ。
