#!/usr/bin/env bash
set -e

echo "================================================="
echo "   TaxShield Ledger — Database Reset Script     "
echo "================================================="

# Navigate to oss directory if run from root
if [ -d "taxshield-ledger-oss" ]; then
  cd taxshield-ledger-oss
fi

echo "[1/3] Resetting PostgreSQL schema and migrations..."
pnpm exec prisma migrate reset --force

echo "[2/3] Ensuring active single owner partial index..."
pnpm exec prisma db execute --schema prisma/schema.prisma --stdin <<< 'CREATE UNIQUE INDEX IF NOT EXISTS "company_single_owner" ON "company_memberships" ("company_id") WHERE "role" = '"'"'OWNER'"'"' AND "status" = '"'"'ACTIVE'"'"';'

echo "[3/3] Verifying database state..."
pnpm exec tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function verify() {
  const users = await prisma.user.count();
  const companies = await prisma.company.count();
  const rules = await prisma.taxRule.count();
  console.log('✓ Database verification:');
  console.log('  - Registered Users:      ' + users + ' (Expected: 0 for fresh bootstrap)');
  console.log('  - Registered Companies:  ' + companies + ' (Expected: 0 for fresh bootstrap)');
  console.log('  - Seeded Tax Rules:      ' + rules + ' (Rules Engine active)');
  await prisma.\$disconnect();
}
verify();
"

echo "================================================="
echo "✓ Database is clean and ready for fresh setup!"
echo "  Run 'pnpm dev' and open http://localhost:3000   "
echo "================================================="
