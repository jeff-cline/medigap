// The Rakuten Advertising category taxonomy for el.ag. Each category → subcategories.
// `tier` = commission potential (highlights the high-value verticals). Every node is a page.
export type Sub = { slug: string; name: string };
export type Cat = { slug: string; name: string; tier: 1 | 2 | 3 | 4; icon: string; subs: Sub[] };

const S = (name: string): Sub => ({ slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name });

export const TAXONOMY: Cat[] = [
  { slug: "insurance", name: "Insurance", tier: 4, icon: "🛡️", subs: ["Auto Insurance","Homeowners Insurance","Renters Insurance","Medicare","Medigap","Medicare Advantage","Life Insurance","Final Expense","Dental Insurance","Vision Insurance","Travel Insurance","Pet Insurance","Commercial Insurance"].map(S) },
  { slug: "financial-services", name: "Financial Services", tier: 4, icon: "💳", subs: ["Credit Cards","Banking","Loans","Personal Loans","Mortgage","Refinance","Investing","Brokerage","Tax Services","Accounting","Credit Repair","Identity Protection"].map(S) },
  { slug: "travel", name: "Travel", tier: 3, icon: "✈️", subs: ["Airlines","Hotels","Resorts","Vacation Rentals","Cruises","Rental Cars","Travel Packages","Activities","Theme Parks","Luggage"].map(S) },
  { slug: "home", name: "Home", tier: 3, icon: "🏡", subs: ["Furniture","Home Decor","Bedding","Mattresses","Kitchen","Appliances","Smart Home","Home Improvement","Tools","Garden","Pet Supplies"].map(S) },
  { slug: "telecommunications", name: "Telecommunications", tier: 3, icon: "📶", subs: ["Internet","Cable","Mobile Phones","Wireless Plans","VoIP","Business Internet"].map(S) },
  { slug: "software-saas", name: "Software & SaaS", tier: 3, icon: "🧩", subs: ["Software","SaaS","CRM","Marketing Software","Cybersecurity","Payroll","HR"].map(S) },
  { slug: "health-wellness", name: "Health & Wellness", tier: 2, icon: "💪", subs: ["Vitamins","Supplements","Fitness Equipment","Sporting Goods","Outdoor Recreation"].map(S) },
  { slug: "electronics", name: "Electronics", tier: 2, icon: "💻", subs: ["Computers","Laptops","Tablets","Phones","Wireless","Cameras","Audio","Gaming","Office Equipment"].map(S) },
  { slug: "consumer-retail", name: "Consumer Retail", tier: 3, icon: "🛍️", subs: ["Apparel","Shoes","Jewelry","Luxury Fashion","Handbags","Watches"].map(S) },
  { slug: "beauty", name: "Beauty", tier: 2, icon: "💄", subs: ["Cosmetics","Skin Care","Hair Care","Fragrance"].map(S) },
  { slug: "automotive", name: "Automotive", tier: 2, icon: "🚗", subs: ["New Vehicles","Used Vehicles","Parts","Tires","Accessories","Auto Services"].map(S) },
  { slug: "education", name: "Education", tier: 2, icon: "🎓", subs: ["Online Learning","Universities","Certifications","Professional Training","Coding Bootcamps","Language Learning","Test Prep"].map(S) },
  { slug: "business-b2b", name: "Business & B2B", tier: 2, icon: "🏢", subs: ["Business Banking","Business Insurance","Shipping","Printing","Office Supplies","Communications"].map(S) },
  { slug: "entertainment", name: "Entertainment", tier: 2, icon: "🎬", subs: ["Streaming","Music","Gaming","Ticket Sales","Events","Sports","Subscription Services"].map(S) },
  { slug: "family", name: "Family", tier: 1, icon: "👨‍👩‍👧", subs: ["Baby","Kids","Toys","School Supplies","Parenting"].map(S) },
  { slug: "food", name: "Food", tier: 1, icon: "🍽️", subs: ["Grocery Delivery","Meal Kits","Restaurants","Specialty Foods"].map(S) },
  { slug: "subscriptions", name: "Subscription Services", tier: 1, icon: "📦", subs: ["Subscription Boxes","Membership Programs","Loyalty Programs","Digital Memberships"].map(S) },
];

export const TIER_LABEL: Record<number, string> = { 4: "$$$$ · highest commission", 3: "$$$ · high", 2: "$$ · solid", 1: "$ · volume" };

const CAT_BY_SLUG = new Map(TAXONOMY.map((c) => [c.slug, c]));
const SUB_INDEX = new Map<string, { sub: Sub; cat: Cat }>();
for (const c of TAXONOMY) for (const s of c.subs) SUB_INDEX.set(s.slug, { sub: s, cat: c });

export const getCategory = (slug: string) => CAT_BY_SLUG.get(slug) || null;
export const getSub = (slug: string) => SUB_INDEX.get(slug) || null;
export const allSubs = () => [...SUB_INDEX.values()];
// A slug is a "verticals we phone-monetize too" (toll-free CTA) when it's insurance/financial.
export const isPhoneVertical = (catSlug: string) => catSlug === "insurance" || catSlug === "financial-services";
