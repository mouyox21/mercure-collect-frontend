# QA — Audit Navigation & Rôles

**Date :** 2026-08-03  
**Périmètre :** AppSidebar, AppHeader, RoleMenuConfigService, supervisor/*, settings/*  
**Note :** Les trois screenshots évoqués (`vue Administrateur / Journal d'audit`, `vue Manager / Console des escalades`, `vue Superviseur / Supervision IA`) n'existent pas encore dans le dépôt (`docs/` ne contient que des fichiers `.md`). L'audit s'appuie donc exclusivement sur l'analyse du code.

---

## 1. Duplication de navigation — CONFIRMÉ (2 composants non traités)

### Cause racine

Le prompt 12.3 a supprimé le bloc `<nav class="sdash__sidenav">` du `SuperviseurDashboardComponent`. **Deux autres composants superviseur ont conservé leur propre sidenav interne** et n'ont pas été traités :

| Composant | Sélecteur CSS | Titre hardcodé | Fichier |
|---|---|---|---|
| `SuperviseurEscaladesComponent` | `econsole__sidenav` | "Supervision" | `supervisor/escalades/supervisor-escalades.component.html` |
| `SuperviseurIaDmnComponent` | `iadmn__sidenav` | "Supervision" | `supervisor/ia-dmn/supervisor-ia-dmn.component.html` |

### Effet visuel

Quand un utilisateur navigue vers `/superviseur/escalades` ou `/superviseur/ia-dmn`, **trois colonnes** s'affichent côte à côte :

```
[AppSidebar 220px] [sidenav interne 196px] [contenu principal]
```

Le bloc interne (fond `#1f2937`, 196 px de large) est défini dans le SCSS de chaque composant avec `display: flex; min-height: 100%`. Il est structurellement identique au bloc qui a été retiré du dashboard.

### Ce n'est pas un orphelin

Ces sidebars ne sont pas des résidus de CSS mort — elles font partie du template HTML rendu et occupent de l'espace visuel. Elles ne sont pas conditionnelles : elles s'affichent systématiquement, quel que soit le rôle actif.

---

## 2. Fuite de menu inter-rôles — CONFIRMÉ (items identiques + Paramétrage non gardé)

### Menu identique pour SUPERVISOR et MANAGER

Les deux sidebars internes (`econsole__sidenav` et `iadmn__sidenav`) affichent **exactement les mêmes 7 items** pour n'importe quel rôle connecté, sans vérification de droits :

```
Vue manager · Portefeuilles · Équipe · Escalades · Contentieux · Supervision IA · Paramétrage
```

Cette liste est hardcodée — aucun `*appHasRight`, aucune directive conditionnelle. Elle ne tient pas compte de la config différenciée définie dans `RoleMenuConfigService` :

| Rôle | Items attendus (`RoleMenuConfigService`) | Items affichés (sidenav interne) |
|---|---|---|
| SUPERVISOR | Vue superviseur / Équipe / Escalades / Contentieux / Supervision IA | Vue manager / Portefeuilles / Équipe / Escalades / Contentieux / Supervision IA / **Paramétrage** |
| MANAGER | Vue manager / Portefeuilles / Performance / Décisions / Reporting | Vue manager / Portefeuilles / Équipe / Escalades / Contentieux / Supervision IA / **Paramétrage** |

Écarts constatés :
- SUPERVISOR voit "Vue **manager**" au lieu de "Vue **superviseur**"
- SUPERVISOR voit "Portefeuilles" qui lui est étranger
- MANAGER voit "Équipe" et "Supervision IA" qui ne font pas partie de son espace
- Les deux voient "Paramétrage" qui nécessite `SETTINGS_MANAGE`, droit absent du profil `superviseur`

### "Paramétrage" visible sans droit

Le lien `<a routerLink="/parametrages">` apparaît dans les deux sidebars sans aucun contrôle de permission. Le `roleGuard` bloque bien la navigation effective (le router intercepte), mais le lien reste **affiché et cliquable** — l'utilisateur voit un item qui provoque une redirection silencieuse. C'est une fuite UI.

---

## 3. Route "Équipe" — STUB, PAS DE ROUTE DÉDIÉE

### État dans `supervisor.routes.ts`

```typescript
// Routes déclarées sous /superviseur/* :
'dashboard'  → SuperviseurDashboardComponent     ✓
'escalades'  → SuperviseurEscaladesComponent     ✓
'ia-dmn'     → SuperviseurIaDmnComponent         ✓
// Aucune route 'equipe'
```

### Comportement par source

**Dans les sidebars internes (econsole + iadmn) :**  
"Équipe" est rendu comme un `<span>` non-cliquable avec la classe `--disabled` :
```html
<span class="econsole__sidenav-stub econsole__sidenav-stub--disabled" title="Bientôt disponible">
```
→ Pas d'erreur router, pas de navigation. Item désactivé visuellement (opacity: 0.45).

**Dans `RoleMenuConfigService` (contextual block AppSidebar — rôle SUPERVISOR) :**
```typescript
{ label: 'Équipe', icon: '👥', route: '/superviseur/dashboard', requiredRight: 'CASE_ASSIGN' }
```
→ L'item "Équipe" pointe vers `/superviseur/dashboard`, **même URL que "Vue superviseur"**. Aucune erreur router, mais navigation incorrecte (redirige vers le dashboard superviseur au lieu d'un écran équipe).

### Résumé

| Source | Comportement | Erreur console |
|---|---|---|
| Sidebars internes | Stub désactivé (`<span>`) | Aucune |
| AppSidebar contextuel (SUPERVISOR) | Lien actif → `/superviseur/dashboard` | Aucune (route valide) |
| Routes déclarées | Pas de `/superviseur/equipe` | Aucune (route jamais appelée) |

Il n'y a pas d'erreur JavaScript reproductible. Le problème est fonctionnel : "Équipe" ne mène nulle part d'utile.

---

## 4. Cohérence active-state — DÉSYNCHRONISATION STRUCTURELLE

### Deux mécanismes d'activation coexistent

| Bloc | Mécanisme | Synchronisation router |
|---|---|---|
| AppSidebar contextuel | `routerLinkActive="sidebar__ctx-link--active"` (Angular) | Oui — réactif |
| Sidebars internes (econsole, iadmn) | CSS class hardcodée `--stub--active` sur `<span>` | Non — statique |

### Cas concrets de désynchronisation

**Rôle SUPERVISOR, page `/superviseur/escalades` :**
- AppSidebar : "Escalades" actif via `routerLinkActive` ✓
- Sidenav interne : "Escalades" hardcodé actif (`econsole__sidenav-stub--active`) ✓
- Résultat : deux blocs affichent simultanément "Escalades" en surbrillance (bleu dans la sidenav interne, fond semi-transparent dans l'AppSidebar). Double signal visuel redondant.

**Rôle MANAGER, page `/superviseur/escalades` :**
- AppSidebar : "Décisions" actif via `routerLinkActive` (car `route: '/superviseur/escalades'`) ✓
- Sidenav interne : "Escalades" hardcodé actif — "Décisions" absent du bloc interne, "Équipe" et "Portefeuilles" désactivés
- Résultat : item actif différent dans chaque bloc → désorientation visuelle.

**Rôle SUPERVISOR, page `/superviseur/ia-dmn` :**
- AppSidebar : "Supervision IA" actif via `routerLinkActive` ✓
- Sidenav interne (iadmn) : "Supervision IA" hardcodé actif via `iadmn__sidenav-stub--active` sur `<span>` — **mais c'est un stub non-cliquable**, pas un `<a>` avec `routerLink`. Le routeur n'en est pas informé.
- Résultat : deux blocs affichent "Supervision IA" actif, mais par des moyens différents (router vs CSS statique).

**Double activation du contexte AppSidebar pour SUPERVISOR :**  
"Vue superviseur" et "Équipe" partagent le même `route: '/superviseur/dashboard'` dans `RoleMenuConfigService`. Quand l'URL est `/superviseur/dashboard`, `routerLinkActive` active **les deux items simultanément**.

---

## 5. Écran Admin (Journal d'audit) — PAS DE DUPLICATION ✓

### Confirmation code

Le template `audit.component.html` (et tous les templates sous `settings/`) ne contient aucun bloc de navigation secondaire. La vérification par grep sur `src/app/settings/**` ne retourne aucun fichier correspondant aux patterns `sidenav`, `__sidenav`, `secondary.*nav`.

Structure effective pour ADMIN à `/parametrages/audit` :
```
[AppSidebar] → nav commune + bloc "Administration" (contextuel)
[Contenu principal] → audit.component directement
```

### Pourquoi c'est correct et pas les deux autres

Les écrans `settings/` ont été développés **après** la mise en place du système AppSidebar contextuel (prompts 12.3/12.4). Ils n'ont donc jamais eu besoin d'une navigation interne — ils délèguent entièrement la navigation à l'AppSidebar.

Les écrans `supervisor/escalades` et `supervisor/ia-dmn` existaient **avant** ce refactor. Leur sidenav interne était la seule navigation disponible à l'époque (avant l'intégration de `RoleMenuConfigService` dans l'AppSidebar). Lors du prompt 12.3, seul le `supervisor-dashboard` a été traité car il était le composant principal visé. Les deux autres sont restés dans leur état d'avant-refactor.

---

## Récapitulatif des anomalies

| # | Anomalie | Sévérité | Composants concernés |
|---|---|---|---|
| 1 | Double sidenav (AppSidebar + interne) sur 2 écrans superviseur | **Haute** | `supervisor-escalades`, `supervisor-ia-dmn` |
| 2 | Menu interne identique pour SUPERVISOR et MANAGER (pas de différenciation de rôle) | **Haute** | idem |
| 3 | "Paramétrage" affiché sans droit `SETTINGS_MANAGE` pour SUPERVISOR/MANAGER | **Moyenne** | idem |
| 4 | "Équipe" dans AppSidebar pointe vers `/superviseur/dashboard` (alias trompeur) | **Moyenne** | `RoleMenuConfigService` |
| 5 | Double activation `routerLinkActive` (même route) | **Faible** | `RoleMenuConfigService` MANAGER |
| 6 | Active-state désynchronisé entre AppSidebar (router) et sidenav interne (CSS statique) | **Haute** | `supervisor-escalades`, `supervisor-ia-dmn` |
| 7 | H1 `supervisor-dashboard` hardcodé "Vue manager" (identique pour SUPERVISOR et MANAGER) | **Faible** | `supervisor-dashboard` |
| 8 | AGENT contextual block duplique les 3 items du common nav (même URLs) | **Faible** | `RoleMenuConfigService` AGENT |

---

## Plan de correction suggéré (non implémenté)

1. **Supprimer les blocs `sidenav` internes** de `supervisor-escalades.component.html` et `supervisor-ia-dmn.component.html`, ainsi que leurs styles SCSS associés (`__sidenav-*`). Adapter le layout racine (`display: flex` → `display: block`) comme fait pour le dashboard.
2. **Supprimer "Paramétrage"** des sidebars internes et ne jamais l'afficher sans vérification `*appHasRight="'SETTINGS_MANAGE'"`.
3. **Corriger la route "Équipe"** dans `RoleMenuConfigService` : soit pointer vers une vraie route à créer (`/superviseur/equipe`), soit supprimer l'item jusqu'à implémentation.
4. **Séparer "Vue superviseur" et "Équipe"** pour qu'ils n'aient pas la même `route` — évite la double activation `routerLinkActive`.
5. **Dynamiser le H1** de `supervisor-dashboard` via `ActiveRoleService.currentRole()` : SUPERVISOR → "Vue superviseur", MANAGER → "Vue manager".
6. **Réviser le MENU_CONFIG.AGENT** pour ne pas dupliquer les items du common nav dans le bloc contextuel.

---

## Statut post-correction — vérification 2026-08-03

Vérification effectuée par lecture des sources :
- `supervisor-escalades.component.html`
- `supervisor-ia-dmn.component.html`
- `role-menu-config.service.ts`
- `supervisor.routes.ts`
- `app-sidebar.component.html`
- `supervisor-dashboard.component.ts` + `.html`

| # | Anomalie | Statut | Preuve |
|---|---|---|---|
| 1 | Double sidenav sur escalades / ia-dmn | ✅ OK | Les deux templates ne contiennent plus aucun bloc `sidenav` interne. Root `<div class="econsole">` / `<div class="iadmn">` — layout direct sans colonne de nav secondaire. |
| 2 | Menu interne identique SUPERVISOR / MANAGER | ✅ OK | Sidebars internes supprimées. `RoleMenuConfigService` affiche des listes différenciées : SUPERVISOR (5 items) vs MANAGER (5 items distincts), propagées par l'AppSidebar via `contextualMenu()`. |
| 3 | "Paramétrage" visible sans droit `SETTINGS_MANAGE` | ✅ OK | `MENU_CONFIG.SUPERVISOR` et `MENU_CONFIG.MANAGER` ne contiennent aucune entrée `Paramétrage`. Le lien n'est affiché que dans `MENU_CONFIG.ADMIN` avec `requiredRight: 'SETTINGS_MANAGE'`. |
| 4 | "Équipe" → écran distinct de "Vue superviseur" | ✅ OK | `RoleMenuConfigService` SUPERVISOR : `route: '/superviseur/equipe'`. `supervisor.routes.ts` : route `equipe` chargée → `SuperviseurEquipeComponent` (composant dédié, distinct du dashboard). |
| 5 | Double activation `routerLinkActive` | ✅ OK | `RoleMenuEntry` enrichi d'un champ `queryParams?: Record<string, string>`. MANAGER "Performance" → `{ vue: 'performance' }`, "Reporting" → `{ vue: 'reporting' }`. `AppSidebarComponent.linkActiveOptions()` retourne `IsActiveMatchOptions` avec `queryParams: 'exact'` pour les items dotés de query params, `queryParams: 'ignored'` sinon. Sur `/rapports?vue=performance` seul "Performance" est actif ; sur `/rapports?vue=reporting` seul "Reporting" est actif. Aucune modification du module Rapports requise. |
| 6 | Active-state désynchronisé (AppSidebar vs sidenav interne) | ✅ OK | Sidebars internes supprimées. Un seul mécanisme : `routerLinkActive="sidebar__ctx-link--active"` dans `app-sidebar.component.html`. |
| 7 | H1 hardcodé "Vue manager" | ✅ OK | `supervisor-dashboard.component.ts` : `readonly pageTitle = computed(() => this.activeRole.currentRole() === 'SUPERVISOR' ? 'Vue superviseur' : 'Vue manager')`. Template : `{{ pageTitle() }}`. Testé par 3 specs (`SUPERVISOR`, `MANAGER`, reactive change). |
| 8 | Bloc AGENT duplique les items du common nav | ✅ OK | `MENU_CONFIG.AGENT = []`. L'AppSidebar masque le bloc contextuel via `@if (contextualMenu().length > 0)` — aucun doublon Dashboard / Dossiers / Clients rendu. |

| 9 | Style sidebar non unifié (emojis vs icônes vectorielles, typographie et états actif divergents entre nav commune et nav contextuelle) | ✅ OK | Bloc contextuel migré vers les mêmes icônes SVG Heroicons v2 outline que la nav commune (`sidebar__icon` 20 × 20 px, `stroke-width="1.5"`). `__ctx-link` : `padding`, `color`, `font-weight` et fond `--active` alignés sur `__link`. `__ctx-menu` : `padding-top` retiré pour homogénéiser le rythme vertical. `__ctx-icon` (classe emoji) supprimée. `RoleMenuEntry.icon` typé `SidebarIconName` (union de 15 noms Heroicons) ; paths centralisés dans `sidebar-icons.ts` (couche `shared/data-access`). |

### Bilan

**9/9 anomalies corrigées.** Aucun KO résiduel. Les prompts fonctionnels suivants peuvent reprendre sans blocage de navigation ni incohérence visuelle de la sidebar.
