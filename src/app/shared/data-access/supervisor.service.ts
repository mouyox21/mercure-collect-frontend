import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupervisorDashboardDto } from './models/supervisor.model';

@Injectable()
export abstract class SupervisorService {
  abstract getDashboard(): Observable<SupervisorDashboardDto>;
}
