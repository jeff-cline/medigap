import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const email = (e || "").trim().toLowerCase();
  let done = false;
  if (email) { await db.lead.updateMany({ where: { email }, data: { emailOptOut: true } }).catch(() => {}); done = true; }
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="card p-8 max-w-md">
        <div className="text-3xl">✅</div>
        <h1 className="text-xl font-semibold mt-2">{done ? "You're unsubscribed" : "Unsubscribe"}</h1>
        <p className="text-sm text-[var(--muted)] mt-2">{done ? `${email} won't receive marketing emails from medigap.plus anymore.` : "No email address provided."}</p>
        <a href="/" className="btn btn-ghost text-sm mt-4">Back to medigap.plus</a>
      </div>
    </main>
  );
}
