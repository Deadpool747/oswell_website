import { IconTile } from "@/components/Icon";
import { CtaBand, PageHero, PhotoFrame, meta } from "@/components/Ui";
import { photos } from "@/lib/site";

export const metadata = meta(
  "About Oswell Technologies | Global AI & Product Engineering Company",
  "Learn about Oswell Technologies, a global AI, automation, and product engineering company helping businesses build, automate, and scale.",
  "/about.html"
);

const blocks = [
  ["Who we are", "A collaborative team of engineers, designers, and strategists focused on building high-impact digital products."],
  ["What we deliver", "Scalable web and mobile applications, automation systems, and AI-powered solutions aligned to measurable goals."],
  ["Mission", "Help modern businesses build, automate, and scale with confidence through focused execution and strong engineering quality."],
  ["How we work", "Discovery, architecture, sprint delivery, QA, deployment, and measurable post-launch support."],
  ["What makes us different", "We combine AI capability with robust product engineering, so automation and usability improve together."],
];

export default function About() {
  return (
    <>
      <PageHero
        kicker="About us"
        title="About Oswell Technologies"
        lead="Oswell Technologies began as a focused AI and deep learning practice and expanded into a full-service product engineering company. We now partner with founders and business teams across markets to build systems that are fast to launch and stable to scale."
      />
      <section className="section">
        <div className="container">
          <PhotoFrame photo={photos.discussion} className="wide" chips={["Engineers", "Designers", "Strategists"]} />
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <div>
            <p className="muted" style={{ marginTop: 0 }}>
              Our work blends business strategy, clean UI/UX, and production-grade engineering so clients get measurable
              value, not just demos.
            </p>
            <ul className="checks">
              <li>Build practical digital products aligned to business goals</li>
              <li>Automate repetitive operations with clear ROI</li>
              <li>Scale architecture for long-term performance and growth</li>
            </ul>
          </div>
          <article className="card">
            <h3 style={{ marginTop: 0 }}>Reach us</h3>
            <ul className="contact-list">
              <li><span>General</span><a href="mailto:info@oswelltechnologies.com">info@oswelltechnologies.com</a></li>
              <li><span>Sales</span><a href="mailto:sales@oswelltechnologies.com">sales@oswelltechnologies.com</a></li>
              <li><span>HR</span><a href="mailto:hr@oswelltechnologies.com">hr@oswelltechnologies.com</a></li>
            </ul>
          </article>
        </div>
      </section>
      <section className="section alt">
        <div className="container grid-3">
          {blocks.map(([t, d], i) => (
            <article key={t} className="card">
              <IconTile name={["users", "package", "target", "compass", "sparkles"][i]} i={i} />
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand title="Let's build something together" text="Book a short call and we'll tell you honestly how we can help." />
    </>
  );
}
