"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#050B14", color: "#DCE5F2", fontFamily: "sans-serif" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 440, textAlign: "center" }}>
            <h1>Something went wrong</h1>
            <p>Oswell could not recover this page.</p>
            <button type="button" onClick={reset}>Try Again</button>
            <a href="/live-runs/" style={{ marginLeft: 12, color: "#C4B5FD" }}>Go to Dashboard</a>
          </section>
        </main>
      </body>
    </html>
  );
}
