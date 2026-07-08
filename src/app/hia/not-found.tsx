import { HIA } from "@/lib/health";
import HiaShell from "@/components/hia/HiaShell";

const C = HIA.colors;

export default function NotFound() {
  const links: [string, string][] = [
    ["Health Insurance Companies", "/health-insurance-companies"],
    ["Apply by State", "/apply"],
    ["Insurance Quotes", "/insurance-quotes"],
    ["Health Insurance Plans", "/health-insurance-plans"],
    ["Health Savings Account (HSA)", "/health-savings-account"],
    ["Frequently Asked Questions", "/faq"],
  ];
  return (
    <HiaShell crumbs={[{ name: "Private Health Insurance", href: "/" }, { name: "Not found" }]}>
      <h1 className="text-3xl font-black" style={{ color: C.navy }}>We couldn&apos;t find that page</h1>
      <p className="mt-3" style={{ color: C.ink }}>
        That page doesn&apos;t exist here. Carrier pages live at <code>/private/&lt;company&gt;</code> (e.g. <a href="/private/aetna" style={{ color: C.blue }}>/private/aetna</a>), and states live at <code>/apply/&lt;state&gt;</code> (e.g. <a href="/apply/new-york" style={{ color: C.blue }}>/apply/new-york</a>). Try one of these:
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {links.map(([l, h]) => <a key={h} href={h} className="rounded-lg border px-4 py-3 font-semibold hover:shadow-sm" style={{ borderColor: C.border, color: C.navy }}>{l} →</a>)}
      </div>
      <p className="mt-6 text-sm">Or <a href="/" style={{ color: C.blue }}>return to the Private Health Insurance home</a>, or <a href={`tel:${HIA.tel}`} style={{ color: C.green }}>call {HIA.telDisplay}</a>.</p>
    </HiaShell>
  );
}
