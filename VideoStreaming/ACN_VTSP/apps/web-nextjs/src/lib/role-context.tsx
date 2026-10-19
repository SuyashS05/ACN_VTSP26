"use client";

import React, { createContext, useContext, useState } from "react";

export type PlatformRole = "USER" | "CLIENT" | "ADMIN";

export interface ClientTenantRecord {
  clientId: string;
  userId: string;
  email: string;
  channelHandle: string;
  role: PlatformRole;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  scopes: string[];
  quotaStorageGb: number;
}

interface RoleContextValue {
  role: PlatformRole;
  setRole: (r: PlatformRole) => void;
  channelHandle: string | null;
  becomeClient: (desiredHandle: string) => void;
  clients: ClientTenantRecord[];
  toggleClientScope: (clientId: string, scope: string) => void;
  updateClientStatus: (clientId: string, status: ClientTenantRecord["status"]) => void;
  promoteUserToRole: (clientId: string, newRole: PlatformRole) => void;
}

const INITIAL_CLIENTS: ClientTenantRecord[] = [
  {
    clientId: "chn_acn_official",
    userId: "usr_demo_01",
    email: "creator@acn-vtsp.io",
    channelHandle: "@acn_cloud_media",
    role: "CLIENT",
    status: "ACTIVE",
    scopes: ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
    quotaStorageGb: 500,
  },
  {
    clientId: "chn_edtech_labs",
    userId: "usr_edtech_02",
    email: "founder@edtech-stream.io",
    channelHandle: "@edtech_ai_academy",
    role: "CLIENT",
    status: "ACTIVE",
    scopes: ["video:read", "video:upload", "ai:gpu_enrichment"],
    quotaStorageGb: 250,
  },
  {
    clientId: "chn_viewer_guest",
    userId: "usr_viewer_03",
    email: "viewer@gmail.com",
    channelHandle: "(No Channel Yet)",
    role: "USER",
    status: "PENDING_APPROVAL",
    scopes: ["video:read"],
    quotaStorageGb: 10,
  },
];

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  // Default role is USER as requested
  const [role, setRole] = useState<PlatformRole>("USER");
  const [channelHandle, setChannelHandle] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientTenantRecord[]>(INITIAL_CLIENTS);

  function becomeClient(desiredHandle: string) {
    const clean = desiredHandle.startsWith("@") ? desiredHandle : `@${desiredHandle}`;
    setChannelHandle(clean);
    setRole("CLIENT");
    setClients((prev) => [
      {
        clientId: `chn_${Date.now().toString().slice(-4)}`,
        userId: "usr_current_session",
        email: "you@acn-vtsp.io",
        channelHandle: clean,
        role: "CLIENT",
        status: "ACTIVE",
        scopes: ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
        quotaStorageGb: 100,
      },
      ...prev,
    ]);
  }

  function toggleClientScope(clientId: string, scope: string) {
    setClients((prev) =>
      prev.map((c) => {
        if (c.clientId !== clientId) return c;
        const exists = c.scopes.includes(scope);
        return {
          ...c,
          scopes: exists ? c.scopes.filter((s) => s !== scope) : [...c.scopes, scope],
        };
      })
    );
  }

  function updateClientStatus(clientId: string, status: ClientTenantRecord["status"]) {
    setClients((prev) => prev.map((c) => (c.clientId === clientId ? { ...c, status } : c)));
  }

  function promoteUserToRole(clientId: string, newRole: PlatformRole) {
    setClients((prev) =>
      prev.map((c) =>
        c.clientId === clientId
          ? {
              ...c,
              role: newRole,
              status: "ACTIVE",
              scopes:
                newRole === "USER"
                  ? ["video:read"]
                  : ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
            }
          : c
      )
    );
  }

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        channelHandle,
        becomeClient,
        clients,
        toggleClientScope,
        updateClientStatus,
        promoteUserToRole,
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

