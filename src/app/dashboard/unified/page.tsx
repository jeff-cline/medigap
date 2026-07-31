import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unifiedThreads, cannedList } from "@/lib/inbox";
import UnifiedComms from "@/components/comms/UnifiedComms";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export const dynamic = "force-dynamic";

export default async function UnifiedPage() {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role)) redirect("/dashboard");

  const { threads, numbers } = await unifiedThreads();
  const canned = await cannedList();

  return <UnifiedComms threads={threads} numbers={numbers} canned={canned} />;
}
