import { EXIT } from "@/lib/exit";

// The site-wide call to action — styled specifically for booking a free consultation to
// multiply your exit. Links to the Calendly booking, opens in a new tab.
export function BookButton({ label = "Book a free consultation", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  const pad = size === "lg" ? "px-8 py-4 text-base" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-sm";
  return (
    <a href="/book"
      className={`inline-flex items-center gap-2 rounded-md font-bold ${pad}`}
      style={{ background: EXIT.colors.orange, color: EXIT.colors.bg }}>
      {label} <span aria-hidden>→</span>
    </a>
  );
}

// Full CTA band — appears near the bottom of every page.
export function CtaBand() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <div className="rounded-2xl border p-8 sm:p-10 text-center" style={{ borderColor: EXIT.colors.border, background: "linear-gradient(180deg, #0b1220, #111c34)" }}>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Free · No pressure · A working session</div>
        <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">Multiply your exit. Increase your multiples.</h2>
        <p className="mt-3 text-slate-300 max-w-xl mx-auto">Book a free consultation. In 30 minutes we'll show you where the value is hiding and how we'd double — even triple — your exit valuation.</p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <BookButton label="Book a free consultation" size="lg" />
          <a href="/how-we-work" className="inline-flex items-center rounded-md border px-6 py-3 text-sm font-bold text-white hover:bg-white/5" style={{ borderColor: EXIT.colors.border }}>See the 3 ways we work</a>
        </div>
        <p className="mt-4 text-xs text-slate-400">Pay to play · We work for equity · We work for backend success — based on the opportunity.</p>
      </div>
    </section>
  );
}
