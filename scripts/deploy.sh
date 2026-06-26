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
set -a; . ./.env; set +a
CLEAN="${DATABASE_URL%%\?*}"

echo "  • backing up the database…"
pg_dump "$CLEAN" -Fc -f "/root/medigap-db-backup-$(date +%Y%m%d-%H%M%S).dump" && echo "    backup ok"
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

npm run build
pm2 reload medigap
npx tsx scripts/ensure-god.ts
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
