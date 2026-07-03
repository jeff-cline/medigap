// XM — experientialmarketing.ai keyword architecture. 22 silos, each with 5 supporting pages,
// for deep SEO/AEO coverage of the experiential / brand-activation industry.
export type XmSub = { slug: string; title: string };
export type XmSilo = { slug: string; name: string; blurb: string; img: string; subs: XmSub[] };

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// 5 SEO-varied supporting pages per silo (commercial + informational + AEO intent).
function subsFor(name: string): XmSub[] {
  const patterns = [
    (n: string) => `${n} Agency`,
    (n: string) => `${n} Cost & Pricing`,
    (n: string) => `${n} Ideas`,
    (n: string) => `${n} Examples & Case Studies`,
    (n: string) => `How ${n} Works`,
  ];
  return patterns.map((p) => ({ slug: slugify(p(name)), title: p(name) }));
}

const RAW: [string, string, string][] = [
  // name, blurb, pexels image query
  ["Brand Activations", "Turn brand ideas into live, sharable moments that move product and earn media.", "brand activation event crowd"],
  ["Event Marketing", "End-to-end experiential event strategy, management, and flawless on-site execution.", "marketing event stage lights"],
  ["Mobile Marketing Tours", "Take the brand to the people — multi-market mobile tours that scale nationwide.", "branded tour truck event"],
  ["Glass Box Trucks", "The glass box truck: a rolling, transparent stage that stops traffic in every market.", "glass box truck city"],
  ["Pop-Up Experiences", "Pop-up shops and installations that create scarcity, buzz, and foot traffic.", "pop up shop retail experience"],
  ["Product Sampling", "Put product in the right hands at scale with measurable field sampling programs.", "product sampling event people"],
  ["Trade Show Exhibits", "Booths and exhibits engineered to own the show floor and capture qualified leads.", "trade show exhibit booth"],
  ["Guerrilla Marketing", "High-impact, low-footprint stunts that break through and travel across social.", "guerrilla marketing street stunt"],
  ["Brand Ambassadors", "Vetted, trained brand ambassadors and street teams that represent you flawlessly.", "brand ambassador team event"],
  ["Festival Marketing", "Own the festival: footprints, activations, and moments fans line up for.", "music festival crowd brand"],
  ["Stadium Activations", "Sports and stadium activations that turn fandom into brand affinity.", "stadium sports event crowd"],
  ["Retail Experiences", "In-store and retail experiences that lift conversion at the shelf and beyond.", "retail store experience shoppers"],
  ["Immersive XR Experiences", "AR, VR, and mixed-reality experiences that make the brand unforgettable.", "virtual reality immersive experience"],
  ["Product Launch Events", "Launch moments engineered for reach, press, and first-day demand.", "product launch event reveal"],
  ["Corporate Events", "Conferences, summits, and internal events produced to broadcast quality.", "corporate conference stage audience"],
  ["Influencer Activations", "Creator and influencer activations that fuse trusted voices with live moments.", "influencer creator filming event"],
  ["College Campus Marketing", "Reach Gen-Z where they live — campus tours, sampling, and ambassador programs.", "college campus students event"],
  ["Experiential Technology", "LED, projection mapping, touch, and data capture that make experiences smart.", "led projection mapping technology"],
  ["Experiential Production", "Fabrication, staging, and production that build the impossible on schedule.", "event production fabrication stage build"],
  ["National Tour Management", "Logistics, staffing, and routing to run flawless multi-market national tours.", "national tour logistics map trucks"],
  ["Sponsorship Activation", "Turn sponsorship dollars into activated, measurable brand experiences.", "sponsorship activation event branding"],
  ["Experiential ROI & Measurement", "Prove impact — reach, engagement, and attribution from every activation.", "marketing analytics dashboard data"],
];

export const XM_SILOS: XmSilo[] = RAW.map(([name, blurb, img]) => ({ slug: slugify(name), name, blurb, img, subs: subsFor(name) }));

const CAT_BY = new Map(XM_SILOS.map((c) => [c.slug, c]));
const SUB_BY = new Map<string, { sub: XmSub; silo: XmSilo }>();
for (const c of XM_SILOS) for (const s of c.subs) SUB_BY.set(s.slug, { sub: s, silo: c });

export const xmSilo = (slug: string) => CAT_BY.get(slug) || null;
export const xmSub = (slug: string) => SUB_BY.get(slug) || null;
export const xmAllUrls = () => [...XM_SILOS.map((c) => c.slug), ...[...SUB_BY.keys()]];
