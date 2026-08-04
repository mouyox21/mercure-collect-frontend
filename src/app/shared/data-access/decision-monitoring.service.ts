import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DecisionMonitoringDto } from './models/supervisor.model';

export interface DecisionMonitoringPageDto {
  items: DecisionMonitoringDto[];
}

@Injectable()
export abstract class DecisionMonitoringService {
  abstract getDecisions(caseId?: string): Observable<DecisionMonitoringPageDto>;
  abstract submitFeedback(decisionId: string, feedback: string): Observable<DecisionMonitoringDto>;
}
