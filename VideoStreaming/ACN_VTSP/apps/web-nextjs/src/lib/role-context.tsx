"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type PlatformRole = "USER" | "CLIENT" | "ADMIN";

// Exclusive Admin Email across the entire ACN-VTSP platform
export const ADMIN_EMAIL = "suyashskotkar@gmail.com";

const STORAGE_ACCOUNTS_KEY = "acn_vtsp_accounts_v2";
const STORAGE_SESSION_KEY = "acn_vtsp_session_v2";

export interface AuthUserSession {
  userId: string;
  name: string;
  email: string;
  role: PlatformRole;
  channelHandle: string | null;
  isAuthenticated: boolean;
}

export interface ClientTenantRecord {
  clientId: string;
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  channelHandle: string;
  role: PlatformRole;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  scopes: string[];
  quotaStorageGb: number;
}

interface RoleContextValue {
  user: AuthUserSession;
  role: PlatformRole;
  channelHandle: string | null;
  loginWithEmailPassword: (email: string, password: string) => { ok: boolean; role: PlatformRole; message: string };
  signupWithEmailPassword: (name: string, email: string, password: string) => { ok: boolean; role: PlatformRole; message: string };
  logout: () => void;
  becomeClient: (desiredHandle: string) => { ok: boolean; message: string };
  clients: ClientTenantRecord[];
  toggleClientScope: (clientId: string, scope: string) => void;
  updateClientStatus: (clientId: string, status: ClientTenantRecord["status"]) => void;
  promoteUserToRole: (clientId: string, newRole: PlatformRole) => void;
}

const INITIAL_ACCOUNTS: ClientTenantRecord[] = [
  {
    clientId: "chn_admin_root",
    userId: "usr_admin_suyash",
    name: "Suyash Kotkar",
    email: ADMIN_EMAIL,
    passwordHash: "",
    channelHandle: "@suyash_admin",
    role: "ADMIN",
    status: "ACTIVE",
    scopes: ["video:read", "video:upload", "stream:live", "ai:gpu_enrichment", "mcp:headless"],
    quotaStorageGb: 10000,
  },
];

const GUEST_SESSION: AuthUserSession = {
  userId: "guest",
  name: "Guest Viewer",
  email: "",
  role: "USER",
  channelHandle: null,
  isAuthenticated: false,
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserSession>(GUEST_SESSION);
  const [clients, setClients] = useState<ClientTenantRecord[]>(INITIAL_ACCOUNTS);

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
            ...parsedSession,
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
      role: assignedRole,
      status: "ACTIVE",
      scopes: isAdmin || assignedRole === "CLIENT"
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

    if ( existing && existing.status === "SUSPENDED" && cleanEmail !== ADMIN_EMAIL) {
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
        loginWithEmailPassword,
        signupWithEmailPassword,
        logout,
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
