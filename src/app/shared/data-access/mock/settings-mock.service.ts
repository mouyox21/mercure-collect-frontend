import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DmnPackagePageDto, ReferenceValuePageDto, SettingsService } from '../settings.service';
import { DmnTestCaseDto } from '../models/settings.model';
import { MockDataLoader } from './mock-data-loader.service';

@Injectable()
export class SettingsMockService extends SettingsService {
  private readonly mockData = inject(MockDataLoader);

  getReferenceValues(domain?: string): Observable<ReferenceValuePageDto> {
    return this.mockData.load<ReferenceValuePageDto>('reference-values').pipe(
      map(f => ({ items: domain ? f.items.filter(r => r.domain === domain) : f.items })),
    );
  }

  getDmnPackages(): Observable<DmnPackagePageDto> {
    return this.mockData.load<DmnPackagePageDto>('dmn-packages');
  }

  getDmnTestCases(packageId: string): Observable<DmnTestCaseDto[]> {
    return this.mockData.load<DmnPackagePageDto>('dmn-packages').pipe(
      map(f => f.testCases.filter(tc => tc.packageId === packageId)),
    );
  }
}
