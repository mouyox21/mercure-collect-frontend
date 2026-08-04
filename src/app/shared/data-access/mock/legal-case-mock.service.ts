import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LegalCasePageDto, LegalCaseService } from '../legal-case.service';
import { LegalCaseDto } from '../models/legal-case.model';
import { MockDataLoader } from './mock-data-loader.service';

interface LegalCasesFixture { items: LegalCaseDto[] }

@Injectable()
export class LegalCaseMockService extends LegalCaseService {
  private readonly mockData = inject(MockDataLoader);

  getLegalCases(creditorId?: string): Observable<LegalCasePageDto> {
    return this.mockData.load<LegalCasesFixture>('legal-cases').pipe(
      map(f => ({ items: creditorId ? f.items.filter(c => (c as any).creditorId === creditorId) : f.items })),
    );
  }

  getLegalCase(legalCaseId: string): Observable<LegalCaseDto> {
    return this.mockData.load<LegalCasesFixture>('legal-cases').pipe(
      map(f => {
        const item = f.items.find(c => c.legalCaseId === legalCaseId);
        if (!item) throw { status: 404, message: `Legal case ${legalCaseId} not found` };
        return item;
      }),
    );
  }
}
