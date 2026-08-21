import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const portalApp = readFileSync(join(repoRoot, "nyxa-portal", "app.js"), "utf8");
const projectsSource = portalApp.match(/const projects\s*=\s*\[([\s\S]*?)\n\];/)?.[1] ?? "";
const siteRoot = "https://nyxalabs.github.io";
const urls = new Set([`${siteRoot}/`]);

function escapeXml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  }[character]));
}

for (const match of projectsSource.matchAll(/\n  \{\n([\s\S]*?)\n  \}(?:,|$)/g)) {
  const block = match[1];
  const url = block.match(/\burl\s*:\s*["']([^"']+)["']/)?.[1];
  if (!url || /\bpublished\s*:\s*false\b/.test(block)) continue;

  const localPath = url.replace(/^\/+|\/+$/g, "");
  const hasPublishedPage = existsSync(join(repoRoot, localPath, "index.html"));
  const explicitlyPublished = /\bpublished\s*:\s*true\b/.test(block);
  if (!hasPublishedPage && !explicitlyPublished) continue;

  urls.add(`${siteRoot}/${localPath}/`);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
writeFileSync(join(repoRoot, "sitemap.xml"), sitemap, "utf8");
console.log(`Sitemap généré : ${urls.size} URL(s)`);
