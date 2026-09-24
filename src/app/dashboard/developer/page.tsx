import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Section } from "@/components/ui";
import DevAccessToggle from "@/components/DevAccessToggle";

export const dynamic = "force-dynamic";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-none w-8 h-8 rounded-lg bg-[var(--brand)]/15 text-[var(--brand)] font-bold flex items-center justify-center">{n}</div>
      <div className="min-w-0">
        <h3 className="font-semibold text-[var(--text)]">{title}</h3>
        <div className="text-sm text-[var(--muted)] space-y-2 mt-1">{children}</div>
      </div>
    </div>
  );
}

function Cmd({ children }: { children: React.ReactNode }) {
  return <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]"><code>{children}</code></pre>;
}

export default async function DeveloperPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Only God (management) and developer accounts reach this page.
  if (session.role !== "god" && session.role !== "developer") redirect("/dashboard");

  const isGod = session.role === "god";
  const row = await db.setting.findUnique({ where: { key: "developer.enabled" } }).catch(() => null);
  const enabled = row?.value !== "0"; // unset = on

  // A developer sees nothing while the switch is off.
  if (session.role === "developer" && !enabled) {
    return (
      <Card className="max-w-2xl">
        <h1 className="text-xl font-bold">Developer access is currently turned off</h1>
        <p className="text-sm text-[var(--muted)] mt-2">This section has been disabled by the administrator. If you believe you should have access, contact the account owner.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Developer onboarding — go from rookie to shipping with Claude Code</h1>
        <p className="text-sm text-[var(--muted)] mt-1 max-w-2xl">
          This is your start-to-finish guide to using Claude Code — the terminal AI agent this whole platform is built with.
          Follow the steps in order. By the end you&rsquo;ll be reading real code, making safe changes, and shipping meaningful work.
        </p>
      </div>

      {isGod && (
        <div className="space-y-1">
          <DevAccessToggle enabled={enabled} />
          <p className="text-[11px] text-[var(--muted)]">Only you see this switch. Turn it off and every developer account loses this section immediately — grant per-account Core sections under User Management.</p>
        </div>
      )}

      <Section title="What is Claude Code?" desc="The tool you're here to learn.">
        <Card>
          <p className="text-sm text-[var(--muted)]">
            Claude Code is Anthropic&rsquo;s official AI coding agent that runs in your terminal. You describe what you want in plain English;
            it reads the codebase, writes and edits files, runs tests and commands, and explains its work — with you approving each step.
            It&rsquo;s how this platform is maintained, and it&rsquo;s the fastest way for a new developer to become productive here.
          </p>
        </Card>
      </Section>

      <Section title="The setup — five steps" desc="Do these once.">
        <Card>
          <div className="space-y-5">
            <Step n={1} title="Install a terminal & Node.js (prerequisites)">
              <p>Claude Code runs in a terminal and needs <strong>Node.js 18 or newer</strong>. On macOS use the built-in Terminal app; on Windows use <strong>WSL</strong> (Ubuntu) or PowerShell; on Linux any terminal.</p>
              <p>Check whether Node is installed:</p>
              <Cmd>node --version</Cmd>
              <p>If it&rsquo;s missing or below 18, install the LTS from <span className="text-[var(--brand)]">nodejs.org</span> (or via nvm).</p>
            </Step>

            <Step n={2} title="Install Claude Code">
              <p>Install it globally with npm:</p>
              <Cmd>npm install -g @anthropic-ai/claude-code</Cmd>
              <p>Then confirm it&rsquo;s ready:</p>
              <Cmd>claude --version</Cmd>
              <p>(There is also a one-line native installer on the official docs if you prefer not to use npm.)</p>
            </Step>

            <Step n={3} title="Sign in">
              <p>Start it from any folder and follow the login prompt:</p>
              <Cmd>claude</Cmd>
              <p>Authenticate with your Anthropic account (a Claude Pro/Max plan or API credits). The first run walks you through it in the browser. After that you stay signed in.</p>
            </Step>

            <Step n={4} title="Open a project and take your first lap">
              <p>Move into a code folder, start Claude, and ask it to teach you the codebase — reading before writing is the whole game:</p>
              <Cmd>cd my-project{"\n"}claude</Cmd>
              <p>Then try prompts like: <em>&ldquo;Explain what this project does and how it&rsquo;s structured.&rdquo;</em> · <em>&ldquo;Where is the login handled?&rdquo;</em> · <em>&ldquo;Walk me through what happens when a form is submitted.&rdquo;</em></p>
            </Step>

            <Step n={5} title="Learn the everyday moves">
              <p><strong>Plan first:</strong> for anything non-trivial, ask it to <em>propose a plan before changing code</em>, then approve it.</p>
              <p><strong>Point at files:</strong> reference a file with <code>@path/to/file</code> so it looks exactly where you mean.</p>
              <p><strong>Slash commands:</strong> type <code>/help</code> to see them; <code>/clear</code> starts a fresh context when you switch tasks.</p>
              <p><strong>Let it run the loop:</strong> ask it to write the change, run the tests, and fix failures — then you review the diff and commit.</p>
            </Step>
          </div>
        </Card>
      </Section>

      <Section title="House rules — non-negotiable" desc="How we work safely on live systems.">
        <Card>
          <ul className="text-sm text-[var(--muted)] space-y-2 list-disc pl-5">
            <li><strong>Never break the other sites.</strong> This box hosts many live properties. Change only what your task needs and confirm nothing else is affected.</li>
            <li><strong>Work on a branch, not on live.</strong> Make changes in a branch or a copy, test them, and get a review before anything goes to production.</li>
            <li><strong>Test before you ship.</strong> Run the build and the tests. A green build is the minimum bar for a deploy.</li>
            <li><strong>Ask before anything irreversible.</strong> Deleting data, restarting services, changing DNS or billing — stop and confirm with the owner first.</li>
            <li><strong>Never commit secrets.</strong> API keys, passwords and tokens go in environment config, never in code or chat.</li>
            <li><strong>When unsure, ask Claude to explain the risk</strong> before you run a command. &ldquo;What could this affect?&rdquo; is a good habit.</li>
          </ul>
        </Card>
      </Section>

      <Section title="Rookie → meaningful — a 4-week path" desc="A realistic ramp.">
        <Card>
          <div className="text-sm text-[var(--muted)] space-y-2">
            <p><strong>Week 1 — Read.</strong> Use Claude to explain the codebase, the data model, and how a request flows end to end. Fix a typo or a copy change to learn the edit-test-ship loop.</p>
            <p><strong>Week 2 — Small, safe changes.</strong> Take a tiny bug or styling fix. Ask Claude to write a test first, then the fix. Review the diff yourself before committing.</p>
            <p><strong>Week 3 — A feature behind review.</strong> Build a small, self-contained feature on a branch. Have Claude plan it, implement it, and run the tests; a senior reviews before merge.</p>
            <p><strong>Week 4 — Work at scale.</strong> Use planning mode and sub-tasks for bigger work, learn the deploy process, and start owning a small area end to end.</p>
          </div>
        </Card>
      </Section>

      <Section title="Reference & help" desc="Where to go next.">
        <Card>
          <ul className="text-sm text-[var(--muted)] space-y-2 list-disc pl-5">
            <li>Official docs: <span className="text-[var(--brand)]">docs.claude.com/claude-code</span></li>
            <li>In any session, type <code>/help</code> for commands and <code>/doctor</code> if something looks off.</li>
            <li>Stuck? Ask Claude directly — &ldquo;how do I …?&rdquo; — it knows its own features.</li>
            <li>Access, credentials, or scope questions: contact the account owner.</li>
          </ul>
        </Card>
      </Section>

      <Card className="border-[var(--brand)]/40">
        <h3 className="font-semibold">Your login</h3>
        <p className="text-sm text-[var(--muted)] mt-1">
          Your account was created with a temporary password (<code>TEMP!234</code>) that you must change on first sign-in.
          Keep your credentials private. Your access to this and any other Core section is granted and can be revoked by the account owner at any time.
        </p>
      </Card>
    </div>
  );
}
