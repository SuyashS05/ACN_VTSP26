import React from "react";
import { RoleProvider } from "../lib/role-context";
import { RoleNavigationHeader } from "../components/RoleNavigationHeader";

export const metadata = {
  title: "ACN-VTSP • Cloud-Native Video Transcoding & Streaming Platform",
  description: "Zero-Egress R2 • KEDA Spot CMAF (.m4s) • Spot GPU AI • Sub-300ms WebRTC & Yjs • <5ms ONNX Chat • Headless MCP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#080c14", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <RoleProvider>
          <RoleNavigationHeader />
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
