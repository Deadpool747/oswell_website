"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocalSession, loginLocally } from "@/lib/auth/local-session";
import { localAuthenticationEnabled } from "@/lib/auth/entra";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!localAuthenticationEnabled()) return;
    void getLocalSession().then((session) => { if (session) router.replace("/security/"); });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await loginLocally(username, password);
      router.replace("/security/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Oswell sign-in is temporarily unavailable. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07101B] px-5 py-10 text-white"><div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#0E7490]/20 blur-3xl" /><div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#1D4ED8]/15 blur-3xl" /><form onSubmit={submit} className="relative w-full max-w-md rounded-2xl border border-[#1B2D43] bg-[#09111C]/95 p-8 shadow-2xl"><div className="mb-8"><div className="text-xs font-semibold tracking-[0.24em] text-[#6EE7B7]">OSWELL</div><h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to Oswell</h1></div><label className="block text-sm text-[#C9D6E5]">Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-lg border border-[#28405C] bg-[#07101B] px-3 py-2.5 text-white outline-none ring-[#38BDF8] focus:ring-2" required /></label><label className="mt-5 block text-sm text-[#C9D6E5]">Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-[#28405C] bg-[#07101B] px-3 py-2.5 text-white outline-none ring-[#38BDF8] focus:ring-2" required /></label>{error && <p className="mt-4 text-sm text-[#FCA5A5]">{error}</p>}<button disabled={submitting} className="mt-7 w-full rounded-lg bg-[#0E7490] px-4 py-2.5 font-medium text-white transition hover:bg-[#0891B2] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Signing in..." : "Sign In"}</button></form></main>;
}
