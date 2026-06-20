"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Site = { id: string; name: string; logoUrl: string; brandColor: string; heroHeadline: string; footerLinks: string };
type FooterLink = { label: string; href: string };

const F = "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

export default function BrandingEditor({ site }: { site: Site }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(site.logoUrl || "");
  const [brandColor, setBrandColor] = useState(site.brandColor || "#16d6a5");
  const [heroHeadline, setHeroHeadline] = useState(site.heroHeadline || "");
  const [links, setLinks] = useState<FooterLink[]>(() => {
    try { const a = JSON.parse(site.footerLinks || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");

  async function upload(file: File, set: (url: string) => void) {
    setUploading(true); setNote("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("label", `${site.name} branding`);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setUploading(false);
    if (d.url) set(d.url); else setNote(d.error || "Upload failed");
  }

  function setLink(i: number, k: keyof FooterLink, val: string) {
    setLinks((cur) => cur.map((l, idx) => (idx === i ? { ...l, [k]: val } : l)));
  }
  function addLink() { setLinks((cur) => [...cur, { label: "", href: "" }]); }
  function removeLink(i: number) { setLinks((cur) => cur.filter((_, idx) => idx !== i)); }

  async function save() {
    setBusy(true); setNote("");
    const r = await fetch("/api/sites", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "branding", id: site.id, logoUrl, brandColor, heroHeadline, footerLinks: links.filter((l) => l.label && l.href) }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.error) setNote(d.error); else { setNote("Saved — live on your site."); router.refresh(); }
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Logo</label>
          <div className="flex items-center gap-3 mt-1">
            {logoUrl ? <img src={logoUrl} alt="logo" className="h-10 w-auto rounded bg-white/5 border border-[var(--border)] p-1" /> : <div className="h-10 w-10 rounded bg-[var(--panel2)] border border-[var(--border)] grid place-items-center text-xs text-[var(--muted)]">none</div>}
            <label className="btn btn-ghost text-xs !py-1.5 cursor-pointer">
              {uploading ? "Uploading…" : "Upload logo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], setLogoUrl)} />
            </label>
          </div>
          <input className={F} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="or paste an image URL" />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Brand color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-12 rounded bg-transparent border border-[var(--border)]" />
            <input className={F + " !mt-0 font-mono"} value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#16d6a5" />
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1">Buttons, links and accents across your white-label site.</p>
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Hero headline</label>
        <input className={F} value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder="Trusted Medicare help from a local agent" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Your custom footer links</label>
          <button type="button" onClick={addLink} className="btn btn-ghost text-xs !py-1">+ Add link</button>
        </div>
        <p className="text-[11px] text-[var(--muted)] mb-2">Your own links for your marketing site (your About, socials, disclosures). Not required on the consumer funnel.</p>
        <div className="space-y-2">
          {links.length === 0 && <p className="text-xs text-[var(--muted)]">No custom links yet.</p>}
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={F + " !mt-0"} value={l.label} onChange={(e) => setLink(i, "label", e.target.value)} placeholder="Label" />
              <input className={F + " !mt-0"} value={l.href} onChange={(e) => setLink(i, "href", e.target.value)} placeholder="https://…" />
              <button type="button" onClick={() => removeLink(i)} className="btn btn-ghost text-xs !py-1.5 text-[var(--danger)]">✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy || uploading} className="btn btn-brand text-sm">{busy ? "Saving…" : "Save branding"}</button>
        {note && <span className="text-xs text-[var(--muted)]">{note}</span>}
      </div>
    </div>
  );
}
