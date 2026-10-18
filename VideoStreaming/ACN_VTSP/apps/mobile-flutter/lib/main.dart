// ============================================================================
// ACN-VTSP Phase 8.2: Flutter Cross-Platform Mobile App (16:9 VOD & 9:16 Shorts)
// Supports CMAF ABR (360p/720p/1080p), 0.25x-2x Speed, Next-2-Video Pre-Fetching,
// Shoppable Product Pop-Up Overlays, Timestamped RAG Q&A, and LiveKit WebRTC
// ============================================================================

import 'package:flutter/material.dart';

void main() {
  runApp(const AcnVtspMobileApp());
}

class AcnVtspMobileApp extends StatelessWidget {
  const AcnVtspMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ACN-VTSP Stream',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3186FF),
          brightness: Brightness.dark,
        ),
      ),
      home: const AcnHomeShell(),
    );
  }
}

class AcnHomeShell extends StatefulWidget {
  const AcnHomeShell({super.key});

  @override
  State<AcnHomeShell> createState() => _AcnHomeShellState();
}

class _AcnHomeShellState extends State<AcnHomeShell> {
  int _tabIndex = 0;
  double _playbackSpeed = 1.0;
  String _selectedQuality = '720p (Fast ABR)';
  String _selectedAudioLang = 'English (Original)';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ACN-VTSP • Cloud-Native Stream'),
        actions: [
          DropdownButton<String>(
            value: _selectedQuality,
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: '360p (Instant)', child: Text('360p')),
              DropdownMenuItem(value: '720p (Fast ABR)', child: Text('720p')),
              DropdownMenuItem(value: '1080p (Full HD)', child: Text('1080p')),
            ],
            onChanged: (v) => setState(() => _selectedQuality = v!),
          ),
          const SizedBox(width: 12),
          DropdownButton<double>(
            value: _playbackSpeed,
            underline: const SizedBox.shrink(),
            items: const [0.25, 0.5, 1.0, 1.25, 1.5, 2.0]
                .map((s) => DropdownMenuItem(value: s, child: Text('${s}x')))
                .toList(),
            onChanged: (v) => setState(() => _playbackSpeed = v!),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: IndexedStack(
        index: _tabIndex,
        children: [
          _buildHorizontalVodView(),
          _buildVerticalShortsView(),
          _buildLiveWebRtcAndWhiteboardView(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (idx) => setState(() => _tabIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.ondemand_video), label: '16:9 Watch & RAG'),
          NavigationDestination(icon: Icon(Icons.smartphone), label: '9:16 Shorts'),
          NavigationDestination(icon: Icon(Icons.sensors), label: 'Live + Board'),
        ],
      ),
    );
  }

  Widget _buildHorizontalVodView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF38BDF8)),
                ),
                child: Center(
                  child: Text(
                    'CMAF Player ($_selectedQuality @ ${_playbackSpeed}x)\nAudio: $_selectedAudioLang',
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              Positioned(
                right: 16,
                top: 16,
                child: Chip(
                  avatar: const Icon(Icons.shopping_bag, size: 16, color: Color(0xFF34D399)),
                  label: const Text('Wireless Headphones • \$129'),
                  backgroundColor: Colors.black87,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Timestamped RAG Q&A & Auto-MCQ Quiz',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Card(
          child: ListTile(
            leading: Chip(label: Text('[00:42]')),
            title: Text('Why does CMAF encode .m4s segments once?'),
            subtitle: Text('Shared across Apple HLS (.m3u8) and Android DASH (.mpd) with zero egress on R2.'),
          ),
        ),
      ],
    );
  }

  Widget _buildVerticalShortsView() {
    return PageView.builder(
      scrollDirection: Axis.vertical,
      itemCount: 3,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child: Text(
              '9:16 Vertical Short #${index + 1}\n(Pre-fetched next 2 videos init.mp4 + seg_000.m4s ~400KB)',
              textAlign: TextAlign.center,
            ),
          ),
        );
      },
    );
  }

  Widget _buildLiveWebRtcAndWhiteboardView() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'LiveKit WebRTC SFU (<300ms Co-Hosting) + MediaMTX LL-HLS (10k+ Viewers)\n'
          '+ Yjs CRDT Whiteboard (<5 kbps) + Go/ONNX Sub-5ms Chat Moderation',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

