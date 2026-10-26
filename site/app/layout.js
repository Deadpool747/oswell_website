import { Inter, Space_Grotesk } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealObserver from "@/components/RevealObserver";
import "./globals.css";
import "./sections.css";
import "./theme.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });

export const metadata = {
  metadataBase: new URL("https://oswelltechnologies.com"),
  title: "Global AI Development & Automation Company | Oswell Technologies",
  description:
    "Oswell Technologies builds AI systems, business automation, web platforms, mobile apps, and custom software for startups, SMBs, and enterprise teams worldwide.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    type: "website",
    siteName: "Oswell Technologies",
    url: "https://oswelltechnologies.com/",
    images: ["/logo-transparent.png"],
  },
};

export const viewport = { themeColor: "#eef0f8" };

// Runs before first paint: use the saved choice, else the visitor's system preference.
const themeInit = `(function(){try{var t=localStorage.getItem("oswell-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
