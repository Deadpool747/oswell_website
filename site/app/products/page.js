import products from "@/data/products.json";
import { IconTile } from "@/components/Icon";
import { CtaBand, PageHero, meta } from "@/components/Ui";

export const metadata = meta(
  "AI Products & Automation Solutions | Oswell Technologies",
  "Production-ready AI products, automation systems, OCR, computer vision, voice agents, and domain-specific software for global teams.",
  "/products.html"
);

const icons = ["bot", "mic", "workflow", "scan", "truck", "eye", "stethoscope", "calculator", "shield", "message", "target", "handshake", "chart", "brain", "trophy"];

export default function Products() {
  return (
    <>
      <PageHero
        kicker="Products"
        title="AI products & automation solutions"
        lead="From agentic AI systems to healthcare diagnostics and financial risk intelligence, we build production-ready solutions tailored to your domain."
      />
      <section className="section">
        <div className="container grid-3">
          {products.map((p, i) => (
            <article key={p.title} className="card product">
              <IconTile name={icons[i % icons.length]} i={i} />
              <h3>{p.title}</h3>
              <p className="muted">{p.summary}</p>
              <details>
                <summary>View product snapshot</summary>
                <dl>
                  <dt>Problem</dt>
                  <dd>{p.problem}</dd>
                  <dt>Scenario</dt>
                  <dd>{p.scenario}</dd>
                  <dt>Our solution</dt>
                  <dd>{p.solution}</dd>
                </dl>
              </details>
            </article>
          ))}
        </div>
      </section>

      <CtaBand
        title="Need a custom AI product?"
        text="Tell us your use case and we will propose architecture, timeline, and rollout plan."
      />
    </>
  );
}
