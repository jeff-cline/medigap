export const dynamic = "force-static";

// robots.txt for equity.direct. The whole point of the site is the 100 keyword
// pages, so everything public is open to crawling — including the AI crawlers,
// deliberately. Answer-engine visibility is the other half of why those FAQ
// blocks exist.
//
// Only the private surfaces are disallowed: the partner portal and the API.
export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /partners/",
    "Disallow: /api/",
    "",
    "# Answer engines are welcome — the FAQ blocks are written to be quoted.",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    "Sitemap: https://equity.direct/sitemap.xml",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
