"use client";
import { useMemo, useState } from "react";
import { EXIT } from "@/lib/exit";
import { CALCULATORS, type Calc } from "@/lib/calculators";

const O = EXIT.colors.orange;

function Field({ f, val, onChange }: { f: Calc["fields"][number]; val: number; onChange: (n: number) => void }) {
  const base = "w-full rounded-md border bg-black/30 px-3 py-2 text-white outline-none focus:border-[color:var(--orange)]";
  if (f.kind === "select") return <select value={val} onChange={(e) => onChange(+e.target.value)} className={base} style={{ ["--orange" as string]: O }}>{f.options!.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}</select>;
  if (f.kind === "score") return (
    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => onChange(n)} className="flex-1 rounded-md py-2 text-sm font-bold border" style={{ borderColor: EXIT.colors.border, background: val === n ? O : "transparent", color: val === n ? EXIT.colors.bg : "#cbd5e1" }}>{n}</button>)}</div>
  );
  return (
    <div className="flex items-center rounded-md border bg-black/30 px-3" style={{ borderColor: EXIT.colors.border }}>
      {f.kind === "money" && <span className="text-slate-500">$</span>}
      <input type="number" value={val} onChange={(e) => onChange(+e.target.value)} className="w-full bg-transparent px-2 py-2 text-white outline-none" />
      {f.kind === "percent" && <span className="text-slate-500">%</span>}
    </div>
  );
}

function Report({ calc, values, unlocked, onUnlock }: { calc: Calc; values: Record<string, number>; unlocked: boolean; onUnlock: () => void }) {
  const out = useMemo(() => calc.compute(values), [calc, values]);
  return (
    <div className="rounded-xl border p-5" style={{ borderColor: EXIT.colors.border, background: "#0b1220" }}>
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Your result</div>
      <div className="mt-1 text-4xl font-black" style={{ color: O }}>{out.headline}</div>
      <div className="text-sm text-slate-400">{out.sub}</div>
      <div className="mt-4 space-y-2">
        {out.rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{r.label}</span>
            <span className={`font-bold ${r.gated && !unlocked ? "blur-sm select-none" : "text-white"}`}>{r.gated && !unlocked ? "$000,000" : r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg p-3 text-sm" style={{ background: "#111c34", color: "#cbd5e1", filter: unlocked ? "none" : "blur(4px)", userSelect: unlocked ? "auto" : "none" }}>{out.insight}</div>
      {!unlocked && (
        <button onClick={onUnlock} className="mt-4 w-full rounded-md px-5 py-3 font-bold" style={{ background: O, color: EXIT.colors.bg }}>🔓 Create a free account to unlock the full report + all 6 calculators</button>
      )}
    </div>
  );
}

export default function CalculatorSuite({ images, unlocked = false }: { images: Record<string, string>; unlocked?: boolean }) {
  const [sel, setSel] = useState<string>("");
  const [values, setValues] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(CALCULATORS.map((c) => [c.slug, Object.fromEntries(c.fields.map((f) => [f.key, f.default]))])));
  const [signup, setSignup] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const calc = CALCULATORS.find((c) => c.slug === sel);

  async function createAccount() {
    if (!f.name.trim() || !f.email.trim() || f.password.length < 6) { setErr("Name, email, and a 6+ char password are required."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/calc/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok) window.location.href = "/account"; else setErr(r.error || "Could not create the account.");
  }

  if (calc) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
          <button onClick={() => { setSel(""); setSignup(false); }} className="text-sm text-slate-400 hover:text-white mb-3">← All calculators</button>
          <h3 className="text-2xl font-black">{calc.title}</h3>
          <p className="text-sm text-slate-400 mt-1">{calc.desc}</p>
          <div className="mt-5 space-y-3">
            {calc.fields.map((fl) => (
              <div key={fl.key}><label className="text-sm text-slate-300">{fl.label}</label><div className="mt-1"><Field f={fl} val={values[calc.slug][fl.key]} onChange={(n) => setValues((s) => ({ ...s, [calc.slug]: { ...s[calc.slug], [fl.key]: n } }))} /></div></div>
            ))}
          </div>
        </div>
        <div>
          {unlocked ? <Report calc={calc} values={values[calc.slug]} unlocked={true} onUnlock={() => {}} /> : signup ? (
            <div className="rounded-2xl border p-6" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel }}>
              <h3 className="text-xl font-black">Unlock your full report</h3>
              <p className="text-sm text-slate-400 mt-1">Create a free account to see every number, save your results, and use all 6 calculators.</p>
              <div className="mt-4 grid gap-2.5" style={{ ["--orange" as string]: O }}>
                {(["name", "email", "phone", "company"] as const).map((k) => <input key={k} placeholder={k[0].toUpperCase() + k.slice(1)} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full rounded-md border bg-black/30 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-[color:var(--orange)]" style={{ borderColor: EXIT.colors.border }} />)}
                <input type="password" placeholder="Create a password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="w-full rounded-md border bg-black/30 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-[color:var(--orange)]" style={{ borderColor: EXIT.colors.border }} />
              </div>
              {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
              <button onClick={createAccount} disabled={busy} className="mt-3 w-full rounded-md px-5 py-3 font-bold" style={{ background: O, color: EXIT.colors.bg }}>{busy ? "Creating…" : "Create account & unlock →"}</button>
              <p className="mt-2 text-[11px] text-slate-500 text-center">Already have an account? <a href="/login" className="underline">Log in</a></p>
            </div>
          ) : <Report calc={calc} values={values[calc.slug]} unlocked={false} onUnlock={() => setSignup(true)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {CALCULATORS.map((c) => (
        <button key={c.slug} onClick={() => setSel(c.slug)} className="group text-left rounded-2xl border overflow-hidden hover:border-[color:var(--orange)] transition-colors" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel, ["--orange" as string]: O }}>
          <div className="relative h-32 overflow-hidden">
            {images[c.slug] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={images[c.slug]} alt={`${c.title} — exit optimization calculator`} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition" />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, #0b1220)" }} />
          </div>
          <div className="p-4">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>{c.short}</div>
            <div className="mt-1 font-black text-lg text-white">{c.title}</div>
            <div className="text-sm text-slate-400 mt-1">{c.desc}</div>
            <div className="mt-3 text-sm font-bold" style={{ color: O }}>Open calculator →</div>
          </div>
        </button>
      ))}
    </div>
  );
}
