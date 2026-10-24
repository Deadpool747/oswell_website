// Keeps the legacy URLs of the previous static site working after `next build`:
//  - /about.html etc. are copies of /about/index.html (canonical tags point at the .html URL)
//  - research PDFs, sitemap.xml and robots.txt are carried over from the repo root
import { cpSync, existsSync, copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "out");
const repo = join(here, "..", "..");

const posts = JSON.parse(await (await import("node:fs/promises")).readFile(join(here, "..", "data", "posts.json"), "utf8"));
const pages = ["about", "services", "products", "use-cases", "blog", "contact", "research", "careers", ...posts.map((p) => p.slug)];

for (const p of pages) {
  const src = join(out, p, "index.html");
  if (!existsSync(src)) throw new Error(`missing built page: ${p}`);
  copyFileSync(src, join(out, `${p}.html`));
}

mkdirSync(join(out, "assets", "research"), { recursive: true });
for (const f of readdirSync(join(repo, "assets", "research"))) {
  copyFileSync(join(repo, "assets", "research", f), join(out, "assets", "research", f));
}
for (const f of ["sitemap.xml", "robots.txt"]) copyFileSync(join(repo, f), join(out, f));

console.log(`postbuild: ${pages.length} legacy .html pages, research PDFs, sitemap, robots`);
