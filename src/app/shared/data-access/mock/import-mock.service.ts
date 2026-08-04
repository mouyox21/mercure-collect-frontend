import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ImportBatchPageDto, ImportService } from '../import.service';
import { ImportBatchDto, ImportBatchStatus } from '../models/import.model';
import { MockDataLoader } from './mock-data-loader.service';

interface ImportBatchesFixture { items: ImportBatchDto[] }

@Injectable()
export class ImportMockService extends ImportService {
  private readonly mockData = inject(MockDataLoader);

  getBatches(status?: ImportBatchStatus): Observable<ImportBatchPageDto> {
    return this.mockData.load<ImportBatchesFixture>('import-batches').pipe(
      map(f => ({ items: status ? f.items.filter(b => b.status === status) : f.items })),
    );
  }

  getBatch(batchId: string): Observable<ImportBatchDto> {
    return this.mockData.load<ImportBatchesFixture>('import-batches').pipe(
      map(f => {
        const item = f.items.find(b => b.batchId === batchId);
        if (!item) throw { status: 404, message: `Batch ${batchId} not found` };
        return item;
      }),
    );
  }
}
