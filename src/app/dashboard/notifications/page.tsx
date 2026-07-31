import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";
import NotificationService from "@/components/notify/NotificationService";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const s = await getSession();
  if (!isGod(s)) redirect("/dashboard");

  const [events, members, enrolledCount] = await Promise.all([
    db.notificationEvent.findMany({ orderBy: [{ month: "asc" }, { day: "asc" }] }),
    db.educationalProgram.findMany({ where: { enrolled: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.educationalProgram.count({ where: { enrolled: true } }),
  ]);

  return (
    <NotificationService
      events={events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
      members={members.map((m) => ({ id: m.id, phone: m.phone, email: m.email, state: m.state, name: m.name, source: m.source, at: m.createdAt.toISOString() }))}
      enrolledCount={enrolledCount}
    />
  );
}
