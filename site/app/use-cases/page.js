import { IconTile } from "@/components/Icon";
import { CtaBand, PageHero, meta } from "@/components/Ui";

export const metadata = meta(
  "Global AI & Automation Use Cases | Oswell Technologies",
  "Real-world AI and automation use cases across support, finance, logistics, healthcare, operations, and product teams.",
  "/use-cases.html"
);

const cases = [
  ["bot", "Agentic AI Workflows", "Autonomous task planning and execution with approval checkpoints."],
  ["message", "AI Chatbots", "Customer support, lead qualification, and multilingual query handling."],
  ["mic", "Voice Agents", "AI call assistants for booking, support, and automated follow-ups."],
  ["eye", "Computer Vision", "Visual inspection, detection, compliance checks, and monitoring."],
  ["scan", "OCR Automation", "Invoice, KYC and form extraction and validation pipelines."],
  ["shield", "Bank Fraud Detection", "Transaction anomaly detection and risk scoring in real time."],
  ["trophy", "Sports Analysis", "Player tracking, team insights, and match performance analytics."],
  ["trend", "Stocks Prediction", "Time-series forecasting and signal-based decision dashboards."],
  ["stethoscope", "MRI Cancer Detection", "AI-assisted diagnostic support from medical imaging workflows."],
  ["truck", "Delivery & Tracking Systems", "Dispatch automation, route logic, and live status visibility."],
  ["workflow", "Business Automation", "Approval flows, CRM sync, reporting automation, and alerts."],
  ["line", "Predictive Analytics", "Demand forecasting, churn prediction, and revenue intelligence."],
];

export default function UseCases() {
  return (
    <>
      <PageHero
        kicker="Use cases"
        title="Global AI & automation use cases for business"
        lead="Explore practical solutions for sales, operations, support, finance, healthcare, logistics, and decision intelligence."
      />
      <section className="section">
        <div className="container grid-3">
          {cases.map(([icon, t, d], i) => (
            <article key={t} className="card">
              <IconTile name={icon} i={i} />
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </article>
          ))}
        </div>
        <div className="container" style={{ marginTop: "1.1rem" }}>
          <article className="card">
            <h3>Industry coverage</h3>
            <p className="muted">
              FinTech, Logistics, Healthcare, Retail, Education, Manufacturing, Real Estate, and Enterprise IT.
            </p>
          </article>
        </div>
      </section>
      <CtaBand
        title="Need a custom use case?"
        text="We design domain-specific AI solutions around your process, data, and compliance requirements."
      />
    </>
  );
}
