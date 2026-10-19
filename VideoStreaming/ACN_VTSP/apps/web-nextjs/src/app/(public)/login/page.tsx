"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatformRole } from "../../../lib/role-context";

export default function LoginPage() {
  const { user, loginWithEmailPassword, signupWithEmailPassword, logout } = usePlatformRole();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res =
      mode === "signup"
        ? signupWithEmailPassword(name, email, password)
        : loginWithEmailPassword(email, password);

    setFeedback(res.message);
    setIsError(!res.ok);

    if (res.ok) {
      setTimeout(() => {
        if (res.role === "ADMIN") router.push("/admin");
        else if (res.role === "CLIENT") router.push("/studio/upload");
        else router.push("/");
      }, 350);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "88vh", padding: 24, background: "#080c14", color: "#f8fafc" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#0f172a", border: "1px solid #334155", borderRadius: 16, padding: 28 }}>
        {/* Sign In / Sign Up Mode Toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "#090d16", padding: 5, borderRadius: 10, marginBottom: 20, border: "1px solid #1e293b" }}>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setFeedback(null);
            }}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              background: mode === "signin" ? "#38bdf8" : "transparent",
              color: mode === "signin" ? "#080c14" : "#94a3b8",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setFeedback(null);
            }}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              background: mode === "signup" ? "#38bdf8" : "transparent",
              color: mode === "signup" ? "#080c14" : "#94a3b8",
            }}
          >
            Create Account
          </button>
        </div>

        <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>
          {mode === "signin" ? "Welcome Back" : "Create Your Account"}
        </h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 0, marginBottom: 18 }}>
          {mode === "signin"
            ? "Sign in with your email and password to access your streams, Creator Studio, or Admin Control Plane."
            : "Sign up with your email and password. New accounts start as Viewers and can create a Creator Channel anytime."}
        </p>

        {user.isAuthenticated && (
          <div style={{ padding: 12, background: "#090d16", border: "1px solid #1e293b", borderRadius: 10, marginBottom: 18, fontSize: 12.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div>Signed in as <strong style={{ color: "#38bdf8" }}>{user.email}</strong></div>
              <div style={{ color: "#94a3b8", marginTop: 2 }}>
                Role: <strong>{user.role}</strong> {user.channelHandle ? `• ${user.channelHandle}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                setFeedback("Signed out successfully.");
                setIsError(false);
              }}
              style={{ padding: "6px 11px", borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #475569", fontSize: 12, cursor: "pointer" }}
            >
              Logout
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "#cbd5e1" }}>Full Name</label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "#cbd5e1" }}>Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "#cbd5e1" }}>Password</label>
            <input
              type="password"
              required
              placeholder="Enter password (min 4 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
            />
          </div>

          <button
            type="submit"
            style={{ padding: "11px 16px", borderRadius: 8, background: "#38bdf8", color: "#080c14", border: "none", fontWeight: 700, cursor: "pointer", marginTop: 4 }}
          >
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {feedback && (
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 8,
              fontSize: 12.5,
              background: isError ? "rgba(251, 113, 133, 0.15)" : "rgba(52, 211, 153, 0.15)",
              border: `1px solid ${isError ? "#fb7185" : "#34d399"}`,
              color: isError ? "#fecdd3" : "#a7f3d0",
            }}
          >
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
