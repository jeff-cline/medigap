import { EXIT } from "@/lib/exit";

// Calendly inline embed, themed to the site (dark background, orange primary) via Calendly's
// color params so the booking widget matches the brand.
export default function BookEmbed({ height = 720 }: { height?: number }) {
  const url = new URL(EXIT.calendly);
  url.searchParams.set("hide_gdpr_banner", "1");
  url.searchParams.set("background_color", EXIT.colors.panel.replace("#", "")); // 0b1220
  url.searchParams.set("text_color", EXIT.colors.ink.replace("#", "")); // e2e8f0
  url.searchParams.set("primary_color", EXIT.colors.orange.replace("#", "")); // f97316
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
      <iframe src={url.toString()} title="Book a free consultation" width="100%" height={height} frameBorder="0" style={{ minWidth: "280px" }} />
    </div>
  );
}
