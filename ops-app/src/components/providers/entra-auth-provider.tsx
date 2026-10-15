"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { entraAuthenticationEnabled, localAuthenticationEnabled, requireEntraSession } from "@/lib/auth/entra";
import { getLocalSession, type LocalSession } from "@/lib/auth/local-session";

type LocalAuthContextValue = { session: LocalSession | null };

const LocalAuthContext = createContext<LocalAuthContextValue>({ session: null });

export function useLocalAuthSession() {
  return useContext(LocalAuthContext).session;
}

export function EntraAuthProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [localSession, setLocalSession] = useState<LocalSession | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPath = pathname === "/login" || pathname === "/login/";

  useEffect(() => {
    if (localAuthenticationEnabled()) {
      void getLocalSession().then((session) => {
        setLocalSession(session);
        if (!session && !isLoginPath) router.replace("/login/");
        if (session && isLoginPath) router.replace("/security/");
      }).catch(() => setError("Oswell sign-in could not be completed.")).finally(() => setChecking(false));
      return;
    }
    if (!entraAuthenticationEnabled()) {
      setChecking(false);
      return;
    }
    void requireEntraSession().catch(() => setError("Oswell sign-in could not be completed.")).finally(() => setChecking(false));
  }, [pathname, router]);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-[#07101B] p-6 text-center text-sm text-[#FCA5A5]"><div><p>{error}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-[#28405C] px-3 py-2 text-xs text-white hover:bg-[#101B2B]">Retry</button></div></main>;
  }
  if (localAuthenticationEnabled() && checking && !isLoginPath) {
    return <main className="grid min-h-screen place-items-center bg-[#07101B] text-sm text-[#94A3B8]">Checking your Oswell session...</main>;
  }
  return <LocalAuthContext.Provider value={{ session: localSession }}>{children}</LocalAuthContext.Provider>;
}
