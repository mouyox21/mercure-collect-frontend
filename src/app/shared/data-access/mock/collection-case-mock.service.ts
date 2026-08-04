import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CollectionCasePageDto, CollectionCaseService } from '../collection-case.service';
import {
  CollectionCaseSearchCriteria,
  CollectionCaseDetailDto,
  CollectionActionCommand,
} from '../models/collection-case.model';
import { MockDataLoader } from './mock-data-loader.service';

interface CasesFixture { total: number; items: CollectionCaseDetailDto[] }

const NEXT_ACTION_BY_STATUS: Record<string, string> = {
  OPEN:      'Appel de relance prévu',
  PENDING:   'Suivi de promesse',
  SUSPENDED: 'Reprise à planifier',
  CLOSED:    '—',
};

@Injectable()
export class CollectionCaseMockService extends CollectionCaseService {
  private readonly mockData = inject(MockDataLoader);

  getCases(criteria: CollectionCaseSearchCriteria): Observable<CollectionCasePageDto> {
    return this.mockData.load<CasesFixture>('collection-cases').pipe(
      map(fixture => {
        let items: any[] = [...fixture.items];

        if (criteria.agentId)           items = items.filter(c => c.agentId === criteria.agentId);
        if (criteria.status)            items = items.filter(c => c.status === criteria.status);
        if (criteria.phase)             items = items.filter(c => c.phase === criteria.phase);
        if (criteria.categoryCode)      items = items.filter(c => c.categoryCode === criteria.categoryCode);
        if (criteria.priority)          items = items.filter(c => c.priority === criteria.priority);
        if (criteria.debtorName)        items = items.filter(c => c.debtorName?.toLowerCase().includes(criteria.debtorName!.toLowerCase()));
        if (criteria.caseReference)     items = items.filter(c => c.caseReference?.toLowerCase().includes(criteria.caseReference!.toLowerCase()));
        if (criteria.amountMin  != null) items = items.filter(c => c.overdueAmount >= criteria.amountMin!);
        if (criteria.amountMax  != null) items = items.filter(c => c.overdueAmount <= criteria.amountMax!);
        if (criteria.daysLateMin != null) items = items.filter(c => c.daysLate >= criteria.daysLateMin!);
        if (criteria.daysLateMax != null) items = items.filter(c => c.daysLate <= criteria.daysLateMax!);

        if (criteria.sort) {
          const [col, dir] = criteria.sort.split(',');
          items = [...items].sort((a, b) => {
            const av = a[col], bv = b[col];
            if (av === bv) return 0;
            const cmp = av < bv ? -1 : 1;
            return dir === 'asc' ? cmp : -cmp;
          });
        }

        items = items.map(c => ({
          ...c,
          nextActionLabel: c.nextActionLabel ?? NEXT_ACTION_BY_STATUS[c.status] ?? '—',
        }));

        const total = items.length;
        const start = criteria.page * criteria.size;
        return { total, items: items.slice(start, start + criteria.size) } as CollectionCasePageDto;
      }),
    );
  }

  getCaseDetail(_caseId: string): Observable<CollectionCaseDetailDto> {
    return this.mockData.load<CollectionCaseDetailDto>('case-detail');
  }

  performAction(_command: CollectionActionCommand): Observable<void> {
    return this.mockData.load<CasesFixture>('collection-cases').pipe(map(() => undefined));
  }
}
