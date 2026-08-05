# QA — Mapping Rôles ↔ Routes ↔ Droits

**Date :** 2026-08-04 — mise à jour Prompt 19.2 : profil MANAGER dédié  
**Source :** `src/app/shared/data-access/permission.types.ts`, `role-menu-config.service.ts`

---

## 1. Table de référence

| Rôle actif | Route par défaut | Section sidebar | Profil `RoleProfile` |
|---|---|---|---|
| `AGENT` | `/dashboard` | *(aucune — bloc contextuel masqué)* | `agent` |
| `SUPERVISOR` | `/superviseur/dashboard` | Espace Superviseur | `superviseur` |
| `MANAGER` | `/superviseur/dashboard` | Espace Manager | `manager` *(dédié depuis Prompt 19.2)* |
| `ADMIN` | `/parametrages` | Administration | `administrateur` |

---

## 2. Routes protégées et droits requis

| Préfixe URL | Droit requis (`PermissionCode`) | Rôles autorisés |
|---|---|---|
| `/dashboard` | `DASHBOARD_VIEW` | AGENT, SUPERVISOR, MANAGER, ADMIN |
| `/dossiers` | `CASE_VIEW` | AGENT, SUPERVISOR, MANAGER, ADMIN |
| `/clients` | `CLIENT_VIEW` | AGENT, SUPERVISOR, MANAGER, ADMIN |
| `/superviseur/*` | `CASE_ASSIGN` | SUPERVISOR, MANAGER, ADMIN |
| `/contentieux` | `LEGAL_CASE_VIEW` | SUPERVISOR, ADMIN |
| `/rapports` | `REPORT_VIEW` | SUPERVISOR, MANAGER, ADMIN |
| `/parametrages/*` | `SETTINGS_MANAGE` | ADMIN |

Le `roleGuard` est appliqué sur chaque préfixe protégé dans `app.routes.ts`. En cas d'accès refusé, l'utilisateur est redirigé vers `/dashboard`.

---

## 3. Comportement au changement de rôle (sélecteur header)

1. `ActiveRoleService.setRole(role)` est appelé.
2. `MockActiveRoleService` met à jour son signal et appelle `PermissionService.setProfile()`.
3. `AppHeaderComponent.onRoleChange()` vérifie si l'URL courante reste accessible (via `PROTECTED_PREFIXES`). Si non, redirection vers `ROLE_DEFAULT_ROUTES[role]`.

**Exemples :**
- Superviseur sur `/superviseur/escalades` → passe à AGENT → redirigé vers `/dashboard`
- Admin sur `/parametrages` → passe à AGENT → redirigé vers `/dashboard`
- Agent sur `/dashboard` → passe à SUPERVISOR → reste sur `/dashboard`
- Manager sur `/rapports` → passe à AGENT → redirigé vers `/dashboard` (agent n'a pas `REPORT_VIEW`)

---

## 4. Menus contextuels par rôle — configuration corrigée

> Périmètre : bloc contextuel AppSidebar uniquement (la nav commune Dashboard / Dossiers / Clients est gérée séparément dans `app-sidebar.component.html`).

### AGENT — bloc contextuel masqué

`MENU_CONFIG.AGENT = []` — `contextualMenu().length === 0` → la section "Espace Agent" n'est pas rendue par l'`@if` de l'AppSidebar.

**Raison :** toute la navigation AGENT est couverte par la nav commune.

---

### SUPERVISOR — "Espace Superviseur"

| # | Item | Route | Droit requis | Route unique dans le rôle |
|---|---|---|---|---|
| 1 | Vue superviseur | `/superviseur/dashboard` | `CASE_ASSIGN` | ✓ |
| 2 | Équipe | `/superviseur/equipe` | `CASE_ASSIGN` | ✓ |
| 3 | Escalades | `/superviseur/escalades` | `ESCALATION_CREATE` | ✓ |
| 4 | Contentieux | `/contentieux` | `LEGAL_CASE_VIEW` | ✓ |
| 5 | Supervision IA | `/superviseur/ia-dmn` | `CASE_ASSIGN` | ✓ |

---

### MANAGER — "Espace Manager"

| # | Item | Route | Droit requis | Route unique dans le rôle |
|---|---|---|---|---|
| 1 | Vue manager | `/superviseur/dashboard` | `CASE_ASSIGN` | ✓ |
| 2 | Portefeuilles | `/superviseur/portefeuilles` | `CASE_ASSIGN` | ✓ |
| 3 | Performance | `/rapports` | `REPORT_VIEW` | ⚠ partagée avec #5 |
| 4 | Décisions | `/superviseur/escalades` | `ESCALATION_CREATE` | ✓ |
| 5 | Reporting | `/rapports` | `REPORT_VIEW` | ⚠ partagée avec #3 |

**Limitation résiduelle — Performance / Reporting :** partagent `/rapports`. Correction différée à l'évolution du module Rapports (sous-routes `/rapports/performance` et `/rapports/reporting`).

---

### ADMIN — "Administration"

| # | Item | Route | Droit requis | Route unique dans le rôle |
|---|---|---|---|---|
| 1 | Paramétrage | `/parametrages` | `SETTINGS_MANAGE` | ✓ |
| 2 | Référentiels | `/parametrages/referentiels` | `SETTINGS_MANAGE` | ✓ |
| 3 | Règles & Workflows | `/parametrages/regles-workflows` | `SETTINGS_MANAGE` | ✓ |
| 4 | Imports | `/parametrages/imports` | `SETTINGS_MANAGE` | ✓ |
| 5 | Audit | `/parametrages/audit` | `AUDIT_VIEW` | ✓ |

---

## 5. Vérification globale : "/parametrages" et droit SETTINGS_MANAGE

Aucune entrée de `MENU_CONFIG` pour AGENT, SUPERVISOR ou MANAGER ne contient de route sous `/parametrages`. L'intégralité des entrées `/parametrages*` est exclusivement dans `ADMIN`.

---

## 6. Dashboard Superviseur vs Dashboard Manager

`SuperviseurDashboardComponent` sert les deux rôles (`/superviseur/dashboard`). Le titre dynamique (`pageTitle`) est un `computed` sur `ActiveRoleService.currentRole()` :
- `SUPERVISOR` → `"Vue superviseur"`
- `MANAGER` → `"Vue manager"`

---

## 7. Droits reporting — `REPORT_VIEW` vs `REPORT_EXPORT`

| Droit | Rôles | Effet |
|---|---|---|
| `REPORT_VIEW` | `superviseur`, `manager`, `administrateur` | Accès à la route `/rapports` ; affichage du catalogue et des dashboards |
| `REPORT_EXPORT` | `superviseur`, `manager`, `administrateur` | Boutons PDF/Excel/CSV visibles et actifs |
| *(aucun)* | `agent` | Aucun accès à `/rapports` |

---

## 8. Profil MANAGER — périmètre de droits (Prompt 19.2)

### Décision architecturale

Avant le Prompt 19.2, `MANAGER` héritait du profil `superviseur` via `ROLE_TO_PROFILE`. Ce raccourci accordait au Manager des droits opérationnels non pertinents (`CLIENT_CONTACT_VIEW`, `ACTION_CREATE`, `PROMISE_CREATE`, `PAYMENT_PLAN_CREATE`, `CASE_UPDATE`, `LEGAL_CASE_VIEW`).

Le profil `manager` est désormais un profil distinct dans `ROLE_PERMISSIONS`, reflétant le rôle réel : **vision consolidée multi-portefeuilles, pilotage stratégique — sans intervention opérationnelle directe**.

### Matrice de droits MANAGER

| `PermissionCode` | Manager | Justification |
|---|---|---|
| `DASHBOARD_VIEW` | ✓ | Navigation commune (Dashboard) |
| `CASE_VIEW` | ✓ | Navigation commune (Dossiers) + DataGrid superviseur |
| `CASE_ASSIGN` | ✓ | Garde de route `/superviseur/*` + menu Décisions |
| `CLIENT_VIEW` | ✓ | Navigation commune (Clients) |
| `CLIENT_FINANCIAL_VIEW` | ✓ | Vue consolidée — indicateurs financiers par portefeuille |
| `PAYMENT_PLAN_APPROVE` | ✓ | Validation échéanciers au niveau management |
| `ESCALATION_CREATE` | ✓ | Filtrage menu "Décisions" → `/superviseur/escalades` |
| `REPORT_VIEW` | ✓ | Filtrage menus "Performance" et "Reporting" → `/rapports` |
| `REPORT_EXPORT` | ✓ | Export PDF/Excel/CSV (même périmètre que `REPORT_VIEW`) |
| `CASE_UPDATE` | ✗ | Édition opérationnelle — niveau agent/superviseur |
| `CLIENT_CONTACT_VIEW` | ✗ | Le Manager ne contacte pas directement les clients |
| `ACTION_CREATE` | ✗ | Création d'actions — niveau agent/superviseur |
| `PROMISE_CREATE` | ✗ | Création de promesses — niveau agent/superviseur |
| `PAYMENT_PLAN_CREATE` | ✗ | Crée pas — approuve seulement |
| `LEGAL_CASE_VIEW` | ✗ | Contentieux absent du menu MANAGER |
| `LEGAL_CASE_MANAGE` | ✗ | Réservé ADMIN |
| `SETTINGS_MANAGE` | ✗ | Réservé ADMIN |
| `AUDIT_VIEW` | ✗ | Réservé ADMIN |

### Vérification accès par écran MANAGER

| Écran (menu item) | Route | Droit contrôlant l'accès | Présent dans profil `manager` ? |
|---|---|---|---|
| Vue manager | `/superviseur/dashboard` | `CASE_ASSIGN` (route guard) | ✓ |
| Portefeuilles | `/superviseur/portefeuilles` | `CASE_ASSIGN` (route guard) | ✓ |
| Performance | `/rapports` | `REPORT_VIEW` (route guard + menu filter) | ✓ |
| Décisions | `/superviseur/escalades` | `ESCALATION_CREATE` (menu filter) | ✓ |
| Reporting | `/rapports` | `REPORT_VIEW` (route guard + menu filter) | ✓ |
| Dashboard (nav commune) | `/dashboard` | `DASHBOARD_VIEW` | ✓ |
| Dossiers (nav commune) | `/dossiers` | `CASE_VIEW` | ✓ |
| Clients (nav commune) | `/clients` | `CLIENT_VIEW` | ✓ |

**Aucune régression** — tous les écrans accessibles avant le Prompt 19.2 (via héritage `superviseur`) et pertinents pour le Manager restent accessibles. Les droits retirés (`LEGAL_CASE_VIEW`, `ACTION_CREATE`, etc.) correspondaient à des fonctionnalités qui n'apparaissent pas dans le menu MANAGER.

### REPORT_CATALOGUE — rapports visibles par Manager

| Rapport | Manager voit ? | Justification |
|---|---|---|
| RPT-001 Performance de recouvrement | ✓ | Vue consolidée essentielle |
| RPT-002 Taux de promesses tenues | ✓ | Pilotage stratégique |
| RPT-003 Aging des créances | ✓ | Vision portefeuilles |
| RPT-004 Performance équipe | ✓ | Pilotage des superviseurs |
| RPT-005 Suivi des escalades | ✓ | Traitement des décisions |
| RPT-006 Analyse IA / DMN | ✓ | Supervision modèles |
| RPT-007 Encours par créancier | ✗ | Niveau administrateur |
| RPT-008 Imports & rejets | ✗ | Niveau administrateur |
| RPT-009 Audit des actions | ✗ | Réservé ADMIN (`AUDIT_VIEW`) |
| RPT-010 Contentieux actifs | ✓ | Vue consolidée (lecture seule) |

---

## 9. Gaps résiduels

| Gap | Sévérité | Action |
|---|---|---|
| MANAGER "Performance" / "Reporting" partagent `/rapports` | Faible | Créer sous-routes `/rapports/performance` et `/rapports/reporting` lors de l'évolution du module |
| Route stub `portefeuilles` redirige vers dashboard | Faible | Implémenter le composant dédié |

---

*Mise à jour 2026-08-03 — corrections nav : AGENT bloc contextuel vidé, SUPERVISOR Équipe corrigée, MANAGER Portefeuilles corrigée, sidebars internes supprimées.*  
*Mise à jour 2026-08-04 — AN-SEC-01 : ajout `REPORT_VIEW`, séparation accès/export, mise à jour roleGuard.*  
*Mise à jour 2026-08-04 — Prompt 19.2 : profil `manager` dédié dans `RoleProfile` + `ROLE_PERMISSIONS`. Retrait de l'héritage `superviseur`. Matrice de droits complète. `user-mock.service.ts` + `permission-debug.component.ts` + `reporting.component.ts` mis à jour.*
