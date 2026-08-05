import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CaseDetailComponent } from './case-detail.component';
import { CollectionCaseService } from '../../shared/data-access/collection-case.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { MockPermissionService } from '../../shared/data-access/mock/permission-mock.service';
import { CollectionCaseDetailDto } from '../../shared/data-access/models/collection-case.model';
import { ModalFormValue } from '../../shared/ui/ui.types';

const CASE_STUB: CollectionCaseDetailDto = {
  caseId: 'c1',
  caseReference: 'REF-001',
  debtorId: 'd1',
  debtorName: 'Test Debtor',
  creditorId: 'cr1',
  creditorLabel: 'Créancier Test',
  phase: 'AMIABLE',
  status: 'OPEN',
  priority: 'NORMAL',
  categoryCode: 'CAT1',
  categoryLabel: 'Catégorie 1',
  overdueAmount: 1000,
  totalDebtAmount: 1500,
  daysLate: 30,
  openDate: '2026-01-01',
  lastActionDate: '2026-07-01',
  agentId: 'a1',
  agentName: 'Agent Test',
  contractReference: 'CONT-001',
  dmnDecision: {
    segment: 'STANDARD',
    nextBestAction: 'PHONE_CALL',
    nextBestActionReason: 'Appel recommandé',
    score: 75,
    computedAt: '2026-08-01T08:00:00Z',
  },
  hasActivePromise: false,
  hasActivePaymentPlan: false,
};

function buildComponent() {
  const fixture = TestBed.createComponent(CaseDetailComponent);
  const component = fixture.componentInstance;
  // Bypass ngOnInit network call — set state directly
  component['caseDetail'].set(CASE_STUB);
  component['viewState'].set('success');
  return { fixture, component };
}

describe('CaseDetailComponent — onCloseCase / onCloseConfirmed', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseDetailComponent],
      providers: [
        { provide: PermissionService, useClass: MockPermissionService },
        {
          provide: CollectionCaseService,
          useValue: {
            getCaseDetail: () => of(CASE_STUB),
            performAction: () => of(undefined),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'c1' } } },
        },
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    }).compileComponents();
  });

  it('should open closure modal instead of showing toast when onCloseCase() is called', () => {
    const { component } = buildComponent();

    component.onCloseCase();

    expect(component.closureModalOpen()).toBe(true);
    expect(component.showToast()).toBe(false);
  });

  it('should show success toast and close modal after onCloseConfirmed() with a motif', () => {
    const { component } = buildComponent();
    component['closureModalOpen'].set(true);

    const value: ModalFormValue = { motif: 'Dossier soldé intégralement', commentaire: '' };
    component.onCloseConfirmed(value);

    expect(component.closureModalOpen()).toBe(false);
    expect(component.showToast()).toBe(true);
    expect(component.toastMsg()).toContain('clôturé');
  });

  it('should update case status to CLOSED after confirmation', () => {
    const { component } = buildComponent();

    const value: ModalFormValue = { motif: 'Règlement complet', commentaire: '' };
    component.onCloseConfirmed(value);

    expect(component.caseDetail()?.status).toBe('CLOSED');
  });
});
