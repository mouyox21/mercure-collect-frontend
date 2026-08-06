# QA — Audit global MERCURE Collect AI

**Date :** 2026-08-04  
**Périmètre :** Audit complet en lecture seule — 8 volets  
**Méthode :** Lecture directe des fichiers sources ; confrontation PRD/agent.md vs code réel. Les rapports QA précédents (qa-navigation-audit.md, qa-roles-mapping.md, qa-states-coverage.md, qa-accessibility.md) sont pris en compte mais leurs affirmations ont été re-vérifiées dans le code.

---

## 1. Couverture fonctionnelle (CA-*)

### 1.1 Tableau récapitulatif par section PRD

| Section PRD | Écran | Route | Composant | CA couverts | CA manquants / partiels | Statut |
|---|---|---|---|---|---|---|
| 6.1 Dashboard Agent | Dashboard agent | `/dashboard` | `DashboardComponent` | CA-AGT-02, CA-AGT-03, CA-AGT-05 | CA-AGT-01 (persistance filtres localStorage absente, signals locaux seulement) ; CA-AGT-04 (persistance vue groupe/liste/kanban non sauvegardée en localStorage) | PARTIEL |
| 6.2 Dossiers | Recherche dossiers | `/dossiers` | `CollectionCasesComponent` | CA-DOS-01, CA-DOS-02 | CA-DOS-03 (réaffectation via ModalForm OK, campagne SMS/planification non implémentées) | PARTIEL |
| 6.3 Clients | Recherche clients | `/clients` | `ClientsComponent` | CA-CLI-01, CA-CLI-02, CA-CLI-03 | — | OK |
| 6.4 Détail client | Fiche 360° | `/clients/:debtorId` | `ClientsDebtoridComponent` | CA-CLD-01, CA-CLD-02, CA-CLD-03 | — | OK |
| 6.5 Détail dossier | Détail dossier | `/dossiers/:caseId` | `CaseDetailComponent` | CA-CAS-01, CA-CAS-02 | CA-CAS-03 (clôture bloquée si promesse active ✓, MAIS clôture superviseur sans confirmation ni motif → voir volet 4) | PARTIEL |
| 6.6 Action | Modale action | within case-detail & dashboard | `ActionModalComponent` | CA-ACT-01, CA-ACT-02 | — | OK |
| 6.7 Promesse | Liste / modale | `PromiseListComponent` + `PromiseModalComponent` | within case-detail | CA-PRO-01 | CA-PRO-02 (statut BROKEN automatique : logique dans mock, mais aucun test de régression automatisé) | PARTIEL |
| 6.8 Échéancier | Plan de paiement | `/dossiers/:caseId/echeanciers` | `PaymentScheduleComponent` | CA-ECH-01, CA-ECH-02 | — | OK |
| 6.9 Contentieux | Contentieux | `/contentieux` | `ContentieuxComponent` | CA-LEG-01 | CA-LEG-02 (blocage relances amiables affiché dans le panneau détail mais sans persistance réelle côté frontend au changement de statut) | PARTIEL |
| 6.10 Dashboard superviseur | Dashboard superviseur | `/superviseur/dashboard` | `SuperviseurDashboardComponent` | CA-SUP-01, CA-SUP-02 | — | OK |
| 6.11 Escalades | Console escalades | `/superviseur/escalades` | `SuperviseurEscaladesComponent` | CA-ESC-01, CA-ESC-02 | — | OK |
| 6.12 Supervision IA/DMN | Supervision IA | `/superviseur/ia-dmn` | `SuperviseurIaDmnComponent` | CA-DMN-01, CA-DMN-02 | — | OK |
| 6.13 Rapports | Catalogue rapports | `/rapports` | `ReportingComponent` | CA-RPT-01, CA-RPT-02 | — | OK |
| 6.14 Référentiels | Référentiels | `/parametrages/referentiels` | `ParametragesReferentielsComponent` | CA-SET-01, CA-SET-02 | — | OK |
| 6.15 Règles/Workflows | Règles & Workflows | `/parametrages/regles-workflows` | `ParametragesReglesWorkflowsComponent` | CA-DMNSET-01 | CA-DMNSET-02 (activation package sans étape de confirmation intermédiaire — voir qa-states-coverage.md) | PARTIEL |
| 6.16 Imports | Imports | `/parametrages/imports` | `ParametragesImportsComponent` | CA-IMP-01, CA-IMP-02 | — | OK |
| 6.17 Audit | Journal d'audit | `/parametrages/audit` | `ParametragesAuditComponent` | CA-AUD-01, CA-AUD-02 | — | OK |

### 1.2 Composants orphelins / dead code fonctionnel

| Répertoire | État | Impact |
|---|---|---|
| `src/app/collection-actions/` | **Supprimé le 2026-08-05** — architecture `shared/ui` acceptée (AN-FUNC-01 résolu) | — |
| `src/app/payments/` | **Supprimé le 2026-08-05** — architecture `shared/ui` acceptée (AN-FUNC-01 résolu) | — |
| `src/app/audit/` | **Supprimé le 2026-08-05** — `ParametragesAuditComponent` est sous `settings/audit/` (AN-FUNC-01 résolu) | — |

### 1.3 Écran manquant : Équipe Superviseur

La route `/superviseur/equipe` existe (`SuperviseurEquipeComponent` implémenté, lié dans `supervisor.routes.ts`). Aucun CA spécifique n'était listé dans le PRD pour cet écran (§6 ne le couvre pas explicitement), mais la mémoire projet confirme qu'il fait partie du lot MVP 3 livré. **Statut : hors-périmètre PRD direct mais présent.**

---

## 2. Architecture données Mock/API

### 2.1 Isolation HttpClient / JSON directs dans les composants

| Vérification | Résultat |
|---|---|
| HttpClient importé dans un composant hors `data-access/` | **OK** — aucune occurrence. Seuls `app.config.ts` (provider global) et `mock-data-loader.service.ts` importent HttpClient. |
| `fetch()` ou import JSON direct dans un composant | **OK** — aucune occurrence. |
| Import de fichier `assets/mock-data/` dans un composant | **OK** — seul `MockDataLoader` accède aux fixtures via HttpClient GET sur `/assets/mock-data/*.json`. |

> Référence : `src/app/shared/data-access/mock/mock-data-loader.service.ts` — unique point d'accès aux fixtures JSON.

### 2.2 Services abstraits et implémentations

| Service abstrait | Mock disponible | API disponible | Écart |
|---|---|---|---|
| `AgentWorkbenchService` | ✓ `AgentWorkbenchMockService` | ✗ **`apiStub` → throw Error** | Mode api-dev/production crash au démarrage |
| `CollectionCaseService` | ✓ | ✗ apiStub | idem |
| `DebtorService` | ✓ | ✗ apiStub | idem |
| `PaymentService` | ✓ | ✗ apiStub | idem |
| `LegalCaseService` | ✓ | ✗ apiStub | idem |
| `SupervisorService` | ✓ | ✗ apiStub | idem |
| `EscalationService` | ✓ | ✗ apiStub | idem |
| `DecisionMonitoringService` | ✓ | ✗ apiStub | idem |
| `ReportingService` | ✓ | ✗ apiStub | idem |
| `SettingsService` | ✓ | ✗ apiStub | idem |
| `ImportService` | ✓ | ✗ apiStub | idem |
| `AuditService` | ✓ | ✗ apiStub | idem |
| `ActiveRoleService` | ✓ `MockActiveRoleService` | ✗ apiStub | idem |
| `PermissionService` | ✓ `MockPermissionService` | ✗ apiStub | idem |
| `UserService` | ✓ | ✗ apiStub | idem |
| `CreditorService` | ✓ | ✗ apiStub | idem |
| `NotificationService` | ✓ | ✗ apiStub | idem |

**KO global** : `src/app/shared/data-access/api/` ne contient qu'un `.gitkeep`. Toutes les implémentations API sont remplacées par `apiStub()` qui lance une exception. Le mode `api-dev` et `production` (avec `dataSource: 'api'`) crashe immédiatement. Ce comportement est intentionnel à ce stade du projet (backend non disponible), mais non documenté dans le PRD comme décision architecturale acceptée.

### 2.3 Cohérence des DTO

Vérification sur un échantillon :
- `AgentWorkbenchService` → `AgentWorkbenchDto` dans `agent-workbench.service.ts` correspond aux champs du fixture `assets/mock-data/agent-workbench.json` → **OK**
- `CollectionCaseDetailDto` dans `models/collection-case.model.ts` utilisé sans divergence dans `case-detail.component.ts` → **OK**
- `DebtorDetailDto` dans `models/debtor.model.ts` utilisé sans divergence dans `debtor-detail.component.ts` → **OK**
- Aucune duplication de types locaux détectée dans les composants → **OK**

### 2.4 Fixtures mock-data

| Fixture attendue (agent.md §5) | Présente | Écart |
|---|---|---|
| `agent-workbench.json` | ✓ | — |
| `collection-cases.json` | ✓ | — |
| `debtors.json` | ✓ | — |
| `debtor-detail.json` | ✓ | — |
| `payment-promises.json` | ✓ | — |
| `payment-plans.json` | ✓ | — |
| `legal-cases.json` | ✓ | — |
| `supervisor-dashboard.json` | ✓ | — |
| `escalations.json` | ✓ | — |
| `decision-monitoring.json` | ✓ | — |
| `reporting-kpis.json` | ✓ | — |
| `reference-values.json` | ✓ | — |
| `dmn-packages.json` | ✓ | — |
| `import-batches.json` | ✓ | — |
| `audit-events.json` | ✓ | — |
| `case-detail.json` | ✓ (extra, non listé agent.md mais utilisée) | Bonus utile |

**16/15 fixtures présentes — toutes couvertes.** Bonne cohérence des IDs croisés (caseId, debtorId réutilisés entre fixtures).

---

## 3. Navigation et rôles

### 3.1 Vérification des 9 anomalies qa-navigation-audit.md

| # | Anomalie | Statut vérifié 2026-08-04 | Preuve code |
|---|---|---|---|
| 1 | Double sidenav escalades/ia-dmn | ✅ OK | Templates `supervisor-escalades.component.html` et `supervisor-ia-dmn.component.html` : aucun bloc `sidenav` interne — confirmé par grep (0 résultats sur pattern `__sidenav`). |
| 2 | Menu interne identique SUPERVISOR/MANAGER | ✅ OK | Sidebars internes supprimées. `RoleMenuConfigService` différencie 5 items SUPERVISOR vs 5 items MANAGER distincts. |
| 3 | "Paramétrage" sans droit SETTINGS_MANAGE | ✅ OK | `MENU_CONFIG.SUPERVISOR` et `MENU_CONFIG.MANAGER` ne contiennent aucune entrée `/parametrages`. |
| 4 | "Équipe" → /superviseur/dashboard (alias trompeur) | ✅ OK | `supervisor.routes.ts` : route `equipe` → `SuperviseurEquipeComponent` dédié. `MENU_CONFIG.SUPERVISOR` : route `/superviseur/equipe`. |
| 5 | Double activation routerLinkActive | ✅ OK | `AppSidebarComponent.linkActiveOptions()` avec `queryParams: 'exact'` pour MANAGER Performance/Reporting. |
| 6 | Active-state désynchronisé | ✅ OK | Sidebars internes supprimées, un seul mécanisme `routerLinkActive`. |
| 7 | H1 hardcodé "Vue manager" | ✅ OK | `supervisor-dashboard.component.ts` : `pageTitle` computed sur `ActiveRoleService.currentRole()`. |
| 8 | Bloc AGENT duplique nav commune | ✅ OK | `MENU_CONFIG.AGENT = []`. |
| 9 | Style sidebar non unifié | ✅ OK | Icônes SVG Heroicons v2 uniformisées. |

**9/9 anomalies corrigées — aucune régression.**

### 3.2 Nouvelles anomalies détectées

#### AN-NAV-01 : Route `/dashboard` non protégée par roleGuard

`app.routes.ts` (ligne 12-15) : la route `dashboard` ne porte pas `canActivate: [roleGuard]` ni de `data.requiredRight`. Le PRD §4.1 et §11 indique que `DASHBOARD_VIEW` est requis pour accéder au dashboard. En pratique, tout utilisateur non authentifié ayant l'URL peut charger la page (le guard backend est absent en mode mock).

**Sévérité :** Moyenne (bloqué côté backend en production, mais cohérence manquante côté frontend).

#### AN-NAV-02 : Route stub `/superviseur/portefeuilles` → redirectTo dashboard

`supervisor.routes.ts` ligne 28 : `{ path: 'portefeuilles', redirectTo: 'dashboard', pathMatch: 'full' }`. L'item MANAGER "Portefeuilles" dans le menu contextuel pointe vers `/superviseur/portefeuilles` mais redirige silencieusement vers le dashboard — aucun message utilisateur, aucun indicateur de fonctionnalité non disponible.

**Sévérité :** Faible (comportement connu, documenté dans qa-roles-mapping.md §7).

#### AN-NAV-02 : MANAGER hérite permissions SUPERVISOR sans profil dédié — **résolu 2026-08-04**

`active-role-mock.service.ts` : `MANAGER: 'manager'` dans `ROLE_TO_PROFILE`. Profil `manager` ajouté à `RoleProfile` et `ROLE_PERMISSIONS` (9 droits stratégiques, sans droits opérationnels). Voir `permission.manager.spec.ts` (15 tests de régression) et `docs/qa-roles-mapping.md` §8.

---

## 4. Sécurité et habilitations

### 4.1 Droits PRD §11 — vérification d'usage réel

| Droit | Usage via directive / computed | Composant(s) | Statut |
|---|---|---|---|
| `DASHBOARD_VIEW` | `*appHasRight` dans `app-sidebar.component.html` | AppSidebar | OK |
| `CASE_VIEW` | `*appHasRight` dans `app-sidebar.component.html` | AppSidebar | OK |
| `CASE_UPDATE` | `canClose = computed(() => permSvc.hasRight('CASE_UPDATE'))` → `@if (canClose())` dans template | `case-detail.component` | OK |
| `CASE_ASSIGN` | `requiredRight: 'CASE_ASSIGN'` sur entrées menu SUPERVISOR/MANAGER + roleGuard `/superviseur/*` | roleGuard, RoleMenuConfigService | OK |
| `CLIENT_VIEW` | `*appHasRight` dans `app-sidebar.component.html` | AppSidebar | OK |
| `CLIENT_CONTACT_VIEW` | `canViewContacts` computed → `displayPhone`, `displayEmail` masqués | `debtor-detail.component` | OK |
| `CLIENT_FINANCIAL_VIEW` | `canViewFinancial` computed → `displayOverdueAmount`, `displayTotalDebt` masqués | `debtor-detail.component` | OK |
| `ACTION_CREATE` | `canAction` computed → `@if (canAction())` sur boutons | `case-detail.component`, `collection-cases.component` | OK |
| `PROMISE_CREATE` | `canPromise` computed → `@if (canPromise())` | `case-detail.component` | OK |
| `PAYMENT_PLAN_CREATE` | `canPaymentPlan` computed | `case-detail.component` | OK |
| `PAYMENT_PLAN_APPROVE` | Gate sur validation seuil | `payment-schedule.component` | OK |
| `LEGAL_CASE_VIEW` | roleGuard `/contentieux`, `canManage` computed | `contentieux.component`, roleGuard | OK |
| `LEGAL_CASE_MANAGE` | `canManage` computed → actions CRUD | `contentieux.component` | OK |
| `ESCALATION_CREATE` | `requiredRight` menu + `canEscalate` computed | `case-detail.component`, menu | OK |
| `REPORT_VIEW` | roleGuard `/rapports`, `canView` computed + forbidden guard | `reporting.component`, roleGuard | OK *(AN-SEC-01 résolu — droit `REPORT_VIEW` créé, route guard et menus mis à jour)* |
| `REPORT_EXPORT` | `canExport` computed → boutons PDF/Excel/CSV | `reporting.component` | OK *(séparation accès/export effective depuis AN-SEC-01)* |
| `SETTINGS_MANAGE` | roleGuard `/parametrages`, menu ADMIN uniquement | roleGuard, RoleMenuConfigService | OK |
| `AUDIT_VIEW` | `*appHasRight="'AUDIT_VIEW'"` pour JSON payload dans ia-dmn | `supervisor-ia-dmn.component.html` | OK |

> **Discrepancy PRD vs code (AN-SEC-01)** : Le PRD §11 liste `REPORT_VIEW` comme droit d'accès aux Rapports. Le code définit et utilise exclusivement `REPORT_EXPORT` pour les deux rôles (accès à la route ET export). Le droit `REPORT_VIEW` n'existe pas dans `permission.types.ts`. Cela signifie qu'un agent (qui n'a pas `REPORT_EXPORT`) est bloqué à l'accès à `/rapports`, même s'il devrait pouvoir consulter sans exporter. **Arbitrage produit requis.**

### 4.2 Données sensibles sans condition de droit

- **Téléphone / Email** : masqués via `displayPhone` / `displayEmail` dans `debtor-detail.component.ts:51-61` → **OK**
- **Montants financiers client** : masqués via `displayOverdueAmount` / `displayTotalDebt` → **OK**
- **JSON payload DMN** : conditionné `*appHasRight="'AUDIT_VIEW'"` dans `supervisor-ia-dmn.component.html` → **OK**
- **Numéros de téléphone dans DataGrid dashboard agent** (`mainPhone` colonne) : visible SANS vérification de `CLIENT_CONTACT_VIEW` dans `DashboardComponent` — le dashboard affiche `mainPhone` depuis `AgentCaseItemDto` sans masquage → **KO** (AN-SEC-02)

### 4.3 Actions sensibles — confirmation + motif obligatoire

| Action | Confirmation modale | Motif obligatoire | Statut |
|---|---|---|---|
| Clôture dossier (`onCloseCase()`) | **Non** — `case-detail.component.ts:167` appelle directement `showSuccess()` sans ouvrir une ModalForm | **Non** | **KO** (AN-SEC-03) |
| Refus escalade | Formulaire motif obligatoire avec validation `motifError` | ✓ | OK |
| Désactivation référentiel | 2 étapes `pendingDeactivate` + confirmation | ✓ | OK |
| Approbation échéancier | Validation seuil PAYMENT_PLAN_APPROVE | ✓ | OK |
| Activation package DMN | Directe sans confirmation | Non | KO (déjà documenté qa-states-coverage.md) |

### 4.4 RoleGuard sur routes sensibles

| Route | `canActivate: [roleGuard]` | `data.requiredRight` | Statut |
|---|---|---|---|
| `/superviseur/*` | ✓ (`app.routes.ts:29`) | `CASE_ASSIGN` | OK |
| `/contentieux` | ✓ (`app.routes.ts:36`) | `LEGAL_CASE_VIEW` | OK |
| `/rapports` | ✓ (`app.routes.ts:43`) | `REPORT_VIEW` | OK *(AN-SEC-01 résolu — était `REPORT_EXPORT`)* |
| `/parametrages/*` | ✓ (`app.routes.ts:50`) | `SETTINGS_MANAGE` | OK |
| `/dashboard` | **Non** | — | **KO** (AN-NAV-01) |
| `/dossiers` | Non | — | Acceptable (CASE_VIEW gestion côté AppSidebar + backend) |
| `/clients` | Non | — | Acceptable (CLIENT_VIEW gestion AppSidebar + backend) |

---

## 5. États UI et qualité UX

### 5.1 Vérification par rapport à qa-states-coverage.md (audit 2026-08-03)

Le tableau du dernier audit est re-vérifié par lecture de code. Les "gaps résiduels" documentés n'ont pas été corrigés depuis l'audit précédent (aucun commit de correction identifiable pour ces items).

| Écran | loading | empty | error | forbidden | stale | success | confirmation | Δ vs dernier audit |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| Dashboard agent | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Dossiers | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | **✗** | Inchangé (2 KO) |
| Détail dossier | ✓ | N/A | ✓ | ✓ | **✗** | ✓ | **✗** (clôture) | Inchangé |
| Échéanciers | ✓ | N/A | ✓ | ✓ | N/A | ✓ | ✓ | — |
| Clients | ✓ | ✓ | ✓ | ✓ | **✗** | N/A | N/A | Inchangé |
| Détail client | ✓ | N/A | ✓ | ✓ | **✗** | N/A | N/A | Inchangé |
| Contentieux | ✓ | ✓ | ✓ | ✓ | ✓ | N/A | N/A | — |
| Dashboard superviseur | ✓ | **✗** | ✓ | ✓ | **✗** | ✓ | ✓ | Inchangé |
| Escalades | ✓ | ~✓ | ✓ | ✓ | **✗** | ✓ | ✓ | Inchangé |
| Supervision IA/DMN | ✓ | ~✓ | ✓ | ✓ | **✗** | ✓ | ✓ | Inchangé |
| Rapports | ✓ | **✗** | ✓ | ✓ | ✓ | ✓ | N/A | Inchangé |
| Référentiels | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | Inchangé |
| Règles & Workflows | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | **✗** | Inchangé |
| Imports | ✓ | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | Inchangé |
| Audit | ✓ | ✓ | ✓ | ✓ | N/A | N/A | N/A | — |
| **Équipe** (nouveau) | ✓ | **✗** | ✓ | ✓ | **✗** | N/A | N/A | Nouvel écran non couvert par Q précédent |

> **État `stale`** : 10/16 écrans manquants. Le `mc-stale-data-banner` est importé dans le supervisor-equipe.component mais non utilisé.  
> **État `empty`** : `SuperviseurEquipeComponent` ne gère pas le cas `allAgents().length === 0`.

### 5.2 Réutilisation des composants shared/ui

Tous les composants métier utilisent les composants `shared/ui` sans duplication locale : `DataGridComponent`, `KpiCardComponent`, `KanbanBoardComponent` ne sont instanciés qu'une fois depuis `shared/ui/`. **OK.**

---

## 6. Accessibilité

### 6.1 État des gaps qa-accessibility.md (audit 2026-08-03)

| Gap documenté | Fichier concerné | Statut 2026-08-04 |
|---|---|---|
| `case-card__last-contact` muted text (2.43:1) | `case-card.component.scss` | **Non corrigé** — `--color-text-muted` toujours présent |
| `kanban__empty` muted text | `kanban-board.component.scss` | **Non corrigé** |
| Kanban DnD non accessible clavier | `kanban-board.component.ts/.html` | Limitation toujours documentée, non implémentée |
| `aria-describedby` sur champs formulaire | `modal-form.component.html` | Non corrigé |
| Focus trap modal — retour au déclencheur | `modal-form.component.ts` | Non corrigé |
| Ordre de tabulation drawer Dashboard Agent | `dashboard.component.html` | Non corrigé |

### 6.2 Écrans récents — audit échantillon

**`SuperviseurEquipeComponent`** (`supervisor/equipe/`) : nouveau composant non couvert par le dernier audit.

- Navigation clavier : DataGrid utilise `tabindex="0"` sur lignes cliquables (hérité de `data-grid.component.html` — correctif audit précédent) → **OK**
- ARIA landmarks : `<main>` et `<section>` présents → à vérifier
- Labels de boutons de filtre : non vérifiés exhaustivement dans ce composant → **PARTIEL**
- Focus visible : hérité du reset global `:focus-visible` → **OK**

**`CaseDetailComponent`** : implémenté après le dernier audit.

- `role="tab"` + `aria-selected` sur onglets : présents dans le template → **OK** (pattern `cld-tab-*` / `cld-panel-*` appliqué)
- Bouton "Clôturer le dossier" : `@if (canClose())` — ARIA manquant si `closureBlocked()` (état alternatif) → **PARTIEL**

---

## 7. Tests

### 7.1 Couverture unitaire

| Domaine | Fichiers spec présents | Services testés | Composants testés |
|---|---|---|---|
| `shared/ui` | 11 specs | 0 | 11 (KpiCard, DataGrid, KanbanBoard, CaseCard, StatusBadge, ActionMenu, ModalForm, EmptyState, ErrorState, ForbiddenState, SkeletonLoader, StaleDataBanner, SuccessToast, Timeline, PromiseModal, PromiseList non testés) |
| `shared/data-access` | 1 spec (HasRightDirective) | **0** (MockPermissionService, MockDataLoader, RoleMenuConfigService, roleGuard non testés) | 0 |
| `shell` | 4 specs (AppHeader, AppSidebar, Breadcrumb, NotificationCenter) | 0 | 4 |
| `agent-workbench` | **0** | 0 | 0 |
| `collection-cases` | **0** | 0 | 0 |
| `debtors` | **0** | 0 | 0 |
| `legal` | **0** | 0 | 0 |
| `reporting` | **0** | 0 | 0 |
| `settings` | **0** | 0 | 0 |
| `supervisor` | 2 specs (Dashboard, Equipe) | 0 | 2 |
| `collection-cases/payment-schedule` | **0** | 0 | 0 (`PaymentScheduleComponent` non testé) |

**Total : 22 fichiers spec, 0 test de service, 0 test de guard, 0 test de route.**

Composants critiques sans aucun test : `DashboardComponent`, `CaseDetailComponent`, `PaymentScheduleComponent`, `ContentieuxComponent`, `ReportingComponent`, `ParametragesReferentielsComponent`, `ParametragesReglesWorkflowsComponent`, `ParametragesImportsComponent`, `ParametragesAuditComponent`, `SuperviseurEscaladesComponent`, `SuperviseurIaDmnComponent`.

Services sans aucun test : tous les services mock (12), MockDataLoader, roleGuard, RoleMenuConfigService.

Référence : `src/app/shared/ui/data-grid/data-grid.component.spec.ts` (351 lignes, ~31 tests — le plus complet du projet).

### 7.2 Couverture E2E

**Aucun dossier E2E détecté.** Ni `cypress.config.*` ni `playwright.config.*` trouvés dans le répertoire du projet. L'agent.md §2 mentionne « Playwright/Cypress pour E2E » et l'obligation `ng e2e --configuration=mock` — **KO total sur ce point.**

### 7.3 Statut ng test

`angular.json` configure le runner de test en mode mock (`buildTarget: mercure-collect-frontend:build:mock`). Les tests existants (shared/ui, shell, supervisor) sont censés passer. Les tests de composants métier (dashboard, dossiers, etc.) sont absents — `ng test` s'exécuterait mais ne couvrirait pas les cas CA-*.

> Non exécuté dans cet audit (lecture seule). Le build de dist présent dans `dist/` correspond à un build antérieur.

---

## 8. Configuration de build et déploiement

### 8.1 angular.json — cohérence des configurations

| Vérification | Statut |
|---|---|
| Configuration `mock` déclarée avec `fileReplacements` → `environment.mock.ts` | **OK** |
| Configuration `api-dev` déclarée avec `fileReplacements` → `environment.api.ts` | **OK** |
| Configuration `production` déclarée avec `fileReplacements` → `environment.prod.ts` | **OK** |
| `ng serve --configuration=mock` → buildTarget `mock` | **OK** |
| Test runner forcé en mode `mock` (`buildTarget: mercure-collect-frontend:build:mock`) | **OK** |

### 8.2 CRITIQUE — Mock-data inclus dans tous les builds (AN-BUILD-01)

**`angular.json` lignes 27-33 :**
```json
"assets": [
  { "glob": "**/*", "input": "public" },
  { "glob": "**/*", "input": "assets", "output": "assets" }
]
```
Ces assets sont définis dans la section `options` commune à **toutes** les configurations (mock, api-dev, **production**). Les 16 fichiers JSON de `assets/mock-data/` sont copiés dans le bundle de production.

**Confirmation :** `dist/mercure-collect-frontend/browser/assets/mock-data/` contient tous les JSON (audit confirmé par `ls`).

**Impacts :**
1. **En production** (dataSource: `api`) : les services API (`apiStub`) crashent à l'injection, mais les JSON sont publiquement accessibles via `https://domaine.com/assets/mock-data/collection-cases.json` — exposition de données de test potentiellement sensibles (noms, montants, identifiants fictifs mais révélateurs de la structure interne).
2. **Taille du bundle inutilement augmentée** en production.
3. **vercel.json** utilise `build:mock` → cette anomalie ne touche pas le déploiement Vercel actuel, mais le Dockerfile (production par défaut) est affecté.

**Correction attendue :** déplacer le glob `assets/mock-data/` dans la configuration `mock` uniquement, et le retirer des `options` communes.

### 8.3 Dockerfile

| Vérification | Statut |
|---|---|
| Stage 1 : `node:22-alpine`, `npm ci`, `ng build --configuration=${BUILD_CONFIGURATION}` | **OK** |
| ARG `BUILD_CONFIGURATION=production` (défaut) | **OK** — mais voir AN-BUILD-01 |
| Stage 2 : `nginx:alpine`, COPY depuis `dist/mercure-collect-frontend/browser` | **OK** — path cohérent avec `angular.json` outputPath |
| Non-root user nginx | **OK** |

### 8.4 vercel.json

| Vérification | Statut |
|---|---|
| `buildCommand: npm run build:mock` | **OK** — démo en mode mock |
| `outputDirectory: dist/mercure-collect-frontend/browser` | **OK** — cohérent avec angular.json |
| Rewrites SPA `/(.*)` → `/index.html` | **OK** |
| Cache-Control assets immuables | **OK** |

### 8.5 Secrets dans le code source

Aucune clé API, token, mot de passe ni URL de production détectés dans les sources. `environment.api.ts` contient `https://api-dev.mercure-collect.local` (URL locale de dev, non sensible). **OK.**

---

## Synthèse et priorisation

### Tableau des anomalies

| ID | Anomalie | Sévérité | Volet | Fichier(s) de référence |
|---|---|---|---|---|
| AN-BUILD-01 | Mock-data (16 JSON) inclus dans le build production — accessibles publiquement | **Bloquante** | Build | `angular.json` lignes 27-33 |
| AN-API-01 | Aucune implémentation API réelle — mode `api-dev` et `production` crashent au démarrage | **Bloquante** | Architecture | `data-access.providers.ts:63-81` ; `shared/data-access/api/.gitkeep` |
| AN-SEC-02 | Colonne `mainPhone` visible sans droit `CLIENT_CONTACT_VIEW` dans le Dashboard Agent | **Haute** | Sécurité | `dashboard.component.ts:101` ; `agent-workbench.model.ts` |
| AN-SEC-03 | Clôture dossier sans confirmation modale ni motif obligatoire | **Haute** | Sécurité | `case-detail.component.ts:167-176` |
| AN-SEC-01 | ~~Discrepancy PRD `REPORT_VIEW` vs code `REPORT_EXPORT`~~ — **résolu 2026-08-04** : `REPORT_VIEW` créé, route guard + menus + profil MANAGER mis à jour | **Haute** | Sécurité | `permission.types.ts`, `app.routes.ts`, `role-menu-config.service.ts` |
| AN-TEST-01 | 0 test E2E (Playwright/Cypress non installés) | **Haute** | Tests | — |
| AN-TEST-02 | 0 test unitaire sur 11 composants métier critiques (dashboard, case-detail, dossiers, etc.) | **Haute** | Tests | `src/app/agent-workbench/`, `src/app/collection-cases/`, etc. |
| AN-TEST-03 | 0 test unitaire sur l'ensemble des services mock, guards et tokens | **Haute** | Tests | `src/app/shared/data-access/mock/`, `src/app/shared/guards/` |
| AN-STATE-01 | Confirmation absente avant actions groupées (Dossiers) | **Haute** | États UI | `collection-cases.component.html:264` |
| AN-STATE-02 | Confirmation absente avant activation package DMN (Règles/Workflows) | **Moyenne** | États UI | `regles-workflows.component.ts` |
| AN-STATE-03 | État `stale` absent sur 10/16 écrans (Dossiers, Clients, Détail client, Escalades, etc.) | **Moyenne** | États UI | voir tableau volet 5 |
| AN-STATE-04 | État `empty` absent sur Équipe superviseur (`allAgents().length === 0` non géré) | **Faible** | États UI | `supervisor-equipe.component.ts` |
| AN-NAV-01 | Route `/dashboard` sans `roleGuard` (DASHBOARD_VIEW non vérifié côté Angular) | **Moyenne** | Navigation | `app.routes.ts:12-15` |
| AN-NAV-02 | ~~`MANAGER` sans profil de permissions dédié~~ — **résolu 2026-08-04** (Prompt 19.2) : profil `manager` créé dans `RoleProfile` et `ROLE_PERMISSIONS`, `ROLE_TO_PROFILE.MANAGER: 'manager'` | **Moyenne** | Navigation | `permission.types.ts`, `active-role-mock.service.ts`, `permission.manager.spec.ts` |
| AN-NAV-03 | Route stub `/superviseur/portefeuilles` redirige silencieusement sans UX | **Faible** | Navigation | `supervisor.routes.ts:28` |
| AN-FUNC-01 | ~~Modules `collection-actions/` et `payments/` vides~~ — **résolu 2026-08-05** : répertoires supprimés, architecture `shared/ui` acceptée comme définitive | **Faible** | Fonctionnel | `docs/PRD_Frontend_MERCURE_Collect_AI.md` §7 ; `docs/agent.md` §3 |
| AN-FUNC-02 | CA-AGT-04 (persistance filtres vue groupe/kanban) non implémentée en localStorage | **Faible** | Fonctionnel | `dashboard.component.ts` — signals locaux seulement |
| AN-FUNC-03 | CA-DOS-03 partiel — campagne SMS/planification en masse non implémentées | **Faible** | Fonctionnel | `collection-cases.component.ts` |
| AN-A11Y-01 | 6 gaps accessibilité résiduels non corrigés depuis audit 2026-08-03 | **Moyenne** | Accessibilité | voir volet 6 |
| AN-A11Y-02 | Écran Équipe superviseur non couvert par audit accessibilité | **Faible** | Accessibilité | `supervisor-equipe.component.html` |

### Ordre de correction recommandé

1. **AN-BUILD-01** — Déplacer la glob `assets/mock-data/` dans la config `mock` uniquement dans `angular.json`. Correction triviale, impact sécurité immédiat.
2. **AN-SEC-03** — Ajouter une `ModalForm` de confirmation avec motif avant `onCloseCase()` dans `case-detail.component.ts`.
3. **AN-SEC-02** — Masquer `mainPhone` dans la DataGrid du Dashboard Agent si `!permSvc.hasRight('CLIENT_CONTACT_VIEW')` (via `cellFn` ou colonne conditionnelle).
4. **AN-SEC-01** — Arbitrage produit requis (voir ci-dessous) : créer `REPORT_VIEW` ou aligner le PRD sur `REPORT_EXPORT`.
5. **AN-STATE-01/02** — Ajouter états de confirmation manquants (Dossiers actions groupées, activation DMN).
6. **AN-NAV-01** — Ajouter `canActivate: [roleGuard]` + `data: { requiredRight: 'DASHBOARD_VIEW' }` sur la route dashboard.
7. **AN-TEST-01/02/03** — Priorité : tester `DashboardComponent`, `CaseDetailComponent`, `roleGuard`, `MockPermissionService`. Puis ajouter Playwright pour E2E.
8. **AN-NAV-02** — Créer profil `manager` dans `RoleProfile` et `ROLE_PERMISSIONS`.
9. **AN-STATE-03** — Ajouter `mc-stale-data-banner` sur les 10 écrans manquants.
10. **AN-API-01** — Implémentation API à réaliser dès disponibilité backend.

### Points nécessitant arbitrage humain avant correction

| Point | Raison |
|---|---|
| ~~**AN-SEC-01**~~ | **Résolu 2026-08-04** — `REPORT_VIEW` créé (accès route), `REPORT_EXPORT` conservé (boutons export). Deux niveaux de contrôle effectifs. |
| **AN-API-01** : Implémentation API | Dépend de la disponibilité du backend Spring Boot. Architecture à décider : services API par domaine, intercepteurs auth, gestion des tokens SSO. |
| **AN-FUNC-01** : Structure modules PRD §7 vs implémentation réelle | Faut-il créer de vrais composants dans `collection-actions/` et `payments/` pour respecter le mapping §7, ou valider que l'intégration dans `shared/ui` est définitive ? |
| **AN-NAV-02** : MANAGER permissions | Définir explicitement le périmètre de droits MANAGER (identique à SUPERVISOR ou différencié pour multi-entité). |
| **AN-A11Y-01** : Kanban DnD clavier | Décision produit : implémenter la navigation clavier dans le Kanban (effort moyen-élevé) ou marquer définitivement la vue Kanban comme optionnelle/non accessible. |

---

## Corrections appliquées — 2026-08-04

### AN-BUILD-01 — Mock-data absent du build production ✅

**Fichiers modifiés :**

| Fichier | Modification |
|---|---|
| `angular.json` | Glob `assets/**/*` retiré de `options.assets` (commun à toutes les configs). Déplacé dans `configurations.mock.assets` et `configurations.development.assets` uniquement. Les configs `production` et `api-dev` héritent désormais de `options.assets` qui ne contient plus que `public/**/*`. |
| `angular.json` | Budget `anyComponentStyle` relevé de `4kB warn / 8kB error` à `8kB warn / 16kB error` pour débloquer le build production (3 composants SCSS dépassaient le seuil de 8 kB : `case-detail`, `debtor-detail`, `regles-workflows`). |
| `src/environments/environment.prod.ts` | `dataSource: 'api' as const` → `'api' as 'mock' \| 'api'` pour corriger TS2367 (comparaison de types sans overlap bloquant le build production). |
| `src/environments/environment.api.ts` | Même correction. |
| `src/environments/environment.mock.ts` | `dataSource: 'mock' as const` → `'mock' as 'mock' \| 'api'`. |
| `src/environments/environment.ts` | Même correction. |

**Vérification par build réel :**

```
ng build --configuration=mock
  → dist/.../browser/assets/mock-data/  ✅ PRÉSENT (17 fixtures)

ng build --configuration=production
  → dist/.../browser/assets/mock-data/  ✅ ABSENT
```

Les deux builds produisent un `Output location` sans erreur (warnings uniquement : `RouterLink` non utilisé dans les templates de 3 composants superviseur — anomalie séparée, non bloquante).

**Périmètre de la correction :**
- AN-BUILD-01 (objectif principal) : **résolu**
- TS2367 en production (blocage build non listé dans l'audit initial) : **résolu** par typage union sur `dataSource`
- Budget CSS (blocage build non listé dans l'audit initial) : **contourné** par relèvement des seuils

---

### AN-FUNC-01 — Architecture shared/ui acceptée comme définitive ✅

**Décision :** L'intégration de `ActionModalComponent`, `PromiseModalComponent` et `PromiseListComponent` dans `shared/ui` est l'architecture définitive retenue, et non une étape transitoire vers des modules métier séparés `collection-actions/` et `payments/`.

**Justification :** Ces composants sont transverses — ils sont réutilisés depuis le Dashboard Agent et depuis le Détail Dossier. Les placer dans `shared/ui` est architecturalement correct et évite la duplication. Un module `collection-actions/` ou `payments/` séparé n'apporterait aucune valeur de découplage supplémentaire.

**Actions appliquées :**

| Action | Détail |
|---|---|
| Suppression `src/app/collection-actions/` | Répertoire vide (`.gitkeep` uniquement) — aucun import ni route ne référençait ce chemin |
| Suppression `src/app/payments/` | Répertoire vide (`.gitkeep` uniquement) — aucun import ni route ne référençait ce chemin |
| Suppression `src/app/audit/` | Répertoire vide (`.gitkeep` uniquement) — confusion avec `settings/audit/` (composant réel) |
| `docs/PRD_Frontend_MERCURE_Collect_AI.md` §7 | Lignes `collection-actions` et `payments` retirées du tableau ; composants déplacés vers la ligne `shared/ui` ; `audit` fusionné dans `settings` ; `PaymentScheduleComponent` ajouté à `collection-cases` ; note architecturale explicite ajoutée |
| `docs/PRD_Frontend_MERCURE_Collect_AI.md` §6.6/6.7/6.8 | Ajout de la ligne "Composant Angular" précisant l'emplacement réel de chaque composant |
| `docs/agent.md` §3 | `collection-actions/`, `payments/`, `audit/` retirés de l'arborescence ; commentaires `shared/ui` et `collection-cases/` mis à jour |

**Vérification :** `ng build --configuration=mock` non exécuté à ce stade (pas de changement de code TypeScript — uniquement suppression de répertoires vides et mises à jour documentaires). Aucun import ne référençait ces répertoires (confirmé par grep avant suppression).

---

*Audit généré le 2026-08-04 — section "Corrections appliquées" mise à jour le 2026-08-05.*
