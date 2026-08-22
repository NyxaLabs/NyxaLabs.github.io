import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const portalAppPath = existsSync(join(repoRoot, "app.js"))
  ? join(repoRoot, "app.js")
  : join(repoRoot, "nyxa-portal", "app.js");
const portalApp = readFileSync(portalAppPath, "utf8");
const siteRoot = "https://nyxalabs.github.io";

function extractProjectsArray(source) {
  const declaration = source.match(/\b(?:const|let|var)\s+projects\s*=/);
  if (!declaration || declaration.index == null) {
    throw new Error("Impossible de trouver la liste centrale `projects` dans app.js.");
  }

  const start = source.indexOf("[", declaration.index + declaration[0].length);
  if (start < 0) throw new Error("La liste `projects` ne contient pas de tableau.");

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error("Le tableau `projects` n'est pas correctement fermé dans app.js.");
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  }[character]));
}

const projectsLiteral = extractProjectsArray(portalApp);
const projects = vm.runInNewContext(`(${projectsLiteral})`, Object.create(null), { timeout: 1000 });

if (!Array.isArray(projects)) {
  throw new Error("La liste centrale `projects` doit être un tableau.");
}

const urls = new Set([`${siteRoot}/`]);
let ignored = 0;

for (const project of projects) {
  if (!project || project.published !== true) continue;

  if (typeof project.url !== "string" || !project.url.trim()) {
    console.warn(`Projet ignoré : URL absente ou invalide (${project?.name ?? "sans nom"}).`);
    ignored += 1;
    continue;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(project.url, `${siteRoot}/`);
  } catch {
    console.warn(`Projet ignoré : URL illisible (${project.name ?? project.url}).`);
    ignored += 1;
    continue;
  }

  if (parsedUrl.origin !== siteRoot) {
    console.warn(`Projet ignoré : URL externe (${parsedUrl.href}).`);
    ignored += 1;
    continue;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(parsedUrl.pathname);
  } catch {
    console.warn(`Projet ignoré : chemin URL invalide (${parsedUrl.pathname}).`);
    ignored += 1;
    continue;
  }

  const segments = decodedPath.split("/").filter(Boolean);
  if (!segments.length || segments.some(segment => segment === "." || segment === "..")) {
    console.warn(`Projet ignoré : chemin local invalide (${decodedPath}).`);
    ignored += 1;
    continue;
  }

  const pagePath = join(repoRoot, ...segments, "index.html");
  if (!existsSync(pagePath)) {
    console.warn(
      `Projet publié mais absent du sitemap car ${segments.join("/")}/index.html n'existe pas.`
    );
    ignored += 1;
    continue;
  }

  const canonicalPath = parsedUrl.pathname.endsWith("/")
    ? parsedUrl.pathname
    : `${parsedUrl.pathname}/`;

  urls.add(`${siteRoot}${canonicalPath}`);
}

const orderedUrls = [
  `${siteRoot}/`,
  ...[...urls]
    .filter(url => url !== `${siteRoot}/`)
    .sort((a, b) => a.localeCompare(b, "fr"))
];

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  orderedUrls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

writeFileSync(join(repoRoot, "sitemap.xml"), sitemap, "utf8");
console.log(`Sitemap généré : ${orderedUrls.length} URL(s), ${ignored} projet(s) ignoré(s).`);
