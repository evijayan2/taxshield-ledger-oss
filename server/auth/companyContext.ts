import { prisma } from '../prisma.js';

export interface UserCompanyContext {
  membershipId: string;
  companyId: string;
  companyName: string;
  role: 'OWNER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
}

/**
 * Retrieves the active company membership context for a user.
 * In OSS mode, each user belongs to the single company configured.
 */
export async function getActiveCompanyForUser(userId: string): Promise<UserCompanyContext | null> {
  const membership = await prisma.companyMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    membershipId: membership.id,
    companyId: membership.companyId,
    companyName: membership.company.name,
    role: membership.role,
    status: membership.status,
  };
}

/**
 * Checks if a company already exists and whether any owner is configured.
 */
export async function getCompanyBootstrapStatus(): Promise<{
  hasCompany: boolean;
  hasOwner: boolean;
  company: { id: string; name: string; ownerEmail: string } | null;
}> {
  const company = await prisma.company.findFirst({
    select: { id: true, name: true, ownerEmail: true },
  });

  const ownerCount = await prisma.companyMembership.count({
    where: {
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  const userCount = await prisma.user.count();

  return {
    hasCompany: Boolean(company),
    hasOwner: ownerCount > 0 || userCount > 0,
    company: company || null,
  };
}
