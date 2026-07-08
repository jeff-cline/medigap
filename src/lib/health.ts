// healthinsuranceapplication.com — brand, application taxonomy, states, and the external-link rules.
export const HIA = {
  brand: "Private Health Insurance",
  domain: "healthinsuranceapplication.com",
  tel: "18006334427",
  telDisplay: "1-800-MEDIGAP",
  colors: { navy: "#0b2b5c", blue: "#1457e6", blue2: "#2f6fed", green: "#0f9d58", ink: "#111827", muted: "#5b6b86", soft: "#f4f7fc", border: "#e3e9f2", white: "#ffffff" },
  disclaimer: "This independent repository links to publicly available health insurance application resources. We are not the insurance carrier. For official plan details, contact the carrier directly.",
} as const;

// Each application "type" expands into a full record per carrier (title, summary, form/product type, keywords).
export const APP_TYPES: Record<string, { label: string; form_type: string; product_type: string; desc: (c: string) => string; keywords: (c: string) => string[] }> = {
  individual: { label: "Individual Health Insurance Application", form_type: "Application", product_type: "Individual & Family", desc: (c) => `The individual health insurance application form used to apply for private medical insurance coverage from ${c}. Covers applicant details, coverage selection, and enrollment.`, keywords: (c) => [`${c} individual health insurance application`, `${c} application pdf`, `apply for ${c} health insurance`] },
  family: { label: "Family Health Insurance Application", form_type: "Application", product_type: "Individual & Family", desc: (c) => `The family health insurance application for enrolling a household in a private medical insurance plan through ${c}.`, keywords: (c) => [`${c} family health insurance application`, `${c} family plan enrollment`] },
  "small-group": { label: "Small Group Health Insurance Application", form_type: "Application", product_type: "Employer Group", desc: (c) => `The small group (employer) health insurance application used by businesses to offer ${c} medical coverage to employees.`, keywords: (c) => [`${c} small group application`, `${c} employer health insurance application`] },
  "medicare-supplement": { label: "Medicare Supplement (Medigap) Application", form_type: "Application", product_type: "Medicare Supplement", desc: (c) => `The Medicare supplement (Medigap) application for ${c}. Medigap plans help cover costs Original Medicare leaves behind.`, keywords: (c) => [`${c} medicare supplement application pdf`, `${c} medigap application`] },
  "medicare-advantage": { label: "Medicare Advantage Enrollment Application", form_type: "Enrollment", product_type: "Medicare Advantage", desc: (c) => `The Medicare Advantage enrollment application for ${c} Part C plans.`, keywords: (c) => [`${c} medicare advantage enrollment`, `${c} part c application`] },
  broker: { label: "Broker Appointment Application", form_type: "Broker", product_type: "Agent/Broker", desc: (c) => `The broker/agent appointment application to become an appointed producer with ${c}.`, keywords: (c) => [`${c} broker appointment application`, `${c} agent appointment pdf`] },
  provider: { label: "Provider Enrollment Application", form_type: "Provider", product_type: "Provider Network", desc: (c) => `The provider enrollment/credentialing application to join the ${c} network.`, keywords: (c) => [`${c} provider enrollment application`, `${c} credentialing form`] },
  "member-change": { label: "Member Change Form", form_type: "Member", product_type: "Member Services", desc: (c) => `The member change form for updating information on an existing ${c} health plan.`, keywords: (c) => [`${c} member change form`, `${c} update coverage form`] },
  enrollment: { label: "Health Plan Enrollment Form", form_type: "Enrollment", product_type: "Enrollment", desc: (c) => `The health plan enrollment form used to enroll in a ${c} medical plan.`, keywords: (c) => [`${c} enrollment form`, `${c} health plan enrollment pdf`] },
};

export const STATES: { name: string; abbr: string }[] = [
  ["Alabama","AL"],["Alaska","AK"],["Arizona","AZ"],["Arkansas","AR"],["California","CA"],["Colorado","CO"],["Connecticut","CT"],["Delaware","DE"],["Florida","FL"],["Georgia","GA"],["Hawaii","HI"],["Idaho","ID"],["Illinois","IL"],["Indiana","IN"],["Iowa","IA"],["Kansas","KS"],["Kentucky","KY"],["Louisiana","LA"],["Maine","ME"],["Maryland","MD"],["Massachusetts","MA"],["Michigan","MI"],["Minnesota","MN"],["Mississippi","MS"],["Missouri","MO"],["Montana","MT"],["Nebraska","NE"],["Nevada","NV"],["New Hampshire","NH"],["New Jersey","NJ"],["New Mexico","NM"],["New York","NY"],["North Carolina","NC"],["North Dakota","ND"],["Ohio","OH"],["Oklahoma","OK"],["Oregon","OR"],["Pennsylvania","PA"],["Rhode Island","RI"],["South Carolina","SC"],["South Dakota","SD"],["Tennessee","TN"],["Texas","TX"],["Utah","UT"],["Vermont","VT"],["Virginia","VA"],["Washington","WA"],["West Virginia","WV"],["Wisconsin","WI"],["Wyoming","WY"],
].map(([name, abbr]) => ({ name, abbr }));

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// External-link rules: MEDIGAP → 1-800-medigap.com, supplement → medigap.plus, policy → policystore.com,
// "private health insurance"/"health insurance" → homepage. First occurrence of each, to avoid stuffing.
export function linkify(text: string): string {
  let out = text;
  const wrap = (href: string) => (m: string) => `<a href="${href}">${m}</a>`;
  out = out.replace(/(^|[^-])\bMEDIGAP\b/, `$1<a href="https://1-800-medigap.com">MEDIGAP</a>`);
  out = out.replace(/\bsupplements?\b/i, wrap("https://medigap.plus"));
  out = out.replace(/\bpolic(?:y|ies)\b/i, wrap("https://policystore.com"));
  out = out.replace(/\bprivate health insurance\b/i, wrap("/"));
  out = out.replace(/\bhealth insurance\b/i, wrap("/"));
  return out;
}
