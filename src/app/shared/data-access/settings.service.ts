import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReferenceValueDto, DmnPackageDto, DmnTestCaseDto } from './models/settings.model';

export interface ReferenceValuePageDto {
  items: ReferenceValueDto[];
}

export interface DmnPackagePageDto {
  items: DmnPackageDto[];
  testCases: DmnTestCaseDto[];
}

@Injectable()
export abstract class SettingsService {
  abstract getReferenceValues(domain?: string): Observable<ReferenceValuePageDto>;
  abstract getDmnPackages(): Observable<DmnPackagePageDto>;
  abstract getDmnTestCases(packageId: string): Observable<DmnTestCaseDto[]>;
}
