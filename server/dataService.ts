import { getPool, initPostgresTables } from './db.js';

export async function loadAllDataFromPostgres(): Promise<any | null> {
  const pool = getPool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    // Check if snapshot exists
    const snapRes = await client.query('SELECT data FROM app_state_snapshots WHERE id = $1', ['current_state']);
    if (snapRes.rows.length > 0 && snapRes.rows[0].data) {
      return snapRes.rows[0].data;
    }

    // Otherwise reconstruct from tables
    const orgRes = await client.query('SELECT * FROM organizations LIMIT 1');
    if (orgRes.rows.length === 0) return null;

    const row = orgRes.rows[0];
    const org = {
      id: row.id,
      name: row.name,
      ein: row.ein,
      stateTaxId: row.state_tax_id,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      ownerName: row.owner_name,
      ownerEmail: row.owner_email,
      ownerTaxBracket: parseFloat(row.owner_tax_bracket),
      filingFrequencyPA: row.filing_frequency_pa,
      standardMileageRate: parseFloat(row.standard_mileage_rate),
    };

    const empRes = await client.query('SELECT * FROM employees ORDER BY first_name ASC');
    const employees = empRes.rows.map(e => ({
      id: e.id,
      firstName: e.first_name,
      lastName: e.last_name,
      email: e.email,
      phone: e.phone,
      ssnLastFour: e.ssn_last_four,
      employmentType: e.employment_type,
      payRate: parseFloat(e.pay_rate),
      payFrequency: e.pay_frequency,
      w4FilingStatus: e.w4_filing_status,
      w4MultipleJobs: e.w4_multiple_jobs,
      w4DependentCredit: parseFloat(e.w4_dependent_credit),
      w4OtherIncome: parseFloat(e.w4_other_income),
      w4Deductions: parseFloat(e.w4_deductions),
      w4ExtraWithholding: parseFloat(e.w4_extra_withholding),
      paPsdCode: e.pa_psd_code,
      paPsdName: e.pa_psd_name,
      paResidentEitRate: parseFloat(e.pa_resident_eit_rate),
      paWorkPsdCode: e.pa_work_psd_code,
      paWorkEitRate: parseFloat(e.pa_work_eit_rate),
      paLstAnnual: parseFloat(e.pa_lst_annual),
      paLstExempt: e.pa_lst_exempt,
      zelleHandle: e.zelle_handle,
      bankAccountMasked: e.bank_account_masked,
      isActive: e.is_active,
    }));

    const milRes = await client.query('SELECT * FROM mileage_logs ORDER BY trip_date DESC');
    const mileageLogs = milRes.rows.map(m => ({
      id: m.id,
      employeeId: m.employee_id,
      tripDate: m.trip_date,
      originLocation: m.origin_location,
      destinationLocation: m.destination_location,
      businessPurpose: m.business_purpose,
      startOdometer: parseFloat(m.start_odometer),
      endOdometer: parseFloat(m.end_odometer),
      calculatedMiles: parseFloat(m.calculated_miles),
      rateApplied: parseFloat(m.rate_applied),
      mileageAllowance: parseFloat(m.mileage_allowance),
      isReimbursableAccountablePlan: m.is_reimbursable_accountable_plan,
      status: m.status,
      linkedPayStubId: m.linked_pay_stub_id,
      notes: m.notes,
      createdAt: m.created_at,
    }));

    const trvRes = await client.query('SELECT * FROM travel_expenses ORDER BY expense_date DESC');
    const travelExpenses = trvRes.rows.map(t => ({
      id: t.id,
      employeeId: t.employee_id,
      mileageLogId: t.mileage_log_id,
      expenseDate: t.expense_date,
      category: t.category,
      description: t.description,
      amount: parseFloat(t.amount),
      paymentSource: t.payment_source,
      receiptNote: t.receipt_note,
      receiptUrl: t.receipt_url,
      isReimbursable: t.is_reimbursable,
      status: t.status,
      linkedPayStubId: t.linked_pay_stub_id,
      createdAt: t.created_at,
    }));

    const runRes = await client.query('SELECT * FROM payroll_runs ORDER BY period_end DESC');
    const payrollRuns = runRes.rows.map(r => ({
      id: r.id,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      payDate: r.pay_date,
      status: r.status,
      totalGross: parseFloat(r.total_gross),
      totalEmployeeTaxes: parseFloat(r.total_employee_taxes),
      totalReimbursements: parseFloat(r.total_reimbursements),
      totalNetPay: parseFloat(r.total_net_pay),
      totalEmployerTaxes: parseFloat(r.total_employer_taxes),
      totalCompanyCost: parseFloat(r.total_company_cost),
      stubsCount: r.stubs_count,
      createdAt: r.created_at,
      lockedAt: r.locked_at,
    }));

    const stubRes = await client.query('SELECT * FROM pay_stubs ORDER BY pay_date DESC');
    const payStubs = stubRes.rows.map(s => ({
      id: s.id,
      payrollRunId: s.payroll_run_id,
      employeeId: s.employee_id,
      periodStart: s.period_start,
      periodEnd: s.period_end,
      payDate: s.pay_date,
      hoursWorked: parseFloat(s.hours_worked),
      overtimeHours: parseFloat(s.overtime_hours),
      hourlyRate: parseFloat(s.hourly_rate),
      grossEarnings: parseFloat(s.gross_earnings),
      federalIncomeTax: parseFloat(s.federal_income_tax),
      socialSecurityTax: parseFloat(s.social_security_tax),
      medicareTax: parseFloat(s.medicare_tax),
      paStateTax: parseFloat(s.pa_state_tax),
      paLocalEit: parseFloat(s.pa_local_eit),
      paLst: parseFloat(s.pa_lst),
      totalEmployeeTaxes: parseFloat(s.total_employee_taxes),
      mileageReimbursement: parseFloat(s.mileage_reimbursement),
      travelExpensesReimbursement: parseFloat(s.travel_expenses_reimbursement),
      totalReimbursements: parseFloat(s.total_reimbursements),
      netPay: parseFloat(s.net_pay),
      employerSocialSecurity: parseFloat(s.employer_social_security),
      employerMedicare: parseFloat(s.employer_medicare),
      employerPaUc: parseFloat(s.employer_pa_uc),
      totalEmployerTaxes: parseFloat(s.total_employer_taxes),
      totalCompanyCost: parseFloat(s.total_company_cost),
      disbursementMethod: s.disbursement_method,
      disbursementStatus: s.disbursement_status,
      zelleConfirmationRef: s.zelle_confirmation_ref,
      paidAt: s.paid_at,
      createdAt: s.created_at,
    }));

    const compRes = await client.query('SELECT * FROM compliance_tasks ORDER BY due_date ASC');
    const complianceTasks = compRes.rows.map(c => ({
      id: c.id,
      jurisdiction: c.jurisdiction,
      formIdentifier: c.form_identifier,
      title: c.title,
      taxPeriodLabel: c.tax_period_label,
      dueDate: c.due_date,
      filingMethod: c.filing_method,
      portalUrl: c.portal_url,
      status: c.status,
      amountDue: parseFloat(c.amount_due),
      boxValues: c.box_values,
      confirmationNumber: c.confirmation_number,
      filedDate: c.filed_date,
      notes: c.notes,
      createdAt: c.created_at,
    }));

    const genRes = await client.query('SELECT * FROM general_expenses ORDER BY expense_date DESC');
    const generalExpenses = genRes.rows.map(g => ({
      id: g.id,
      expenseDate: g.expense_date,
      category: g.category,
      payee: g.payee,
      description: g.description,
      amount: parseFloat(g.amount),
      scheduleCLine: g.schedule_c_line,
      isTaxDeductible: g.is_tax_deductible,
      notes: g.notes,
      createdAt: g.created_at,
    }));

    return {
      org,
      employees,
      mileageLogs,
      travelExpenses,
      payrollRuns,
      payStubs,
      complianceTasks,
      generalExpenses,
    };
  } catch (err) {
    console.error('Error loading data from PostgreSQL:', err);
    return null;
  } finally {
    client.release();
  }
}

export async function saveAllDataToPostgres(data: any): Promise<{ success: boolean; error?: string }> {
  const pool = getPool();
  if (!pool) {
    return { success: false, error: 'No POSTGRES_URL configured' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Save state snapshot
    await client.query(
      `INSERT INTO app_state_snapshots (id, data, updated_at) 
       VALUES ('current_state', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(data)]
    );

    // 2. Sync organization table
    if (data.org) {
      await client.query(
        `INSERT INTO organizations (
          id, name, ein, state_tax_id, address, city, state, zip, 
          owner_name, owner_email, owner_tax_bracket, filing_frequency_pa, standard_mileage_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          ein = EXCLUDED.ein,
          state_tax_id = EXCLUDED.state_tax_id,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zip = EXCLUDED.zip,
          owner_name = EXCLUDED.owner_name,
          owner_email = EXCLUDED.owner_email,
          owner_tax_bracket = EXCLUDED.owner_tax_bracket,
          filing_frequency_pa = EXCLUDED.filing_frequency_pa,
          standard_mileage_rate = EXCLUDED.standard_mileage_rate,
          updated_at = CURRENT_TIMESTAMP`,
        [
          data.org.id || 'org_main',
          data.org.name,
          data.org.ein,
          data.org.stateTaxId,
          data.org.address,
          data.org.city,
          data.org.state,
          data.org.zip,
          data.org.ownerName,
          data.org.ownerEmail,
          data.org.ownerTaxBracket || 24,
          data.org.filingFrequencyPA || 'MONTHLY',
          data.org.standardMileageRate || 0.67,
        ]
      );
    }

    // 3. Sync Employees
    if (Array.isArray(data.employees)) {
      await client.query('DELETE FROM employees');
      for (const emp of data.employees) {
        await client.query(
          `INSERT INTO employees (
            id, first_name, last_name, email, phone, ssn_last_four, 
            employment_type, pay_rate, pay_frequency, w4_filing_status, 
            w4_multiple_jobs, w4_dependent_credit, w4_other_income, 
            w4_deductions, w4_extra_withholding, pa_psd_code, pa_psd_name, 
            pa_resident_eit_rate, pa_work_psd_code, pa_work_eit_rate, 
            pa_lst_annual, pa_lst_exempt, zelle_handle, bank_account_masked, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
          [
            emp.id, emp.firstName, emp.lastName, emp.email, emp.phone, emp.ssnLastFour,
            emp.employmentType, emp.payRate, emp.payFrequency, emp.w4FilingStatus,
            emp.w4MultipleJobs || false, emp.w4DependentCredit || 0, emp.w4OtherIncome || 0,
            emp.w4Deductions || 0, emp.w4ExtraWithholding || 0, emp.paPsdCode, emp.paPsdName,
            emp.paResidentEitRate, emp.paWorkPsdCode, emp.paWorkEitRate,
            emp.paLstAnnual || 52, emp.paLstExempt || false, emp.zelleHandle,
            emp.bankAccountMasked || null, emp.isActive ?? true
          ]
        );
      }
    }

    // 4. Sync Mileage Logs
    if (Array.isArray(data.mileageLogs)) {
      await client.query('DELETE FROM mileage_logs');
      for (const m of data.mileageLogs) {
        await client.query(
          `INSERT INTO mileage_logs (
            id, employee_id, trip_date, origin_location, destination_location,
            business_purpose, start_odometer, end_odometer, calculated_miles,
            rate_applied, mileage_allowance, is_reimbursable_accountable_plan,
            status, linked_pay_stub_id, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            m.id, m.employeeId, m.tripDate, m.originLocation, m.destinationLocation,
            m.businessPurpose, m.startOdometer, m.endOdometer, m.calculatedMiles,
            m.rateApplied, m.mileageAllowance, m.isReimbursableAccountablePlan ?? true,
            m.status, m.linkedPayStubId || null, m.notes || null
          ]
        );
      }
    }

    // 5. Sync Travel Expenses
    if (Array.isArray(data.travelExpenses)) {
      await client.query('DELETE FROM travel_expenses');
      for (const t of data.travelExpenses) {
        await client.query(
          `INSERT INTO travel_expenses (
            id, employee_id, mileage_log_id, expense_date, category,
            description, amount, payment_source, receipt_note, receipt_url,
            is_reimbursable, status, linked_pay_stub_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            t.id, t.employeeId, t.mileageLogId || null, t.expenseDate, t.category,
            t.description, t.amount, t.paymentSource, t.receiptNote || null,
            t.receiptUrl || null, t.isReimbursable ?? true, t.status, t.linkedPayStubId || null
          ]
        );
      }
    }

    // 6. Sync Payroll Runs
    if (Array.isArray(data.payrollRuns)) {
      await client.query('DELETE FROM payroll_runs');
      for (const r of data.payrollRuns) {
        await client.query(
          `INSERT INTO payroll_runs (
            id, period_start, period_end, pay_date, status,
            total_gross, total_employee_taxes, total_reimbursements,
            total_net_pay, total_employer_taxes, total_company_cost, stubs_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            r.id, r.periodStart, r.periodEnd, r.payDate, r.status,
            r.totalGross, r.totalEmployeeTaxes, r.totalReimbursements,
            r.totalNetPay, r.totalEmployerTaxes, r.totalCompanyCost, r.stubsCount
          ]
        );
      }
    }

    // 7. Sync Pay Stubs
    if (Array.isArray(data.payStubs)) {
      await client.query('DELETE FROM pay_stubs');
      for (const s of data.payStubs) {
        await client.query(
          `INSERT INTO pay_stubs (
            id, payroll_run_id, employee_id, period_start, period_end, pay_date,
            hours_worked, overtime_hours, hourly_rate, gross_earnings,
            federal_income_tax, social_security_tax, medicare_tax, pa_state_tax,
            pa_local_eit, pa_lst, total_employee_taxes, mileage_reimbursement,
            travel_expenses_reimbursement, total_reimbursements, net_pay,
            employer_social_security, employer_medicare, employer_pa_uc,
            total_employer_taxes, total_company_cost, disbursement_method,
            disbursement_status, zelle_confirmation_ref
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`,
          [
            s.id, s.payrollRunId, s.employeeId, s.periodStart, s.periodEnd, s.payDate,
            s.hoursWorked, s.overtimeHours, s.hourlyRate, s.grossEarnings,
            s.federalIncomeTax, s.socialSecurityTax, s.medicareTax, s.paStateTax,
            s.paLocalEit, s.paLst, s.totalEmployeeTaxes, s.mileageReimbursement,
            s.travelExpensesReimbursement, s.totalReimbursements, s.netPay,
            s.employerSocialSecurity, s.employerMedicare, s.employerPaUc,
            s.totalEmployerTaxes, s.totalCompanyCost, s.disbursementMethod,
            s.disbursementStatus, s.zelleConfirmationRef || null
          ]
        );
      }
    }

    // 8. Sync Compliance Tasks
    if (Array.isArray(data.complianceTasks)) {
      await client.query('DELETE FROM compliance_tasks');
      for (const c of data.complianceTasks) {
        await client.query(
          `INSERT INTO compliance_tasks (
            id, jurisdiction, form_identifier, title, tax_period_label,
            due_date, filing_method, portal_url, status, amount_due,
            box_values, confirmation_number, filed_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            c.id, c.jurisdiction, c.formIdentifier, c.title, c.taxPeriodLabel,
            c.dueDate, c.filingMethod, c.portalUrl, c.status, c.amountDue,
            JSON.stringify(c.boxValues), c.confirmationNumber || null,
            c.filedDate || null, c.notes || null
          ]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error saving data to PostgreSQL:', err);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}
