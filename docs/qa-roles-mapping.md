# QA — Mapping Rôles ↔ Routes ↔ Droits

**Date :** 2026-08-03 — mise à jour post-corrections navigation  
**Source :** `src/app/shared/data-access/role-menu-config.service.ts`

---

## 1. Table de référence

| Rôle actif | Route par défaut | Section sidebar |
|---|---|---|
| `AGENT` | `/dashboard` | *(aucune — bloc contextuel masqué)* |
| `SUPERVISOR` | `/superviseur/dashboard` | Espace Superviseur |
| `MANAGER` | `/superviseur/dashboard` | Espace Manager |
| `ADMIN` | `/parametrages` | Administration |

---

## 2. Routes protégées et droits requis

| Préfixe URL | Droit requis (`PermissionCode`) | Rôles autorisés |
|---|---|---|
| `/dashboard` | `DASHBOARD_VIEW` | AGENT, SUPERVISOR, MANAGER, ADMIN |
| `/dossiers` | `CASE_VIEW` | AGENT, SUPERVISOR, MANAGER, ADMIN |
| `/clients` | `CLIENT_VIEW` | AGENT, SUPERVISOR, MANAGER, ADMIN |
| `/superviseur/*` | `CASE_ASSIGN` | SUPERVISOR, MANAGER, ADMIN |
| `/contentieux` | `LEGAL_CASE_VIEW` | SUPERVISOR, MANAGER, ADMIN |
| `/rapports` | `REPORT_EXPORT` | SUPERVISOR, MANAGER, ADMIN |
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

---

## 4. Menus contextuels par rôle — configuration corrigée

> Périmètre : bloc contextuel AppSidebar uniquement (la nav commune Dashboard / Dossiers / Clients est gérée séparément dans `app-sidebar.component.html`).

### AGENT — bloc contextuel masqué

`MENU_CONFIG.AGENT = []` — `contextualMenu().length === 0` → la section "Espace Agent" n'est pas rendue par l'`@if` de l'AppSidebar.

**Raison :** toute la navigation AGENT est couverte par la nav commune. Les 4 entrées antérieures étaient des doublons (Tableau de bord / Mes dossiers / Clients → mêmes routes que la nav commune ; Historique → `/dossiers`, également en double).

---

### SUPERVISOR — "Espace Superviseur"

| # | Item | Route | Droit requis | Route unique dans le rôle |
|---|---|---|---|---|
| 1 | Vue superviseur | `/superviseur/dashboard` | `CASE_ASSIGN` | ✓ |
| 2 | Équipe | `/superviseur/equipe` | `CASE_ASSIGN` | ✓ *(Prompt 14.3)* |
| 3 | Escalades | `/superviseur/escalades` | `ESCALATION_CREATE` | ✓ |
| 4 | Contentieux | `/contentieux` | `LEGAL_CASE_VIEW` | ✓ |
| 5 | Supervision IA | `/superviseur/ia-dmn` | `CASE_ASSIGN` | ✓ |

**Toutes les routes sont uniques.** Aucune double activation `routerLinkActive` possible.

**"Équipe" :** route `/superviseur/equipe` implémentée — `SuperviseurEquipeComponent` (Prompt 14.3). DataGrid agents + filtres période/portefeuille + drawer de détail.

**Correction apportée :** l'ancienne route `/superviseur/dashboard` sur "Équipe" (identique à "Vue superviseur") provoquait une double activation `routerLinkActive` à chaque visite du dashboard. Corrigé.

---

### MANAGER — "Espace Manager"

| # | Item | Route | Droit requis | Route unique dans le rôle |
|---|---|---|---|---|
| 1 | Vue manager | `/superviseur/dashboard` | `CASE_ASSIGN` | ✓ |
| 2 | Portefeuilles | `/superviseur/portefeuilles` | `CASE_ASSIGN` | ✓ |
| 3 | Performance | `/rapports` | `REPORT_EXPORT` | ⚠ partagée avec #5 |
| 4 | Décisions | `/superviseur/escalades` | `ESCALATION_CREATE` | ✓ |
| 5 | Reporting | `/rapports` | `REPORT_EXPORT` | ⚠ partagée avec #3 |

**Périmètre confirmé :** la config MANAGER ne contient pas "Équipe", "Supervision IA" ni "Escalades". Ces items ne fuitaient que depuis les sidebars internes (supprimées), pas depuis cette config officielle.

**Correction apportée :** "Vue manager" et "Portefeuilles" partageaient `/superviseur/dashboard` → double activation `routerLinkActive`. Corrigé : "Portefeuilles" déplacé sur `/superviseur/portefeuilles` (stub `redirectTo: 'dashboard'` dans `supervisor.routes.ts`).

**Limitation résiduelle — Performance / Reporting :** ces deux items partagent `/rapports`. Ils représentent conceptuellement deux usages distincts du même écran Rapports, mais l'écran est une page unique sans sous-routes. Sur `/rapports`, `routerLinkActive` activera simultanément les deux items. La correction complète requiert des sous-routes dédiées (ex. `/rapports/performance`, `/rapports/reporting`) — différé à l'évolution du module Rapports.

---

### ADMIN — "Administration"

| # | Item | Route | Droit requis | Route unique dans le rôle |
|---|---|---|---|---|
| 1 | Paramétrage | `/parametrages` | `SETTINGS_MANAGE` | ✓ |
| 2 | Référentiels | `/parametrages/referentiels` | `SETTINGS_MANAGE` | ✓ |
| 3 | Règles & Workflows | `/parametrages/regles-workflows` | `SETTINGS_MANAGE` | ✓ |
| 4 | Imports | `/parametrages/imports` | `SETTINGS_MANAGE` | ✓ |
| 5 | Audit | `/parametrages/audit` | `AUDIT_VIEW` | ✓ |

**Toutes les routes sont uniques.**

---

## 5. Vérification globale : "/parametrages" et droit SETTINGS_MANAGE

Aucune entrée de `MENU_CONFIG` pour AGENT, SUPERVISOR ou MANAGER ne contient de route sous `/parametrages`. L'intégralité des entrées `/parametrages*` est exclusivement dans `ADMIN`, toutes associées à `SETTINGS_MANAGE` (sauf "Audit" → `AUDIT_VIEW`, droit plus restrictif).

Les liens `<a routerLink="/parametrages">` qui apparaissaient sans garde de permission dans les anciens sidebars internes de `supervisor-escalades` et `supervisor-ia-dmn` ont été **supprimés** avec le retrait de ces blocs (session précédente).

**Résultat :** aucun chemin d'accès UI à `/parametrages` n'est possible sans `SETTINGS_MANAGE`. Le `roleGuard` bloque la navigation effective ; l'affichage ne montre plus le lien pour les rôles non autorisés.

---

## 6. Dashboard Superviseur vs Dashboard Manager

### Décision architecturale : un seul composant

`SuperviseurDashboardComponent` sert les deux rôles (`/superviseur/dashboard`).

**Pourquoi ne pas créer deux composants distincts ?**  
Les données proviennent du même endpoint `SupervisorService.getDashboard()` et le DTO retourné est identique pour SUPERVISOR et MANAGER. Le contenu des sections (KPI bar, table aging, table équipe, alertes, décisions) est actuellement le même pour les deux rôles. Créer deux composants maintenant serait du sur-découpage prématuré.

Le focus métier différent entre les deux rôles (Manager → Portefeuilles/Performance/Reporting ; Supervisor → Équipe/Escalades/Supervision IA) se traduit dans les **items du menu contextuel** (géré par `RoleMenuConfigService`), pas dans le contenu de `/superviseur/dashboard`.

**Quand reconsidérer ?** Si les exigences futures demandent des KPIs, des tables ou des actions spécifiques à un seul rôle sur cette page, on crée alors deux composants (`SuperviseurVueComponent` et `ManagerVueComponent`) avec routes dédiées.

### Titre dynamique (corrigé)

`pageTitle` est un `computed` sur `ActiveRoleService.currentRole()` :
- `SUPERVISOR` → `"Vue superviseur"`
- `MANAGER` (et tout autre rôle) → `"Vue manager"`

---

## 7. Gaps résiduels

| Gap | Sévérité | Action |
|---|---|---|
| MANAGER "Performance" / "Reporting" partagent `/rapports` | Faible | Créer sous-routes `/rapports/performance` et `/rapports/reporting` lors de l'évolution du module |
| Route stub `portefeuilles` redirige vers dashboard | Faible | Implémenter le composant dédié |
| MANAGER sans profil de permissions propre | Moyenne | Ajouter `'manager'` à `RoleProfile` + `ROLE_PERMISSIONS` |

---

*Mise à jour 2026-08-03 — corrections nav : AGENT bloc contextuel vidé, SUPERVISOR Équipe corrigée, MANAGER Portefeuilles corrigée, sidebars internes supprimées. Dashboard H1 dynamique via ActiveRoleService.*
