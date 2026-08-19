import { Outlet } from "@tanstack/react-router";

/** Shared route outlet. Navigation and chrome are owned by SidebarLayout. */
export function AppShell() {
  return <Outlet />;
}
