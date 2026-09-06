export interface TaxRuleAdminItem {
  id: string;
  ruleCode: string;
  name: string;
  jurisdiction: string;
  category: string;
  versionNumber: number;
  status: 'DISCOVERED' | 'IN_REVIEW' | 'VALIDATED' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED';
  sourceTitle: string;
  sourceUrl: string;
  sourcePublisher: string;
  statuteReference: string;
  citationTier: 'TIER_1_OFFICIAL' | 'TIER_2_GOV_DEPT' | 'TIER_3_THIRD_PARTY';
  effectiveStart: string;
  ruleDataSummary: string;
  ruleData?: any;
}

export const DEFAULT_TAX_RULES: TaxRuleAdminItem[] = [];


