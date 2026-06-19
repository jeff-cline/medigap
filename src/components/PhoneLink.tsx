import Link from "next/link";
import { fmtPhone } from "@/lib/format";

// Click any phone anywhere → resolve to that customer's full record (or offer to create it).
export default function PhoneLink({ phone, className, raw }: { phone: string; className?: string; raw?: boolean }) {
  if (!phone) return <span className="text-[var(--muted)]">—</span>;
  return (
    <Link href={`/dashboard/lookup?phone=${encodeURIComponent(phone)}`} className={className || "text-[var(--brand)] hover:underline"}>
      {raw ? phone : fmtPhone(phone)}
    </Link>
  );
}
