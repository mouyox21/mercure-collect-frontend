import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LegalCaseDto } from './models/legal-case.model';

export interface LegalCasePageDto {
  items: LegalCaseDto[];
}

@Injectable()
export abstract class LegalCaseService {
  abstract getLegalCases(creditorId?: string): Observable<LegalCasePageDto>;
  abstract getLegalCase(legalCaseId: string): Observable<LegalCaseDto>;
}
