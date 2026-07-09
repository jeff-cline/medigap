// el.ag/go — iPhone-optimized web terminal for the Core.
// Named, persistent tmux "projects" + idle detection ("April, N agents finished").
// Auth: password -> signed session cookie. Runs on :3030, proxied at el.ag/go by nginx.
const express = require("express");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const pty = require("node-pty");
const { WebSocketServer } = require("ws");
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require("@simplewebauthn/server");

const PORT = process.env.GOTERM_PORT || 3041;
const DIR = __dirname;
const CFG = path.join(DIR, "config.json");     // { passHash, secret }
const PROJ = path.join(DIR, "projects.json");  // [{ id, name }]

// --- config (password hash + signing secret) ---
if (!fs.existsSync(CFG)) {
  const secret = crypto.randomBytes(32).toString("hex");
  const passHash = crypto.createHash("sha256").update("TEMP!234").digest("hex");
  fs.writeFileSync(CFG, JSON.stringify({ passHash, secret }, null, 2));
}
const cfg = JSON.parse(fs.readFileSync(CFG, "utf8"));
const readProjects = () => { try { return JSON.parse(fs.readFileSync(PROJ, "utf8")); } catch { return []; } };
const writeProjects = (p) => fs.writeFileSync(PROJ, JSON.stringify(p, null, 2));
if (!fs.existsSync(PROJ)) writeProjects([{ id: "main", name: "Main" }]);

// --- auth helpers ---
const sign = (v) => crypto.createHmac("sha256", cfg.secret).update(v).digest("hex");
const makeToken = () => { const t = "s" + Date.now(); return t + "." + sign(t); };
const validToken = (tok) => { if (!tok) return false; const [t, s] = tok.split("."); return !!(t && s && s === sign(t)); };
const hashPass = (p) => crypto.createHash("sha256").update(p).digest("hex");
const getCookie = (req, name) => { const m = (req.headers.cookie || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)")); return m ? decodeURIComponent(m[1]) : ""; };
const authed = (req) => validToken(getCookie(req, "goterm_session"));
const sanitize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const app = express();
app.use(express.json());

app.get(["/", "/index.html"], (_req, res) => res.sendFile(path.join(DIR, "public", "index.html")));
app.get("/myip", (req, res) => res.json({ ip: req.headers["x-real-ip"] || (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress }));
app.post("/login", (req, res) => {
  if (hashPass(req.body.password || "") === cfg.passHash) {
    res.setHeader("Set-Cookie", `goterm_session=${makeToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false });
});
app.post("/change-password", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const np = String(req.body.password || "");
  if (np.length < 6) return res.status(400).json({ ok: false, error: "min 6 chars" });
  cfg.passHash = hashPass(np);
  fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2));
  res.json({ ok: true });
});

// ---------- Face ID / passkey (WebAuthn) — bind access to this iPhone ----------
const RP_ID = "el.ag", ORIGIN = "https://el.ag", RP_NAME = "Core Terminal";
const CREDS = path.join(DIR, "credentials.json");
const readCreds = () => { try { return JSON.parse(fs.readFileSync(CREDS, "utf8")); } catch { return []; } };
const writeCreds = (c) => fs.writeFileSync(CREDS, JSON.stringify(c, null, 2));
let regChallenge = "", authChallenge = "";

app.get("/webauthn/has", (_req, res) => res.json({ registered: readCreds().length > 0 }));

app.post("/webauthn/register/options", async (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME, rpID: RP_ID, userName: "jeff", attestationType: "none",
    excludeCredentials: readCreds().map((c) => ({ id: c.id, transports: c.transports })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred", authenticatorAttachment: "platform" },
  });
  regChallenge = options.challenge;
  res.json(options);
});
app.post("/webauthn/register/verify", async (req, res) => {
  if (!authed(req)) return res.status(401).end();
  try {
    const v = await verifyRegistrationResponse({ response: req.body.response, expectedChallenge: regChallenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID });
    if (!v.verified) return res.json({ ok: false });
    const c = v.registrationInfo.credential;
    const creds = readCreds();
    creds.push({ id: c.id, publicKey: Buffer.from(c.publicKey).toString("base64"), counter: c.counter, transports: c.transports || [], name: String(req.body.deviceName || "iPhone").slice(0, 40), createdAt: new Date().toISOString() });
    writeCreds(creds);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ ok: false, error: String(e).slice(0, 200) }); }
});
app.post("/webauthn/auth/options", async (_req, res) => {
  const options = await generateAuthenticationOptions({ rpID: RP_ID, allowCredentials: readCreds().map((c) => ({ id: c.id, transports: c.transports })), userVerification: "preferred" });
  authChallenge = options.challenge;
  res.json(options);
});
app.post("/webauthn/auth/verify", async (req, res) => {
  try {
    const cred = readCreds().find((c) => c.id === req.body.id);
    if (!cred) return res.status(400).json({ ok: false, error: "unknown device" });
    const v = await verifyAuthenticationResponse({ response: req.body, expectedChallenge: authChallenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID,
      credential: { id: cred.id, publicKey: new Uint8Array(Buffer.from(cred.publicKey, "base64")), counter: cred.counter, transports: cred.transports } });
    if (!v.verified) return res.json({ ok: false });
    const creds = readCreds(); const cc = creds.find((c) => c.id === cred.id); if (cc) { cc.counter = v.authenticationInfo.newCounter; writeCreds(creds); }
    res.setHeader("Set-Cookie", `goterm_session=${makeToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ ok: false, error: String(e).slice(0, 200) }); }
});

// project management
app.get("/api/projects", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  res.json(readProjects());
});
const getProject = (id) => readProjects().find((p) => p.id === id) || null;
// Normalize a repo input (owner/repo, https URL, or ssh URL) to a push-capable SSH URL.
function normRepo(r) {
  r = String(r || "").trim();
  if (!r) return "";
  if (!/^[\w@:/.\-]+$/.test(r)) return "";
  if (/^[\w.\-]+\/[\w.\-]+$/.test(r)) return `git@github.com:${r.replace(/\.git$/, "")}.git`;
  const m = r.match(/^https?:\/\/github\.com\/([\w.\-]+)\/([\w.\-]+?)(?:\.git)?\/?$/i);
  if (m) return `git@github.com:${m[1]}/${m[2]}.git`;
  return r;
}
app.post("/api/projects", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const name = String(req.body.name || "").trim().slice(0, 40) || "Project";
  const website = String(req.body.website || "").trim().slice(0, 80);
  const repo = normRepo(req.body.repo);
  const id = sanitize(name) || "p" + Date.now();
  const dir = "/var/www/projects/" + id;
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  const list = readProjects();
  if (!list.find((p) => p.id === id)) { list.push({ id, name, website, repo, dir, autostart: true }); writeProjects(list); }
  res.json({ ok: true, id, name });
});
app.delete("/api/projects/:id", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const id = sanitize(req.params.id);
  try { cp.execSync(`tmux kill-session -t ${id} 2>/dev/null`); } catch {}
  writeProjects(readProjects().filter((p) => p.id !== id));
  res.json({ ok: true });
});
// One-tap sync: commit + push the project's folder (uses the box's GitHub SSH key).
app.post("/api/sync", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const p = getProject(sanitize(req.body.project || ""));
  if (!p || !p.dir) return res.json({ ok: false, output: "No folder for this project." });
  if (!fs.existsSync(path.join(p.dir, ".git"))) return res.json({ ok: false, output: "No git repo linked to this project." });
  const msg = String(req.body.message || "sync from phone").slice(0, 120);
  const script = `cd ${JSON.stringify(p.dir)} && git add -A && (git commit -m ${JSON.stringify(msg)} || echo "(nothing to commit)") && git push 2>&1`;
  cp.exec(script, { timeout: 90000, maxBuffer: 1 << 20 }, (err, stdout, stderr) => {
    const out = ((stdout || "") + (stderr || "")).trim().slice(-500);
    res.json({ ok: !err, output: out || (err ? String(err).slice(0, 300) : "done") });
  });
});
// One-tap pull: grab changes made elsewhere.
app.post("/api/pull", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const p = getProject(sanitize(req.body.project || ""));
  if (!p || !p.dir) return res.json({ ok: false, output: "No folder for this project." });
  if (!fs.existsSync(path.join(p.dir, ".git"))) return res.json({ ok: false, output: "No git repo linked to this project." });
  cp.exec(`cd ${JSON.stringify(p.dir)} && git pull 2>&1`, { timeout: 90000, maxBuffer: 1 << 20 }, (err, stdout, stderr) => {
    const out = ((stdout || "") + (stderr || "")).trim().slice(-500);
    res.json({ ok: !err, output: out || (err ? String(err).slice(0, 300) : "done") });
  });
});
// Deploy to production (Core project only). Runs detached so it survives a dropped connection;
// progress is polled via /api/deploy/log.
const DEPLOY_LOG = "/var/www/goterm/deploy.log";
app.post("/api/deploy", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const p = getProject(sanitize(req.body.project || ""));
  if (!p || p.dir !== "/var/www/projects/core") return res.json({ ok: false, output: "Deploy is enabled only for the Core project." });
  try { const cur = fs.readFileSync(DEPLOY_LOG, "utf8"); if (cur && !/__DEPLOY_DONE__/.test(cur)) return res.json({ ok: false, output: "A deploy is already running." }); } catch {}
  try {
    fs.writeFileSync(DEPLOY_LOG, "Starting production deploy…\n");
    const child = cp.spawn("bash", ["-lc", `bash /var/www/goterm/deploy-prod.sh >> ${DEPLOY_LOG} 2>&1; echo "__DEPLOY_DONE__ $?" >> ${DEPLOY_LOG}`], { detached: true, stdio: "ignore" });
    child.unref();
    res.json({ ok: true, started: true });
  } catch (e) { res.json({ ok: false, output: String(e).slice(0, 200) }); }
});
app.get("/api/deploy/log", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  let tail = ""; try { tail = fs.readFileSync(DEPLOY_LOG, "utf8"); } catch {}
  const m = tail.match(/__DEPLOY_DONE__ (\d+)/);
  res.json({ running: !m, ok: m ? m[1] === "0" : false, tail: tail.replace(/__DEPLOY_DONE__ \d+/, "").trim().slice(-1400) });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  if (!req.url.startsWith("/pty")) return socket.destroy();
  if (!validToken(getCookie(req, "goterm_session"))) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => attachPty(ws, req));
});

// A busy run that goes quiet for IDLE_MS, having been busy at least MIN_BUSY_MS, is "finished".
const IDLE_MS = 8000, MIN_BUSY_MS = 40000;
function attachPty(ws, req) {
  const url = new URL(req.url, "http://x");
  const project = sanitize(url.searchParams.get("project")) || "main";
  const p = getProject(project);
  const dir = (p && p.dir) || "/var/www";
  const cols = +url.searchParams.get("cols") || 80, rows = +url.searchParams.get("rows") || 24;
  // First open of a project: create its tmux session in its folder, clone the repo, launch Claude.
  let exists = false;
  try { cp.execFileSync("tmux", ["has-session", "-t", project], { stdio: "ignore" }); exists = true; } catch {}
  if (!exists) {
    try {
      cp.execFileSync("tmux", ["new-session", "-d", "-s", project, "-c", dir]);
      if (p && p.autostart) {
        // init script lives OUTSIDE the project dir so `git clone .` sees an empty dir.
        // On first open: clone if empty, else auto-pull the latest — then launch Claude.
        // IS_SANDBOX lets `claude --dangerously-skip-permissions` run as root on this dedicated box.
        const init = `#!/bin/bash\nexport IS_SANDBOX=1\ncd ${JSON.stringify(dir)}\n`
          + (p.website ? `export SITE=${JSON.stringify(p.website)}\n` : "")
          + (p.repo ? `if [ -z "$(ls -A)" ]; then echo "Cloning ${p.repo} ..."; git clone ${JSON.stringify(p.repo)} . && echo "✓ cloned"; elif [ -d .git ]; then echo "Pulling latest ..."; git pull; fi\n` : "");
        const initDir = "/var/www/goterm/inits";
        try { fs.mkdirSync(initDir, { recursive: true }); fs.writeFileSync(path.join(initDir, project + ".sh"), init); } catch {}
        cp.execFileSync("tmux", ["send-keys", "-t", project, `source ${initDir}/${project}.sh`, "Enter"]);
        cp.execFileSync("tmux", ["send-keys", "-t", project, "claude --dangerously-skip-permissions", "Enter"]);
      }
    } catch {}
  }
  const term = pty.spawn("tmux", ["attach", "-t", project], { name: "xterm-256color", cols, rows, cwd: dir, env: process.env });
  let busy = false, busyStart = 0, idleTimer = null;
  const armIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (busy && Date.now() - busyStart >= MIN_BUSY_MS) { try { ws.send(JSON.stringify({ type: "finished", project })); } catch {} }
      busy = false;
    }, IDLE_MS);
  };
  // Watch the stream for a Claude sign-in URL so the client can offer a one-tap "Log in" button.
  let outBuf = "", authSent = false;
  const ANSI = /\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07]*(?:\x07|\x1b\\)|\x1b[()][AB012]|[\x00-\x08\x0b-\x1f]/g;
  term.onData((d) => {
    try { ws.send(JSON.stringify({ type: "data", data: d })); } catch {}
    if (!busy) { busy = true; busyStart = Date.now(); }
    armIdle();
    if (!authSent) {
      outBuf = (outBuf + d).slice(-6000);
      const m = outBuf.replace(ANSI, "").match(/https:\/\/(?:claude\.ai|console\.anthropic\.com|[a-z0-9.-]*anthropic\.com)\/[^\s"'<>]+/i);
      if (m) { authSent = true; const url = m[0].replace(/[.,)\]}]+$/, ""); try { ws.send(JSON.stringify({ type: "authurl", url })); } catch {} }
    }
  });
  ws.on("message", (m) => {
    let msg; try { msg = JSON.parse(m); } catch { return; }
    if (msg.type === "input") term.write(msg.data);
    else if (msg.type === "resize" && msg.cols && msg.rows) { try { term.resize(msg.cols, msg.rows); } catch {} }
  });
  ws.on("close", () => { try { term.kill(); } catch {} }); // detaches from tmux; the session persists
}

server.listen(PORT, "127.0.0.1", () => console.log("goterm on :" + PORT));
