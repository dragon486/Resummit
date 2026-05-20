import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractMeta(html: string, property: string): string | null {
  // og:xxx  /  name="xxx"  /  itemprop="xxx"
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+itemprop=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractTitle(html: string): string | null {
  const og = extractMeta(html, "og:title") || extractMeta(html, "twitter:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? null;
}

/** Try to parse a human-readable date from whatever string we find */
function parseHumanDate(raw: string): string | null {
  if (!raw) return null;

  // ISO  2024-06-15 / 2024-06
  const isoM = raw.match(/(\d{4})-(\d{2})(?:-\d{2})?/);
  if (isoM) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[parseInt(isoM[2], 10) - 1];
    return month ? `${month} ${isoM[1]}` : isoM[1];
  }

  // "June 2024" / "Jun 2024"
  const longM = raw.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i);
  if (longM) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const abbr = months.find((m) => longM[1].toLowerCase().startsWith(m.toLowerCase()));
    return abbr ? `${abbr} ${longM[2]}` : `${longM[1]} ${longM[2]}`;
  }

  // just a year
  const yearM = raw.match(/\b(20\d{2})\b/);
  if (yearM) return yearM[1];

  return null;
}

/** Credly badge public API */
async function scrapeCredy(url: string) {
  // Extract badge slug from URL like credly.com/badges/abc-123 or /earn/...
  const slugM = url.match(/credly\.com\/badges\/([\w-]+)/i);
  if (!slugM) return null;
  try {
    const api = `https://api.credly.com/v1/obi/v2/badges/${slugM[1]}`;
    const res = await fetch(api, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json();
    const badge = json?.badge ?? json;
    const title = badge?.name ?? badge?.["@graph"]?.[0]?.name ?? null;
    const issuedOn = badge?.issued_at ?? badge?.issuedOn ?? null;
    const issuer = badge?.issuer?.name ?? badge?.issuer?.["name"] ?? null;
    return {
      title: title ? String(title) : null,
      date: parseHumanDate(issuedOn ?? ""),
      issuer: issuer ? String(issuer) : null,
    };
  } catch { return null; }
}

/** Generic OG/meta scraper */
async function scrapeGeneric(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Sclade/1.0; +https://sclade.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(7000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();

    const title = extractTitle(html);
    const dateStr =
      extractMeta(html, "article:published_time") ??
      extractMeta(html, "og:updated_time") ??
      extractMeta(html, "datePublished") ??
      extractMeta(html, "date") ??
      null;
    const issuer =
      extractMeta(html, "og:site_name") ??
      extractMeta(html, "publisher") ??
      null;

    return {
      title: title ?? null,
      date: parseHumanDate(dateStr ?? ""),
      issuer: issuer ?? null,
    };
  } catch { return null; }
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Normalise URL
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;

    let result: { title: string | null; date: string | null; issuer: string | null } | null = null;

    // Try specialised scrapers first
    if (/credly\.com/i.test(fullUrl)) {
      result = await scrapeCredy(fullUrl);
    }

    // Always fall back to generic OG scraper
    if (!result || (!result.title && !result.date)) {
      const generic = await scrapeGeneric(fullUrl);
      result = {
        title: result?.title ?? generic?.title ?? null,
        date: result?.date ?? generic?.date ?? null,
        issuer: result?.issuer ?? generic?.issuer ?? null,
      };
    }

    if (!result) {
      return NextResponse.json({ error: "Could not extract metadata" }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[fetch-credential] ERROR:", err);
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 500 });
  }
}
