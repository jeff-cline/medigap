import PublicHeader from "@/components/PublicHeader";
import SiteFooter from "@/components/SiteFooter";
import OnboardForm from "@/components/OnboardForm";

export const metadata = { title: "Get your own AI lead-gen site — medigap.plus partners", description: "Tell us about your business and we'll build you a custom senior-insurance lead-gen site with its own CRM. Overflow leads earn you affiliate revenue share." };

export default function OnboardPage() {
  return (
    <>
      <PublicHeader />
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 brand-gradient opacity-[0.06]" />
        <div className="mx-auto max-w-3xl px-6 py-14 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"><span className="live-dot text-[var(--brand)]">●</span> Partner onboarding</div>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold">Your own <span className="text-gradient">AI lead-gen machine</span></h1>
          <p className="mt-4 text-lg text-[var(--muted)]">Answer a few questions and we&apos;ll deep-research your market and build you a custom site with its own CRM, call routing, money words, and AI voice agent. Keep the leads in your ZIP codes — earn revenue share on the rest.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <OnboardForm />
      </section>
      <SiteFooter />
    </>
  );
}
