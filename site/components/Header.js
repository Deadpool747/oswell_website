"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CAL_URL, nav, navIndustry } from "@/lib/site";
import Icon from "@/components/Icon";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const ddRef = useRef(null);

  const close = () => {
    setOpen(false);
    setIndustryOpen(false);
  };

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    const onDown = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setIndustryOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setIndustryOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="header">
      <div className="container header-row">
        <Link href="/" className="brand" onClick={close}>
          <img src="/logo-transparent.png" alt="Oswell Technologies" height="34" />
        </Link>
        <nav className={`nav ${open ? "is-open" : ""}`} aria-label="Main">
          {nav.slice(0, 3).map((n) => (
            <Link key={n.href} href={n.href} onClick={close}>
              {n.label}
            </Link>
          ))}
          {nav.slice(3, 4).map((n) => (
            <Link key={n.href} href={n.href} onClick={close}>
              {n.label}
            </Link>
          ))}

          <div className={`dropdown ${industryOpen ? "is-open" : ""}`} ref={ddRef}>
            <button
              type="button"
              className="dropdown-btn"
              aria-haspopup="menu"
              aria-expanded={industryOpen}
              onClick={() => setIndustryOpen((v) => !v)}
              onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setIndustryOpen(true)}
            >
              Industry <Icon name="chevron" size={15} />
            </button>
            <div className="dropdown-menu" role="menu" onMouseLeave={() => window.matchMedia("(hover: hover)").matches && setIndustryOpen(false)}>
              {navIndustry.map(([label, href]) => (
                <Link key={href} href={href} role="menuitem" onClick={close}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {nav.slice(4).map((n) => (
            <Link key={n.href} href={n.href} onClick={close}>
              {n.label}
            </Link>
          ))}
          <a className="btn btn-primary nav-cta" href={CAL_URL} target="_blank" rel="noopener">
            Book a call
          </a>
        </nav>
        <button className="menu-btn" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
