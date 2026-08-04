import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ImportBatchDto, ImportBatchStatus } from './models/import.model';

export interface ImportBatchPageDto {
  items: ImportBatchDto[];
}

@Injectable()
export abstract class ImportService {
  abstract getBatches(status?: ImportBatchStatus): Observable<ImportBatchPageDto>;
  abstract getBatch(batchId: string): Observable<ImportBatchDto>;
}
