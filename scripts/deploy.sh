#!/bin/sh
# Deploy medigap.plus (the Core) to the Vultr box (137.220.56.129).
# Local dev uses SQLite; this forces Postgres on prod.
# Self-protecting: auto-backup → destructive-change guard → build → reload → ensure-god → route smoke-test.
# Usage: sh scripts/deploy.sh
set -e

SSH_KEY="$HOME/.ssh/r0cketship_vultr"
SERVER="root@137.220.56.129"
APP="/var/www/medigap"

echo "→ Syncing code (excluding node_modules, .next, .git, local db, uploads, .env)…"
rsync -az --delete -e "ssh -i $SSH_KEY -o BatchMode=yes" \
  --exclude node_modules --exclude .next --exclude .git \
  --exclude 'prisma/dev.db*' --exclude 'public/uploads/*' --exclude .env \
  ./ "$SERVER:$APP/"

echo "→ Backup → guard → build → reload (on server)…"
# Single-quoted heredoc: runs verbatim on the server (no local expansion).
ssh -i "$SSH_KEY" "$SERVER" 'bash -s' <<'REMOTE'
set -e
cd /var/www/medigap
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

echo "  • backing up the database…"
# Source .env in a SUBSHELL only — do NOT leak NODE_ENV=production into the build
# (that would make npm ci skip devDependencies and break the build).
( set -a; . ./.env; set +a; pg_dump "${DATABASE_URL%%\?*}" -Fc -f "/root/medigap-db-backup-$(date +%Y%m%d-%H%M%S).dump" ) && echo "    backup ok"
# keep the 20 most recent backups
ls -t /root/medigap-db-backup-*.dump 2>/dev/null | tail -n +21 | xargs -r rm -f

npm ci --no-audit --no-fund
npx prisma generate

echo "  • schema guard (additive-only)…"
# Push WITHOUT --accept-data-loss. Additive changes apply; a DESTRUCTIVE change (drop/narrow)
# fails here → we ABORT before build/reload, leaving the running app untouched on old code.
if ! npx prisma db push --skip-generate 2>/tmp/push.err; then
  echo "  ✗ ABORTED — schema change requires data loss (destructive). App left on the previous build."
  echo "    Review the change; if it is truly intended, run a manual migration with a fresh backup."
  sed 's/^/    | /' /tmp/push.err
  exit 1
fi

echo "  • form-guard coverage…"
# A public form endpoint that does not call guardForm() fails the deploy —
# "we forgot reCAPTCHA on the new form" must not be discovered from spam.
node scripts/check-form-guard.mjs

npm run build

# medigap.plus is served by an nginx upstream pool of TWO pm2 instances
# (medigap on :3020, medigap-2 on :3021 — see /etc/nginx/conf.d/medigap_upstream.conf).
# Reloading only the first leaves half the traffic on the previous build, which
# looks like a route that exists on some page loads and 404s on others. Reload
# every instance that serves this directory.
for app in $(pm2 jlist | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{JSON.parse(d).filter(p=>p.pm2_env&&p.pm2_env.pm_cwd==="/var/www/medigap").forEach(p=>console.log(p.name))})'); do
  echo "  • reloading $app"
  pm2 reload "$app" >/dev/null
done
npx tsx scripts/ensure-god.ts
npx tsx scripts/seed-quinstreet.ts
echo "  • build + reload done"
REMOTE

echo "→ Route smoke-test (a 404/5xx on any critical route = fail)…"
# code · url · what we expect ("exists" = anything that's not 404/5xx, e.g. 200 or a 30x/401/403)
ROUTES="
https://medigap.plus/
https://medigap.plus/login
https://medigap.plus/dashboard
https://medigap.plus/dashboard/jv
https://medigap.plus/dashboard/social
https://medigap.plus/dashboard/playbook
https://medigap.plus/dashboard/affiliates
https://medigap.plus/dashboard/ping-tree
https://medigap.plus/dashboard/social-metrics
https://medigap.plus/dashboard/ai-spend
https://medigap.plus/dashboard/qr
https://medigap.plus/dashboard/seo-plan
https://medigap.plus/dashboard/integrations
https://medigap.plus/insurance
https://medigap.plus/insurance/medicare-insurance
https://medigap.plus/insurance/home-insurance
https://medigap.plus/answers
https://medigap.plus/sitemap.xml
https://medigap.plus/robots.txt
https://1-800-medigap.com/insurance
https://1-800-medigap.com/medicare-basics-enrollment
https://1-800-medigap.com/assisted-living
https://1-800-medigap.com/assisted-living/assisted-living-cost
https://1-800-medigap.com/answers
https://1-800-medigap.com/sitemap.xml
https://medigap.plus/playbook
https://medigap.plus/playbook/secret-weapon
https://medigap.plus/agetech
https://medigap.plus/core-api
https://medigap.plus/creator
https://medigap.plus/brand
https://doublewide.ai/
https://1-800-medigap.com/
https://parentingupward.org/
"
fail=0
for url in $ROUTES; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "$url" || echo "000")
  if [ "$code" = "404" ] || [ "$code" -ge 500 ] 2>/dev/null || [ "$code" = "000" ]; then
    echo "  ✗ $code  $url"; fail=1
  else
    echo "  ✓ $code  $url"
  fi
done

if [ "$fail" = "1" ]; then
  echo "⚠️  SMOKE TEST FAILED — a critical route is 404/5xx. Investigate before relying on this deploy."
  exit 1
fi
echo "✓ Deployed & smoke-tested clean. https://medigap.plus"
echo "  (Backup taken pre-migration; destructive schema changes are blocked; routes verified.)"
