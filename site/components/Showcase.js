"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

const TABS = [
  {
    id: "voice",
    icon: "mic",
    title: "Voice AI agents",
    text: "Answer, qualify and book calls around the clock, in the caller's own language.",
  },
  {
    id: "chat",
    icon: "message",
    title: "Support that resolves",
    text: "Chat assistants that check systems and complete the task, not just reply.",
  },
  {
    id: "route",
    icon: "workflow",
    title: "Smart routing",
    text: "Send every request to the right team or workflow based on intent, not menus.",
  },
  {
    id: "connect",
    icon: "layers",
    title: "Connected workflows",
    text: "Plug AI into the tools you already use: messaging, CRM, documents and more.",
  },
];

const INTERVAL = 7000;

function Avatar({ label, tone = 1, className = "" }) {
  return <span className={`sc-avatar tone-${tone} ${className}`}>{label}</span>;
}

function VoiceScene() {
  return (
    <div className="sc-scene sc-voice">
      <div className="wave wave-l">
        {Array.from({ length: 14 }).map((_, i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>
      <div className="mic-orb">
        <span className="ring r1" />
        <span className="ring r2" />
        <span className="ring r3" />
        <span className="mic-core">
          <Icon name="mic" size={34} />
        </span>
      </div>
      <div className="wave wave-r">
        {Array.from({ length: 14 }).map((_, i) => (
          <i key={i} style={{ "--i": i + 3 }} />
        ))}
      </div>
      <Avatar label="AK" tone={1} className="pos-a" />
      <Avatar label="SR" tone={3} className="pos-b" />
      <div className="sc-bubble b-top">
        <small>Caller</small>
        Can I book a visit for Tuesday afternoon?
      </div>
      <div className="sc-bubble b-bottom ai">
        <small>AI agent</small>
        Done. You&apos;re booked for Tuesday at 4:00 PM.
      </div>
    </div>
  );
}

function ChatScene() {
  return (
    <div className="sc-scene sc-chat">
      <div className="chat-window">
        <div className="chat-head">
          <span className="orb-mini" />
          <b>Support assistant</b>
          <em>online</em>
        </div>
        <div className="msg user">Where is my order?</div>
        <div className="msg tool">
          <Icon name="search" size={14} /> Checking order system…
        </div>
        <div className="msg bot">
          Order #12345 is on its way and arrives Thursday. Want me to text you the tracking link?
        </div>
        <div className="msg user late">Yes please</div>
        <div className="msg bot done">
          <Icon name="check" size={14} /> Tracking link sent
        </div>
      </div>
      <div className="sc-chip chip-time">
        <Icon name="clock" size={14} /> Resolved in 8 seconds
      </div>
    </div>
  );
}

function RouteScene() {
  const targets = [
    { label: "Billing", icon: "calculator", tone: 2, y: 18 },
    { label: "Tech support", icon: "settings", tone: 1, y: 50 },
    { label: "Sales", icon: "handshake", tone: 4, y: 82 },
  ];
  return (
    <div className="sc-scene sc-route">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {targets.map((t, i) => (
          <path
            key={t.label}
            d={`M 26 50 C 48 50, 52 ${t.y}, 76 ${t.y}`}
            className="flow"
            style={{ "--d": `${i * 0.5}s` }}
          />
        ))}
      </svg>
      <div className="route-in">
        <Avatar label="Request" tone={3} className="pill-avatar" />
      </div>
      <div className="route-core">
        <span className="ring r1" />
        <span className="route-orb">
          <Icon name="sparkles" size={26} />
        </span>
      </div>
      {targets.map((t) => (
        <div key={t.label} className="route-out" style={{ top: `${t.y}%` }}>
          <span className={`sc-icon tone-${t.tone}`}>
            <Icon name={t.icon} size={18} />
          </span>
          {t.label}
        </div>
      ))}
      <div className="sc-chip chip-intent">
        <Icon name="target" size={14} /> Intent detected
      </div>
    </div>
  );
}

function ConnectScene() {
  const nodes = [
    { icon: "message", label: "Messaging", x: 82, y: 14, tone: 1 },
    { icon: "mail", label: "Email", x: 90, y: 40, tone: 2 },
    { icon: "database", label: "CRM", x: 90, y: 66, tone: 3 },
    { icon: "file", label: "Documents", x: 82, y: 90, tone: 4 },
    { icon: "calendar", label: "Calendar", x: 10, y: 28, tone: 5 },
    { icon: "chart", label: "Reports", x: 10, y: 72, tone: 6 },
  ];
  return (
    <div className="sc-scene sc-connect">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {nodes.map((n, i) => (
          <path
            key={n.label}
            d={`M 50 52 C ${(50 + n.x) / 2} 52, ${(50 + n.x) / 2} ${n.y}, ${n.x} ${n.y}`}
            className="flow"
            style={{ "--d": `${i * 0.35}s` }}
          />
        ))}
      </svg>
      <div className="connect-core">
        <span className="ring r1" />
        <span className="ring r2" />
        <span className="route-orb lg">
          <Icon name="bot" size={34} />
        </span>
      </div>
      {nodes.map((n) => (
        <div key={n.label} className="conn-node" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className={`sc-icon tone-${n.tone}`}>
            <Icon name={n.icon} size={20} />
          </span>
          <small>{n.label}</small>
        </div>
      ))}
    </div>
  );
}

const SCENES = { voice: VoiceScene, chat: ChatScene, route: RouteScene, connect: ConnectScene };

export default function Showcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % TABS.length), INTERVAL);
    return () => clearTimeout(t);
  }, [active, paused, reduced]);

  const Scene = SCENES[TABS[active].id];

  return (
    <div
      className="showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="sc-tabs" role="tablist" aria-label="What our AI can do">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={i === active}
            className={`sc-tab ${i === active ? "is-active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="sc-tab-icon">
              <Icon name={t.icon} size={20} />
            </span>
            <span className="sc-tab-body">
              <strong>{t.title}</strong>
              <span>{t.text}</span>
              {i === active && !reduced && (
                <i className={`sc-progress ${paused ? "paused" : ""}`} style={{ "--dur": `${INTERVAL}ms` }} />
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="sc-stage" role="tabpanel" key={TABS[active].id}>
        <Scene />
      </div>
    </div>
  );
}
