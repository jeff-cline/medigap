import { db } from "@/lib/db";
import { Card, Stat, Section } from "@/components/ui";
import { num, cst } from "@/lib/format";
import { qrImage, trackingUrl } from "@/lib/qr";
import QrBuilder from "@/components/QrBuilder";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  const since7 = new Date(Date.now() - 7 * 86400000);
  const [codes, totalScans, scans7] = await Promise.all([
    db.qrCode.findMany({ orderBy: [{ scans: "desc" }, { createdAt: "desc" }], take: 300 }),
    db.qrScan.count(),
    db.qrScan.count({ where: { at: { gte: since7 } } }),
  ]);
  const campaigns = codes.filter((c) => c.kind === "campaign");
  const pages = codes.filter((c) => c.kind === "page");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">QR Tracking</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Track scans from anywhere — TV spots, display ads, print, billboards, direct mail. Each site page also gets its
          own QR automatically. Every scan redirects to its destination and is counted here, so you can measure response
          <b className="text-[var(--text)]"> outside the phone call</b>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total scans" value={num(totalScans)} sub="all QR codes" tone="up" />
        <Stat label="Last 7 days" value={num(scans7)} sub="scans" tone="gold" />
        <Stat label="Campaign QRs" value={num(campaigns.length)} sub="TV / display / print…" tone="default" />
        <Stat label="Page QRs" value={num(pages.length)} sub="auto, per page" tone="default" />
      </div>

      <Section title="Create a tracked QR code" desc="Point it anywhere; place it on any channel; watch the scans roll in.">
        <QrBuilder />
      </Section>

      <Section title="Your QR codes" desc="Ranked by scans. Download the PNG or copy the tracking link for any one.">
        {codes.length === 0 ? (
          <Card><p className="text-sm text-[var(--muted)]">No QR codes yet — create one above (page QRs appear here as the site pages get scanned).</p></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {codes.map((c) => {
              const track = trackingUrl(c.code);
              return (
                <Card key={c.id}>
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrImage(track, 120)} alt={c.label} className="h-24 w-24 rounded bg-white p-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{c.label || c.code}</div>
                      <div className="text-[11px] text-[var(--muted)]">{c.kind === "page" ? "page" : c.source} · {num(c.scans)} scan{c.scans === 1 ? "" : "s"}</div>
                      {c.lastScanAt && <div className="text-[10px] text-[var(--muted)]">last {cst(c.lastScanAt)}</div>}
                      <div className="text-[10px] text-[var(--brand2)] truncate mt-1" title={c.targetUrl}>→ {c.targetUrl.replace(/^https?:\/\//, "")}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a href={qrImage(track, 600)} download={`qr-${c.code}.png`} target="_blank" className="btn btn-ghost text-[11px] !py-1">⬇ PNG</a>
                    <span className="text-[10px] text-[var(--muted)] self-center truncate">{track.replace("https://", "")}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
