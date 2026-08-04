import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentPromiseDto, PaymentPlanCommand, PaymentPlanDto, CreatePromiseCommand } from './models/payment.model';

export interface PaymentPromisePageDto {
  items: PaymentPromiseDto[];
}

export interface PaymentPlanPageDto {
  items: PaymentPlanDto[];
}

@Injectable()
export abstract class PaymentService {
  abstract getPromises(caseId?: string): Observable<PaymentPromisePageDto>;
  abstract createPromise(command: CreatePromiseCommand): Observable<PaymentPromiseDto>;
  abstract getPaymentPlan(caseId: string): Observable<PaymentPlanDto | null>;
  abstract createPaymentPlan(command: PaymentPlanCommand): Observable<PaymentPlanDto>;
}
