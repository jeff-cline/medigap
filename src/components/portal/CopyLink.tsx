"use client";
import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-sm bg-[var(--panel2)] border border-[var(--border)] rounded-lg px-3 py-2 truncate">{url}</code>
      <button
        onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
        className="btn btn-brand text-sm !py-2 shrink-0"
      >{copied ? "✓ Copied" : "Copy link"}</button>
    </div>
  );
}
