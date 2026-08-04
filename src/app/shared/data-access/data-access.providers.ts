import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ActiveRoleService } from './active-role.service';
import { MockActiveRoleService } from './mock/active-role-mock.service';
import { PermissionService } from './permission.service';
import { MockPermissionService } from './mock/permission-mock.service';
import { UserService } from './user.service';
import { MockUserService } from './mock/user-mock.service';
import { CreditorService } from './creditor.service';
import { MockCreditorService } from './mock/creditor-mock.service';
import { NotificationService } from './notification.service';
import { MockNotificationService } from './mock/notification-mock.service';
import { AgentWorkbenchService } from './agent-workbench.service';
import { AgentWorkbenchMockService } from './mock/agent-workbench-mock.service';
import { CollectionCaseService } from './collection-case.service';
import { CollectionCaseMockService } from './mock/collection-case-mock.service';
import { DebtorService } from './debtor.service';
import { DebtorMockService } from './mock/debtor-mock.service';
import { PaymentService } from './payment.service';
import { PaymentMockService } from './mock/payment-mock.service';
import { LegalCaseService } from './legal-case.service';
import { LegalCaseMockService } from './mock/legal-case-mock.service';
import { SupervisorService } from './supervisor.service';
import { SupervisorMockService } from './mock/supervisor-mock.service';
import { EscalationService } from './escalation.service';
import { EscalationMockService } from './mock/escalation-mock.service';
import { DecisionMonitoringService } from './decision-monitoring.service';
import { DecisionMonitoringMockService } from './mock/decision-monitoring-mock.service';
import { ReportingService } from './reporting.service';
import { ReportingMockService } from './mock/reporting-mock.service';
import { SettingsService } from './settings.service';
import { SettingsMockService } from './mock/settings-mock.service';
import { ImportService } from './import.service';
import { ImportMockService } from './mock/import-mock.service';
import { AuditService } from './audit.service';
import { AuditMockService } from './mock/audit-mock.service';

function apiStub(service: string): never {
  throw new Error(`API mode not yet implemented for ${service}`);
}

export const dataAccessProviders: Provider[] =
  environment.dataSource === 'mock'
    ? [
        { provide: ActiveRoleService,           useClass: MockActiveRoleService           },
        { provide: PermissionService,           useClass: MockPermissionService           },
        { provide: UserService,                 useClass: MockUserService                 },
        { provide: CreditorService,             useClass: MockCreditorService             },
        { provide: NotificationService,         useClass: MockNotificationService         },
        { provide: AgentWorkbenchService,       useClass: AgentWorkbenchMockService       },
        { provide: CollectionCaseService,       useClass: CollectionCaseMockService       },
        { provide: DebtorService,               useClass: DebtorMockService               },
        { provide: PaymentService,              useClass: PaymentMockService              },
        { provide: LegalCaseService,            useClass: LegalCaseMockService            },
        { provide: SupervisorService,           useClass: SupervisorMockService           },
        { provide: EscalationService,           useClass: EscalationMockService           },
        { provide: DecisionMonitoringService,   useClass: DecisionMonitoringMockService   },
        { provide: ReportingService,            useClass: ReportingMockService            },
        { provide: SettingsService,             useClass: SettingsMockService             },
        { provide: ImportService,               useClass: ImportMockService               },
        { provide: AuditService,                useClass: AuditMockService                },
      ]
    : [
        { provide: ActiveRoleService,           useFactory: () => apiStub('ActiveRoleService')           },
        { provide: PermissionService,           useFactory: () => apiStub('PermissionService')           },
        { provide: UserService,                 useFactory: () => apiStub('UserService')                 },
        { provide: CreditorService,             useFactory: () => apiStub('CreditorService')             },
        { provide: NotificationService,         useFactory: () => apiStub('NotificationService')         },
        { provide: AgentWorkbenchService,       useFactory: () => apiStub('AgentWorkbenchService')       },
        { provide: CollectionCaseService,       useFactory: () => apiStub('CollectionCaseService')       },
        { provide: DebtorService,               useFactory: () => apiStub('DebtorService')               },
        { provide: PaymentService,              useFactory: () => apiStub('PaymentService')              },
        { provide: LegalCaseService,            useFactory: () => apiStub('LegalCaseService')            },
        { provide: SupervisorService,           useFactory: () => apiStub('SupervisorService')           },
        { provide: EscalationService,           useFactory: () => apiStub('EscalationService')           },
        { provide: DecisionMonitoringService,   useFactory: () => apiStub('DecisionMonitoringService')   },
        { provide: ReportingService,            useFactory: () => apiStub('ReportingService')            },
        { provide: SettingsService,             useFactory: () => apiStub('SettingsService')             },
        { provide: ImportService,               useFactory: () => apiStub('ImportService')               },
        { provide: AuditService,                useFactory: () => apiStub('AuditService')                },
      ];
