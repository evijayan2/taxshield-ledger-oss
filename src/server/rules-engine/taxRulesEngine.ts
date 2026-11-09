/**
 * Tax Rules Engine
 * Re-exported from taxshield-ledger-core to prevent code and fixture duplication.
 */
export {
  type TaxRulePayload,
  type ResolvedRule,
  refreshActiveRuleCache,
  resolveActiveRuleSync,
  resolveActiveRule,
  computeFederalWithholdingFromRule,
  createCalculationSnapshot,
} from 'taxshield-ledger-core';
