"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function call(path: string, body: object) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNote(data.error || "Failed.");
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function impersonate() {
    const data = await call("/api/impersonate", { userId });
    if (data) window.location.href = "/dashboard"; // re-routes by the target role
  }

  async function approve() {
    const data = await call("/api/users", { id: userId, action: "approve" });
    if (data) {
      setNote("Approved.");
      router.refresh();
    }
  }

  async function reset() {
    const data = await call("/api/users", { id: userId, action: "reset" });
    if (data) {
      setNote(`Temp password: ${data.tempPassword || "TEMP!234"}`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" onClick={impersonate} disabled={busy} className="btn btn-brand text-xs !py-1 !px-2.5">
        Impersonate
      </button>
      {status === "pending" && (
        <button type="button" onClick={approve} disabled={busy} className="btn btn-ghost text-xs !py-1 !px-2.5">
          Approve
        </button>
      )}
      <button type="button" onClick={reset} disabled={busy} className="btn btn-ghost text-xs !py-1 !px-2.5">
        Reset Password
      </button>
      {note && <span className="w-full text-right text-xs text-[var(--muted)]">{note}</span>}
    </div>
  );
}
