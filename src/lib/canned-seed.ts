export const CANNED_SEED: { label: string; keywords: string[]; reply: string; sortOrder: number }[] = [
  { label: "Callback request", keywords: ["call me", "please call", "give me a call", "call back"], reply: "Thanks! A licensed Medigap specialist will call you shortly. You can also reach us at 1-800-MEDIGAP (1-800-633-4427).", sortOrder: 1 },
  { label: "Flex/food card", keywords: ["food card", "spending card", "flex card", "grocery"], reply: "For help with your benefits card, a specialist will reach out. Reply with your name and ZIP so we can pull up your plan.", sortOrder: 2 },
  { label: "Agent handoff", keywords: ["agent", "human", "representative", "someone", "talk to"], reply: "You've got it — a real specialist will contact you right away. If it's urgent, call 1-800-633-4427.", sortOrder: 3 },
  { label: "STOP already handled", keywords: [], reply: "", sortOrder: 99 },
];
export async function seedCanned(prisma: { cannedResponse: any }): Promise<void> {
  const n = await prisma.cannedResponse.count();
  if (n > 0) return;
  for (const c of CANNED_SEED.filter((x) => x.keywords.length)) {
    await prisma.cannedResponse.create({ data: { label: c.label, keywords: JSON.stringify(c.keywords.map((k) => k.toLowerCase())), reply: c.reply, sortOrder: c.sortOrder } });
  }
}
