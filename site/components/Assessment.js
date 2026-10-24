import { CAL_URL } from "@/lib/site";
import {
  assessmentIncludes, bring, differences, oswell, pitfalls, sprintIncludes, steps,
} from "@/lib/assessment-common";
import { CtaBand, FaqList, JsonLd, faqJsonLd } from "@/components/Ui";

export default function Assessment({ a }) {
  return (
    <>
      <JsonLd data={faqJsonLd(a.faqs)} />

      <section className="page-hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container assess-hero">
          <div>
            <span className="pill">
              <i className="dot" /> Free AI assessment
            </span>
            <h1>{a.title}</h1>
            <p className="lead">{a.subtitle}</p>
            <div className="actions">
              <a className="btn btn-primary" href={CAL_URL} target="_blank" rel="noopener">
                Book your free 20-min strategy call
              </a>
              <a className="btn btn-ghost" href="#booking">
                Get your 48-hour assessment
              </a>
            </div>
            <p className="small muted" style={{ marginTop: "1.2rem" }}>
              Illustrative planning outputs only. Final recommendations are tailored during the strategy call.
            </p>
          </div>
          <aside className="card panel">
            <div className="panel-head">
              <h2>{a.industry}</h2>
              <span className="tag-label">48 hours</span>
            </div>
            <p className="muted small">What we review in the complimentary assessment</p>
            <ul className="checks">
              {a.review.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </aside>
        </div>
        <div className="container">
          <dl className="stats">
            {a.metrics.map(([v, l]) => (
              <div key={l}>
                <dt>{v}</dt>
                <dd>{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Two free services</span>
            <h2>Start with a low-risk, high-value first step</h2>
            <p className="muted">
              A complimentary 48-hour review of your opportunities, or a one-week MVP discovery sprint to validate the
              idea and map the path forward.
            </p>
          </header>
          <div className="grid-2">
            <article className="card">
              <span className="tag-label">Complimentary 48-hour AI &amp; product assessment</span>
              <h3>What you get in 48 hours</h3>
              <p className="muted">
                Ideal for teams that want a quick expert view before investing in software or AI.
              </p>
              <ul className="checks">
                {assessmentIncludes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <a className="btn btn-ghost" href={CAL_URL} target="_blank" rel="noopener">
                Claim this assessment
              </a>
            </article>
            <article className="card">
              <span className="tag-label">Complimentary 1-week MVP discovery sprint</span>
              <h3>Perfect for founders and new ideas</h3>
              <p className="muted">
                A focused sprint to decide what to build, what to skip, and how to launch with confidence.
              </p>
              <ul className="checks">
                {sprintIncludes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <a className="btn btn-ghost" href={CAL_URL} target="_blank" rel="noopener">
                Start the sprint
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container grid-2">
          <article>
            <span className="kicker">Common challenges</span>
            <h2 className="h-md">{a.challengesTitle}</h2>
            <ul className="checks minus">
              {a.challenges.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </article>
          <article>
            <span className="kicker">How AI solves it</span>
            <h2 className="h-md">{a.solveTitle}</h2>
            <div className="grid-2 tight">
              {a.solutions.map(([t, d]) => (
                <div key={t} className="card">
                  <h3 style={{ marginTop: 0 }}>{t}</h3>
                  <p className="muted">{d}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Portfolio</span>
            <h2>Industry-style project examples</h2>
            <p className="muted">
              Demo project concepts. Each card shows the problem, solution, technology, and the business outcome that
              matters.
            </p>
          </header>
          <div className="grid-2">
            {a.portfolio.map((p) => (
              <article key={p.title} className="card">
                <span className="tag-label">{p.tag}</span>
                <h3>{p.title}</h3>
                <dl className="kv">
                  <dt>Problem</dt>
                  <dd>{p.problem}</dd>
                  <dt>Solution</dt>
                  <dd>{p.solution}</dd>
                  <dt>Technology</dt>
                  <dd>{p.tech}</dd>
                  <dt>Outcome</dt>
                  <dd>{p.outcome}</dd>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container grid-2">
          <article className="card">
            <span className="tag-label">Traditional development</span>
            <h3>Common pitfalls we see</h3>
            <ul className="checks minus">
              {pitfalls.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </article>
          <article className="card">
            <span className="tag-label">Oswell Technologies</span>
            <h3>How we work differently</h3>
            <ul className="checks">
              {oswell.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className="container grid-3" style={{ marginTop: "1.1rem" }}>
          {differences.map(([t, d]) => (
            <article key={t} className="card">
              <h3 style={{ marginTop: 0 }}>{t}</h3>
              <p className="muted">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Process</span>
            <h2>A simple path from call to launch</h2>
          </header>
          <ol className="steps steps-8">
            {steps.map(([t, d], i) => (
              <li key={t}>
                <span className="step-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section alt">
        <div className="container narrow">
          <header className="section-head">
            <span className="kicker">FAQ</span>
            <h2>Questions people ask before they book</h2>
          </header>
          <FaqList items={a.faqs} />
        </div>
      </section>

      <section className="section" id="booking">
        <div className="container">
          <header className="section-head">
            <span className="kicker">Booking details</span>
            <h2>Book the call directly and come prepared</h2>
            <p className="muted">
              Book the 20-minute strategy call first, then use this checklist so the conversation is specific to your
              business.
            </p>
          </header>
          <div className="grid-4">
            {bring.map(([t, items]) => (
              <article key={t} className="card">
                <h3 style={{ marginTop: 0 }}>{t}</h3>
                <ul className="checks">
                  {items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: "1.5rem" }}>
            To share documents before the call, send them to{" "}
            <a className="link" href="mailto:info@oswelltechnologies.com">
              info@oswelltechnologies.com
            </a>
            .
          </p>
        </div>
      </section>

      <CtaBand
        title="Ready to discover what's possible?"
        text="Book a complimentary strategy session. Let's identify opportunities before you invest thousands into software or AI."
      />
    </>
  );
}
