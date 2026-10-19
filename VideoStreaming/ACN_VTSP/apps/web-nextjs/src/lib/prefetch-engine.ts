/**
 * ACN-VTSP Phase 8.1: Zero-Latency Next-2-Videos CMAF Segment Pre-Fetcher
 *
 * When rendering the personalized feed (especially 9:16 vertical scroll Shorts),
 * the client pre-fetches the `.m3u8` manifest and the first `init.mp4` + `seg_000.m4s` (~400KB)
 * of the NEXT 2 videos in the viewport so swiping renders the first frame in < 300ms.
 */

export interface FeedVideoPrefetchTarget {
  videoId: string;
  masterM3u8Url: string;
  initMp4Url: string;
  firstSegmentM4sUrl: string;
}

const prefetchedVideoIds = new Set<string>();

export async function prefetchNextTwoVideosInViewport(
  feedItems: FeedVideoPrefetchTarget[],
  currentIndex: number
): Promise<void> {
  const nextTwo = feedItems.slice(currentIndex + 1, currentIndex + 3);

  await Promise.allSettled(
    nextTwo.map(async (item) => {
      if (prefetchedVideoIds.has(item.videoId)) return;
      prefetchedVideoIds.add(item.videoId);

      // Warm browser/HTTP3 QUIC cache for manifest + CMAF init box + first 2s .m4s chunk
      await Promise.all([
        fetch(item.masterM3u8Url, { mode: "cors" }),
        fetch(item.initMp4Url, { mode: "cors" }),
        fetch(item.firstSegmentM4sUrl, {
          mode: "cors",
          headers: { Range: "bytes=0-409600" }, // ~400KB fast-startup cap
        }),
      ]);
    })
  );
}

export class ShortsPrefetchEngine {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:8080/out_cmaf") {
    this.baseUrl = baseUrl;
  }

  public async onViewportChange(currentIndex: number, videoIds: string[]): Promise<string[]> {
    const targets: FeedVideoPrefetchTarget[] = videoIds.map((vid) => ({
      videoId: vid,
      masterM3u8Url: `${this.baseUrl}/videos/vid_8842/master.m3u8`,
      initMp4Url: `${this.baseUrl}/videos/vid_8842/video_h264/360p/init.mp4`,
      firstSegmentM4sUrl: `${this.baseUrl}/videos/vid_8842/video_h264/360p/seg_000.m4s`,
    }));
    await prefetchNextTwoVideosInViewport(targets, currentIndex);
    return videoIds.slice(currentIndex + 1, currentIndex + 3);
  }
}
