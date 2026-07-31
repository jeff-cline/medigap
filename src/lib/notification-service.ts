import { db } from "@/lib/db";
import { dueEvents, sentYearFor, type NotifEvent } from "@/lib/notify-events";
import { sendStaticSms } from "@/lib/static/sms";
import { sendEmail } from "@/lib/email";

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Cron entrypoint (rides /api/fire/tick). Sends any due NotificationEvent to every enrolled
// EducationalProgram member by SMS (from the 1-800-MEDIGAP main number, so replies thread into the
// unified inbox) and optionally by email. Idempotent: an event's lastSentYear is stamped BEFORE the
// blast, so a partial failure or overlapping tick can never re-blast the same year. Never throws.
export async function sendDueNotifications(now: Date = new Date()): Promise<{ events: number; sent: number; failed: number }> {
  let events = 0, sent = 0, failed = 0;
  try {
    const all = await db.notificationEvent.findMany({ where: { active: true } });
    // dueEvents filters the array, returning the same Prisma row objects (identity preserved).
    const dueRows = dueEvents(all as unknown as NotifEvent[], now) as unknown as typeof all;
    if (dueRows.length === 0) return { events: 0, sent: 0, failed: 0 };

    const members = await db.educationalProgram.findMany({ where: { enrolled: true } });
    for (const ev of dueRows) {
      events++;
      // stamp first (idempotency) so a crash mid-blast never re-sends this cycle
      await db.notificationEvent.update({ where: { id: ev.id }, data: { lastSentYear: sentYearFor(ev as unknown as NotifEvent, now) } }).catch(() => {});
      const body = ev.link ? `${ev.message} ${ev.link}` : ev.message;
      for (const m of members) {
        if (m.phone) {
          const r = await sendStaticSms({ to: m.phone, body, leadId: m.leadId });
          if (r.ok) sent++; else failed++;
        }
        if (ev.sendEmail && m.email) {
          sendEmail(m.email, ev.title || "A note from 1-800-MEDIGAP", `<p>${escapeHtml(body)}</p>`, "zapmail").catch(() => {});
        }
      }
    }
  } catch {
    /* never throw into the cron */
  }
  return { events, sent, failed };
}
