import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createImageTask, runwayKey, SOCIAL_FORMATS } from "@/lib/runway";
import { aiReply } from "@/lib/voice";

// God tool: take a freeform prompt → deep-research a broadcast-grade creative concept
// (NOT a literal transcript of the prompt) → kick off a native render for Facebook,
// Instagram and TV/digital. Returns the brief + one image task per format; the client
// then advances each format image→video via /api/runway/advance.

type Brief = { headline: string; subhead: string; concept: string };

async function deepResearchBrief(prompt: string): Promise<Brief | null> {
  const system = `You are an award-winning senior-market (Medicare / 65+) direct-response creative director and researcher.
Take the user's idea and do the THINKING they didn't: research the audience pain, the offer, the emotional hook, and what actually converts older Americans. Then design a single BROADCAST-GRADE visual concept — cinematic, photoreal, NOT a literal re-statement of the prompt. Go beyond the script.
Return ONLY compact JSON: {"headline": "...", "subhead": "...", "concept": "..."}
- headline: <= 7 words, bold on-screen ad headline.
- subhead: <= 12 words, supporting line / CTA.
- concept: 2-4 sentences describing the exact scene to render — subjects (warm, real seniors), setting, lighting, mood, color palette, camera framing with clear negative space for the headline, and the motion the video should have. Make it vivid and directable.`;
  const reply = await aiReply(
    [{ role: "system", content: system }, { role: "user", content: prompt.slice(0, 1500) }],
    { maxTokens: 700, temperature: 0.8, timeoutMs: 30000 },
  );
  if (!reply) return null;
  try {
    const m = reply.match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : reply);
    if (j && (j.concept || j.headline)) {
      return { headline: String(j.headline || "").slice(0, 80), subhead: String(j.subhead || "").slice(0, 140), concept: String(j.concept || "").slice(0, 700) };
    }
  } catch {}
  return null;
}

function orientation(ratio: string): string {
  if (ratio === "720:1280") return "vertical 9:16 composition";
  if (ratio === "1280:720") return "wide 16:9 cinematic composition";
  return "square 1:1 composition";
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  if (!(await runwayKey())) return NextResponse.json({ ok: false, error: "Connect RunwayML on Integrations first." }, { status: 200 });

  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt || !String(prompt).trim()) return NextResponse.json({ error: "Enter a prompt." }, { status: 400 });

  // 1) Deep research → creative brief (falls back to the raw prompt if no AI provider).
  const researched = await deepResearchBrief(String(prompt));
  const brief: Brief = researched || { headline: "", subhead: "", concept: String(prompt) };
  const usedResearch = !!researched;

  // 2) One native image render per platform.
  const formats: { key: string; label: string; ratio: string; note: string; imageTask: string; promptText: string; error?: string }[] = [];
  for (const f of SOCIAL_FORMATS) {
    const headlinePart = brief.headline ? ` Leave clean negative space for the on-screen headline "${brief.headline}"${brief.subhead ? ` and subtext "${brief.subhead}"` : ""}.` : "";
    const promptText = `${brief.concept} ${orientation(f.ratio)}.${headlinePart} Photoreal, broadcast-grade, cinematic lighting, high detail, social-media advertisement.`;
    const img = await createImageTask(promptText, f.ratio);
    const imgId = (img.data as { id?: string })?.id || "";
    formats.push({ key: f.key, label: f.label, ratio: f.ratio, note: f.note, imageTask: imgId, promptText, error: imgId ? undefined : (img.error || "image task failed") });
  }

  return NextResponse.json({ ok: true, usedResearch, brief, formats });
}
