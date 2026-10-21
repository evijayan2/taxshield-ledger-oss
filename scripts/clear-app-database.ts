import dotenv from 'dotenv';
import { prisma } from '../server/prisma.js';

dotenv.config();

async function main() {
  console.log('Connecting to database...');
  await prisma.$connect();
  console.log('Clearing all application tables (companies, users, memberships, expenses, payroll)...');

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      sessions, 
      password_reset_tokens, 
      password_credentials, 
      company_memberships, 
      users, 
      pay_stub_tax_lines, 
      pay_stubs, 
      payroll_runs, 
      timesheets, 
      employee_bank_histories, 
      employee_residence_histories, 
      employee_work_location_histories, 
      employees, 
      general_expenses, 
      travel_expenses, 
      mileage_logs, 
      invoice_line_items, 
      invoices, 
      customers, 
      contractor_payments, 
      form_w9_records, 
      bank_transactions, 
      bank_import_batches, 
      compliance_tasks, 
      calculation_snapshots, 
      audit_log_entries, 
      payroll_calendar_periods, 
      pay_schedule_configs, 
      company_address_histories, 
      companies 
    CASCADE;
  `);

  console.log('Truncation complete.');

  const counts = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    memberships: await prisma.companyMembership.count(),
    taxRuleVersions: await prisma.taxRuleVersion.count(),
    activeTaxRuleVersions: await prisma.taxRuleVersion.count({ where: { status: 'ACTIVE' } }),
  };

  console.log('Verification counts:', counts);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});
