import Link from "next/link";
import { CAL_URL } from "@/lib/site";
import { PageHero, meta } from "@/components/Ui";

export const metadata = meta(
  "Book a Discovery Call | Oswell Technologies",
  "Book a 20-minute discovery call with Oswell Technologies to discuss AI development, automation, product strategy, and software delivery.",
  "/contact.html"
);

const WHATSAPP = "https://wa.me/447442256653";

export default function Contact() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Book a direct discovery call"
        lead="Skip the form. Choose a time and we will come prepared with the right questions, a practical direction, and next-step recommendations."
      >
        <div className="actions">
          <a className="btn btn-primary" href={CAL_URL} target="_blank" rel="noopener">
            Book a 20-min call
          </a>
          <a className="btn btn-ghost" href={WHATSAPP} target="_blank" rel="noopener">
            WhatsApp us
          </a>
        </div>
      </PageHero>

      <section className="section">
        <div className="container split">
          <div>
            <h2>What happens after you book?</h2>
            <ol className="numbered">
              <li>We review your goals before the call</li>
              <li>We discuss the best-fit approach</li>
              <li>We follow up with the right next step</li>
            </ol>
          </div>
          <article className="card">
            <h3 style={{ marginTop: 0 }}>Direct reach</h3>
            <ul className="contact-list">
              <li><span>General</span><a href="mailto:info@oswelltechnologies.com">info@oswelltechnologies.com</a></li>
              <li><span>Sales</span><a href="mailto:sales@oswelltechnologies.com">sales@oswelltechnologies.com</a></li>
              <li><span>HR</span><a href="mailto:hr@oswelltechnologies.com">hr@oswelltechnologies.com</a></li>
              <li><span>Phone</span><a href="tel:+447442256653">+44 7442 256653</a></li>
              <li><span>Delivery</span>Remote and global</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section alt">
        <div className="container cta" style={{ background: "transparent", border: 0 }}>
          <span className="kicker">Premium intake</span>
          <h2>Have a bigger product idea?</h2>
          <p className="muted">Use the guided intake wizard for scope, features, timeline, and budget in one flow.</p>
          <div className="actions center">
            <a className="btn btn-ghost" href="/idea/">
              Open the idea wizard →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
