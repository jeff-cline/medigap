import { slugify } from "./tree";

export type SeedNode = { word: string; contextPrompt?: string; children?: SeedNode[] };

const DOCTOR_911 =
  "If this is a medical emergency, hang up and dial 911. We are only a concierge voice engine.";

export const STATIC_SEED: SeedNode[] = [
  { word: "Precision Medicine" },
  { word: "Concierge Medicine" },
  { word: "Private Health Insurance" },
  { word: "Weight Loss" },
  { word: "Peptides" },
  { word: "Life Insurance" },
  {
    word: "Doctor",
    contextPrompt: DOCTOR_911,
    children: [
      { word: "Plastic Surgery" }, { word: "Chiropractor" }, { word: "Allergy" },
      { word: "Sexual Wellness" }, { word: "Weight Loss" }, { word: "General" },
    ],
  },
  {
    word: "Home Services", // last / default
    children: [
      { word: "Roofing" }, { word: "Plumbing" }, { word: "Air-Conditioning" }, { word: "Electrical" },
      { word: "Lawn" }, { word: "Gardening" }, { word: "Pool Maintenance" }, { word: "Handyman" },
    ],
  },
];

// Accepts any object exposing `.staticMoneyWord` (the plain PrismaClient from prisma/seed.ts or the extended db).
export async function seedStaticMoneyWords(prisma: { staticMoneyWord: any }): Promise<void> {
  const existing = await prisma.staticMoneyWord.count();
  if (existing > 0) return; // idempotent — never clobber real config

  const usedSlugs = new Set<string>();
  const slugFor = (word: string) => {
    const root = slugify(word) || "word";
    let s = root;
    for (let i = 2; usedSlugs.has(s); i++) s = `${root}-${i}`;
    usedSlugs.add(s);
    return s;
  };

  const insert = async (node: SeedNode, parentId: string | null, sortOrder: number) => {
    const row = await prisma.staticMoneyWord.create({
      data: {
        word: node.word, slug: slugFor(node.word), parentId, sortOrder,
        contextPrompt: node.contextPrompt ?? "",
      },
    });
    let i = 0;
    for (const child of node.children ?? []) await insert(child, row.id, i++);
  };

  let i = 0;
  for (const top of STATIC_SEED) await insert(top, null, i++);
}
