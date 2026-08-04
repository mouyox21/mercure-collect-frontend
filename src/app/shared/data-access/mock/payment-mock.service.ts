import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PaymentPromisePageDto, PaymentPlanPageDto, PaymentService } from '../payment.service';
import {
  PaymentPromiseDto,
  PaymentPlanCommand,
  PaymentPlanDto,
  PaymentPromiseStatus,
  CreatePromiseCommand,
} from '../models/payment.model';
import { MockDataLoader } from './mock-data-loader.service';

interface PromisesFixture { items: PaymentPromiseDto[] }
interface PlansFixture    { items: PaymentPlanDto[]    }

@Injectable()
export class PaymentMockService extends PaymentService {
  private readonly mockData = inject(MockDataLoader);

  // In-memory list for newly created promises during the session
  private readonly created: PaymentPromiseDto[] = [];

  getPromises(caseId?: string): Observable<PaymentPromisePageDto> {
    const today = new Date().toISOString().slice(0, 10);
    return this.mockData.load<PromisesFixture>('payment-promises').pipe(
      map(f => {
        const all = [...f.items, ...this.created];
        const filtered = caseId ? all.filter(p => p.caseId === caseId) : all;
        const withBroken = filtered.map(p =>
          p.status === 'ACTIVE' && p.promiseDate < today
            ? { ...p, status: 'BROKEN' as PaymentPromiseStatus }
            : p
        );
        const sorted = withBroken.sort((a, b) => a.promiseDate.localeCompare(b.promiseDate));
        return { items: sorted };
      }),
    );
  }

  createPromise(command: CreatePromiseCommand): Observable<PaymentPromiseDto> {
    const today = new Date().toISOString().slice(0, 10);
    const autoStatus: PaymentPromiseStatus =
      command.promiseDate < today ? 'BROKEN' : 'ACTIVE';
    const dto: PaymentPromiseDto = {
      promiseId:          `PROM-NEW-${Date.now()}`,
      caseId:             command.caseId,
      caseReference:      '',
      debtorId:           '',
      debtorName:         '',
      promiseDate:        command.promiseDate,
      promiseAmount:      command.promiseAmount,
      currency:           command.currency,
      channel:            command.channel,
      status:             autoStatus,
      createdByAgentId:   'AGT-001',
      createdByAgentName: 'Agent (session)',
      createdAt:          new Date().toISOString(),
      notes:              command.notes,
    };
    this.created.push(dto);
    return of(dto).pipe(delay(300));
  }

  getPaymentPlan(caseId: string): Observable<PaymentPlanDto | null> {
    return this.mockData.load<PlansFixture>('payment-plans').pipe(
      map(f => f.items.find(p => p.caseId === caseId) ?? null),
    );
  }

  createPaymentPlan(command: PaymentPlanCommand): Observable<PaymentPlanDto> {
    return this.mockData.load<PlansFixture>('payment-plans').pipe(
      map(() => ({ ...command, derogation: command.derogation ?? false })),
    );
  }
}
