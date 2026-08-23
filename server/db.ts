import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPostgresConnectionString(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

export function getPool(): pg.Pool | null {
  const connectionString = getPostgresConnectionString();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    // Enable SSL by default for Vercel Postgres / Neon / Cloud Postgres
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return pool;
}

export async function initPostgresTables(): Promise<{ success: boolean; message: string; tableCounts?: Record<string, number> }> {
  const p = getPool();
  if (!p) {
    return {
      success: false,
      message: 'No POSTGRES_URL or DATABASE_URL environment variable detected. Configure POSTGRES_URL in Vercel or environment variables to enable cloud database.'
    };
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');

    // 1. Organization Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ein VARCHAR(50) NOT NULL,
        state_tax_id VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(20) NOT NULL,
        zip VARCHAR(20) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        owner_email VARCHAR(255) NOT NULL,
        owner_tax_bracket NUMERIC DEFAULT 24,
        filing_frequency_pa VARCHAR(50) DEFAULT 'MONTHLY',
        standard_mileage_rate NUMERIC DEFAULT 0.67,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Employees Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        ssn_last_four VARCHAR(10) NOT NULL,
        employment_type VARCHAR(50) NOT NULL,
        pay_rate NUMERIC NOT NULL,
        pay_frequency VARCHAR(50) NOT NULL,
        w4_filing_status VARCHAR(50) NOT NULL,
        w4_multiple_jobs BOOLEAN DEFAULT FALSE,
        w4_dependent_credit NUMERIC DEFAULT 0,
        w4_other_income NUMERIC DEFAULT 0,
        w4_deductions NUMERIC DEFAULT 0,
        w4_extra_withholding NUMERIC DEFAULT 0,
        pa_psd_code VARCHAR(50) NOT NULL,
        pa_psd_name VARCHAR(255) NOT NULL,
        pa_resident_eit_rate NUMERIC NOT NULL,
        pa_work_psd_code VARCHAR(50) NOT NULL,
        pa_work_eit_rate NUMERIC NOT NULL,
        pa_lst_annual NUMERIC DEFAULT 52.00,
        pa_lst_exempt BOOLEAN DEFAULT FALSE,
        zelle_handle VARCHAR(255) NOT NULL,
        bank_account_masked VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Mileage Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mileage_logs (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) NOT NULL,
        trip_date VARCHAR(50) NOT NULL,
        origin_location TEXT NOT NULL,
        destination_location TEXT NOT NULL,
        business_purpose TEXT NOT NULL,
        start_odometer NUMERIC NOT NULL,
        end_odometer NUMERIC NOT NULL,
        calculated_miles NUMERIC NOT NULL,
        rate_applied NUMERIC NOT NULL,
        mileage_allowance NUMERIC NOT NULL,
        is_reimbursable_accountable_plan BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) NOT NULL,
        linked_pay_stub_id VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Travel Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS travel_expenses (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) NOT NULL,
        mileage_log_id VARCHAR(100),
        expense_date VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        payment_source VARCHAR(50) NOT NULL,
        receipt_note TEXT,
        receipt_url TEXT,
        is_reimbursable BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) NOT NULL,
        linked_pay_stub_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Payroll Runs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_runs (
        id VARCHAR(100) PRIMARY KEY,
        period_start VARCHAR(50) NOT NULL,
        period_end VARCHAR(50) NOT NULL,
        pay_date VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        total_gross NUMERIC NOT NULL,
        total_employee_taxes NUMERIC NOT NULL,
        total_reimbursements NUMERIC NOT NULL,
        total_net_pay NUMERIC NOT NULL,
        total_employer_taxes NUMERIC NOT NULL,
        total_company_cost NUMERIC NOT NULL,
        stubs_count INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        locked_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 6. Pay Stubs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pay_stubs (
        id VARCHAR(100) PRIMARY KEY,
        payroll_run_id VARCHAR(100) NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        period_start VARCHAR(50) NOT NULL,
        period_end VARCHAR(50) NOT NULL,
        pay_date VARCHAR(50) NOT NULL,
        hours_worked NUMERIC NOT NULL,
        overtime_hours NUMERIC NOT NULL,
        hourly_rate NUMERIC NOT NULL,
        gross_earnings NUMERIC NOT NULL,
        federal_income_tax NUMERIC NOT NULL,
        social_security_tax NUMERIC NOT NULL,
        medicare_tax NUMERIC NOT NULL,
        pa_state_tax NUMERIC NOT NULL,
        pa_local_eit NUMERIC NOT NULL,
        pa_lst NUMERIC NOT NULL,
        total_employee_taxes NUMERIC NOT NULL,
        mileage_reimbursement NUMERIC NOT NULL,
        travel_expenses_reimbursement NUMERIC NOT NULL,
        total_reimbursements NUMERIC NOT NULL,
        net_pay NUMERIC NOT NULL,
        employer_social_security NUMERIC NOT NULL,
        employer_medicare NUMERIC NOT NULL,
        employer_pa_uc NUMERIC NOT NULL,
        total_employer_taxes NUMERIC NOT NULL,
        total_company_cost NUMERIC NOT NULL,
        disbursement_method VARCHAR(50) NOT NULL,
        disbursement_status VARCHAR(50) NOT NULL,
        zelle_confirmation_ref VARCHAR(100),
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Compliance Tasks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_tasks (
        id VARCHAR(100) PRIMARY KEY,
        jurisdiction VARCHAR(100) NOT NULL,
        form_identifier VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        tax_period_label VARCHAR(100) NOT NULL,
        due_date VARCHAR(50) NOT NULL,
        filing_method VARCHAR(100) NOT NULL,
        portal_url TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        amount_due NUMERIC NOT NULL,
        box_values JSONB NOT NULL,
        confirmation_number VARCHAR(100),
        filed_date VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. General Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS general_expenses (
        id VARCHAR(100) PRIMARY KEY,
        expense_date VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        payee VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        schedule_c_line VARCHAR(50) NOT NULL,
        is_tax_deductible BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Full JSON Backup Store Table (for instant snapshot rollback / state synchronization)
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_state_snapshots (
        id VARCHAR(100) PRIMARY KEY DEFAULT 'current_state',
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');

    // Count records
    const orgRes = await client.query('SELECT COUNT(*) FROM organizations');
    const empRes = await client.query('SELECT COUNT(*) FROM employees');
    const milRes = await client.query('SELECT COUNT(*) FROM mileage_logs');
    const trvRes = await client.query('SELECT COUNT(*) FROM travel_expenses');
    const runRes = await client.query('SELECT COUNT(*) FROM payroll_runs');
    const stubRes = await client.query('SELECT COUNT(*) FROM pay_stubs');
    const compRes = await client.query('SELECT COUNT(*) FROM compliance_tasks');

    return {
      success: true,
      message: 'Vercel Postgres tables initialized and ready.',
      tableCounts: {
        organizations: parseInt(orgRes.rows[0].count, 10),
        employees: parseInt(empRes.rows[0].count, 10),
        mileage_logs: parseInt(milRes.rows[0].count, 10),
        travel_expenses: parseInt(trvRes.rows[0].count, 10),
        payroll_runs: parseInt(runRes.rows[0].count, 10),
        pay_stubs: parseInt(stubRes.rows[0].count, 10),
        compliance_tasks: parseInt(compRes.rows[0].count, 10),
      }
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('PostgreSQL table initialization error:', err);
    return {
      success: false,
      message: `Failed to initialize Postgres tables: ${err.message}`
    };
  } finally {
    client.release();
  }
}
