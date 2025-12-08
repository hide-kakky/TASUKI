
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:isar/isar.dart';
import 'package:tasuki_app/features/flow/data/upload_queue.dart';
import 'package:tasuki_app/core/providers.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: 'http://127.0.0.1:54321',
    anonKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  );

  // Initialize Isar
  final dir = await getApplicationDocumentsDirectory();
  final isar = await Isar.open(
    [UploadQueueItemSchema],
    directory: dir.path,
  );

  runApp(ProviderScope(
    overrides: [
      isarProvider.overrideWithValue(isar),
    ],
    child: const TasukiApp(),
  ));
}

class TasukiApp extends ConsumerWidget {
  const TasukiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Check initial session
    final session = Supabase.instance.client.auth.currentSession;

    return MaterialApp(
      title: 'TASUKI',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: session != null ? const TimelineScreen() : const AuthScreen(),
    );
  }
}
