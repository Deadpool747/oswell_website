"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Sidebar } from "@/components/navigation/sidebar";

type AppShellContextValue = {
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const value = useMemo<AppShellContextValue>(
    () => ({
      mobileNavOpen,
      openMobileNav: () => setMobileNavOpen(true),
      closeMobileNav: () => setMobileNavOpen(false)
    }),
    [mobileNavOpen]
  );

  return (
    <AppShellContext.Provider value={value}>
      <div className="min-h-screen bg-[#050B14] text-[#F5F7FA] grid-fade">
        <Sidebar />
        {mobileNavOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-[#02060D]/75 xl:hidden"
              onClick={value.closeMobileNav}
            />
            <Sidebar mode="mobile" onNavigate={value.closeMobileNav} onRequestClose={value.closeMobileNav} />
          </>
        )}
        <main className="min-h-screen xl:pl-[188px]">
          <div className="mx-auto w-full max-w-[1680px] px-3 py-3 sm:px-5 sm:py-4">{children}</div>
        </main>
      </div>
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error("useAppShell must be used inside AppShell");
  return context;
}
