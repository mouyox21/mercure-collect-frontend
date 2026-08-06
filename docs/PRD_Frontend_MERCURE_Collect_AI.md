# PRD — Frontend MERCURE Collect AI
**Version 1.0 — dérivée de « Spécifications détaillées des IHM v1.0 »**
**Stack cible :** Angular (front) — consommant une API Java Spring Boot / DTO REST
**Auteur :** Product / UX — **Destinataires :** Tech Lead Frontend, développeurs Angular, QA, UX/UI

---

## 1. Contexte et objectif

MERCURE Collect AI est une solution de gestion intelligente du recouvrement. Le frontend Angular doit permettre aux agents, superviseurs et administrateurs fonctionnels de piloter le cycle de recouvrement de bout en bout : prise en charge d'un dossier, contact client, promesses, échéanciers, précontentieux/contentieux, reporting et paramétrage.

**Objectif du présent PRD** : cadrer le développement du frontend uniquement (Angular), en précisant les écrans, les comportements attendus, le contrat de données (DTO), les règles UX, les non-fonctionnels et la stratégie de développement en **mode mock** puis **mode API réelle**, pour permettre une livraison incrémentale sans dépendance bloquante au backend.

**Hors périmètre de ce PRD** : implémentation backend Spring Boot, modélisation base de données, moteur Flowable BPMN/DMN (le frontend consomme leurs résultats via API), configuration Superset serveur.

---

## 2. Personas et rôles

| Rôle | Objectif principal | Écrans prioritaires |
|---|---|---|
| **Agent de recouvrement** | Traiter les dossiers affectés, contacter les clients, saisir promesses/échéanciers | Dashboard agent, Dossiers, Détail client, Détail dossier, Action, Promesse, Échéancier |
| **Superviseur** | Piloter la performance, réaffecter, traiter les escalades, surveiller les promesses non tenues | Dashboard superviseur, Portefeuille, Équipe, Escalades, Supervision IA |
| **Administrateur fonctionnel** | Paramétrer référentiels, créanciers, workflows, modèles, règles DMN | Paramétrages, Utilisateurs, Règles, Modèles, Import |
| **Direction / Management** | Consulter les indicateurs consolidés et tendances | Rapports, Dashboards, Export |

---

## 3. Périmètre fonctionnel

### Dans le périmètre (livrables Angular)
1. Shell applicatif (sidebar, header, breadcrumb, notification center)
2. Écrans Agent (dashboard, dossiers, recherche avancée)
3. Écrans Client (recherche, fiche 360°)
4. Écrans Dossier de recouvrement (détail, actions, historique)
5. Paiements : promesses de paiement, échéanciers
6. Contentieux / Précontentieux
7. Écrans Superviseur (dashboard, escalades, supervision IA/DMN)
8. Rapports (catalogue + intégration Superset embedded)
9. Paramétrages (référentiels, règles DMN, workflows en lecture, imports, audit)
10. Gestion des états UI standards (chargement, vide, erreur, non autorisé, obsolète, succès, confirmation)
11. Couche d'accès aux données double mode : **Mock** (données statiques/JSON locales) et **API** (Spring Boot réel), pilotable par configuration d'environnement

### Hors périmètre
- Développement des endpoints Spring Boot
- Modélisation DMN/BPMN
- Infrastructure Superset serveur (le frontend ne fait qu'embarquer un iframe/token)
- Authentification SSO complète (le frontend prévoit uniquement les hooks — voir §9)

---

## 4. Architecture applicative frontend

| Aspect | Spécification |
|---|---|
| Framework | Angular (dernière version LTS), routing par modules lazy-loadés |
| Style | Grille desktop 1440 px, sidebar 240 px, header 72 px, marges 24 px, grille 12 colonnes |
| Design tokens | Bleu foncé `#183B56`, bleu action `#2563EB`, fond `#F8FAFC`, bordure `#E2E8F0`, succès `#16A34A`, alerte `#F97316`, critique `#DC2626` |
| Typographie | Aptos ou Inter — titres 20–28px, sous-titres 14px, corps 13–14px, tableaux 12–13px |
| Rayons | Cartes 16px, boutons 10–12px, badges 999px |
| Accessibilité | Contrastes AA, navigation clavier, focus visible, libellés explicites, alt text |
| Modularité | 1 module Angular par domaine fonctionnel (cf. §7 mapping module ↔ écran) |
| Découplage données | Toute vue consomme des **services** (interfaces) découplés du transport (mock ou HTTP réel) — voir agent.md |

### 4.1 Navigation et structure

| Menu | Route Angular | Droit requis |
|---|---|---|
| Dashboard | `/dashboard` | `DASHBOARD_VIEW` |
| Dossiers | `/dossiers` | `CASE_VIEW` |
| Clients | `/clients` | `CLIENT_VIEW` |
| Rapports | `/rapports` | `REPORT_VIEW` |
| Paramétrages | `/parametrages` | `SETTING_VIEW` |

Zones persistantes : Sidebar (logo, menu, rôle, profil), Header (date, agent, créancier actif, recherche globale, notifications), Breadcrumb sur écrans détail, Notification center (retards, promesses du jour, validations superviseur, erreurs d'import).

---

## 5. Composants transverses (Design System)

| Composant | Usage | Variantes |
|---|---|---|
| `AppSidebar` | Menu principal | Dashboard, Dossiers, Clients, Rapports, Paramétrages |
| `AppHeader` | Contexte utilisateur/créancier | Date, agent, créancier, recherche, notifications |
| `KpiCard` | Indicateur numérique | Standard, succès, alerte, critique, montant |
| `DataGrid` | Liste dense | Tri, pagination serveur, filtres, colonnes personnalisables, sélection multiple |
| `KanbanBoard` | Vue par catégorie/phase | Colonnes repliables, drag/drop contrôlé |
| `CaseCard` | Carte dossier compacte | Standard, critique, promesse non tenue, contentieux |
| `StatusBadge` | Statut/priorité | Nouveau, en cours, promesse, échéancier, précontentieux, contentieux, clôturé |
| `ActionMenu` | Actions rapides | Appeler, SMS, Email, Lettre, Promesse, Échéancier, Escalader |
| `Timeline` | Historique interactions | Verticale, filtrable par canal/type |
| `ModalForm` | Création/modification | Action, promesse, échéancier, document, escalade |

Ces composants doivent être livrés en **premier** (librairie de composants partagée `shared/ui`) car ils sont réutilisés sur l'ensemble des écrans.

---

## 6. Exigences fonctionnelles par écran

> Pour chaque écran : objectif, route, composant racine, zones, actions utilisateur, règles UX, DTO consommé, critères d'acceptation. Détail exhaustif dans la SFD source (§4 à §12) ; synthèse ci-dessous pour cadrage produit.

### 6.1 Dashboard Agent — `/agent/dashboard` (`AgentDashboardComponent`)
- Objectif : portefeuille quotidien groupé par catégorie d'action, trié par ancienneté puis montant décroissant.
- Zones : entête contexte (KPI fixes), barre de filtres, DataGrid groupé, vue Kanban alternative, drawer d'action rapide.
- Catégories MVP : Nouveau client, Promesse non respectée, Échéance du jour, Rappel téléphone, Injoignable/BAL vocale, Envoi SMS, Lettre de relance, Document de négociation.
- Règle de tri : ancienneté catégorie ↓ puis montant ↓. Pagination serveur obligatoire ≥100 dossiers.
- DTO : `HeaderAgentWorkbenchDto`, `ActionCategoryDto`, `AgentCaseItemDto`.
- Endpoint : `GET /api/agents/{agentId}/workbench?creditorId=&date=`
- CA : CA-AGT-01 à CA-AGT-05 (groupement, cohérence compteurs, tri, persistance filtres au changement de vue, traçabilité de chaque action rapide).
- **Référence visuelle fournie** (voir maquettes jointes) : sert de socle pixel pour la Vue Groupe / DataGrid / panneau détail dossier en drawer bas.

### 6.2 Dossiers — Recherche avancée — `/dossiers` (`DossiersComponent`)
- Filtres avancés combinables, DataGrid tri multi-colonnes/pagination serveur, actions en masse (export, réaffectation, planification, campagne SMS), vues sauvegardées par utilisateur.
- DTO : `CollectionCaseSearchCriteria`, `CollectionCaseListItem`. Endpoint : `GET /api/collection-cases/search`.
- CA : CA-DOS-01 à CA-DOS-03.

### 6.3 Clients — Recherche — `/clients` (`ClientsComponent`)
- Recherche serveur avec debounce (min. 3 caractères), filtres combinables, masquage des données sensibles selon droits, alerte doublons (ICE/CIN/téléphone).
- DTO : `DebtorSearchResultDto`. Endpoint : `GET /api/debtors/search`.
- CA : CA-CLI-01 à CA-CLI-03.

### 6.4 Détail Client — Vue 360° — `/clients/:debtorId` (`ClientsDebtoridComponent`)
- Bandeau identité fixe, KPI temps réel, onglets lazy-load (Vue 360, infos générales, contrats & dettes, dossiers, interactions, documents, garanties, historique), bloc « prochaine action » actionnable.
- Chargement < 2s avec agrégats précalculés côté API.
- DTO : `DebtorDetailDto`. Endpoint : `GET /api/debtors/{debtorId}/detail`.
- CA : CA-CLD-01 à CA-CLD-03.

### 6.5 Détail Dossier — `/dossiers/:caseId` (`DossiersCaseidComponent`)
- Bandeau (référence, phase, statut, priorité, catégorie, montant, retard en badges), bloc décision DMN (segment, next-best-action, raison, score), tabs lazy (synthèse, dette, actions, interactions, promesses, échéancier, documents, contentieux, historique).
- Clôture impossible si promesse/échéancier actif sauf droit superviseur.
- DTO : `CollectionCaseDetailDto`. Endpoint : `GET /api/collection-cases/{caseId}/detail`.
- CA : CA-CAS-01 à CA-CAS-03.

### 6.6 Création/traitement d'une action — modale
- Contexte lecture seule, formulaire dynamique selon type, compte-rendu obligatoire à la clôture, option création promesse depuis appel.
- Composant Angular : `ActionModalComponent` (`shared/ui/action-modal`) — composant transverse réutilisé dans Dashboard Agent et Détail Dossier.
- DTO : `CollectionActionCommand`. Endpoint : `POST /api/collection-actions`.
- CA : CA-ACT-01, CA-ACT-02.

### 6.7 Promesse de paiement — dans le contexte du dossier
- Liste triée par date prévue, formulaire avec validation montant ≤ montant impayé (sauf dérogation) et date ≥ date du jour, statut `BROKEN` automatique si dépassement.
- Composants Angular : `PromiseListComponent` + `PromiseModalComponent` (`shared/ui`) — composants transverses intégrés dans Détail Dossier.
- DTO : `PaymentPromiseDto`. Endpoint : `POST /api/payment-promises`.
- CA : CA-PRO-01, CA-PRO-02.

### 6.8 Échéancier / plan de paiement — `/dossiers/:caseId/echeanciers`
- Synthèse dette + éligibilité DMN, simulateur générant les lignes automatiquement, validation superviseur obligatoire au-delà des seuils.
- Composant Angular : `PaymentScheduleComponent` (`collection-cases/payment-schedule`) — écran dédié, route enfant de collection-cases.
- DTO : `PaymentPlanCommand`. Endpoint : `POST /api/payment-plans`.
- CA : CA-ECH-01, CA-ECH-02.

### 6.9 Contentieux / Précontentieux — `/contentieux` (`ContentieuxComponent`)
- Liste filtrable, timeline juridique, gestion partenaires (avocat/huissier), blocage des relances amiables automatiques une fois en contentieux.
- DTO : `LegalCaseDto`. Endpoint : `GET /api/legal-cases/search`.
- CA : CA-LEG-01, CA-LEG-02.

### 6.10 Dashboard Superviseur — `/superviseur/dashboard`
- KPI globaux, portefeuilles (aging, graphiques), table performance équipe, alertes priorisées (escalades, agents surchargés, promesses non tenues).
- DTO : `SupervisorDashboardDto`. Endpoint : `GET /api/supervisors/{id}/dashboard`.
- CA : CA-SUP-01, CA-SUP-02.
- **Référence visuelle fournie** : socle pour KPI cards, table « Portefeuille par aging » et « Performance équipe », panneau « Alertes prioritaires »/« Décisions superviseur ».

### 6.11 Console des escalades — `/superviseur/escalades`
- DataGrid priorisée, panneau latéral décision (contexte + recommandation DMN/IA), motif obligatoire pour toute décision.
- DTO : `EscalationDto`. Endpoint : `GET /api/escalations/search`.
- CA : CA-ESC-01, CA-ESC-02.

### 6.12 Supervision IA et DMN — `/superviseur/ia-dmn`
- KPI décision, liste des décisions avec JSON input/output et raison métier (visible uniquement aux profils autorisés), feedback agent.
- DTO : `DecisionMonitoringDto`. Endpoint : `GET /api/decision-monitoring`.
- CA : CA-DMN-01, CA-DMN-02.

### 6.13 Rapports — `/rapports`
- Catalogue par rôle, filtres globaux, dashboard Superset embedded (iframe sécurisée / token) ou composants Angular natifs, exports audités.
- DTO : `ReportingFilterDto`, `KpiResponse`. Endpoint : `GET /api/reporting/kpis` (+ token Superset).
- CA : CA-RPT-01, CA-RPT-02.

### 6.14 Paramétrages — Référentiels — `/parametrages/referentiels`
- CRUD référentiel (créanciers, portefeuilles, catégories, statuts, canaux, modèles), pas de suppression physique, code technique immuable.
- DTO : `ReferenceValueDto`. Endpoint : `GET/POST /api/settings/*`.
- CA : CA-SET-01, CA-SET-02.

### 6.15 Paramétrages — Règles DMN & workflows — `/parametrages/regles-workflows`
- Packages DMN versionnés (DRAFT/ACTIVE/ARCHIVED), diagramme BPMN lecture seule, module de test, activation unique par décision (test de non-régression obligatoire).
- DTO : `DmnPackageDto`, `DmnTestCaseDto`. Endpoints : `GET /api/rules/packages`, `GET /api/workflows/definitions`.
- CA : CA-DMNSET-01, CA-DMNSET-02.

### 6.16 Import ERP/CLS — `/parametrages/imports`
- Liste des imports triée par date, détail (résumé, erreurs, mapping), rejets exportables, relance des lignes corrigées.
- DTO : `ImportBatchDto`. Endpoint : `GET /api/import-batches/search`.
- CA : CA-IMP-01, CA-IMP-02.

### 6.17 Audit et historique système — `/parametrages/audit`
- Filtres serveur, liste en lecture seule, détail JSON old/new, masquage selon `AUDIT_FULL_VIEW`.
- DTO : `AuditEventDto`. Endpoint : `GET /api/audit/search`.
- CA : CA-AUD-01, CA-AUD-02.

---

## 7. Mapping module Angular ↔ écrans ↔ API

| Module Angular | Composants clés | Endpoints principaux |
|---|---|---|
| `shell` | app-layout, app-sidebar, app-header, breadcrumb, notification-center | — |
| `agent-workbench` | agent-dashboard-page, action-category-grid, action-category-kanban, case-card, quick-action-drawer | `GET /api/agents/{agentId}/workbench` |
| `collection-cases` | case-list-page, case-detail-page, case-summary-card, dmn-decision-card, case-timeline, **payment-schedule** | `GET /api/collection-cases/search`, `GET /api/collection-cases/{id}/detail`, `PATCH /api/collection-cases/{id}`, `POST /api/payment-plans`, `PATCH /api/payment-plans/{id}/approve` |
| `debtors` | debtor-search-page, debtor-detail-page, debtor-header, debtor-overview-tab, debtor-contracts-tab | `GET /api/debtors/search`, `GET /api/debtors/{id}/detail` |
| `legal` | legal-case-list, legal-case-detail, legal-event-modal | `GET /api/legal-cases/search`, `POST /api/legal-cases` |
| `supervisor` | supervisor-dashboard, agent-performance-grid, escalations-console | `GET /api/supervisors/{id}/dashboard`, `GET /api/escalations/search` |
| `reporting` | report-catalog, superset-embed-frame, report-filters | `GET /api/reporting/kpis`, `GET /api/reporting/embed-token` |
| `settings` | reference-values-page, dmn-packages-page, workflow-definitions-page, import-batches-page, **audit-search-page** | `GET/POST/PATCH /api/settings/*`, `GET /api/rules/packages`, `GET /api/workflows/definitions`, `GET /api/import-batches/search`, `GET /api/audit/search` |
| `shared/ui` | KpiCard, DataGrid, KanbanBoard, CaseCard, StatusBadge, ActionMenu, Timeline, ModalForm, **ActionModalComponent, PromiseModalComponent, PromiseListComponent** | `POST /api/collection-actions`, `PATCH /api/collection-actions/{id}/complete`, `POST /api/payment-promises`, `PATCH /api/payment-promises/{id}` |
| `shared/data-access` | Couche d'abstraction Mock/API (voir §8) | Tous |

> **Note architecturale (décision 2026-08-05) :** Les composants `ActionModal`, `PromiseModal` et `PromiseList` sont des composants transverses réutilisés depuis plusieurs écrans (Dashboard Agent, Détail Dossier). Leur implémentation dans `shared/ui` est l'architecture définitive retenue — les répertoires `src/app/collection-actions/` et `src/app/payments/` initialement prévus comme modules séparés ont été supprimés. Le composant `PaymentScheduleComponent` (écran dédié avec route propre) reste dans `collection-cases/` car il est spécifique à ce domaine. L'audit (`ParametragesAuditComponent`) est sous `settings/audit/` conformément à sa route `/parametrages/audit`.

---

## 8. Stratégie de données : Mode Mock vs Mode API

Le frontend doit être livrable et démontrable **avant** la disponibilité complète du backend Spring Boot. Il doit donc fonctionner selon deux modes, basculables sans changement de code métier :

| Mode | Description | Cible |
|---|---|---|
| **MOCK** | Les services consomment des jeux de données statiques (JSON) via un provider en mémoire simulant latence/erreurs. Aucun appel réseau réel. | Développement UI, démo produit, recette fonctionnelle avant API prête, tests E2E déterministes |
| **API** | Les services consomment le backend Spring Boot réel via `HttpClient`, avec intercepteurs (auth token, erreurs, retry). | Intégration continue, recette d'intégration, production |

**Exigences :**
- Toute vue/composant dépend d'une **interface de service** (ex. `AgentWorkbenchService`) et jamais directement d'un client HTTP ou d'un fichier JSON.
- Le mode actif est déterminé par variable d'environnement (`environment.dataSource = 'mock' | 'api'`), sans recompilation logique métier — seule l'implémentation injectée change (DI Angular).
- Les DTO Mock doivent être strictement conformes aux DTO API documentés en §6 (mêmes noms de champs), pour garantir un remplacement transparent.
- Les données mock doivent couvrir tous les états UI (§10) : cas nominal, liste vide, dossier critique, promesse non tenue, erreur réseau simulée, accès refusé simulé.
- Le détail technique de cette double implémentation (structure de dossiers, conventions, exemples de code) est spécifié dans **`agent.md`** livré en complément de ce PRD.

---

## 9. Exigences non fonctionnelles

| Thème | Exigence |
|---|---|
| Performance | Écrans liste < 2s pour pages standard ; Vue 360 client < 2s avec agrégats précalculés ; pagination serveur obligatoire ≥ 100 lignes |
| Accessibilité | Conformité WCAG AA (contrastes, navigation clavier, focus visible, libellés, alt text) |
| Sécurité frontend | Filtrage d'accès appliqué côté backend (le front n'est jamais l'unique barrière) ; données sensibles masquées/absentes du payload selon droits ; actions sensibles = confirmation + commentaire obligatoire |
| Auditabilité | Exports, consultations sensibles et décisions journalisés (traçabilité déclenchée côté front, persistée côté back) |
| Multi-entité | Le frontend doit gérer changement de créancier/portefeuille/agent sans rechargement complet de page |
| Responsive | Grille desktop prioritaire (1440px) ; comportement dégradé propre en résolutions inférieures (hors mobile natif, non prioritaire MVP) |
| Internationalisation | Textes en français (langue source), architecture i18n Angular prête pour extension future |
| Qualité de code | Modules lazy-loadés, composants `shared/ui` réutilisables, typage strict TypeScript, tests unitaires sur services et composants critiques |

---

## 10. États UI standards (obligatoires sur tous les écrans)

| État | Attendu |
|---|---|
| Chargement | Skeleton loader par bloc, pas de spinner global bloquant sauf initialisation |
| Aucune donnée | Message métier clair + action utile si possible |
| Erreur API | Message non technique + bouton « Réessayer » + code erreur masqué à l'utilisateur |
| Accès refusé | Message habilitation insuffisante, sans fuite de donnée |
| Données obsolètes | Bandeau d'avertissement si date de synchronisation ancienne |
| Action réussie | Toast succès + mise à jour locale des compteurs |
| Action nécessitant confirmation | Modale de confirmation avec motif/commentaire obligatoire si action critique |

---

## 11. Sécurité et habilitations (côté frontend)

| Droit | Écrans concernés | Comportement front attendu |
|---|---|---|
| `DASHBOARD_VIEW` | Dashboards | Masquer le menu/route si absent |
| `CASE_VIEW` / `CASE_UPDATE` / `CASE_ASSIGN` | Dossiers, détail dossier, superviseur | Lecture seule ou actions désactivées selon droit |
| `CLIENT_VIEW` / `CLIENT_CONTACT_VIEW` / `CLIENT_FINANCIAL_VIEW` | Clients, dossier, rapports | Masquage champ par champ (téléphone/email/montants) |
| `ACTION_CREATE`, `PROMISE_CREATE`, `PAYMENT_PLAN_CREATE`, `PAYMENT_PLAN_APPROVE` | Dossier, superviseur | Boutons visibles uniquement si droit présent |
| `LEGAL_CASE_VIEW` / `LEGAL_CASE_MANAGE` | Contentieux | Idem |
| `REPORT_VIEW` | Rapports | Accès à la route `/rapports`, catalogue et dashboards |
| `REPORT_EXPORT` | Rapports | Boutons PDF/Excel/CSV conditionnés — suppose `REPORT_VIEW` mais reste un droit distinct |
| `SETTINGS_MANAGE` | Paramétrages | CRUD conditionné |
| `AUDIT_VIEW` | Audit | Accès route conditionné |

Principe : **le frontend adapte l'affichage par confort UX, mais ne doit jamais être considéré comme la barrière de sécurité** — le backend est source de vérité et peut renvoyer des payloads réduits.

---

## 12. Plan de livraison (alignement lots MVP)

| Lot | Écrans inclus | Objectif |
|---|---|---|
| **MVP 1 — Agent** | Dashboard agent, Dossiers, Détail dossier, Action, Promesse | Traitement opérationnel des dossiers affectés |
| **MVP 2 — Client** | Recherche client, Détail client (contrats/dettes, interactions, documents) | Vue client 360 utile à l'agent |
| **MVP 3 — Superviseur** | Dashboard superviseur, Escalades, Réaffectation | Piloter la charge et valider les exceptions |
| **MVP 4 — Paramétrage** | Référentiels, créanciers, catégories, règles DMN (lecture), imports | Solution configurable et exploitable |
| **MVP 5 — Reporting** | KPI natifs + intégration Superset | Reporting opérationnel et directionnel |

**Recommandation de séquencement technique :**
1. `shared/ui` (design system) + `shell` + couche `shared/data-access` en **mode mock**
2. MVP 1 (Agent) en mock → démo/recette fonctionnelle
3. Bascule progressive en mode API au fur et à mesure de la disponibilité des endpoints Spring Boot (par domaine, cf. §7)
4. MVP 2 à MVP 5 en parallèle du raccordement API, toujours livrables en mock d'abord

---

## 13. Critères d'acceptation globaux

| Critère | Description |
|---|---|
| Fonctionnel | Tous les CA listés en §6 (CA-AGT-*, CA-DOS-*, CA-CLI-*, CA-CLD-*, CA-CAS-*, CA-ACT-*, CA-PRO-*, CA-ECH-*, CA-LEG-*, CA-SUP-*, CA-ESC-*, CA-DMN-*, CA-RPT-*, CA-SET-*, CA-DMNSET-*, CA-IMP-*, CA-AUD-*) sont vérifiés |
| Double mode | Chaque écran fonctionne à l'identique en mode Mock et en mode API, bascule via configuration uniquement |
| UX | L'agent réalise une action depuis l'écran principal en 2 clics maximum |
| États | Tous les états standards (§10) sont implémentés sur chaque écran |
| Perf | Écrans liste < 2s ; Vue 360 < 2s |
| Sécurité | Aucune action sensible sans confirmation/motif ; aucun droit non vérifié côté affichage |
| Design | Conformité au design system (§5) et aux références visuelles fournies (dashboard agent, détail client, dashboard superviseur) |

---

## 14. Risques et hypothèses

| Risque / Hypothèse | Impact | Mitigation |
|---|---|---|
| Backend Spring Boot livré en retard | Blocage du développement frontend | Mode Mock permet de développer et recetter en autonomie (voir §8, agent.md) |
| DTO backend divergents du contrat documenté | Rework des services de mapping | Contrat DTO figé en §6/§14-SFD, tout écart nécessite avenant validé |
| Intégration Superset complexe (token, iframe) | Retard MVP 5 | Prévoir un fallback KPI natifs Angular en attendant l'intégration complète |
| Habilitations fines non finalisées côté backend | Sur-affichage temporaire de données sensibles en environnement de dev | Mode Mock doit permettre de simuler chaque droit/rôle pour test avant API réelle |

---

## 15. Annexes

- Annexe A — Catégories d'action Agent (codes, libellés, priorités) : voir SFD §Annexe A
- Annexe B — États standards UI : voir §10 ci-dessus (repris de SFD Annexe B)
- Références visuelles fournies : écran principal Agent (Vue groupe/DataGrid/Kanban), écran détail Client, dashboard Superviseur — à utiliser comme socle pixel pour le design system
- Document source complet : *Spécifications détaillées des IHM — MERCURE Collect AI v1.0*
- Document complémentaire : **`agent.md`** — guide de livraison technique frontend (mock + API)
