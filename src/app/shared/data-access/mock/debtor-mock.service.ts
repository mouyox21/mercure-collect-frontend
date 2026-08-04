import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DebtorPageDto, DebtorSearchCriteria, DebtorService } from '../debtor.service';
import { DebtorSearchResultDto, DebtorDetailDto } from '../models/debtor.model';
import { MockDataLoader } from './mock-data-loader.service';

interface DebtorsFixture { items: DebtorSearchResultDto[] }

@Injectable()
export class DebtorMockService extends DebtorService {
  private readonly mockData = inject(MockDataLoader);

  search(criteria: DebtorSearchCriteria): Observable<DebtorPageDto> {
    return this.mockData.load<DebtorsFixture>('debtors').pipe(
      map(fixture => this.applyFilters(fixture.items, criteria)),
    );
  }

  getDebtor(_debtorId: string): Observable<DebtorDetailDto> {
    return this.mockData.load<DebtorDetailDto>('debtor-detail');
  }

  private applyFilters(items: DebtorSearchResultDto[], c: DebtorSearchCriteria): DebtorPageDto {
    let result = [...items];

    if (c.query && c.query.length >= 3) {
      const q = c.query.toLowerCase();
      result = result.filter(d =>
        d.debtorName.toLowerCase().includes(q) ||
        d.ice.includes(q) ||
        (d.cin && d.cin.toLowerCase().includes(q)) ||
        d.city.toLowerCase().includes(q),
      );
    }

    if (c.clientType)  result = result.filter(d => d.clientType  === c.clientType);
    if (c.status)      result = result.filter(d => d.status      === c.status);
    if (c.riskSegment) result = result.filter(d => d.riskSegment === c.riskSegment);
    if (c.creditorId)  result = result.filter(d => d.creditorId  === c.creditorId);
    if (c.city)        result = result.filter(d =>
      d.city.toLowerCase().includes(c.city!.toLowerCase()),
    );

    if (c.sort) {
      const [col, dir] = c.sort.split(',');
      result = [...result].sort((a, b) => {
        const av = (a as any)[col];
        const bv = (b as any)[col];
        if (av === bv) return 0;
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''), 'fr');
        return dir === 'desc' ? -cmp : cmp;
      });
    }

    const total = result.length;
    const page  = c.page  ?? 0;
    const size  = c.size  ?? 20;
    return { total, items: result.slice(page * size, (page + 1) * size) };
  }
}
