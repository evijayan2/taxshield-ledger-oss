/**
 * Browser-safe stub for @prisma/client and .prisma/client/index-browser.
 *
 * Prisma Client is a backend ORM for Node.js and cannot run inside browser environments.
 * This stub provides browser-safe stubs and enum constants to prevent Vite / Rollup
 * from attempting to bundle or emit invalid bare ESM imports for .prisma/client/index-browser.
 */

export class PrismaClient {
  constructor() {
    // No-op in browser environment
  }
  async $connect(): Promise<void> {
    return Promise.resolve();
  }
  async $disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

export const prisma = new PrismaClient();

export const RuleType = {
  FLAT_RATE: 'FLAT_RATE',
  BRACKET_PERCENTAGE: 'BRACKET_PERCENTAGE',
  STANDARD_ALLOWANCE: 'STANDARD_ALLOWANCE',
  THRESHOLD: 'THRESHOLD',
  EXEMPTION: 'EXEMPTION',
  PER_MILE_RATE: 'PER_MILE_RATE',
  RATE: 'RATE',
  BRACKET: 'BRACKET',
  ALLOWANCE: 'ALLOWANCE',
  FORMULA: 'FORMULA',
} as const;

export type RuleType = (typeof RuleType)[keyof typeof RuleType];

export const RuleStatus = {
  DISCOVERED: 'DISCOVERED',
  IN_REVIEW: 'IN_REVIEW',
  VALIDATED: 'VALIDATED',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  SUPERSEDED: 'SUPERSEDED',
  ARCHIVED: 'ARCHIVED',
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  DEPRECATED: 'DEPRECATED',
} as const;

export type RuleStatus = (typeof RuleStatus)[keyof typeof RuleStatus];

export const CitationTier = {
  TIER_1_OFFICIAL: 'TIER_1_OFFICIAL',
  TIER_2_GOV_DEPT: 'TIER_2_GOV_DEPT',
  TIER_3_THIRD_PARTY: 'TIER_3_THIRD_PARTY',
  TIER_1_STATUTORY: 'TIER_1_STATUTORY',
  TIER_2_ADMINISTRATIVE: 'TIER_2_ADMINISTRATIVE',
} as const;

export type CitationTier = (typeof CitationTier)[keyof typeof CitationTier];

export const PayFrequency = {
  WEEKLY: 'WEEKLY',
  BI_WEEKLY: 'BI_WEEKLY',
  SEMI_MONTHLY: 'SEMI_MONTHLY',
  MONTHLY: 'MONTHLY',
} as const;

export const WeekendRollRule = {
  PREVIOUS_BUSINESS_DAY: 'PREVIOUS_BUSINESS_DAY',
  NEXT_BUSINESS_DAY: 'NEXT_BUSINESS_DAY',
  EXACT_DAY: 'EXACT_DAY',
} as const;

export const CalendarPeriodStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  OPEN: 'OPEN',
  LOCKED: 'LOCKED',
  COMPLETED: 'COMPLETED',
} as const;

export const OssRole = {
  OWNER: 'OWNER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export const Prisma = {
  Decimal: class Decimal {
    constructor(public val: unknown) {}
    toString() { return String(this.val); }
    toNumber() { return Number(this.val); }
  },
};

export default {
  PrismaClient,
  prisma,
  RuleType,
  RuleStatus,
  CitationTier,
  PayFrequency,
  WeekendRollRule,
  CalendarPeriodStatus,
  OssRole,
  Prisma,
};
