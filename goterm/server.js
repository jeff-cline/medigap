// el.ag/go — iPhone-optimized web terminal for the Core.
// Named, persistent tmux "projects" + idle detection ("April, N agents finished").
// Auth: password -> signed session cookie. Runs on :3030, proxied at el.ag/go by nginx.
const express = require("express");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const pty = require("node-pty");
const { WebSocketServer } = require("ws");

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
const sanitize = (s) => String(s || "").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

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

// project management
app.get("/api/projects", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  res.json(readProjects());
});
app.post("/api/projects", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const name = String(req.body.name || "").trim().slice(0, 40) || "Project";
  const id = sanitize(name) || "p" + Date.now();
  const list = readProjects();
  if (!list.find((p) => p.id === id)) { list.push({ id, name }); writeProjects(list); }
  res.json({ ok: true, id, name });
});
app.delete("/api/projects/:id", (req, res) => {
  if (!authed(req)) return res.status(401).end();
  const id = sanitize(req.params.id);
  try { require("child_process").execSync(`tmux kill-session -t ${id} 2>/dev/null`); } catch {}
  writeProjects(readProjects().filter((p) => p.id !== id));
  res.json({ ok: true });
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
  const term = pty.spawn("tmux", ["new-session", "-A", "-s", project], { name: "xterm-256color", cols: +url.searchParams.get("cols") || 80, rows: +url.searchParams.get("rows") || 24, cwd: "/var/www", env: process.env });
  let busy = false, busyStart = 0, idleTimer = null;
  const armIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (busy && Date.now() - busyStart >= MIN_BUSY_MS) { try { ws.send(JSON.stringify({ type: "finished", project })); } catch {} }
      busy = false;
    }, IDLE_MS);
  };
  term.onData((d) => {
    try { ws.send(JSON.stringify({ type: "data", data: d })); } catch {}
    if (!busy) { busy = true; busyStart = Date.now(); }
    armIdle();
  });
  ws.on("message", (m) => {
    let msg; try { msg = JSON.parse(m); } catch { return; }
    if (msg.type === "input") term.write(msg.data);
    else if (msg.type === "resize" && msg.cols && msg.rows) { try { term.resize(msg.cols, msg.rows); } catch {} }
  });
  ws.on("close", () => { try { term.kill(); } catch {} }); // detaches from tmux; the session persists
}

server.listen(PORT, "127.0.0.1", () => console.log("goterm on :" + PORT));
