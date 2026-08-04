import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EscalationDecisionCommand, EscalationPageDto, EscalationService } from '../escalation.service';
import { EscalationDto, EscalationStatus } from '../models/supervisor.model';
import { MockDataLoader } from './mock-data-loader.service';

interface EscalationsFixture { items: EscalationDto[] }

@Injectable()
export class EscalationMockService extends EscalationService {
  private readonly mockData = inject(MockDataLoader);

  getEscalations(status?: EscalationStatus): Observable<EscalationPageDto> {
    return this.mockData.load<EscalationsFixture>('escalations').pipe(
      map(f => ({ items: status ? f.items.filter(e => e.status === status) : f.items })),
    );
  }

  decide(command: EscalationDecisionCommand): Observable<EscalationDto> {
    return this.mockData.load<EscalationsFixture>('escalations').pipe(
      map(f => {
        const item = f.items.find(e => e.escalationId === command.escalationId);
        if (!item) throw { status: 404, message: `Escalation ${command.escalationId} not found` };
        return {
          ...item,
          status: command.decision,
          decidedAt: new Date().toISOString(),
          decidedBy: 'Jean Martin',
          decisionComment: command.comment,
        } as EscalationDto;
      }),
    );
  }
}
