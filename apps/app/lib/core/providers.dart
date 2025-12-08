
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tasuki_app/features/flow/application/video_service.dart';

// Initialized in main.dart
final isarProvider = Provider<Isar>((ref) => throw UnimplementedError());

final supabaseProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

final videoServiceProvider = Provider<VideoService>((ref) {
  final supabase = ref.watch(supabaseProvider);
  final isar = ref.watch(isarProvider);
  return VideoService(supabase, isar);
});
