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
        fetch(item.masterM3u8Url, { mode: "cors", credentials: "include" }),
        fetch(item.initMp4Url, { mode: "cors", credentials: "include" }),
        fetch(item.firstSegmentM4sUrl, {
          mode: "cors",
          credentials: "include",
          headers: { Range: "bytes=0-409600" }, // ~400KB fast-startup cap
        }),
      ]);
    })
  );
}

