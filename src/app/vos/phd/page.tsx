import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "VOS · Doctoral Thesis", robots: { index: false, follow: false } };

const PDF = "/vos/vos-phd-thesis.pdf";

export default async function VosPhd() {
  const unlocked = (await cookies()).get("vos_ok")?.value === "1";
  if (!unlocked) redirect("/vos");

  return (
    <div style={{ background: "#0a1733", minHeight: "100vh" }} className="text-white">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="font-extrabold tracking-tight text-lg">VOS <span>🚀</span> <span className="text-white/40 text-xs font-normal">Doctoral Thesis</span></div>
        <div className="flex items-center gap-2">
          <a href="/vos" className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold">← Proposal</a>
          <a href={PDF} download className="rounded-full bg-[#b8901f] px-4 py-1.5 text-sm font-bold text-[#1a1206]">⤓ Download</a>
          <a href={PDF} target="_blank" className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold">Open ↗</a>
        </div>
      </div>
      <embed src={`${PDF}#toolbar=1&view=FitH`} type="application/pdf" style={{ width: "100%", height: "calc(100vh - 52px)" }} />
    </div>
  );
}
