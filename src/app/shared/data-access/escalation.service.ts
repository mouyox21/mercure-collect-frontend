import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EscalationDto, EscalationStatus } from './models/supervisor.model';

export interface EscalationPageDto {
  items: EscalationDto[];
}

export interface EscalationDecisionCommand {
  escalationId: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
}

@Injectable()
export abstract class EscalationService {
  abstract getEscalations(status?: EscalationStatus): Observable<EscalationPageDto>;
  abstract decide(command: EscalationDecisionCommand): Observable<EscalationDto>;
}
