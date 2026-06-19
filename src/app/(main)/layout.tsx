import type { ReactNode } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AppShell from "@/components/layout/app-shell";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    user = session?.user ?? null;
  } catch {
    // Not authenticated — middleware will redirect
  }

  return (
    <AppShell
      username={(user as Record<string, string> | null)?.username ?? "user"}
      displayName={user?.name ?? "User"}
      avatarUrl={user?.image ?? null}
    >
      {children}
    </AppShell>
  );
}
