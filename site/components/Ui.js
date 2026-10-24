import Link from "next/link";
import { CAL_URL } from "@/lib/site";

export function PageHero({ kicker, title, lead, children }) {
  return (
    <section className="page-hero">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container page-hero-inner">
        {kicker && <span className="kicker">{kicker}</span>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

export function CtaBand({ title, text, secondary }) {
  return (
    <section className="section">
      <div className="container cta">
        <h2>{title}</h2>
        {text && <p className="muted">{text}</p>}
        <div className="actions center">
          <a className="btn btn-primary" href={CAL_URL} target="_blank" rel="noopener">
            Book a 20-min call
          </a>
          {secondary && (
            <Link className="btn btn-ghost" href={secondary.href}>
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function FaqList({ items }) {
  return (
    <>
      {items.map(([q, a]) => (
        <details key={q} className="faq">
          <summary>{q}</summary>
          <p className="muted">{a}</p>
        </details>
      ))}
    </>
  );
}

export function faqJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export const meta = (title, description, legacyPath) => ({
  title,
  description,
  alternates: { canonical: `https://oswelltechnologies.com${legacyPath}` },
  openGraph: { title, description, url: `https://oswelltechnologies.com${legacyPath}`, type: "website" },
});

/** Photo inside a frosted-glass frame, with optional floating glass chips. */
export function PhotoFrame({ photo, chips = [], className = "" }) {
  return (
    <figure className={`photo-frame ${className}`}>
      <div className="photo-inner">
        <img src={photo.src} width={photo.w} height={photo.h} alt={photo.alt} loading="lazy" decoding="async" />
      </div>
      {chips.map((c, i) => (
        <span key={c} className={`photo-chip chip-${i + 1}`}>
          {c}
        </span>
      ))}
    </figure>
  );
}
