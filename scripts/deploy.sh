#!/bin/sh
# Deploy medigap.plus to the Vultr box (137.220.56.129) — fully isolated from the
# other sites on that server. Local dev uses SQLite; this forces Postgres on prod.
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

echo "→ Building & reloading on server…"
ssh -i "$SSH_KEY" "$SERVER" "set -e; cd $APP; \
  sed -i 's/provider = \"sqlite\"/provider = \"postgresql\"/' prisma/schema.prisma; \
  npm ci --no-audit --no-fund; \
  npx prisma generate; \
  npx prisma db push --skip-generate; \
  npm run build; \
  pm2 reload medigap"

echo "✓ Deployed. https://medigap.plus"
echo "  (DB schema changes are applied with 'prisma db push'; seeding is NOT re-run.)"
