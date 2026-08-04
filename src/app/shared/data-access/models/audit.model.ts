export interface AuditEventDto {
  eventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  eventDate: string;
  description: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  creditorId?: string;
  correlationId?: string;
}
