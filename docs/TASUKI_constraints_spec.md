# TASUKI 動画・AI 処理制約仕様

本ドキュメントは、動画処理、AI 処理、オフライン管理に関する具体的な制約と設定値を定義します。

---

## 1. 動画録画制約

### 1.1 録画時間制限
| 項目 | 値 | 理由 |
|------|-----|------|
| **最大録画時間** | 120秒 (2分) | ・離脱防止（長すぎると撮影が面倒）<br>・ストレージコスト削減<br>・AI 処理時間の短縮 |
| **最小録画時間** | 3秒 | 意味のある内容を録画するため |
| **推奨録画時間** | 30〜60秒 | 簡潔で分かりやすいマニュアルに最適 |

**実装方法** (Flutter):
```dart
// lib/features/flow/presentation/widgets/record_button.dart
const int MAX_RECORDING_DURATION_SECONDS = 120;
const int MIN_RECORDING_DURATION_SECONDS = 3;

Timer? _recordingTimer;
int _elapsedSeconds = 0;

void _startRecording() {
  _recordingTimer = Timer.periodic(Duration(seconds: 1), (timer) {
    _elapsedSeconds++;
    if (_elapsedSeconds >= MAX_RECORDING_DURATION_SECONDS) {
      _stopRecording(); // 自動停止
    }
  });
}
```

### 1.2 動画品質設定
| 項目 | 値 | 理由 |
|------|-----|------|
| **解像度** | 720p (1280x720) | ・モバイル閲覧に十分<br>・ファイルサイズと品質のバランス |
| **フレームレート** | 30 fps | 業務マニュアルには十分 |
| **ビットレート** | 2 Mbps (目安) | 720p/30fps に適切 |
| **エンコード** | H.264 | 広範囲のデバイスで再生可能 |

**推定ファイルサイズ**:
- 30秒: 約 7.5 MB
- 60秒: 約 15 MB
- 120秒: 約 30 MB

### 1.3 サポートフォーマット
- **入力**: MP4, MOV
- **出力** (Mux): HLS (`.m3u8`)

---

## 2. AI 処理制約

### 2.1 タイムアウト設定
| 処理 | タイムアウト | リトライ | 理由 |
|------|-------------|---------|------|
| **Gemini API 呼び出し** | 90秒 | 2回 | 長い動画でも処理完了を待つ |
| **Google Docs 取得** | 30秒 | 3回 | ネットワークエラー対策 |
| **Mux Webhook 処理** | 10秒 | なし | 冪等性保証のため短時間で応答 |

**実装例** (Edge Functions):
```typescript
// supabase/functions/_shared/gemini-client.ts
const GEMINI_TIMEOUT_MS = 90000; // 90秒

async function callGemini(prompt: string): Promise<GeminiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/...', {
      signal: controller.signal,
      // ...
    });
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 2.2 リトライポリシー
| エラー種別 | リトライ | 最大回数 | 間隔 | 記録 |
|-----------|---------|---------|------|------|
| **ネットワークエラー** | ✅ | 3回 | Exponential Backoff | `ai_jobs.retries` |
| **タイムアウト** | ✅ | 2回 | 60秒固定 | `ai_jobs.error_code='timeout'` |
| **API レート制限** | ✅ | 5回 | Retry-After ヘッダ準拠 | `ai_jobs.error_code='rate_limit'` |
| **認証エラー** | ❌ | 0回 | - | `ai_jobs.error_code='auth_error'` |
| **入力データ不正** | ❌ | 0回 | - | `ai_jobs.error_code='invalid_input'` |

**Exponential Backoff**:
```
1回目: 1秒
2回目: 2秒
3回目: 4秒
4回目: 8秒
5回目: 16秒
```

**実装例**:
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  isRetryable: (error: unknown) => boolean
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || retries >= maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
}
```

### 2.3 Gemini トークン制限
| 項目 | 値 | 備考 |
|------|-----|------|
| **入力トークン上限** | 32,768 トークン | Gemini 1.5 Pro の制限 |
| **出力トークン上限** | 8,192 トークン | サマリ・手順・Tips で十分 |
| **動画長さ上限** | 120秒 | = 約 1,800 フレーム (30fps) |

---

## 3. Webhook セキュリティ

### 3.1 Mux Webhook 署名検証
**実装方法**:
```typescript
// supabase/functions/mux_webhook/index.ts
import { createHmac } from 'https://deno.land/std/crypto/mod.ts';

function verifyMuxSignature(req: Request, signature: string | null): boolean {
  if (!signature) return false;

  const secret = Deno.env.get('MUX_WEBHOOK_SECRET')!;
  const body = await req.text();

  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

serve(async (req) => {
  const signature = req.headers.get('mux-signature');
  if (!verifyMuxSignature(req, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }
  // ... 処理続行
});
```

### 3.2 リプレイ攻撃防止
```typescript
// Timestamp チェック（5分以内のリクエストのみ受付）
const MAX_TIMESTAMP_DIFF_MS = 5 * 60 * 1000;

function isTimestampValid(timestamp: string): boolean {
  const webhookTime = new Date(timestamp).getTime();
  const now = Date.now();
  return Math.abs(now - webhookTime) < MAX_TIMESTAMP_DIFF_MS;
}
```

---

## 4. オフラインストレージ管理

### 4.1 オフラインキュー制約
| 項目 | 値 | 理由 |
|------|-----|------|
| **最大キューサイズ** | 10件 | ディスク容量節約（最大 300 MB） |
| **最大保持期間** | 7日間 | それ以上古いものは自動削除 |
| **最大ファイルサイズ** | 50 MB | 異常に大きなファイルを除外 |

**実装方法** (Flutter):
```dart
// lib/features/flow/data/services/offline_queue_service.dart
const int MAX_QUEUE_SIZE = 10;
const Duration MAX_RETENTION = Duration(days: 7);

Future<void> cleanupOldUploads() async {
  final isar = await Isar.getInstance();
  final now = DateTime.now();

  // 7日以上前のものを削除
  await isar.writeTxn(() async {
    await isar.pendingUploads
      .filter()
      .createdAtLessThan(now.subtract(MAX_RETENTION))
      .deleteAll();
  });

  // キューサイズが上限を超えたら古いものから削除
  final count = await isar.pendingUploads.count();
  if (count > MAX_QUEUE_SIZE) {
    final toDelete = await isar.pendingUploads
      .where()
      .sortByCreatedAt()
      .limit(count - MAX_QUEUE_SIZE)
      .findAll();

    await isar.writeTxn(() async {
      for (final upload in toDelete) {
        await isar.pendingUploads.delete(upload.id);
        // ファイル削除
        File(upload.filePath).deleteSync();
      }
    });
  }
}
```

### 4.2 ディスク容量チェック
```dart
// アップロード前にディスク容量を確認
Future<bool> hasEnoughDiskSpace(int requiredBytes) async {
  final dir = await getApplicationDocumentsDirectory();
  // iOS / Android の空き容量取得（プラグイン使用）
  final freeSpace = await DiskSpace.getFreeDiskSpace;

  const SAFETY_MARGIN_MB = 100; // 安全マージン
  return freeSpace > (requiredBytes + SAFETY_MARGIN_MB * 1024 * 1024);
}
```

---

## 5. Mux URL 戦略

### 5.1 現在の実装（MVP）
- **方式**: パブリック再生 URL
- **URL例**: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`
- **セキュリティ**: なし（誰でもアクセス可能）
- **理由**: 実装が簡単、MVP では店舗内アクセスのみを想定

### 5.2 将来の移行先（Post-PMF）
- **方式**: 署名付き URL (Signed URLs)
- **トリガー**: 以下のいずれかを満たした場合
  - 店舗数が 50 を超える
  - セキュリティインシデント発生
  - 外部アクセス（店舗外からの閲覧）が必要になる
- **実装方法**:
```typescript
// Mux Signing Key を使用
import Mux from '@mux/mux-node';
const { JWT } = Mux;

const token = JWT.sign(playbackId, {
  keyId: Deno.env.get('MUX_SIGNING_KEY_ID')!,
  keySecret: Deno.env.get('MUX_SIGNING_KEY_PRIVATE')!,
  type: 'video',
  expiration: '7d', // 7日間有効
});

const signedUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
```

---

## 6. Google Docs API 認証

### 6.1 推奨方式: Service Account
**理由**:
- ユーザーごとの OAuth 不要
- サーバーサイドで完結
- 公開設定のドキュメントにアクセス可能

**セットアップ手順**:
1. Google Cloud Console で Service Account 作成
2. 「Google Docs API」を有効化
3. JSON キーファイルをダウンロード
4. Supabase Secrets に登録:
   ```bash
   supabase secrets set GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

**実装例**:
```typescript
// supabase/functions/import_google_doc/index.ts
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT')!),
  scopes: ['https://www.googleapis.com/auth/documents.readonly'],
});

const docs = google.docs({ version: 'v1', auth });
const doc = await docs.documents.get({ documentId });
```

### 6.2 代替方式: 公開 URLからの直接取得
Service Account が設定できない場合のフォールバック:
```typescript
// 公開設定のドキュメントのみ
const docId = extractDocId(url);
const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
const response = await fetch(exportUrl);
const text = await response.text();
```

**制限**: ドキュメントが「リンクを知っている全員」に公開されている必要がある

---

このドキュメントにより、すべての制約値が明確になり、AI エージェントの自律実装が可能になりました。
