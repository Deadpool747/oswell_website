import Link from "next/link";
import Icon, { IconTile } from "@/components/Icon";
import HeroBackdrop from "@/components/HeroBackdrop";
import Showcase from "@/components/Showcase";
import Counter from "@/components/Counter";
import { PhotoFrame } from "@/components/Ui";
import {
  CAL_URL, WHATSAPP_URL, faqs, industries, outcomes, photos, process, proof, services, stats, team, techStack,
} from "@/lib/site";
import { differences } from "@/lib/assessment-common";
import { papers } from "@/lib/papers";
import products from "@/data/products.json";
import posts from "@/data/posts.json";

// Generic tool categories (not vendor claims) for the "plugs into your stack" strip.
const stackItems = [
  ["message", "Messaging apps"],
  ["mail", "Email"],
  ["database", "CRM"],
  ["calendar", "Calendars"],
  ["file", "Documents"],
  ["chart", "Spreadsheets & BI"],
  ["phone", "Telephony"],
  ["cart", "E-commerce"],
  ["calculator", "Accounting"],
  ["lock", "Identity & access"],
  ["cpu", "Internal APIs"],
  ["truck", "Logistics systems"],
];

// The six quick-offer labels from the original hero.
const heroChips = [
  ["rocket", "1 Week MVP Delivery"],
  ["zap", "48 Hours Assessment"],
  ["cpu", "AI Development"],
  ["mic", "Voice AI & Chatbots"],
  ["mobile", "Web & Mobile Apps"],
  ["workflow", "Automation Systems"],
];

// News-style ticker: only real offers and content that exist on this site.
const news = [
  ["Free 48-hour AI assessment, tailored to your industry", "/healthcare-ai-assessment/"],
  ["One-week MVP discovery sprint", "/services/"],
  ["New whitepaper: AI-Powered Early Disease Detection", "/research/"],
  ["Voice AI, chat and workflow automation, shipped in weeks", "/products/"],
  ["Book a 20-minute strategy call", CAL_URL],
];

// Catalogue numbers that are factual counts of what is on this site.
const library = [
  { value: products.length, label: "AI products", icon: "cpu" },
  { value: 12, label: "Use cases", icon: "target" },
  { value: industries.length, label: "Industry assessments", icon: "layers" },
  { value: papers.length, label: "Research whitepapers", icon: "file" },
];

const featuredIdx = [0, 1, 2, 3, 7];
const featuredCat = ["AI agents", "Voice AI", "Automation", "Document AI", "Finance"];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Oswell Technologies",
      url: "https://oswelltechnologies.com",
      email: "info@oswelltechnologies.com",
      telephone: "+447442256653",
      areaServed: "Worldwide",
    },
    { "@type": "WebSite", name: "Oswell Technologies", url: "https://oswelltechnologies.com" },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

const industryIcons = ["heart", "calculator", "truck", "factory", "graduation", "scale", "briefcase", "cart"];
const processIcons = ["search", "compass", "code", "shield", "rocket"];
const whyIcons = ["users", "sparkles", "layers", "lock", "handshake", "target"];

function NewsLink({ href, children }) {
  return href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  ) : (
    <Link href={href}>{children}</Link>
  );
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Full-screen particle hero */}
      <section className="hero3d">
        <HeroBackdrop />

        <div className="container hero3d-inner">
          <span className="pill pill-dark rise" style={{ "--delay": "150ms" }}>
            <span className="dot">
              <Icon name="sparkles" size={12} />
            </span>
            Build. Automate. Scale.
          </span>

          <ul className="hero-chips" aria-label="What we offer">
            {heroChips.map(([icon, label], i) => (
              <li key={label} className="rise" style={{ "--delay": `${700 + i * 110}ms` }}>
                <Icon name={icon} size={17} /> {label}
              </li>
            ))}
          </ul>

          <div className="hero3d-bottom">
            <h1 className="rise" style={{ "--delay": "300ms" }}>
              Software and AI that <em>removes the busywork</em> from your business.
            </h1>

            <div className="hero3d-side rise" style={{ "--delay": "520ms" }}>
              <p>
                We build AI agents, business automation, custom software and mobile apps for startups, SMBs and
                enterprise teams, shipped in weeks, not quarters.
              </p>
              <div className="actions">
                <a className="btn btn-light" href={CAL_URL} target="_blank" rel="noopener">
                  Book a 20-min call <Icon name="arrow" size={18} />
                </a>
                <Link className="btn btn-outline-light" href="/services/">
                  Explore services
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* News-style ticker */}
        <div className="container hero3d-ticker">
          <div className="ticker dark rise" style={{ "--delay": "800ms" }}>
            <span className="ticker-tag">
              <i /> New
            </span>
            <div className="ticker-view">
              <div className="ticker-track">
                {[...news, ...news].map(([text, href], i) => (
                  <NewsLink key={i} href={href}>
                    {text} <Icon name="arrow" size={14} />
                  </NewsLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container stats-wrap">
        <dl className="stats rise" style={{ "--delay": "900ms" }}>
          {stats.map((s) => (
            <div key={s.label}>
              <dt>
                <Counter value={s.value} decimals={s.decimals || 0} suffix={s.suffix} />
              </dt>
              <dd>
                <strong>{s.label}</strong>
                {s.sub}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Social proof (original site content) */}
      <section className="section" style={{ paddingTop: "3.5rem", paddingBottom: "1rem" }}>
        <div className="container">
          <header className="section-head">
            <span className="kicker">Social proof</span>
            <h2>Built for founders who need trust fast</h2>
          </header>
          <div className="grid-4">
            {proof.map((p, i) => (
              <article key={p.title} className="card">
                <IconTile name={p.icon} i={i} />
                <h3>{p.title}</h3>
                <p className="muted">{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "2.5rem", paddingBottom: "2rem" }}>
        <div className="container">
          <p className="small muted" style={{ textAlign: "center", marginBottom: "1rem" }}>
            Built to plug into the tools your team already uses
          </p>
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[...stackItems, ...stackItems].map(([icon, label], i) => (
                <span key={i}>
                  <Icon name={icon} size={17} /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">See it in action</span>
            <h2>AI that does the work, not just the talking</h2>
            <p className="muted">
              A few of the ways we put AI to work inside real businesses. Pick one to see how it flows.
            </p>
          </header>
          <Showcase />
        </div>
      </section>

      {/* Giant statement band */}
      <div className="bigtext" aria-hidden="true">
        <div className="bigtext-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              Automate <b>✦</b> Scale <b>✦</b> Transform <b>✦</b> Automate <b>✦</b> Scale <b>✦</b> Transform <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Services</span>
            <h2>What we build for growth-focused teams</h2>
          </header>
          <div className="bento">
            {services.map((s, i) => (
              <Link
                href="/services/"
                key={s.title}
                className={`card svc ${s.wide ? "span-2" : ""} ${s.full ? "span-3" : ""}`}
              >
                <div className="svc-top">
                  <IconTile name={s.icon} i={i} />
                  <span className="svc-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <span className="tag-label">{s.cat}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
                <ul className="tags">
                  {s.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <span className="more">
                  Explore <Icon name="arrow" size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Catalogue counters */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="numbers">
            {library.map((l, i) => (
              <div key={l.label} className="num">
                <IconTile name={l.icon} i={i} />
                <b>
                  <Counter value={l.value} />
                </b>
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured solutions, list style */}
      <section className="section alt">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Solutions</span>
            <h2>Production-ready AI, built around your workflow</h2>
          </header>
          <ul className="story-list">
            {featuredIdx.map((pi, i) => {
              const p = products[pi];
              return (
                <li key={p.title}>
                  <Link href="/products/" className="story">
                    <span className="story-n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="story-cat">{featuredCat[i]}</span>
                    <span className="story-body">
                      <strong>{p.title}</strong>
                      <span>{p.summary}</span>
                    </span>
                    <span className="story-go">
                      <Icon name="arrow" size={20} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="actions" style={{ marginTop: "2rem" }}>
            <Link className="btn btn-ghost" href="/products/">
              See all {products.length} products <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Case studies</span>
            <h2>The kind of business impact buyers care about</h2>
          </header>
          <div className="grid-3">
            {outcomes.map((o) => (
              <article key={o.tag} className="card">
                <span className="tag-label">{o.tag}</span>
                <div className="big grad">{o.big}</div>
                <p className="muted">{o.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container split">
          <PhotoFrame photo={photos.team} chips={["Weekly demos", "Remote & global"]} />
          <div>
            <span className="kicker">Why Oswell exists</span>
            <h2>Help businesses adopt AI without complexity</h2>
            <p className="muted">
              We work with founders and operators who want clear outcomes: lower cost, less manual work, faster
              launches, and systems that can scale with the business.
            </p>
            <ul className="checks">
              <li>Product strategy and technical architecture in one team</li>
              <li>Transparent sprint delivery with weekly progress reviews</li>
              <li>Deployment-ready systems with handover support</li>
            </ul>
          </div>
        </div>
        <div className="container" style={{ marginTop: "4rem" }}>
          <header className="section-head" style={{ marginBottom: "1.6rem" }}>
            <span className="kicker">What sets us apart</span>
            <h2>Experienced engineering, not just pretty demos</h2>
          </header>
        </div>
        <div className="container why-grid" style={{ marginTop: 0 }}>
          {differences.map(([t, d], i) => (
            <article key={t} className="why">
              <span className="why-n">{String(i + 1).padStart(2, "0")}</span>
              <IconTile name={whyIcons[i]} i={i} size={20} />
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">How we work</span>
            <h2>Discover, design, build, launch</h2>
          </header>
          <ol className="steps four">
            {process.map(([n, t, d], i) => (
              <li key={n}>
                <span className="step-top">
                  <span className="step-n">{n}</span>
                  <IconTile name={processIcons[i]} i={i + 1} size={20} />
                </span>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Leadership (original site content) */}
      <section className="section alt">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Leadership</span>
            <h2>Leadership and delivery</h2>
          </header>
          <div className="team-grid">
            {team.map((m) => (
              <article key={m.role} className="team-card">
                <div className={`team-photo ${m.placeholder ? "is-placeholder" : ""}`}>
                  <img src={m.img} alt={m.alt} loading="lazy" decoding="async" />
                </div>
                <div className="team-body">
                  <h3>{m.role}</h3>
                  <p className="muted">{m.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Technology stack (original site content) */}
      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Technology stack</span>
            <h2>Built on tools buyers recognize and teams trust</h2>
          </header>
          <ul className="tech">
            {techStack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Live projects (original site content) */}
      <section className="section alt">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Projects</span>
            <h2>Featured live builds and project subdomains</h2>
          </header>
          <div className="grid-3">
            <article className="card">
              <IconTile name="globe" i={0} />
              <h3>Crypto Project Hub</h3>
              <p className="muted">
                A dedicated home for the crypto-focused build now mapped to{" "}
                <a className="link" href="https://crypto.oswelltechnologies.com" target="_blank" rel="noopener">
                  crypto.oswelltechnologies.com
                </a>
                .
              </p>
            </article>
            <article className="card">
              <IconTile name="refresh" i={1} />
              <h3>Repeatable launch pattern</h3>
              <p className="muted">
                We can spin up future client, product, or campaign subdomains using the same structure and branding.
              </p>
            </article>
            <article className="card">
              <IconTile name="rocket" i={2} />
              <h3>Next project slot</h3>
              <p className="muted">
                Share the hostname and we can add the next build here with its own live link and content.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <span className="kicker">Research &amp; Assessments</span>
            <h2>New discovery paths for teams evaluating AI adoption</h2>
            <p className="muted">
              Downloadable research and industry-specific AI assessments, so you can self-qualify before a call. Each
              assessment page frames common friction points, example opportunities, and the right first-step
              conversation for your industry.
            </p>
            <Link className="btn btn-primary" href="/research/">
              Open the research library <Icon name="arrow" size={18} />
            </Link>
          </div>
          <ul className="num-grid two">
            {industries.map(([label, href], i) => (
              <li key={href}>
                <Link href={href} className="num-tile">
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="i">
                    <Icon name={industryIcons[i]} size={22} />
                  </span>
                  <span className="t">
                    {label} <Icon name="arrow" size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Insights: real articles and whitepapers */}
      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Insights</span>
            <h2>Guides and research from our team</h2>
          </header>
          <div className="insights">
            {[
              ...posts.slice(0, 2).map((p) => ({
                kind: "Article",
                meta: p.tag.split("|")[0].trim(),
                title: p.title,
                text: p.summary,
                href: `/${p.slug}/`,
              })),
              ...[papers[5], papers[4]].map((p) => ({
                kind: "Whitepaper",
                meta: `${p.date} · ${p.pages} pages`,
                title: p.title,
                text: p.text,
                href: `/assets/research/${p.file}`,
                file: true,
              })),
            ].map((c) => (
              <article key={c.title} className="card insight">
                <span className={`kind ${c.file ? "paper" : ""}`}>{c.kind}</span>
                <span className="tag-label">{c.meta}</span>
                <h3>{c.title}</h3>
                <p className="muted">{c.text}</p>
                {c.file ? (
                  <a className="more" href={c.href} target="_blank" rel="noopener">
                    Open PDF <Icon name="arrow" size={16} />
                  </a>
                ) : (
                  <Link className="more" href={c.href}>
                    Read article <Icon name="arrow" size={16} />
                  </Link>
                )}
              </article>
            ))}
          </div>
          <div className="actions" style={{ marginTop: "2rem" }}>
            <Link className="btn btn-ghost" href="/blog/">
              All articles
            </Link>
            <Link className="btn btn-ghost" href="/research/">
              All research
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container narrow">
          <header className="section-head">
            <span className="kicker">FAQ</span>
            <h2>Questions buyers usually ask before they convert</h2>
          </header>
          {faqs.map(([q, a]) => (
            <details key={q} className="faq">
              <summary>{q}</summary>
              <p className="muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container cta cta-xl">
          <span className="kicker kicker-light">Book a 20-Min Call</span>
          <h2>Let&apos;s book the call now</h2>
          <p>
            Skip the form and book directly. Choose a time on our calendar and we will use the call to understand the
            scope, answer questions, and outline next steps.
          </p>
          <ul className="call-points">
            <li>
              <Icon name="check" size={16} /> 20-minute discovery call
            </li>
            <li>
              <Icon name="check" size={16} /> Project fit, timeline, and budget discussion
            </li>
            <li>
              <Icon name="check" size={16} /> Clear next step after the call
            </li>
          </ul>
          <div className="actions center">
            <a className="btn btn-primary" href={CAL_URL} target="_blank" rel="noopener">
              Book 20-Min Call <Icon name="arrow" size={18} />
            </a>
            <a className="btn btn-ghost" href={WHATSAPP_URL} target="_blank" rel="noopener">
              WhatsApp Us
            </a>
          </div>
          <p className="cta-note">Fastest path to a clear recommendation, without the back-and-forth of a form.</p>
          <a className="cta-mail" href="mailto:info@oswelltechnologies.com">
            info@oswelltechnologies.com
          </a>
        </div>
      </section>
    </>
  );
}
