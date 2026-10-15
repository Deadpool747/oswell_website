"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050B14] p-6 text-[#DCE5F2]">
      <section className="max-w-md rounded-lg border border-[#24334A] bg-[#09111C] p-6 text-center">
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-[#94A3B8]">Oswell could not load this view. Your data has not been changed.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={reset} variant="primary">Try Again</Button>
          <Button asChild variant="secondary"><a href="/live-runs/">Go to Dashboard</a></Button>
        </div>
      </section>
    </main>
  );
}
