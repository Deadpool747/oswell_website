import Icon from "@/components/Icon";
import { PageHero, meta } from "@/components/Ui";

export const metadata = meta(
  "Careers | Oswell Technologies",
  "Join Oswell Technologies and build scalable products and automation systems with a high-ownership team.",
  "/careers.html"
);

const roles = [
  ["Full-Stack Developer", "React, Node.js, API architecture, and cloud deployment experience."],
  ["Flutter Developer", "Production mobile app experience with strong UX execution."],
  ["Product Designer", "Interface systems, rapid prototyping, and conversion-focused design."],
  ["Automation Engineer", "Workflow orchestration, integrations, and process optimization."],
];

export default function Careers() {
  return (
    <>
      <PageHero
        kicker="Careers"
        title="Build meaningful products with us"
        lead="We are hiring engineers, product designers, and automation specialists who care about quality and impact."
      >
        <div className="actions">
          <a className="btn btn-primary" href="mailto:hr@oswelltechnologies.com">
            Apply via email
          </a>
        </div>
      </PageHero>
      <section className="section">
        <div className="container narrow">
          {roles.map(([t, d]) => (
            <a key={t} className="role" href={`mailto:hr@oswelltechnologies.com?subject=${encodeURIComponent(t)}`}>
              <div>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </div>
              <span aria-hidden="true">
                <Icon name="arrow" size={18} />
              </span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
