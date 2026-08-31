import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const canonicalOrigin = 'https://pmoe7.com';
const indexablePages = ['index.html', 'about.html', 'projects.html', 'writing.html', 'covid.html', 'law.html'];
const requiredFiles = [
  'robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'ai.txt',
  'feed.xml', 'site.webmanifest', '404.html', 'api/entity.json',
  'api/projects.json', 'api/writing.json'
];
const errors = [];
const warnings = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

for (const file of requiredFiles) {
  if (!exists(file)) errors.push(`Missing required discovery file: ${file}`);
}

for (const file of ['site.webmanifest', 'api/entity.json', 'api/projects.json', 'api/writing.json', 'api/schemas/projects.schema.json', 'api/schemas/writing.schema.json']) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    errors.push(`Invalid JSON in ${file}: ${error.message}`);
  }
}

for (const file of indexablePages) {
  const html = read(file);
  const expectedCanonical = file === 'index.html' ? `${canonicalOrigin}/` : `${canonicalOrigin}/${file}`;
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (!titleMatch || titleMatch[1].trim().length < 10) errors.push(`${file}: missing or weak title`);
  if (!descriptionMatch || descriptionMatch[1].trim().length < 70) errors.push(`${file}: missing or weak description`);
  if (!canonicalMatch || canonicalMatch[1] !== expectedCanonical) errors.push(`${file}: canonical must be ${expectedCanonical}`);
  if (!/<meta\s+name=["']robots["'][^>]*index,follow/i.test(html)) errors.push(`${file}: missing index,follow policy`);
  if (!/property=["']og:title["']/i.test(html) || !/property=["']og:description["']/i.test(html) || !/property=["']og:image["']/i.test(html)) errors.push(`${file}: incomplete Open Graph metadata`);
  if (!/name=["']twitter:card["']/i.test(html)) errors.push(`${file}: missing X/Twitter card metadata`);
  if (!/type=["']application\/ld\+json["']/i.test(html)) errors.push(`${file}: missing JSON-LD`);
  if (h1Count !== 1) errors.push(`${file}: expected exactly one h1, found ${h1Count}`);

  for (const script of html.matchAll(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      errors.push(`${file}: invalid JSON-LD: ${error.message}`);
    }
  }

  for (const attribute of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const target = attribute[1].split(/[?#]/)[0];
    if (!target || /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(target) || target.startsWith('#')) continue;
    const decoded = decodeURIComponent(target);
    const localPath = decoded.startsWith('/') ? decoded.slice(1) : decoded;
    if (!exists(localPath)) warnings.push(`${file}: local reference not found: ${target}`);
  }

  for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = image[1];
    if (!/\balt=["'][^"']*["']/i.test(attributes)) errors.push(`${file}: image is missing an alt attribute`);
    const meaningfulAlt = attributes.match(/\balt=["']([^"']+)["']/i);
    if (meaningfulAlt && (!/\bwidth=["']\d+["']/i.test(attributes) || !/\bheight=["']\d+["']/i.test(attributes))) {
      warnings.push(`${file}: meaningful image is missing intrinsic width or height: ${meaningfulAlt[1]}`);
    }
  }
}

const sitemap = read('sitemap.xml');
for (const file of indexablePages) {
  const url = file === 'index.html' ? `${canonicalOrigin}/` : `${canonicalOrigin}/${file}`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`sitemap.xml: missing ${url}`);
}

const robots = read('robots.txt');
if (!robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`)) errors.push('robots.txt: missing canonical sitemap declaration');
if (!read('llms.txt').includes(`${canonicalOrigin}/api/entity.json`)) errors.push('llms.txt: missing entity endpoint');

for (const warning of [...new Set(warnings)]) console.warn(`WARN ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exitCode = 1;
} else {
  console.log(`SEO validation passed for ${indexablePages.length} canonical pages and ${requiredFiles.length} discovery files.`);
}
