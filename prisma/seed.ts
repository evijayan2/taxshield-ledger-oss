import { PrismaClient, RuleStatus, CitationTier, RuleType } from '@prisma/client';
import { allTaxRuleFixtures } from './fixtures/index';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TaxLedger jurisdictions...');

  // 1. Tax Jurisdictions
  for (const j of allTaxRuleFixtures.jurisdictions) {
    await prisma.taxJurisdiction.upsert({
      where: { code: j.code },
      update: { name: j.name, level: j.level as string, state: j.state },
      create: {
        code: j.code,
        name: j.name,
        level: j.level as string,
        state: j.state,
      },
    });
  }

  console.log('Jurisdiction seeding completed successfully. Tax rules must be ingested from TaxPack server.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

