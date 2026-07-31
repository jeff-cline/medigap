import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unifiedThreads, cannedList, outboundLog } from "@/lib/inbox";
import { listShortlinks } from "@/lib/shorten";
import UnifiedComms from "@/components/comms/UnifiedComms";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export const dynamic = "force-dynamic";

export default async function UnifiedPage() {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role)) redirect("/dashboard");

  const { threads, numbers } = await unifiedThreads();
  const [canned, outbound, shortlinks] = await Promise.all([cannedList(), outboundLog(), listShortlinks()]);

  return <UnifiedComms threads={threads} numbers={numbers} canned={canned} outbound={outbound} shortlinks={shortlinks} />;
}
