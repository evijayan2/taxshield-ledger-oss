import { AuditLogEntry } from '../types';

/**
  * Helper to create a structured AuditLogEntry record for compliance tracking.
  *
  * @param entityType - Name of the entity (e.g. 'GeneralExpense', 'MileageLog', 'PayrollRun')
  * @param entityId - Unique identifier of the record modified
  * @param action - Action performed ('CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE')
  * @param actorId - Email or user ID of the actor
  * @param previousState - Snapshot of entity before change (null for CREATE)
  * @param newState - Snapshot of entity after change (null for DELETE)
  * @param reason - Explanation for change (optional)
  * @returns Complete AuditLogEntry record
  */
export function createAuditLogEntry(
  entityType: string,
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE',
  actorId: string = 'owner',
  previousState: Record<string, unknown> | null = null,
  newState: Record<string, unknown> | null = null,
  reason: string = 'User initiated ledger update'
): AuditLogEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    entityType,
    entityId,
    action,
    actorId,
    previousState,
    newState,
    reason,
    timestamp: new Date().toISOString(),
  };
}
