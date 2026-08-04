import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditEventDto } from './models/audit.model';

export interface AuditFilter {
  entityType?: string;
  entityId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditEventPageDto {
  items: AuditEventDto[];
}

@Injectable()
export abstract class AuditService {
  abstract getEvents(filter?: AuditFilter): Observable<AuditEventPageDto>;
}
