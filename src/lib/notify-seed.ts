type AnyDb = any;

// Idempotent example notification so the calendar isn't empty on first load.
export async function ensureNotificationSeed(db: AnyDb): Promise<void> {
  const title = "Open Enrollment reminder";
  const existing = await db.notificationEvent.findFirst({ where: { title } });
  if (existing) return;
  await db.notificationEvent.create({
    data: {
      title,
      message: "Open Enrollment is coming — let us know if you have any questions.",
      link: "https://el.ag/medicare-plans",
      month: 10, day: 15, hour: 9, minute: 0,
      annual: true, year: 0, sendEmail: false, active: true,
    },
  });
}
