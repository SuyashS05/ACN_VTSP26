/**
 * ACN-VTSP Yjs Redis Snapshot Persistence (`services/whiteboard-yjs-sync/src/redis-persistence.ts`)
 * Compresses and persists Y.encodeStateAsUpdate binary snapshots to Redis (`yjs:room:{roomId}`) for late joiners.
 */

import * as zlib from "node:zlib";

export interface CompressedRoomSnapshot {
  redisKey: string;
  roomId: string;
  rawBytes: number;
  compressedBytes: number;
  gzipBase64: string;
  updatedAtIso: string;
}

export function encodeRedisRoomSnapshot(roomId: string, stateUpdate: Uint8Array): CompressedRoomSnapshot {
  const compressed = zlib.gzipSync(Buffer.from(stateUpdate));
  return {
    redisKey: `yjs:room:${roomId}`,
    roomId,
    rawBytes: stateUpdate.byteLength,
    compressedBytes: compressed.byteLength,
    gzipBase64: compressed.toString("base64"),
    updatedAtIso: new Date().toISOString(),
  };
}

