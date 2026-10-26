"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

/** Light / dark switch. The initial theme is set by an inline script in <head> (no flash). */
export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-anim");
    root.dataset.theme = next;
    try {
      localStorage.setItem("oswell-theme", next);
    } catch {}
    setTheme(next);
    setTimeout(() => root.classList.remove("theme-anim"), 450);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={flip}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <Icon name="sun" size={19} className="i-sun" />
      <Icon name="moon" size={19} className="i-moon" />
    </button>
  );
}
