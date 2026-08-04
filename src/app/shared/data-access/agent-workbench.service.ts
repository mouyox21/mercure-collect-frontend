import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HeaderAgentWorkbenchDto, ActionCategoryDto } from './models/agent-workbench.model';

export interface AgentWorkbenchDto {
  header: HeaderAgentWorkbenchDto;
  categories: ActionCategoryDto[];
}

@Injectable()
export abstract class AgentWorkbenchService {
  abstract getWorkbench(): Observable<AgentWorkbenchDto>;
}
