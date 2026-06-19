import Link from "next/link";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";

const NAV = [
  ["Medicare", "/medicare"],
  ["Supplements", "/medigap"],
  ["Housing", "/senior-housing"],
  ["Care", "/senior-care"],
  ["For Agents", "/agents"],
  ["Advertise", "/advertise"],
];

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gradient">medigap.plus</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted)]">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-[var(--text)]">{label}</Link>
          ))}
        </nav>
        <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-sm">📞 {TOLLFREE}</a>
      </div>
    </header>
  );
}
