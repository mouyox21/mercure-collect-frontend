import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CollectionCaseSearchCriteria,
  CollectionCaseListItem,
  CollectionCaseDetailDto,
  CollectionActionCommand,
} from './models/collection-case.model';

export interface CollectionCasePageDto {
  total: number;
  items: CollectionCaseListItem[];
}

@Injectable()
export abstract class CollectionCaseService {
  abstract getCases(criteria: CollectionCaseSearchCriteria): Observable<CollectionCasePageDto>;
  abstract getCaseDetail(caseId: string): Observable<CollectionCaseDetailDto>;
  abstract performAction(command: CollectionActionCommand): Observable<void>;
}
