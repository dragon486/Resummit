import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Known Platform Map ───────────────────────────────────────────────────────
// Maps domain patterns → { issuer, canScrapeDate }
const PLATFORM_MAP: Array<{ pattern: RegExp; issuer: string; canScrapeDate: boolean }> = [
  { pattern: /credly\.com/i,           issuer: "Credly",            canScrapeDate: true  },
  { pattern: /coursera\.org/i,         issuer: "Coursera",          canScrapeDate: true  },
  { pattern: /udemy\.com/i,            issuer: "Udemy",             canScrapeDate: false },
  { pattern: /freecodecamp\.org/i,     issuer: "freeCodeCamp",      canScrapeDate: true  },
  { pattern: /skillshop\.google/i,     issuer: "Google",            canScrapeDate: false },
  { pattern: /google\.com/i,           issuer: "Google",            canScrapeDate: false },
  { pattern: /drive\.google\.com/i,    issuer: "Google Drive",      canScrapeDate: false },
  { pattern: /aws\.amazon\.com/i,      issuer: "Amazon Web Services", canScrapeDate: false },
  { pattern: /amazon\.com/i,           issuer: "Amazon Web Services", canScrapeDate: false },
  { pattern: /microsoft\.com/i,        issuer: "Microsoft",         canScrapeDate: false },
  { pattern: /learn\.microsoft\.com/i, issuer: "Microsoft",         canScrapeDate: false },
  { pattern: /linkedin\.com/i,         issuer: "LinkedIn",          canScrapeDate: false },
  { pattern: /infosys\.com/i,          issuer: "Infosys",           canScrapeDate: false },
  { pattern: /springboard\.com/i,      issuer: "Springboard",       canScrapeDate: true  },
  { pattern: /github\.com/i,           issuer: "GitHub",            canScrapeDate: false },
  { pattern: /devpost\.com/i,          issuer: "Devpost",           canScrapeDate: true  },
  { pattern: /hackerrank\.com/i,       issuer: "HackerRank",        canScrapeDate: false },
  { pattern: /leetcode\.com/i,         issuer: "LeetCode",          canScrapeDate: false },
  { pattern: /pluralsight\.com/i,      issuer: "Pluralsight",       canScrapeDate: true  },
  { pattern: /edx\.org/i,              issuer: "edX",               canScrapeDate: true  },
  { pattern: /udacity\.com/i,          issuer: "Udacity",           canScrapeDate: true  },
  { pattern: /datacamp\.com/i,         issuer: "DataCamp",          canScrapeDate: true  },
  { pattern: /alison\.com/i,           issuer: "Alison",            canScrapeDate: true  },
];

function detectPlatform(url: string) {
  for (const p of PLATFORM_MAP) {
    if (p.pattern.test(url)) return p;
  }
  return null;
}

// ─── HTML Meta Helpers ────────────────────────────────────────────────────────

function extractMeta(html: string, ...props: string[]): string | null {
  for (const property of props) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']{1,300})["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']{1,300})["'][^>]+property=["']${property}["']`, "i"),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']{1,300})["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']{1,300})["'][^>]+name=["']${property}["']`, "i"),
      new RegExp(`<meta[^>]+itemprop=["']${property}["'][^>]+content=["']([^"']{1,300})["']`, "i"),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return m[1].trim();
    }
  }
  return null;
}

function extractTitle(html: string): string | null {
  const og = extractMeta(html, "og:title", "twitter:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  return m?.[1]?.trim() ?? null;
}

/** Normalise any date string to "Mon YYYY" or "YYYY" */
function parseHumanDate(raw: string): string | null {
  if (!raw) return null;
  // ISO 2024-06-15 or 2024-06
  const isoM = raw.match(/(\d{4})-(\d{2})(?:-\d{2})?/);
  if (isoM) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[parseInt(isoM[2], 10) - 1];
    return month ? `${month} ${isoM[1]}` : isoM[1];
  }
  // "June 2024" / "Jun 2024"
  const longM = raw.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i);
  if (longM) {
    const ABBRS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const abbr = ABBRS.find((m) => longM[1].toLowerCase().startsWith(m.toLowerCase()));
    return abbr ? `${abbr} ${longM[2]}` : `${longM[1].slice(0, 3)} ${longM[2]}`;
  }
  // bare year
  const yearM = raw.match(/\b(20\d{2})\b/);
  if (yearM) return yearM[1];
  return null;
}

// ─── Platform-specific Scrapers ───────────────────────────────────────────────

/** Credly public badge embed API */
async function fetchCredy(url: string) {
  // Formats: credly.com/badges/{slug}  OR  credly.com/badges/{slug}/public_url
  const m = url.match(/credly\.com\/badges\/([\w-]+)/i);
  if (!m) return null;

  const slug = m[1];

  // Try the embed JSON endpoint — publicly available, no auth
  const endpoints = [
    `https://www.credly.com/badges/${slug}/public_url`,
    `https://www.credly.com/badges/${slug}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "Accept": "text/html,application/json",
          "User-Agent": "Mozilla/5.0 (compatible; Sclade/1.0)",
        },
        signal: AbortSignal.timeout(7000),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("json")) {
        const json = await res.json();
        const b = json?.data ?? json?.badge ?? json;
        return {
          title: b?.badge?.name ?? b?.name ?? null,
          date: parseHumanDate(b?.issued_at ?? b?.issuedOn ?? ""),
          issuer: b?.badge?.issuer?.summary ?? b?.issuer?.name ?? "Credly",
        };
      }
      const html = await res.text();
      const title = extractTitle(html);
      const dateStr = extractMeta(html, "article:published_time", "og:updated_time", "datePublished");
      return {
        title,
        date: parseHumanDate(dateStr ?? ""),
        issuer: extractMeta(html, "og:site_name") ?? "Credly",
      };
    } catch { continue; }
  }
  return null;
}

/** Generic OG scraper for open pages */
async function scrapeOG(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const title = extractTitle(html);
    const dateStr = extractMeta(html,
      "article:published_time", "og:updated_time",
      "datePublished", "date", "DC.date",
    );
    const issuer = extractMeta(html, "og:site_name", "publisher");
    return { title, date: parseHumanDate(dateStr ?? ""), issuer };
  } catch { return null; }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const fullUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    const platform = detectPlatform(fullUrl);

    // ── Google Drive or other auth-gated links ──────────────────────────────
    if (/drive\.google\.com/i.test(fullUrl) || /docs\.google\.com/i.test(fullUrl)) {
      return NextResponse.json({
        title: null,
        date: null,
        issuer: "Google",
        note: "Google Drive links are private — please fill the title and date manually.",
        cannotRead: true,
      });
    }

    let result: { title: string | null; date: string | null; issuer: string | null } | null = null;

    // ── Specialised scrapers ────────────────────────────────────────────────
    if (/credly\.com/i.test(fullUrl)) {
      result = await fetchCredy(fullUrl);
    }

    // ── Generic OG fallback ─────────────────────────────────────────────────
    if (!result || (!result.title && !result.date)) {
      const og = await scrapeOG(fullUrl);
      result = {
        title: result?.title ?? og?.title ?? null,
        date: result?.date ?? og?.date ?? null,
        issuer: result?.issuer ?? og?.issuer ?? platform?.issuer ?? null,
      };
    }

    // Even if we can't scrape date/title, return the detected issuer so the
    // user gets at least partial auto-fill
    if (!result.title && !result.date && !result.issuer) {
      return NextResponse.json({
        title: null,
        date: null,
        issuer: platform?.issuer ?? null,
        note: "Could not extract metadata from this URL. Please fill manually.",
        cannotRead: true,
      });
    }

    return NextResponse.json({
      title: result.title,
      date: result.date,
      issuer: result.issuer ?? platform?.issuer ?? null,
      cannotRead: false,
    });
  } catch (err: any) {
    console.error("[fetch-credential] ERROR:", err);
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 500 });
  }
}
