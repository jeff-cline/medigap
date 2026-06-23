import Link from "next/link";
import { Card, Section, Stat } from "@/components/ui";
import ArmCloud from "@/components/ArmCloud";
import { buildCloud } from "@/lib/wordcloud";
import { db } from "@/lib/db";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ArmCloudPage() {
  const [cloud, armedCount] = await Promise.all([buildCloud(), db.moneyWord.count()]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Arm Cloud ☁</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Every word callers actually say — pooled from all call conversations, with the filler, connector and
          intent words stripped out — so you can scan and arm money words fast. Click a word (or highlight a phrase
          and hit Arm) to send it to the{" "}
          <Link href="/dashboard/money-words" className="text-[var(--brand)]">Money Words</Link> system; it turns green
          and drops out of the cloud. New words bubble in live as calls come in; anything already armed is hidden.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Unarmed Words" value={num(cloud.words.length)} sub="candidates to arm" tone="gold" />
        <Stat label="Calls Mined" value={num(cloud.calls)} sub="transcripts with caller speech" tone="up" />
        <Stat label="Already Armed" value={num(armedCount)} sub="active money words (hidden here)" tone="up" />
      </div>

      <Section title="Pick & Arm" desc="Biggest = said most often. Click to arm → green → Money Words. Highlight any phrase to arm it as one word.">
        <Card glow>
          <ArmCloud initial={cloud.words} calls={cloud.calls} />
        </Card>
      </Section>
    </>
  );
}
