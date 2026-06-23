import { appendedFields, appendMeta, PHONE_KEYS, type AppendedField } from "@/lib/appended";
import { cst, fmtPhone } from "@/lib/format";

// Phone fields may hold several numbers ("a, b") — format each.
function display(f: AppendedField): string {
  if (PHONE_KEYS.has(f.key)) return f.value.split(",").map((p) => fmtPhone(p.trim())).join(", ");
  return f.value;
}

// Compact one-line strip shown UNDER a table row in the CRM (calls / leads lists).
// Returns null when there's nothing appended so callers can skip rendering the extra row.
export function AppendedStrip({ raw }: { raw?: string | null }) {
  const fields = appendedFields(raw);
  const { status } = appendMeta(raw);
  if (!fields.length) {
    if (status === "no match") return <span className="text-[11px] text-[var(--muted)]">⊕ Appended: no match found</span>;
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-tight">
      <span className="font-bold uppercase tracking-wide text-[var(--gold)]">⊕ Appended</span>
      {fields.map((f) => (
        <span key={f.key} className="text-[var(--muted)]">
          {f.label}: <span className="text-[var(--text)] font-medium">{display(f)}</span>
        </span>
      ))}
    </div>
  );
}

// Should we bother rendering an appended row at all (data OR an explicit "no match")?
export function hasAppended(raw?: string | null): boolean {
  return appendedFields(raw).length > 0 || appendMeta(raw).status === "no match";
}

// Fuller two-column block for detail cards — appended values shown beside, never over, originals.
export function AppendedBlock({ raw }: { raw?: string | null }) {
  const fields = appendedFields(raw);
  const { status, at } = appendMeta(raw);
  if (!fields.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {status === "no match" ? "Append ran — no match found for this contact." : "No appended data yet — it fills in automatically after the call or lead comes in."}
      </p>
    );
  }
  return (
    <div>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {fields.map((f) => (
          <div key={f.key} className="flex justify-between gap-4 border-b border-[var(--border)]/50 py-1">
            <dt className="text-[var(--muted)]">Appended {f.label}</dt>
            <dd className="font-medium text-right">{display(f)}</dd>
          </div>
        ))}
      </dl>
      {at && <p className="text-[11px] text-[var(--muted)] mt-3">Appended {cst(at)}{status && status !== "matched" ? ` · ${status}` : ""}</p>}
    </div>
  );
}
