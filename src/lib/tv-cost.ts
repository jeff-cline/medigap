// Estimated cost rates for producing a TV spot. These are ESTIMATES shown in the god dashboard —
// each provider's real billing depends on your plan. Rates are overridable per integration config
// (key "costPer1kChars" on elevenlabs, "costPerSec" on syncso/runway).
export const TV_RATES = {
  voicePer1kChars: 0.15, // ElevenLabs ~ per 1,000 characters
  lipsyncPerSec: 0.10, // Sync.so ~ per second of output
  lookPerSec: 0.15, // Runway video-to-video ~ per second
} as const;

export type CostBreakdown = {
  chars: number;
  lipsyncSec: number;
  lookSec: number;
  voice: number; // cents
  lipsync: number; // cents
  look: number; // cents
  total: number; // cents
};

export function estimateCost(
  opts: { chars: number; lipsyncSec: number; lookSec: number },
  rates: { voicePer1kChars?: number; lipsyncPerSec?: number; lookPerSec?: number } = {}
): CostBreakdown {
  const vR = rates.voicePer1kChars ?? TV_RATES.voicePer1kChars;
  const lR = rates.lipsyncPerSec ?? TV_RATES.lipsyncPerSec;
  const rR = rates.lookPerSec ?? TV_RATES.lookPerSec;
  const voice = Math.round((opts.chars / 1000) * vR * 100);
  const lipsync = Math.round(opts.lipsyncSec * lR * 100);
  const look = Math.round(opts.lookSec * rR * 100);
  return { chars: opts.chars, lipsyncSec: opts.lipsyncSec, lookSec: opts.lookSec, voice, lipsync, look, total: voice + lipsync + look };
}

export function fmtCents(c: number): string {
  return "$" + (c / 100).toFixed(2);
}
