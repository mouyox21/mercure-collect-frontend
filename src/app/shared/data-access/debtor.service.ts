import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DebtorSearchResultDto, DebtorDetailDto } from './models/debtor.model';

export interface DebtorSearchCriteria {
  query?: string;
  clientType?: string;
  status?: string;
  riskSegment?: string;
  city?: string;
  creditorId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface DebtorPageDto {
  total: number;
  items: DebtorSearchResultDto[];
}

@Injectable()
export abstract class DebtorService {
  abstract search(criteria: DebtorSearchCriteria): Observable<DebtorPageDto>;
  abstract getDebtor(debtorId: string): Observable<DebtorDetailDto>;
}
