"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  BadgeDollarSign,
  Bell,
  Bot,
  Box,
  Boxes,
  Brain,
  Bug,
  ChartNoAxesCombined,
  ChevronDown,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cpu,
  Database,
  DatabaseZap,
  DollarSign,
  FileClock,
  FileText,
  Gauge,
  GitCompare,
  HeartPulse,
  KeyRound,
  Layers3,
  LockKeyhole,
  MessageSquare,
  Network,
  PauseCircle,
  Pencil,
  Play,
  RefreshCw,
  Rocket,
  ScanSearch,
  ScrollText,
  Scissors,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Timer,
  Trash2,
  TriangleAlert,
  UserRoundCheck,
  Users,
  WalletCards,
  Wrench,
  XCircle
} from "lucide-react";
import { OswellMark } from "@/components/branding/oswell-mark";
import { cn } from "@/lib/utils";
import { localAuthenticationEnabled } from "@/lib/auth/entra";
import { logoutLocally } from "@/lib/auth/local-session";
import { useLocalAuthSession } from "@/components/providers/entra-auth-provider";

const sections = [
  {
    label: "Platform",
    items: [
      { href: "/live-runs", label: "Live Runs", icon: Activity },
      { href: "/replay", label: "Replay Studio", icon: Play },
      { href: "/metrics", label: "Metrics", icon: BarChart3 }
    ]
  },
  {
    label: "Agent Governance",
    items: [
      { href: "/connection-center", label: "Connection Center", icon: Network },
      { href: "/agents", label: "Agent Registry", icon: Bot },
      { href: "/connectors", label: "Connector & MCP Governance", icon: Box },
      { href: "/policies", label: "Policy Center", icon: Shield },
      { href: "/approvals", label: "Approvals & Audit", icon: ClipboardCheck }
    ]
  },
  {
    label: "AI Security",
    items: [
      { href: "/security", label: "Security Overview", icon: ShieldCheck },
      { href: "/security/identity-access", label: "Agent Identity & Access", icon: UserRoundCheck },
      { href: "/security/mcp", label: "MCP & Tool Security", icon: Network },
      { href: "/security/context", label: "Context Security", icon: ScanSearch },
      { href: "/security/memory", label: "Memory Security", icon: DatabaseZap },
      { href: "/security/incidents", label: "Threats & Incidents", icon: TriangleAlert }
    ]
  },
  {
    label: "Configuration",
    items: [
      { href: "/configurations", label: "Configuration Center", icon: Settings2 },
      { href: "/prompts", label: "Prompt Manager", icon: FileText },
      { href: "/knowledge", label: "RAG & Knowledge Governance", icon: Database },
      { href: "/secrets", label: "Secrets & Credentials", icon: KeyRound }
    ]
  },
  {
    label: "Operations",
    items: [
      { href: "/cost-capacity", label: "Quota, Cost & Capacity", icon: Gauge },
      { href: "/memory", label: "Memory & State Management", icon: Brain },
      { href: "/deployment", label: "Deployment & Environment", icon: GitCompare }
    ]
  },
  {
    label: "Quality",
    items: [
      { href: "/evaluations", label: "Evaluations", icon: FileClock },
      { href: "/guardrails", label: "Guardrails", icon: ShieldCheck },
      { href: "/testing", label: "Testing & Regression Suite", icon: ClipboardCheck },
      { href: "/feedback", label: "Feedback & Quality Loop", icon: MessageSquare }
    ]
  },
  {
    label: "System",
    items: [
      { href: "/alerts", label: "Alerts", icon: Bell },
      { href: "/exports", label: "Exports", icon: Archive }
    ]
  }
];

const iconMap = {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  BadgeDollarSign,
  Bell,
  Bot,
  Box,
  Boxes,
  Brain,
  Bug,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cpu,
  Database,
  DatabaseZap,
  DollarSign,
  FileClock,
  FileText,
  Gauge,
  GitCompare,
  HeartPulse,
  KeyRound,
  Layers3,
  LockKeyhole,
  Network,
  PauseCircle,
  Pencil,
  RefreshCw,
  Rocket,
  ScanSearch,
  ScrollText,
  Scissors,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Timer,
  Trash2,
  TriangleAlert,
  UserRoundCheck,
  Users,
  WalletCards,
  Wrench,
  XCircle
};

const SIDEBAR_SCROLL_KEY = "oswell-sidebar-scroll-top";

const localRoleLabels: Record<string, string> = {
  "Oswell.SecurityAdministrator": "Local security administrator",
  "Oswell.PlatformAdministrator": "Local platform administrator",
};

type SidebarProps = {
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
  onRequestClose?: () => void;
};

export function Sidebar({ mode = "desktop", onNavigate, onRequestClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const localSession = useLocalAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const mobile = mode === "mobile";

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const restoreScroll = () => {
      const stored = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
      if (!stored) return;
      const scrollTop = Number(stored);
      if (Number.isFinite(scrollTop)) {
        nav.scrollTop = scrollTop;
      }
    };

    restoreScroll();
    window.requestAnimationFrame(restoreScroll);
  }, [pathname]);

  function handleNavScroll() {
    const nav = navRef.current;
    if (!nav) return;
    window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
  }

  async function signOut() {
    try {
      await logoutLocally();
      setMenuOpen(false);
      router.replace("/login/");
    } catch {
      // Keep the current authenticated UI available if a transient API error occurs.
    }
  }

  return (
    <aside
      className={cn(
        "inset-y-0 left-0 border-r border-[#162131] bg-[#050A12] text-[#94A3B8]",
        mobile ? "fixed z-50 w-[280px] shadow-2xl shadow-black/50 xl:hidden" : "fixed z-30 hidden w-[188px] xl:block"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[60px] items-center gap-3 border-b border-[#162131] px-4">
          <Link href="/live-runs" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
            <OswellMark className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">Oswell</div>
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#94A3B8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Live
              </div>
            </div>
          </Link>
          {mobile && (
            <button
              type="button"
              onClick={onRequestClose}
              className="rounded-md p-2 text-[#94A3B8] transition-colors hover:bg-[#0B1420] hover:text-white"
              aria-label="Close navigation"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav ref={navRef} onScroll={handleNavScroll} className="flex-1 overflow-y-auto px-2 py-3">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href === "/agents" && pathname.startsWith("/agents/")) ||
                    (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex h-8 items-center gap-2 rounded-md px-2 text-[12px] transition-colors hover:bg-[#0B1420] hover:text-white",
                        active && "bg-[#1B123C] text-white"
                      )}
                    >
                      {active && <span className="absolute left-0 top-1.5 h-5 w-0.5 rounded-full bg-[#7C5CFF]" />}
                      <Icon className={cn("h-3.5 w-3.5 shrink-0 text-[#94A3B8] group-hover:text-[#C4B5FD]", active && "text-[#7C5CFF]")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-[#162131] p-3">
          {menuOpen && <div className="absolute bottom-[74px] left-3 right-3 rounded-lg border border-[#24334A] bg-[#09111C] p-2 text-xs shadow-xl shadow-black/40"><div className="grid gap-1">{localAuthenticationEnabled() && <button onClick={() => void signOut()} className="rounded px-2 py-1.5 text-left text-[#FCA5A5] hover:bg-[#101B2B]">Sign out</button>}<button onClick={() => setMenuOpen(false)} className="rounded px-2 py-1.5 text-left text-[#94A3B8] hover:bg-[#101B2B] hover:text-white">{mobile ? "Close User Menu" : "Close Menu"}</button></div></div>}
          <button onClick={() => setMenuOpen((current) => !current)} className="flex w-full items-center gap-2 rounded-lg border border-[#162131] bg-[#07101B] p-2 text-left transition-colors hover:border-[#24334A] hover:bg-[#0B1420]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E7490] text-xs font-semibold text-white">{localSession?.username.slice(0, 1).toUpperCase() ?? "O"}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">{localSession?.username ?? "Oswell"}</div>
              <div className="truncate text-[10px] text-[#94A3B8]">{localSession ? (localRoleLabels[localSession.role] ?? localSession.role) : "Session unavailable"}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { iconMap };
