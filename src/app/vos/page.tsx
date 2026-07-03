import type { Metadata } from "next";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "VOS", robots: { index: false, follow: false } };

const PDF = "/vos/voter-operating-system.pdf";

export default async function VOS({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const unlocked = (await cookies()).get("vos_ok")?.value === "1";
  const err = (await searchParams).e;

  if (unlocked) {
    return (
      <div style={{ background: "#0a1733", minHeight: "100vh" }} className="text-white">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="font-extrabold tracking-tight text-lg">VOS <span>🚀</span> <span className="text-white/40 text-xs font-normal">Voter Operating System</span></div>
          <div className="flex items-center gap-2">
            <a href="/vos/phd" className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold">Doctoral Thesis →</a>
            <a href={PDF} download className="rounded-full bg-[#b8901f] px-4 py-1.5 text-sm font-bold text-[#1a1206]">⤓ Download</a>
            <a href={PDF} target="_blank" className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold">Open ↗</a>
          </div>
        </div>
        <embed src={`${PDF}#toolbar=1&view=FitH`} type="application/pdf" style={{ width: "100%", height: "calc(100vh - 52px)" }} />
      </div>
    );
  }

  return (
    <div style={{ background: "radial-gradient(1200px 600px at 50% -10%, #16264d, #070f22 60%)", minHeight: "100vh" }} className="text-white grid place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <div className="text-[#9d1c28] tracking-[0.4em] text-sm">★ ★ ★ ★ ★</div>
        <div className="mt-6 text-[11px] uppercase tracking-[0.35em] text-[#b8901f] font-bold">If you know, you know</div>
        <div className="mt-3 text-6xl font-extrabold tracking-tight">VOS <span className="align-middle">🚀</span></div>
        <p className="mt-3 text-white/50 text-sm">Voter Operating System — restricted. Enter the access word to continue.</p>

        <form action="/api/vos/unlock" method="post" className="mt-8">
          <input
            name="password" type="password" autoFocus required
            placeholder="Access word"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white placeholder:text-white/30 outline-none focus:border-[#b8901f]"
          />
          {err && <div className="mt-2 text-sm text-[#ff8a8a]">That&apos;s not it. Try again.</div>}
          <button type="submit" className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#9d1c28] to-[#b8901f] px-4 py-3 font-extrabold text-white">Unlock 🔒</button>
        </form>

        <div className="mt-10 text-[11px] text-white/30">
          <a href="https://r0cketship.com" target="_blank" className="hover:text-white/60">R0cketShip.com 🚀</a> &nbsp;·&nbsp; <a href="https://krystalore.com" target="_blank" className="hover:text-white/60">Krystalore.com</a>
        </div>
      </div>
    </div>
  );
}
