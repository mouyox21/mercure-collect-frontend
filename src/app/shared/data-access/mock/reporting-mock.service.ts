import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { KpiPageDto, ReportingService } from '../reporting.service';
import { ReportingFilterDto } from '../models/reporting.model';
import { MockDataLoader } from './mock-data-loader.service';

@Injectable()
export class ReportingMockService extends ReportingService {
  private readonly mockData = inject(MockDataLoader);

  getKpis(_filter: ReportingFilterDto): Observable<KpiPageDto> {
    return this.mockData.load<KpiPageDto>('reporting-kpis');
  }
}
