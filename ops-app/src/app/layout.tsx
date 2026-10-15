import type { Metadata } from "next";
import { EntraAuthProvider } from "@/components/providers/entra-auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oswell AI Operations Platform",
  description: "Enterprise AI operations and governance platform with local Node-backed runtime support.",
  applicationName: "Oswell",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EntraAuthProvider>{children}</EntraAuthProvider>
      </body>
    </html>
  );
}
