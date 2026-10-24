import Link from "next/link";
import { notFound } from "next/navigation";
import posts from "@/data/posts.json";
import assessments from "@/data/assessments.json";
import Assessment from "@/components/Assessment";
import { CAL_URL } from "@/lib/site";
import { JsonLd } from "@/components/Ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...posts, ...assessments].map((x) => ({ slug: x.slug }));
}

function find(slug) {
  const post = posts.find((p) => p.slug === slug);
  if (post) return { kind: "post", item: post };
  const a = assessments.find((p) => p.slug === slug);
  if (a) return { kind: "assessment", item: a };
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const found = find(slug);
  if (!found) return {};
  const { kind, item } = found;
  // Posts keep their legacy .html URL as canonical; assessments were already folder URLs.
  const url = kind === "post" ? `https://oswelltechnologies.com/${slug}.html` : `https://oswelltechnologies.com/${slug}/`;
  const title = item.pageTitle;
  return {
    title,
    description: item.description,
    alternates: { canonical: url },
    openGraph: { title, description: item.description, url, type: kind === "post" ? "article" : "website" },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const found = find(slug);
  if (!found) notFound();

  if (found.kind === "assessment") return <Assessment a={found.item} />;

  const p = found.item;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: p.title,
          description: p.description,
          mainEntityOfPage: `https://oswelltechnologies.com/${p.slug}.html`,
          author: { "@type": "Organization", name: "Oswell Technologies" },
          publisher: { "@type": "Organization", name: "Oswell Technologies" },
        }}
      />
      <article className="section post">
        <div className="container narrow">
          <Link href="/blog/" className="back">
            ← Back to blog
          </Link>
          <span className="tag-label">{p.tag}</span>
          <h1>{p.title}</h1>
          <div className="prose">
            {p.body.map((b, i) =>
              b.type === "h" ? (
                <h3 key={i}>{b.text}</h3>
              ) : b.type === "ul" ? (
                <ul key={i}>
                  {b.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{b.text}</p>
              )
            )}
          </div>
          <div className="actions" style={{ marginTop: "2.5rem" }}>
            <a className="btn btn-primary" href={CAL_URL} target="_blank" rel="noopener">
              Book a 20-min call
            </a>
            <Link className="btn btn-ghost" href="/blog/">
              More articles
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
