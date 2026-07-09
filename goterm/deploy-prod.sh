#!/bin/bash
# On-box production deploy: sync the Core working copy (/var/www/projects/core) into the live
# app (/var/www/medigap), then run the same guards as scripts/deploy.sh — DB backup, additive-only
# schema push, build, zero-downtime pm2 reload, smoke-test. Prod .env & uploads are preserved.
set -e
SRC=/var/www/projects/core
APP=/var/www/medigap

echo "→ Syncing Core → production (preserving prod .env, uploads, node_modules)…"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .git \
  --exclude 'prisma/dev.db*' --exclude 'public/uploads/*' --exclude .env \
  --exclude CLAUDE.local.md \
  "$SRC/" "$APP/"

cd "$APP"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

echo "→ Backing up the database…"
( set -a; . ./.env; set +a; pg_dump "${DATABASE_URL%%\?*}" -Fc -f "/root/medigap-db-backup-$(date +%Y%m%d-%H%M%S).dump" ) && echo "  backup ok"
ls -t /root/medigap-db-backup-*.dump 2>/dev/null | tail -n +21 | xargs -r rm -f

npm ci --no-audit --no-fund
npx prisma generate

echo "→ Schema guard (additive-only — destructive changes abort here, prod untouched)…"
if ! npx prisma db push --skip-generate 2>/tmp/push.err; then
  echo "✗ ABORTED — schema change requires data loss. Production left on the previous build."
  sed 's/^/  | /' /tmp/push.err
  exit 1
fi

npm run build
pm2 reload medigap
npx tsx scripts/ensure-god.ts || true

echo "→ Smoke test…"
fail=0
for url in \
  https://medigap.plus/ https://medigap.plus/login https://medigap.plus/dashboard \
  https://medigap.plus/core-api https://el.ag/ https://healthinsuranceapplication.com/ \
  https://exitoptimization.com/ https://experientialmarketing.ai/ https://1-800-medigap.com/; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "$url" || echo "000")
  if [ "$code" = "404" ] || [ "$code" -ge 500 ] 2>/dev/null || [ "$code" = "000" ]; then echo "  ✗ $code  $url"; fail=1; else echo "  ✓ $code  $url"; fi
done
[ "$fail" = "1" ] && { echo "⚠️  SMOKE TEST FAILED — a critical route is down. Investigate."; exit 1; }
echo "✓ Deployed & smoke-tested clean — https://medigap.plus"
