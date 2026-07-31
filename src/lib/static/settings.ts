import { db } from "@/lib/db";

const KEY = "staticHealthFallbackNumber";

export async function getHealthFallbackNumber(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  return row?.value ?? "";
}

export async function setHealthFallbackNumber(v: string): Promise<void> {
  await db.setting.upsert({ where: { key: KEY }, update: { value: v.trim() }, create: { key: KEY, value: v.trim() } });
}
