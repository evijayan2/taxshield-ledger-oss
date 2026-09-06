import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Ensure partial unique index for single active owner per company
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "company_single_owner" ON "company_memberships" ("company_id") WHERE "role" = \'OWNER\' AND "status" = \'ACTIVE\';'
  );

  // 2. Query and verify counts across all entity tables
  const [
    users,
    credentials,
    sessions,
    resetTokens,
    memberships,
    companies,
    taxYears,
    employees,
    payrollRuns,
    payStubs,
    mileageLogs,
    travelExpenses,
    generalExpenses,
    complianceTasks,
    timesheets,
    appStateSnapshots,
    calculationSnapshots,
    auditLogs,
    jurisdictions,
    rules,
    versions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.passwordCredential.count(),
    prisma.session.count(),
    prisma.passwordResetToken.count(),
    prisma.companyMembership.count(),
    prisma.company.count(),
    prisma.taxYear.count(),
    prisma.employee.count(),
    prisma.payrollRun.count(),
    prisma.payStub.count(),
    prisma.mileageLog.count(),
    prisma.travelExpense.count(),
    prisma.generalExpense.count(),
    prisma.complianceTask.count(),
    prisma.timesheet.count(),
    prisma.appStateSnapshot.count(),
    prisma.calculationSnapshot.count(),
    prisma.auditLogEntry.count(),
    prisma.taxJurisdiction.count(),
    prisma.taxRule.count(),
    prisma.taxRuleVersion.count(),
  ]);

  const totalUserDataRecords =
    users +
    credentials +
    sessions +
    resetTokens +
    memberships +
    companies +
    taxYears +
    employees +
    payrollRuns +
    payStubs +
    mileageLogs +
    travelExpenses +
    generalExpenses +
    complianceTasks +
    timesheets +
    appStateSnapshots +
    calculationSnapshots +
    auditLogs;

  console.log('✓ Comprehensive Database Verification Summary:');
  console.log(`  - Registered Users & Auth: ${users} users, ${credentials} credentials, ${sessions} sessions, ${memberships} memberships`);
  console.log(`  - Company & Staff Roster:  ${companies} companies, ${employees} employees, ${taxYears} tax years`);
  console.log(`  - Financial Records:       ${payrollRuns} payroll runs, ${payStubs} pay stubs, ${timesheets} timesheets`);
  console.log(`  - Expenses & Compliance:   ${generalExpenses} expenses, ${mileageLogs} mileage, ${travelExpenses} travel, ${complianceTasks} compliance tasks`);
  console.log(`  - Audit & Provenance:      ${auditLogs} audit logs, ${calculationSnapshots} snapshots, ${appStateSnapshots} app snapshots`);
  console.log(`  - Total User Data Rows:    ${totalUserDataRecords} (Expected: 0 for clean bootstrap)`);
  console.log(`  - Tax Rules Engine:        ${jurisdictions} jurisdictions, ${rules} rules with ${versions} versions active`);

  if (totalUserDataRecords > 0) {
    console.warn(`⚠️ Warning: ${totalUserDataRecords} user data rows remain in the database after reset.`);
  } else {
    console.log('✓ All user data tables successfully reset to 0 rows.');
  }
}

main()
  .catch((e) => {
    console.error('Database post-reset verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
