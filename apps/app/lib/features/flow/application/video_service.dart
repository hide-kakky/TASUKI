import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:isar/isar.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:tasuki_app/features/flow/data/upload_queue.dart';

class VideoService {
  final SupabaseClient _supabase;
  final Isar _isar;

  VideoService(this._supabase, this._isar);

  Future<void> uploadVideo(File videoFile, String storeId) async {
    try {
      // 1. Get Upload URL
      final response = await _supabase.functions.invoke('create_mux_upload_url', body: {
        'store_id': storeId,
      });

      if (response.status != 200) {
        throw Exception('Failed to get upload URL: ${response.data}');
      }

      final uploadUrl = response.data['upload_url'];
      final handoverId = response.data['handover_id'];
      debugPrint('Upload URL: $uploadUrl, Handover ID: $handoverId');

      // 2. Upload File (PUT)
      final fileBytes = await videoFile.readAsBytes();
      final uploadResponse = await http.put(
        Uri.parse(uploadUrl),
        body: fileBytes,
        headers: {
            'Content-Type': 'application/octet-stream',
        },
      );

      if (uploadResponse.statusCode >= 200 && uploadResponse.statusCode < 300) {
        debugPrint('Upload successful');
        await _supabase.from('handovers').update({'ai_status': 'uploaded'}).eq('id', handoverId);
      } else {
        throw Exception('Upload failed: ${uploadResponse.statusCode} ${uploadResponse.body}');
      }

    } catch (e) {
      debugPrint('VideoService Error (Offline?): $e');
      // Save to Offline Queue
      final item = UploadQueueItem()
        ..filePath = videoFile.path
        ..storeId = storeId
        ..createdAt = DateTime.now()
        ..status = UploadStatus.pending;

      await _isar.writeTxn(() async {
        await _isar.uploadQueueItems.put(item);
      });
      debugPrint('Saved to offline queue');
    }
  }
}
