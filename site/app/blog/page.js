import Link from "next/link";
import posts from "@/data/posts.json";
import Icon from "@/components/Icon";
import { PageHero, meta } from "@/components/Ui";

export const metadata = meta(
  "AI Development & Automation Blog | Oswell Technologies",
  "Insights on AI adoption, automation, MVP delivery, mobile apps, and product strategy for global business teams.",
  "/blog.html"
);

export default function Blog() {
  return (
    <>
      <PageHero
        kicker="Blog"
        title="AI and app development guides for business decision makers"
        lead="Practical breakdowns on product strategy, development, and automation implementation for modern business teams."
      />
      <section className="section">
        <div className="container grid-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/${p.slug}/`} className="card post-card">
              <span className="tag-label">{p.tag.split("|")[0].trim()}</span>
              <h3>{p.title}</h3>
              <p className="muted">{p.summary}</p>
              <span className="more">
                Read article <Icon name="arrow" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
