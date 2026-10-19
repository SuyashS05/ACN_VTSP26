"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type PlatformRole = "USER" | "CLIENT" | "ADMIN";
export type ContentType = "VIDEO" | "REEL" | "LIVE" | "POST";
export type ContentVisibility = "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";

export interface LiveViewerPermissions {
  chatMode: "EVERYONE" | "MEMBERS_ONLY" | "SLOW_MODE_5S" | "DISABLED";
  whiteboardMode: "HOST_ONLY" | "CO_HOSTS" | "ALL_VIEWERS";
  allowMicRaiseHand: boolean;
  allowShoppableOverlay: boolean;
  allowRecordingDvr: boolean;
}

export interface StudioContentItem {
  id: string;
  watchId: string;
  type: ContentType;
  visibility: ContentVisibility;
  title: string;
  description: string;
  channelName: string;
  channelHandle: string;
  ownerEmail: string;
  avatarColor: string;
  views: string;
  uploadedAt: string;
  duration: string;
  category: string;
  streamUrl: string;
  posterUrl: string;
  postImageUrl?: string;
  startOffsetSec?: number;
  defaultQuality: "1080p" | "720p" | "360p" | "Auto";
  aiBadges: string[];
  livePermissions?: LiveViewerPermissions;
}

// Exclusive Admin Email across the entire ACN-VTSP platform
export const ADMIN_EMAIL = "suyashskotkar@gmail.com";

const STORAGE_ACCOUNTS_KEY = "acn_vtsp_accounts_v2";
const STORAGE_SESSION_KEY = "acn_vtsp_session_v2";
const STORAGE_CONTENT_KEY = "acn_vtsp_studio_content_v2";

export interface AuthUserSession {
  userId: string;
  name: string;
  email: string;
  role: PlatformRole;
  channelHandle: string | null;
  bio: string;
  avatarUrl: string | null;
  bannerColor: string;
  isAuthenticated: boolean;
}

export interface ClientTenantRecord {
  clientId: string;
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  channelHandle: string;
  bio?: string;
  avatarUrl?: string | null;
  bannerColor?: string;
  role: PlatformRole;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  scopes: string[];
  quotaStorageGb: number;
}

interface RoleContextValue {
  user: AuthUserSession;
  role: PlatformRole;
  channelHandle: string | null;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  loginWithEmailPassword: (email: string, password: string) => { ok: boolean; role: PlatformRole; message: string };
  signupWithEmailPassword: (name: string, email: string, password: string) => { ok: boolean; role: PlatformRole; message: string };
  logout: () => void;
  becomeClient: (desiredHandle: string) => { ok: boolean; message: string };
  updateUserProfile: (patch: {
    name?: string;
    channelHandle?: string;
    bio?: string;
    avatarUrl?: string | null;
    bannerColor?: string;
  }) => void;
  clients: ClientTenantRecord[];
  toggleClientScope: (clientId: string, scope: string) => void;
  updateClientStatus: (clientId: string, status: ClientTenantRecord["status"]) => void;
  promoteUserToRole: (clientId: string, newRole: PlatformRole) => void;
  contentItems: StudioContentItem[];
  addContentItem: (item: Omit<StudioContentItem, "id" | "uploadedAt" | "views">) => StudioContentItem;
  updateContentVisibility: (id: string, visibility: ContentVisibility) => void;
  updateLivePermissions: (id: string, perms: LiveViewerPermissions) => void;
  deleteContentItem: (id: string) => void;
}

function normalizeLocalMediaUrl(url?: string): string {
  if (!url) return "";
  return url.replace(/^http:\/\/localhost:8080\//, "/");
}

const INITIAL_ACCOUNTS: ClientTenantRecord[] = [
  {
    clientId: "chn_admin_root",
    userId: "usr_admin_suyash",
    name: "Suyash Kotkar",
    email: ADMIN_EMAIL,
    passwordHash: "",
    channelHandle: "@suyash_admin",
    bio: "Platform Architect & Administrator • ACN-VTSP Cloud-Native Streaming",
    avatarUrl: null,
    bannerColor: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)",
    role: "ADMIN",
    status: "ACTIVE",
    scopes: ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
    quotaStorageGb: 10000,
  },
];

export const INITIAL_CONTENT_ITEMS: StudioContentItem[] = [
  {
    id: "vid_8842",
    watchId: "vid_8842",
    type: "VIDEO",
    visibility: "PUBLIC",
    title: "Zero-Egress CMAF Streaming & KEDA Spot Architecture (sample-3.mp4)",
    description: "Single-decode FFmpeg filter_complex transcoding into 360p, 720p, and 1080p CMAF .m4s segments.",
    channelName: "ACN Cloud Media",
    channelHandle: "@acn_cloud_media",
    ownerEmail: ADMIN_EMAIL,
    avatarColor: "#38bdf8",
    views: "128K views",
    uploadedAt: "2 hours ago",
    duration: "0:30",
    category: "CMAF & Transcoding",
    streamUrl: "/sample-3.mp4",
    posterUrl: "/out_cmaf/videos/vid_8842/thumbnails/poster.webp",
    defaultQuality: "1080p",
    aiBadges: ["1080p60 CMAF", "Whisper RAG", "YOLOv11 Shoppable"],
  },
  {
    id: "vid_9104",
    watchId: "vid_9104",
    type: "VIDEO",
    visibility: "PUBLIC",
    title: "Sub-5ms Go WebSocket Chat Moderation with Int8 ONNX (sd.mp4)",
    description: "Real-time 0.1ms Aho-Corasick Trie filter + 4ms quantized Int8 ONNX Detoxify moderation pipeline.",
    channelName: "EdTech AI Academy",
    channelHandle: "@edtech_ai_academy",
    ownerEmail: ADMIN_EMAIL,
    avatarColor: "#34d399",
    views: "84.2K views",
    uploadedAt: "5 hours ago",
    duration: "0:25",
    category: "AI & Video RAG",
    streamUrl: "/sd.mp4",
    posterUrl: "/out_cmaf/videos/vid_9104/thumbnails/poster.webp",
    defaultQuality: "720p",
    aiBadges: ["sd.mp4 Stream", "ONNX <5ms", "Aho-Corasick Trie"],
  },
  {
    id: "vid_8842_members",
    watchId: "vid_8842",
    type: "VIDEO",
    visibility: "MEMBERS_ONLY",
    title: "Hybrid BM25 + Qdrant BGE-M3 Timestamped Video Q&A & Auto-MCQs",
    description: "Exclusive deep-dive into Reciprocal Rank Fusion (RRF) and auto-generated interactive MCQs.",
    channelName: "DeepStream Systems",
    channelHandle: "@deepstream_ai",
    ownerEmail: ADMIN_EMAIL,
    avatarColor: "#c084fc",
    views: "62.9K views",
    uploadedAt: "1 day ago",
    duration: "0:30",
    category: "AI & Video RAG",
    streamUrl: "/sample-3.mp4",
    posterUrl: "/out_cmaf/videos/vid_8842/thumbnails/poster_12s.webp",
    startOffsetSec: 8,
    defaultQuality: "1080p",
    aiBadges: ["Qdrant Vector", "Auto-MCQ Quiz"],
  },
  {
    id: "live_room_01",
    watchId: "live_room_01",
    type: "LIVE",
    visibility: "PUBLIC",
    title: "🔴 LIVE: Sub-300ms LiveKit WebRTC SFU + <5 kbps Yjs CRDT Vector Whiteboard",
    description: "Interactive live classroom with synchronized Yjs whiteboard strokes and moderated chat.",
    channelName: "Realtime Labs",
    channelHandle: "@realtime_sfu",
    ownerEmail: ADMIN_EMAIL,
    avatarColor: "#fbbf24",
    views: "1.4K watching now",
    uploadedAt: "Streaming live",
    duration: "LIVE",
    category: "Live WebRTC & Yjs",
    streamUrl: "/sd.mp4",
    posterUrl: "/out_cmaf/videos/vid_9104/thumbnails/poster_14s.webp",
    startOffsetSec: 6,
    defaultQuality: "720p",
    aiBadges: ["WebRTC SFU", "Yjs CRDT <5kbps"],
    livePermissions: {
      chatMode: "EVERYONE",
      whiteboardMode: "ALL_VIEWERS",
      allowMicRaiseHand: true,
      allowShoppableOverlay: true,
      allowRecordingDvr: true,
    },
  },
  {
    id: "reel_9104_1",
    watchId: "vid_9104",
    type: "REEL",
    visibility: "PUBLIC",
    title: "Zero-Buffer 9:16 Vertical Reel Pre-Fetching (init.mp4 + seg_0.m4s)",
    description: "Instant swipe transitions by pre-fetching N+1 and N+2 CMAF initialization segments.",
    channelName: "Mobile Media Eng",
    channelHandle: "@mobile_media",
    ownerEmail: ADMIN_EMAIL,
    avatarColor: "#38bdf8",
    views: "115K views",
    uploadedAt: "2 days ago",
    duration: "0:25",
    category: "9:16 Shorts",
    streamUrl: "/sd.mp4",
    posterUrl: "/out_cmaf/videos/vid_9104/thumbnails/poster_alt.webp",
    startOffsetSec: 3,
    defaultQuality: "720p",
    aiBadges: ["9:16 Reel", "HTTP 206 Range"],
  },
  {
    id: "post_8842_1",
    watchId: "vid_8842",
    type: "POST",
    visibility: "PUBLIC",
    title: "Architecture Release Note: Zero-Egress SeaweedFS R2 + 6x1 WebP Sprite Sheets",
    description: "Our transcoding worker now generates 6x1 WebP sprite sheets alongside 1080p/720p/360p CMAF chunks in a single FFmpeg pass!",
    channelName: "ACN Cloud Media",
    channelHandle: "@acn_cloud_media",
    ownerEmail: ADMIN_EMAIL,
    avatarColor: "#fb7185",
    views: "4.8K likes",
    uploadedAt: "3 days ago",
    duration: "POST",
    category: "Community Posts",
    streamUrl: "/sample-3.mp4",
    posterUrl: "/out_cmaf/videos/vid_8842/thumbnails/poster_22s.webp",
    postImageUrl: "/out_cmaf/videos/vid_8842/thumbnails/poster_22s.webp",
    defaultQuality: "1080p",
    aiBadges: ["Image Post", "Creator Update"],
  },
];

const GUEST_SESSION: AuthUserSession = {
  userId: "guest",
  name: "Guest Viewer",
  email: "",
  role: "USER",
  channelHandle: null,
  bio: "Sign in to customize your profile, subscribe to channels, or launch your own Creator Studio.",
  avatarUrl: null,
  bannerColor: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  isAuthenticated: false,
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserSession>(GUEST_SESSION);
  const [clients, setClients] = useState<ClientTenantRecord[]>(INITIAL_ACCOUNTS);
  const [contentItems, setContentItems] = useState<StudioContentItem[]>(INITIAL_CONTENT_ITEMS);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedAccountsRaw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      let loadedAccounts = INITIAL_ACCOUNTS;
      if (savedAccountsRaw) {
        const parsedAccounts = JSON.parse(savedAccountsRaw) as ClientTenantRecord[];
        if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
          loadedAccounts = parsedAccounts.map((acc) => ({
            ...acc,
            role: acc.email.toLowerCase() === ADMIN_EMAIL ? "ADMIN" : acc.role === "ADMIN" ? "USER" : acc.role,
          }));
        }
      }
      setClients(loadedAccounts);

      const savedContentRaw = localStorage.getItem(STORAGE_CONTENT_KEY);
      if (savedContentRaw) {
        const parsedContent = JSON.parse(savedContentRaw) as StudioContentItem[];
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          const normalized = parsedContent.map((it) => ({
            ...it,
            streamUrl: normalizeLocalMediaUrl(it.streamUrl),
            posterUrl: normalizeLocalMediaUrl(it.posterUrl),
            postImageUrl: it.postImageUrl ? normalizeLocalMediaUrl(it.postImageUrl) : undefined,
          }));
          setContentItems(normalized);
        }
      }

      const savedSessionRaw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (savedSessionRaw) {
        const parsedSession = JSON.parse(savedSessionRaw) as AuthUserSession;
        if (parsedSession && parsedSession.isAuthenticated && parsedSession.email) {
          const emailLower = parsedSession.email.toLowerCase();
          const matchingAccount = loadedAccounts.find((a) => a.email.toLowerCase() === emailLower);
          const resolvedRole: PlatformRole =
            emailLower === ADMIN_EMAIL
              ? "ADMIN"
              : matchingAccount?.role === "CLIENT"
              ? "CLIENT"
              : "USER";
          const resolvedHandle =
            matchingAccount && matchingAccount.channelHandle !== "(No Channel Yet)"
              ? matchingAccount.channelHandle
              : parsedSession.channelHandle;
          setUser({
            ...GUEST_SESSION,
            ...parsedSession,
            name: matchingAccount?.name || parsedSession.name || emailLower.split("@")[0],
            bio:
              matchingAccount?.bio ||
              parsedSession.bio ||
              `Creator & Viewer on ACN-VTSP (${resolvedRole})`,
            avatarUrl: matchingAccount?.avatarUrl ?? parsedSession.avatarUrl ?? null,
            bannerColor:
              matchingAccount?.bannerColor ||
              parsedSession.bannerColor ||
              "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
            role: resolvedRole,
            channelHandle: resolvedHandle,
            isAuthenticated: true,
          });
        }
      }
    } catch {}
  }, []);

  function persistAccounts(nextAccounts: ClientTenantRecord[]) {
    setClients(nextAccounts);
    try {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    } catch {}
  }

  function persistContent(nextContent: StudioContentItem[]) {
    setContentItems(nextContent);
    try {
      localStorage.setItem(STORAGE_CONTENT_KEY, JSON.stringify(nextContent));
    } catch {}
  }

  function persistSession(nextUser: AuthUserSession) {
    setUser(nextUser);
    try {
      if (nextUser.isAuthenticated) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch {}
  }

  function updateUserProfile(patch: {
    name?: string;
    channelHandle?: string;
    bio?: string;
    avatarUrl?: string | null;
    bannerColor?: string;
  }) {
    if (!user.isAuthenticated) return;
    const cleanHandle =
      patch.channelHandle !== undefined
        ? patch.channelHandle.trim()
          ? patch.channelHandle.trim().startsWith("@")
            ? patch.channelHandle.trim()
            : `@${patch.channelHandle.trim()}`
          : user.channelHandle
        : user.channelHandle;

    const updatedSession: AuthUserSession = {
      ...user,
      name: patch.name !== undefined ? patch.name : user.name,
      channelHandle: cleanHandle,
      bio: patch.bio !== undefined ? patch.bio : user.bio,
      avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : user.avatarUrl,
      bannerColor: patch.bannerColor !== undefined ? patch.bannerColor : user.bannerColor,
    };
    persistSession(updatedSession);

    const nextAccounts = clients.map((c) => {
      if (c.email.toLowerCase() !== user.email.toLowerCase()) return c;
      return {
        ...c,
        name: updatedSession.name,
        channelHandle: cleanHandle || c.channelHandle,
        bio: updatedSession.bio,
        avatarUrl: updatedSession.avatarUrl,
        bannerColor: updatedSession.bannerColor,
      };
    });
    persistAccounts(nextAccounts);
  }

  function addContentItem(item: Omit<StudioContentItem, "id" | "uploadedAt" | "views">): StudioContentItem {
    const newItem: StudioContentItem = {
      ...item,
      streamUrl: normalizeLocalMediaUrl(item.streamUrl),
      posterUrl: normalizeLocalMediaUrl(item.posterUrl),
      postImageUrl: item.postImageUrl ? normalizeLocalMediaUrl(item.postImageUrl) : undefined,
      id: `${item.type.toLowerCase()}_${Date.now().toString().slice(-5)}`,
      uploadedAt: item.type === "LIVE" ? "Streaming live" : "Just now",
      views: item.type === "LIVE" ? "1 watching now" : item.type === "POST" ? "1 like" : "1 view",
    };
    const next = [newItem, ...contentItems];
    persistContent(next);
    return newItem;
  }

  function updateContentVisibility(id: string, visibility: ContentVisibility) {
    const next = contentItems.map((item) => (item.id === id ? { ...item, visibility } : item));
    persistContent(next);
  }

  function updateLivePermissions(id: string, livePermissions: LiveViewerPermissions) {
    const next = contentItems.map((item) => (item.id === id ? { ...item, livePermissions } : item));
    persistContent(next);
  }

  function deleteContentItem(id: string) {
    const next = contentItems.filter((item) => item.id !== id);
    persistContent(next);
  }

  function signupWithEmailPassword(
    nameInput: string,
    emailInput: string,
    passwordInput: string
  ): { ok: boolean; role: PlatformRole; message: string } {
    const cleanName = nameInput.trim() || "Platform User";
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { ok: false, role: "USER", message: "Please enter a valid email address." };
    }
    if (!passwordInput || passwordInput.length < 4) {
      return { ok: false, role: "USER", message: "Password must be at least 4 characters." };
    }

    const existing = clients.find((c) => c.email.toLowerCase() === cleanEmail);
    if (existing && existing.passwordHash) {
      return { ok: false, role: "USER", message: "An account with this email already exists. Please Sign In instead." };
    }

    const isAdmin = cleanEmail === ADMIN_EMAIL;
    const assignedRole: PlatformRole = isAdmin ? "ADMIN" : existing?.role === "CLIENT" ? "CLIENT" : "USER";
    const assignedHandle = isAdmin
      ? "@suyash_admin"
      : existing && existing.channelHandle !== "(No Channel Yet)"
      ? existing.channelHandle
      : "(No Channel Yet)";

    const newRecord: ClientTenantRecord = {
      clientId: existing?.clientId ?? `chn_${Date.now().toString().slice(-4)}`,
      userId: existing?.userId ?? (isAdmin ? "usr_admin_suyash" : `usr_${Date.now().toString().slice(-4)}`),
      name: cleanName,
      email: cleanEmail,
      passwordHash: passwordInput,
      channelHandle: assignedHandle,
      bio: `Hi, I'm ${cleanName} on ACN-VTSP!`,
      avatarUrl: null,
      bannerColor: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
      role: assignedRole,
      status: "ACTIVE",
      scopes:
        isAdmin || assignedRole === "CLIENT"
          ? ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"]
          : ["video:read"],
      quotaStorageGb: isAdmin ? 10000 : assignedRole === "CLIENT" ? 250 : 10,
    };

    const nextAccounts = existing
      ? clients.map((c) => (c.email.toLowerCase() === cleanEmail ? newRecord : c))
      : [...clients, newRecord];
    persistAccounts(nextAccounts);

    const session: AuthUserSession = {
      userId: newRecord.userId,
      name: newRecord.name,
      email: cleanEmail,
      role: assignedRole,
      channelHandle: assignedHandle === "(No Channel Yet)" ? null : assignedHandle,
      bio: newRecord.bio || "",
      avatarUrl: newRecord.avatarUrl || null,
      bannerColor: newRecord.bannerColor || "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
      isAuthenticated: true,
    };
    persistSession(session);

    return {
      ok: true,
      role: assignedRole,
      message: isAdmin
        ? `Account created & signed in as Platform Admin (${ADMIN_EMAIL}).`
        : `Account created & signed in as ${cleanEmail} (${assignedRole}).`,
    };
  }

  function loginWithEmailPassword(
    emailInput: string,
    passwordInput: string
  ): { ok: boolean; role: PlatformRole; message: string } {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { ok: false, role: "USER", message: "Please enter a valid email address." };
    }
    if (!passwordInput || passwordInput.length < 4) {
      return { ok: false, role: "USER", message: "Password must be at least 4 characters." };
    }

    const existing = clients.find((c) => c.email.toLowerCase() === cleanEmail);
    if (existing && existing.passwordHash && existing.passwordHash !== passwordInput) {
      return { ok: false, role: "USER", message: "Incorrect password for this account." };
    }

    if (existing && existing.status === "SUSPENDED" && cleanEmail !== ADMIN_EMAIL) {
      return { ok: false, role: "USER", message: "This account has been suspended by the Platform Admin." };
    }

    const isAdmin = cleanEmail === ADMIN_EMAIL;
    const resolvedRole: PlatformRole = isAdmin
      ? "ADMIN"
      : existing?.role === "CLIENT"
      ? "CLIENT"
      : "USER";

    const resolvedHandle = isAdmin
      ? "@suyash_admin"
      : existing && existing.channelHandle !== "(No Channel Yet)"
      ? existing.channelHandle
      : null;

    const userId = existing?.userId ?? (isAdmin ? "usr_admin_suyash" : `usr_${Date.now().toString().slice(-4)}`);
    const userName = existing?.name ?? (isAdmin ? "Suyash Kotkar" : cleanEmail.split("@")[0]);

    if (!existing) {
      const createdAccount: ClientTenantRecord = {
        clientId: `chn_${Date.now().toString().slice(-4)}`,
        userId,
        name: userName,
        email: cleanEmail,
        passwordHash: passwordInput,
        channelHandle: resolvedHandle ?? "(No Channel Yet)",
        bio: `Creator & Viewer on ACN-VTSP`,
        avatarUrl: null,
        bannerColor: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
        role: resolvedRole,
        status: "ACTIVE",
        scopes: isAdmin
          ? ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"]
          : ["video:read"],
        quotaStorageGb: isAdmin ? 10000 : 10,
      };
      persistAccounts([...clients, createdAccount]);
    } else if (!existing.passwordHash) {
      persistAccounts(
        clients.map((c) => (c.email.toLowerCase() === cleanEmail ? { ...c, passwordHash: passwordInput } : c))
      );
    }

    const session: AuthUserSession = {
      userId,
      name: userName,
      email: cleanEmail,
      role: resolvedRole,
      channelHandle: resolvedHandle,
      bio: existing?.bio || `Creator & Viewer on ACN-VTSP (${resolvedRole})`,
      avatarUrl: existing?.avatarUrl || null,
      bannerColor: existing?.bannerColor || "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
      isAuthenticated: true,
    };
    persistSession(session);

    return {
      ok: true,
      role: resolvedRole,
      message: `Signed in as ${cleanEmail} (Role: ${resolvedRole}${resolvedHandle ? ` • ${resolvedHandle}` : ""})`,
    };
  }

  function logout() {
    persistSession(GUEST_SESSION);
  }

  function becomeClient(desiredHandle: string): { ok: boolean; message: string } {
    if (!user.isAuthenticated || !user.email) {
      return { ok: false, message: "Please sign in first before creating a Client channel." };
    }
    const cleanHandle = desiredHandle.trim().startsWith("@")
      ? desiredHandle.trim()
      : `@${desiredHandle.trim() || "my_channel"}`;
    const updatedRole: PlatformRole = user.email.toLowerCase() === ADMIN_EMAIL ? "ADMIN" : "CLIENT";

    const nextSession: AuthUserSession = {
      ...user,
      role: updatedRole,
      channelHandle: cleanHandle,
      isAuthenticated: true,
    };
    persistSession(nextSession);

    const idx = clients.findIndex((c) => c.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      const copy = [...clients];
      copy[idx] = {
        ...copy[idx],
        channelHandle: cleanHandle,
        role: updatedRole,
        status: "ACTIVE",
        scopes: ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
        quotaStorageGb: Math.max(copy[idx].quotaStorageGb, 250),
      };
      persistAccounts(copy);
    } else {
      persistAccounts([
        ...clients,
        {
          clientId: `chn_${Date.now().toString().slice(-4)}`,
          userId: user.userId,
          name: user.name,
          email: user.email,
          passwordHash: "",
          channelHandle: cleanHandle,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          bannerColor: user.bannerColor,
          role: updatedRole,
          status: "ACTIVE",
          scopes: ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
          quotaStorageGb: 250,
        },
      ]);
    }
    return { ok: true, message: `Upgraded ${user.email} to CLIENT with channel ${cleanHandle}` };
  }

  function toggleClientScope(clientId: string, scope: string) {
    const next = clients.map((c) => {
      if (c.clientId !== clientId) return c;
      const exists = c.scopes.includes(scope);
      return {
        ...c,
        scopes: exists ? c.scopes.filter((s) => s !== scope) : [...c.scopes, scope],
      };
    });
    persistAccounts(next);
  }

  function updateClientStatus(clientId: string, status: ClientTenantRecord["status"]) {
    const next = clients.map((c) => (c.clientId === clientId ? { ...c, status } : c));
    persistAccounts(next);
  }

  function promoteUserToRole(clientId: string, newRole: PlatformRole) {
    const next = clients.map((c) => {
      if (c.clientId !== clientId) return c;
      const safeRole: PlatformRole =
        newRole === "ADMIN" && c.email.toLowerCase() !== ADMIN_EMAIL ? "CLIENT" : newRole;
      const nextHandle =
        safeRole === "CLIENT" && c.channelHandle === "(No Channel Yet)"
          ? `@${c.email.split("@")[0]}_channel`
          : safeRole === "USER"
          ? "(No Channel Yet)"
          : c.channelHandle;
      return {
        ...c,
        role: safeRole,
        status: "ACTIVE" as const,
        channelHandle: nextHandle,
        scopes:
          safeRole === "USER"
            ? ["video:read"]
            : ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
      };
    });
    persistAccounts(next);
  }

  return (
    <RoleContext.Provider
      value={{
        user,
        role: user.role,
        channelHandle: user.channelHandle,
        sidebarOpen,
        setSidebarOpen,
        loginWithEmailPassword,
        signupWithEmailPassword,
        logout,
        becomeClient,
        updateUserProfile,
        clients,
        toggleClientScope,
        updateClientStatus,
        promoteUserToRole,
        contentItems,
        addContentItem,
        updateContentVisibility,
        updateLivePermissions,
        deleteContentItem,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function usePlatformRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("usePlatformRole must be used within RoleProvider");
  }
  return ctx;
}
