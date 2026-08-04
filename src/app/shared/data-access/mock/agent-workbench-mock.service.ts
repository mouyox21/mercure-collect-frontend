import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AgentWorkbenchDto, AgentWorkbenchService } from '../agent-workbench.service';
import { MockDataLoader } from './mock-data-loader.service';

@Injectable()
export class AgentWorkbenchMockService extends AgentWorkbenchService {
  private readonly mockData = inject(MockDataLoader);

  getWorkbench(): Observable<AgentWorkbenchDto> {
    return this.mockData.load<AgentWorkbenchDto>('agent-workbench');
  }
}
