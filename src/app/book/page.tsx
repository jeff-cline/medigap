import type { Metadata } from "next";
import CalendlyEmbed from "@/components/CalendlyEmbed";
import Logo from "@/components/agetech/Logo";
import { FOUNDER } from "@/lib/jv-constants";
import "../agetech/agetech.css";

export const metadata: Metadata = {
  title: "Book a call with Jeff Cline — R0cketShip",
  description: "Grab time directly with R0cketShip founder Jeff Cline to start the conversation.",
};

export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ name?: string; email?: string; thanks?: string }> }) {
  const sp = await searchParams;
  const fromForm = sp.thanks === "1";
  const firstName = (sp.name || "").trim().split(/\s+/)[0];
  return (
    <div className="ag-root min-h-screen">
      <header className="border-b border-[var(--ag-border)]">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <a href="/agetech"><Logo /></a>
          <a href="/agetech" className="text-xs text-[var(--ag-muted)] hover:text-[var(--ag-text)]">← Back to the thesis</a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {fromForm && (
          <div className="ag-panel !border-[var(--ag-cyan)]/40 p-4 mb-8 text-center max-w-2xl mx-auto">
            <span className="text-lg">🚀 Thanks for your interest{firstName ? `, ${firstName}` : ""}! You&apos;re in the system — now grab time with Jeff below.</span>
          </div>
        )}
        <div className="text-center mb-8">
          <span className="ag-chip">Founder conversation</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">Book time with <span className="ag-gradient">Jeff Cline</span></h1>
          <p className="text-[var(--ag-muted)] mt-3 max-w-xl mx-auto">
            Pick a slot that works for you. We&apos;ll talk through the R0cketShip thesis, where you fit, and the path forward.
          </p>
        </div>
        <div className="ag-panel p-2 md:p-4">
          <CalendlyEmbed url={FOUNDER.calendly} name={sp.name} email={sp.email} />
        </div>
        <p className="text-center text-xs text-[var(--ag-muted)] mt-4">
          Prefer email? <a href="mailto:invest@r0cketship.com" className="underline">invest@r0cketship.com</a>
        </p>
      </main>
    </div>
  );
}
