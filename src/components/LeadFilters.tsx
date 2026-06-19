"use client";
import { useRouter, useSearchParams } from "next/navigation";

const VERTICALS = ["all", "medicare", "housing", "care", "alzheimers"];
const SOURCES = ["all", "house", "google", "facebook", "organic", "tv", "affiliate"];
const STATUSES = ["all", "new", "contacted", "sold", "dead"];

function Row({
  label,
  param,
  options,
  current,
  onPick,
}: {
  label: string;
  param: string;
  options: string[];
  current: string;
  onPick: (param: string, value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-[var(--muted)] w-16">{label}</span>
      {options.map((o) => {
        const active = current === o || (o === "all" && !current);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onPick(param, o)}
            className={`btn text-xs !py-1 !px-3 capitalize ${active ? "btn-brand" : "btn-ghost"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function LeadFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function pick(param: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete(param);
    else next.set(param, value);
    const qs = next.toString();
    router.push(qs ? `/dashboard/leads?${qs}` : "/dashboard/leads");
  }

  return (
    <div className="space-y-3">
      <Row label="Vertical" param="vertical" options={VERTICALS} current={params.get("vertical") || ""} onPick={pick} />
      <Row label="Source" param="source" options={SOURCES} current={params.get("source") || ""} onPick={pick} />
      <Row label="Status" param="status" options={STATUSES} current={params.get("status") || ""} onPick={pick} />
    </div>
  );
}
