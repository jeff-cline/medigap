import path from "path";

// The 4 hanging monitors in the locked-camera spokesperson base (locked-base2, 1280x720),
// left→right = Screen 1..4. Each: overlay origin (x,y), panel size (w,h), and the screen's
// 4-corner quad for perspective corner-pin: p = [TLx,TLy, TRx,TRy, BLx,BLy, BRx,BRy] (relative).
// 3 clean (black/off) monitors in locked-base3 the host does NOT stand in front of, left→right.
// (The center monitor behind the host is unused — he occludes it.)
export const SCREENS = [
  { n: 1, x: 40, y: 158, w: 320, h: 220, p: [0, 0, 320, 24, 0, 220, 320, 200] }, // big left
  { n: 2, x: 392, y: 168, w: 96, h: 184, p: [0, 0, 96, 6, 0, 184, 96, 176] }, // center-left small
  { n: 3, x: 985, y: 175, w: 258, h: 182, p: [0, 8, 258, 0, 0, 170, 258, 182] }, // far right
] as const;

export const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

export type ScreenContent = { type: "black" | "text" | "image" | "video"; text?: string; url?: string };

export function parseScreen(s: string): ScreenContent {
  try { const o = JSON.parse(s || "{}"); return { type: o.type || "black", text: o.text || "", url: o.url || "" }; } catch { return { type: "black" }; }
}

// Recommended upload pixel size per screen (what the user is told to make their image/video).
export const screenSizeLabel = (n: number) => { const s = SCREENS[n - 1]; return `${s.w}×${s.h}`; };

function localOf(url: string) { return path.join(process.cwd(), "public", url.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "")); }

// Build the ffmpeg compose for a spot: base spokesperson video + 4 perspective screens + lower third + QR.
// Returns the input list (in order), the -filter_complex string, and text files to write first.
export function buildCompose(opts: {
  baseLocal: string; qrLocal: string; screens: ScreenContent[]; gDir: string; spotId: string; applauseLocal?: string;
}): { inputs: { path: string; loop: boolean }[]; filter: string; texts: { file: string; content: string }[]; audioFilter: string; mapAudio: string } {
  const inputs: { path: string; loop: boolean }[] = [{ path: opts.baseLocal, loop: false }, { path: opts.qrLocal, loop: false }];
  const texts: { file: string; content: string }[] = [];
  const parts: string[] = [];
  const labels: string[] = [];

  SCREENS.forEach((d, i) => {
    const sc = opts.screens[i] || { type: "black" };
    const persp = `perspective=x0=${d.p[0]}:y0=${d.p[1]}:x1=${d.p[2]}:y1=${d.p[3]}:x2=${d.p[4]}:y2=${d.p[5]}:x3=${d.p[6]}:y3=${d.p[7]}:sense=destination`;
    const lab = `s${i}`;
    if (sc.type === "image" || sc.type === "video") {
      const idx = inputs.length;
      inputs.push({ path: localOf(sc.url || ""), loop: sc.type === "video" });
      parts.push(`[${idx}:v]scale=${d.w}:${d.h}:force_original_aspect_ratio=increase,crop=${d.w}:${d.h},setpts=PTS-STARTPTS,format=rgba,${persp}[${lab}]`);
    } else if (sc.type === "text") {
      const tf = path.join(opts.gDir, `sc${i}_${opts.spotId}.txt`);
      texts.push({ file: tf, content: sc.text || "" });
      parts.push(`color=c=0x06121f:s=${d.w}x${d.h}:d=30,format=rgba,drawbox=x=0:y=0:w=iw:h=ih:color=0x16d6c0@0.9:t=3,drawtext=textfile=${tf}:fontfile=${FONT}:fontcolor=0xEAFBFF:fontsize=22:line_spacing=8:x=(w-text_w)/2:y=(h-text_h)/2,${persp}[${lab}]`);
    } else {
      // black screen with a "SCREEN n" label so the user knows which monitor is which
      const tf = path.join(opts.gDir, `sc${i}_${opts.spotId}.txt`);
      texts.push({ file: tf, content: `SCREEN ${d.n}` });
      parts.push(`color=c=0x050608:s=${d.w}x${d.h}:d=30,format=rgba,drawbox=x=0:y=0:w=iw:h=ih:color=0x16d6c0@0.85:t=3,drawtext=textfile=${tf}:fontfile=${FONT}:fontcolor=0x16d6c0:fontsize=${d.w > 200 ? 30 : 20}:x=(w-text_w)/2:y=(h-text_h)/2,${persp}[${lab}]`);
    }
    labels.push(lab);
  });

  // qr scaled
  parts.push(`[1:v]scale=150:150[qr]`);

  // overlay screens onto base
  let cur = "0:v";
  SCREENS.forEach((d, i) => {
    const out = `o${i}`;
    parts.push(`[${cur}][s${i}]overlay=${d.x}:${d.y}[${out}]`);
    cur = out;
  });

  // lower third (CALL TOLL-FREE above the glowing brand) + disclaimer
  const brandTf = path.join(opts.gDir, `brand_${opts.spotId}.txt`);
  const discTf = path.join(opts.gDir, `disc_${opts.spotId}.txt`);
  texts.push({ file: brandTf, content: "1-800-MEDIGAP" });
  texts.push({ file: discTf, content: "Private informational resource - not affiliated with or endorsed by the U.S. government, Medicare, or any insurer. Calls may route to licensed professionals." });
  const lt =
    `drawbox=x=0:y=558:w=iw:h=162:color=black@0.46:t=fill,` +
    `drawbox=x=0:y=556:w=iw:h=8:color=0xFF8C1A@0.85:t=fill,` +
    `drawbox=x=0:y=558:w=iw:h=4:color=0x16d6c0:t=fill,` +
    `drawtext=text='CALL TOLL-FREE':fontfile=${FONT}:fontcolor=0xFF8C1A:borderw=3:bordercolor=0x16d6c0:fontsize=24:x=(w-text_w)/2:y=576,` +
    `drawtext=textfile=${brandTf}:fontfile=${FONT}:fontcolor=0xFF8C1A:borderw=9:bordercolor=0xFF8C1A:fontsize=60:x=(w-text_w)/2:y=610,` +
    `drawtext=textfile=${brandTf}:fontfile=${FONT}:fontcolor=0x16d6c0:borderw=4:bordercolor=0x16d6c0:fontsize=60:x=(w-text_w)/2:y=610,` +
    `drawtext=textfile=${brandTf}:fontfile=${FONT}:fontcolor=white:fontsize=60:x=(w-text_w)/2:y=610,` +
    `drawtext=textfile=${discTf}:fontfile=${FONT}:fontcolor=white@0.62:fontsize=12:x=(w-text_w)/2:y=705`;
  parts.push(`[${cur}]${lt}[lt]`);

  // QR card pops in for the last 5s
  parts.push(`[lt]drawbox=x=1055:y=372:w=190:h=205:color=white@0.94:t=fill:enable=gte(t\\,21.8),drawtext=text=SCAN:fontfile=${FONT}:fontcolor=0x0b2348:fontsize=18:x=1055+(190-text_w)/2:y=540:enable=gte(t\\,21.8)[cardbg]`);
  parts.push(`[cardbg][qr]overlay=x=1075:y=384:enable=gte(t\\,21.8)[v]`);

  // Applause bed: loud/strong at the open to grab the room, then ducks under the read.
  let audioFilter = "";
  let mapAudio = "0:a";
  if (opts.applauseLocal) {
    const ai = inputs.length;
    inputs.push({ path: opts.applauseLocal, loop: false });
    audioFilter =
      `[${ai}:a]volume='if(lt(t,2),1.0,if(lt(t,3.6),1.0-(t-2)/1.6*0.82,0.18))':eval=frame,afade=t=out:st=9:d=1.2[ap];` +
      `[0:a][ap]amix=inputs=2:duration=first:normalize=0[aout]`;
    mapAudio = "[aout]";
  }

  return { inputs, filter: parts.join(";"), texts, audioFilter, mapAudio };
}
