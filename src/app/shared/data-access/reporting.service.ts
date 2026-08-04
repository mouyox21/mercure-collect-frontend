import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { KpiResponse, ReportingFilterDto } from './models/reporting.model';

export interface KpiPageDto {
  filters: ReportingFilterDto;
  kpis: KpiResponse[];
}

@Injectable()
export abstract class ReportingService {
  abstract getKpis(filter: ReportingFilterDto): Observable<KpiPageDto>;
}
