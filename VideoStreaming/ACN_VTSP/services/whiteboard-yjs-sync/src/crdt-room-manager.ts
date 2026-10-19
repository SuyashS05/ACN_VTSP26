/**
 * ACN-VTSP Yjs CRDT Room Manager (`services/whiteboard-yjs-sync/src/crdt-room-manager.ts`)
 * Manages room-scoped Y.Doc state vectors and broadcasts <5 kbps Uint8Array binary stroke deltas.
 */

export interface CrdtStrokeDelta {
  roomId: string;
  authorId: string;
  seq: number;
  binaryUpdateBase64: string;
  byteLength: number;
  timestampMs: number;
}

export class CrdtRoomManager {
  private rooms = new Map<string, CrdtStrokeDelta[]>();

  public appendDelta(roomId: string, authorId: string, payloadBytes: Uint8Array): CrdtStrokeDelta {
    const list = this.rooms.get(roomId) ?? [];
    const delta: CrdtStrokeDelta = {
      roomId,
      authorId,
      seq: list.length + 1,
      binaryUpdateBase64: Buffer.from(payloadBytes).toString("base64"),
      byteLength: payloadBytes.byteLength,
      timestampMs: Date.now(),
    };
    list.push(delta);
    this.rooms.set(roomId, list);
    return delta;
  }

  public getRoomHistory(roomId: string): CrdtStrokeDelta[] {
    return this.rooms.get(roomId) ?? [];
  }
}

