import { headers } from "next/headers";
import { db } from "@/lib/db";

// Renders active tracking pixels (global + the current site's) on public marketing pages only.
const ADMIN_PREFIXES = ["/dashboard", "/login", "/change-password", "/agent", "/advertiser", "/investor"];

// Turn a stored pixel snippet into executable <script> elements (innerHTML scripts don't run).
function renderSnippet(code: string, keyBase: string) {
  const blocks = [...code.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
  if (blocks.length === 0) {
    // bare JS (no tags) → inline script
    return <script key={keyBase} dangerouslySetInnerHTML={{ __html: code }} />;
  }
  return blocks.map((m, i) => {
    const src = m[1].match(/src=["']([^"']+)["']/);
    if (src) return <script key={`${keyBase}-${i}`} src={src[1]} async />;
    return <script key={`${keyBase}-${i}`} dangerouslySetInnerHTML={{ __html: m[2] }} />;
  });
}

export default async function TrackingPixels() {
  const h = await headers();
  const path = h.get("x-pathname") || "";
  if (ADMIN_PREFIXES.some((p) => path === p || path.startsWith(p + "/")) || path.startsWith("/dashboard")) return null;

  const host = (h.get("host") || "").toLowerCase();
  const site = host ? await db.site.findUnique({ where: { hostname: host } }).catch(() => null) : null;
  const pixels = await db.pixel.findMany({ where: { active: true, OR: [{ siteId: null }, ...(site ? [{ siteId: site.id }] : [])] } }).catch(() => []);
  if (!pixels.length) return null;
  return <>{pixels.map((p) => renderSnippet(p.code, p.id))}</>;
}
