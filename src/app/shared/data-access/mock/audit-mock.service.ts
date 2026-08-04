import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuditEventPageDto, AuditFilter, AuditService } from '../audit.service';
import { AuditEventDto } from '../models/audit.model';
import { MockDataLoader } from './mock-data-loader.service';

interface AuditFixture { items: AuditEventDto[] }

@Injectable()
export class AuditMockService extends AuditService {
  private readonly mockData = inject(MockDataLoader);

  getEvents(filter?: AuditFilter): Observable<AuditEventPageDto> {
    return this.mockData.load<AuditFixture>('audit-events').pipe(
      map(f => {
        let items = f.items;
        if (filter?.entityType) items = items.filter(e => e.entityType === filter.entityType);
        if (filter?.entityId)   items = items.filter(e => e.entityId   === filter.entityId);
        if (filter?.userId)     items = items.filter(e => e.userId     === filter.userId);
        return { items };
      }),
    );
  }
}
