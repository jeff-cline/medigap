export const dynamic = "force-dynamic";
export function GET() {
  const body = [
    "User-agent: *", "Allow: /", "",
    "# Answer engines welcome (AEO)",
    "User-agent: GPTBot", "Allow: /",
    "User-agent: OAI-SearchBot", "Allow: /",
    "User-agent: ChatGPT-User", "Allow: /",
    "User-agent: PerplexityBot", "Allow: /",
    "User-agent: ClaudeBot", "Allow: /",
    "User-agent: Google-Extended", "Allow: /", "",
    "Sitemap: https://quuik.com/sitemap.xml", "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
