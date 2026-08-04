import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DecisionMonitoringPageDto, DecisionMonitoringService } from '../decision-monitoring.service';
import { DecisionMonitoringDto } from '../models/supervisor.model';
import { MockDataLoader } from './mock-data-loader.service';

interface DecisionsFixture { items: DecisionMonitoringDto[] }

@Injectable()
export class DecisionMonitoringMockService extends DecisionMonitoringService {
  private readonly mockData = inject(MockDataLoader);

  getDecisions(caseId?: string): Observable<DecisionMonitoringPageDto> {
    return this.mockData.load<DecisionsFixture>('decision-monitoring').pipe(
      map(f => ({ items: caseId ? f.items.filter(d => d.caseId === caseId) : f.items })),
    );
  }

  submitFeedback(decisionId: string, feedback: string): Observable<DecisionMonitoringDto> {
    return this.mockData.load<DecisionsFixture>('decision-monitoring').pipe(
      map(f => {
        const item = f.items.find(d => d.decisionId === decisionId);
        if (!item) throw { status: 404, message: `Decision ${decisionId} not found` };
        return { ...item, agentFeedback: feedback, agentFeedbackDate: new Date().toISOString() };
      }),
    );
  }
}
