
import 'package:isar/isar.dart';

part 'upload_queue.g.dart';

@collection
class UploadQueueItem {
  Id id = Isar.autoIncrement;

  late String filePath;

  late String storeId;

  late DateTime createdAt;

  @Enumerated(EnumType.name)
  UploadStatus status = UploadStatus.pending;
}

enum UploadStatus {
  pending,
  uploading,
  failed,
}
