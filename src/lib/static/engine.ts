import { db } from "@/lib/db";

export type Engine = "fluid" | "static";
const KEY = "activeEngine";

export async function getActiveEngine(): Promise<Engine> {
  const row = await db.setting.findUnique({ where: { key: KEY } }).catch(() => null);
  return row?.value === "static" ? "static" : "fluid";
}

export async function setActiveEngine(e: Engine): Promise<void> {
  const value = e === "static" ? "static" : "fluid";
  await db.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
}
