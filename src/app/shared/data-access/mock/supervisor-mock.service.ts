import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupervisorService } from '../supervisor.service';
import { SupervisorDashboardDto } from '../models/supervisor.model';
import { MockDataLoader } from './mock-data-loader.service';

@Injectable()
export class SupervisorMockService extends SupervisorService {
  private readonly mockData = inject(MockDataLoader);

  getDashboard(): Observable<SupervisorDashboardDto> {
    return this.mockData.load<SupervisorDashboardDto>('supervisor-dashboard');
  }
}
