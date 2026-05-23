const BASE_URL = "https://www.rightpriceautosales.net";
const START_PATHS = ["/cars-for-sale"];
const MAX_PAGES = 6;
const MAX_DETAILS = Number(process.argv[2] || 8);

function absoluteUrl(value) {
  if (!value) return null;
  try {
    return new URL(value, BASE_URL).toString();
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

function extractDetailUrls(html) {
  const urls = [];
  const hrefPattern = /href=["']([^"']*\/Inventory\/Details\/[^"']+)["']/gi;
  let match;
  while ((match = hrefPattern.exec(html))) {
    urls.push(absoluteUrl(match[1]));
  }
  return unique(urls);
}

function extractPaginationUrls(html) {
  const urls = [];
  const hrefPattern = /href=["']([^"']*(?:cars-for-sale|Inventory)[^"']*(?:page|Page|pg|PageNumber|start|offset)[^"']*)["']/gi;
  let match;
  while ((match = hrefPattern.exec(html))) {
    urls.push(absoluteUrl(match[1]));
  }
  return unique(urls).filter((url) => url?.startsWith(BASE_URL));
}

function extractVin(text) {
  const vin = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
  return vin ? vin[0].toUpperCase() : null;
}

function extractStock(text) {
  const stock = text.match(/Stock#?\s*[:#]?\s*([A-Za-z0-9-]+)/i);
  return stock ? stock[1] : null;
}

function extractImageUrls(html) {
  const candidates = [];
  const attrPattern = /\b(?:src|data-src|data-lazy|data-original)=["']([^"']+)["']/gi;
  const srcsetPattern = /\bsrcset=["']([^"']+)["']/gi;
  const escapedPattern = /https?:\\?\/\\?\/[^"'\s<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi;

  let match;
  while ((match = attrPattern.exec(html))) candidates.push(match[1]);
  while ((match = srcsetPattern.exec(html))) {
    match[1].split(",").forEach((part) => candidates.push(part.trim().split(/\s+/)[0]));
  }
  while ((match = escapedPattern.exec(html))) {
    candidates.push(match[0].replaceAll("\\/", "/"));
  }

  return unique(
    candidates
      .map(absoluteUrl)
      .filter((url) => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url || ""))
      .filter((url) => !/logo|favicon|placeholder|loading|sprite/i.test(url || "")),
  );
}

async function crawlIndex() {
  const queue = START_PATHS.map((path) => absoluteUrl(path));
  const seen = new Set();
  const details = [];

  while (queue.length && seen.size < MAX_PAGES) {
    const url = queue.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const html = await fetchHtml(url);
    details.push(...extractDetailUrls(html));
    for (const next of extractPaginationUrls(html)) {
      if (!seen.has(next) && queue.length < MAX_PAGES) queue.push(next);
    }
  }

  return unique(details);
}

async function inspectDetail(url) {
  const html = await fetchHtml(url);
  const text = stripTags(html);
  const title = text.match(/\b(19|20)\d{2}\s+[A-Za-z]+\s+[A-Za-z0-9 -]+/)?.[0] || null;

  return {
    detailUrl: url,
    title,
    vin: extractVin(text),
    stock: extractStock(text),
    photoCount: extractImageUrls(html).length,
    photoUrls: extractImageUrls(html).slice(0, 5),
  };
}

async function main() {
  const detailUrls = (await crawlIndex()).slice(0, MAX_DETAILS);
  const vehicles = [];

  for (const url of detailUrls) {
    vehicles.push(await inspectDetail(url));
  }

  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        detailUrlsFound: detailUrls.length,
        inspected: vehicles.length,
        vehicles,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
