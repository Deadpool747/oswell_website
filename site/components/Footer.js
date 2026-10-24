import Link from "next/link";
import { footerColumns, photos } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-shell">
      <div className="footer-grid">
        <div>
          <img src="/logo-transparent.png" alt="Oswell Technologies" height="32" />
          <p className="muted footer-blurb">
            Product engineering partner for teams building digital systems that grow with the business.
          </p>
          <p className="muted small">info@oswelltechnologies.com</p>
        </div>
        {footerColumns.map((c) => (
          <div key={c.title}>
            <h4>{c.title}</h4>
            <ul>
              {c.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith("http") ? (
                    <a href={href} target="_blank" rel="noopener">
                      {label}
                    </a>
                  ) : (
                    <Link href={href}>{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom muted small">
        <span>© {new Date().getFullYear()} Oswell Technologies. All rights reserved.</span>
        <span className="credits">
          Photos by{" "}
          {Object.values(photos).map((p, i, a) => (
            <span key={p.by}>
              <a href={p.url} target="_blank" rel="noopener">
                {p.by}
              </a>
              {i < a.length - 1 ? ", " : ""}
            </span>
          ))}{" "}
          on{" "}
          <a href="https://unsplash.com" target="_blank" rel="noopener">
            Unsplash
          </a>
        </span>
      </div>
      </div>
    </footer>
  );
}
