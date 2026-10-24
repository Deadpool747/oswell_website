import { IconTile } from "@/components/Icon";
import { papers } from "@/lib/papers";
import { CtaBand, PageHero, meta } from "@/components/Ui";

export const metadata = meta(
  "Research, Insights & Whitepapers | Oswell Technologies",
  "Explore Oswell Technologies research, whitepapers, and strategic insights on AI adoption, automation, product validation, digital trust, and delivery planning.",
  "/research.html"
);

const method = [
  ["Opportunity research", "We look for time sinks, manual processes, and customer friction that can be improved with software or AI."],
  ["Solution mapping", "Each idea is mapped against business value, complexity, risk, and implementation speed."],
  ["Validation signals", "We identify the evidence that shows whether a build is likely to convert into revenue or internal efficiency."],
  ["Execution plan", "Research ends with a roadmap that makes the next step obvious for founders and operators."],
];

const publish = [
  ["AI adoption signals", "Where teams are already spending time manually and what that means for automation potential."],
  ["Product validation", "How to tell if an idea deserves a one-week MVP sprint or just a smarter process improvement."],
  ["Delivery planning", "How scope, timeline, architecture, and security shape the right implementation path."],
];

export default function Research() {
  return (
    <>
      <PageHero
        kicker="Research"
        title="Practical research, insights, and whitepapers for AI and product decisions"
        lead="We turn discovery conversations into clear direction. This page collects the themes, methods, planning frameworks, and downloadable whitepapers we use to evaluate whether a project should be validated, scoped, or launched."
      />

      <section className="section">
        <div className="container grid-4">
          {method.map(([t, d], i) => (
            <article key={t} className="card">
              <IconTile name={["search", "layers", "target", "compass"][i]} i={i} />
              <h3 style={{ marginTop: 0 }}>{t}</h3>
              <p className="muted">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Whitepapers</span>
            <h2>Download Oswell research papers</h2>
            <p className="muted">
              Long-form thinking on autonomous operations, digital trust, and AI-enabled production systems.
            </p>
          </header>
          <div className="grid-3">
            {papers.map((p) => (
              <article key={p.file} className="card paper">
                <IconTile name="file" i={papers.indexOf(p)} />
                <h3 style={{ marginTop: 0 }}>{p.title}</h3>
                <p className="muted">{p.text}</p>
                <p className="small muted paper-meta">
                  {p.date} · {p.pages} pages
                  <br />
                  {p.authors.includes(",") ? "Authors" : "Author"}: {p.authors}
                </p>
                <div className="actions">
                  <a className="btn btn-ghost" href={`/assets/research/${p.file}`} target="_blank" rel="noopener">
                    Open PDF
                  </a>
                  <a className="btn btn-ghost" href={`/assets/research/${p.file}`} download>
                    Download
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">What we publish</span>
            <h2>The kind of research that helps teams decide faster</h2>
          </header>
          <div className="grid-3">
            {publish.map(([t, d]) => (
              <article key={t} className="card">
                <h3 style={{ marginTop: 0 }}>{t}</h3>
                <p className="muted">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Need help validating an idea?"
        text="Book a 20-minute call and we'll help you decide what is worth building next."
      />
    </>
  );
}
