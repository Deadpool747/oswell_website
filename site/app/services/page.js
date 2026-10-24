import { IconTile } from "@/components/Icon";
import { CtaBand, PageHero, PhotoFrame, meta } from "@/components/Ui";
import { photos } from "@/lib/site";

export const metadata = meta(
  "Global AI Development & Automation Services | Oswell Technologies",
  "AI development, automation, web platforms, mobile apps, and agentic systems for modern businesses worldwide.",
  "/services.html"
);

const items = [
  ["sparkles", "AI & Agentic AI Solutions", "We build assistants, recommendation systems, and AI workflows integrated with your existing tools.", ["Conversational support systems", "AI summarization for operations", "Knowledge-base retrieval"]],
  ["code", "Web Development", "Modern web applications with responsive interfaces, secure APIs, and maintainable codebases.", ["Customer platforms", "Admin dashboards", "Headless CMS builds"]],
  ["mobile", "Mobile App Development", "Fast and reliable apps for Android and iOS using a shared codebase and deployment pipeline.", ["Flutter product builds", "User journey optimization", "Release management"]],
  ["workflow", "Automation Systems", "Automate repetitive processes with event-driven logic and workflow orchestration.", ["Lead flow automation", "Document and approval workflows", "System-to-system sync"]],
  ["compass", "Consulting", "Need direction before development? We define roadmaps, scope, and architecture that reduce risk.", ["MVP scoping", "Product strategy", "Technical audits"]],
  ["refresh", "Delivery Model", "Each engagement includes planning, sprint execution, QA, launch support, and handover.", ["Weekly demos", "Transparent timelines", "Deployment-ready release"]],
];

export default function Services() {
  return (
    <>
      <PageHero
        kicker="Services"
        title="Global AI development & automation services"
        lead="Our service model is designed to move from discovery to production quickly while keeping your team in control."
      />
      <section className="section">
        <div className="container grid-3">
          {items.map(([icon, title, text, bullets], i) => (
            <article key={title} className="card">
              <IconTile name={icon} i={i} />
              <h3>{title}</h3>
              <p className="muted">{text}</p>
              <ul className="checks">
                {bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="section alt">
        <div className="container split">
          <div>
            <span className="kicker">How we deliver</span>
            <h2>Planning, sprints, QA and launch, in the open</h2>
            <p className="muted">
              Every engagement runs on weekly demos and transparent timelines, so you always see real progress and stay
              in control of scope.
            </p>
            <ul className="checks">
              <li>Discovery and a scoped plan before any build starts</li>
              <li>Sprint delivery with a click-through release each week</li>
              <li>QA, launch support and a clean handover</li>
            </ul>
          </div>
          <PhotoFrame photo={photos.meeting} chips={["Weekly demos", "Deployment-ready"]} />
        </div>
      </section>
      <CtaBand
        title="Need a custom service package?"
        text="Share your goals and get a practical estimate within one business day."
      />
    </>
  );
}
