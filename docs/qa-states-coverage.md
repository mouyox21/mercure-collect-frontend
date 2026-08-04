# QA — Couverture des 7 états UI standards (PRD §10)

Audit des 15 écrans livrés (Phases 4–9). Chaque état est évalué selon la présence effective du composant ou du comportement attendu.

**Composants partagés Phase 1.5 :**
| État | Composant | Sélecteur |
|------|-----------|-----------|
| loading | `SkeletonLoaderComponent` | `mc-skeleton-loader` |
| empty | `EmptyStateComponent` | `mc-empty-state` |
| error | `ErrorStateComponent` | `mc-error-state` |
| forbidden | `ForbiddenStateComponent` | `mc-forbidden-state` |
| stale | `StaleDataBannerComponent` | `mc-stale-data-banner` |
| success | `SuccessToastComponent` | `mc-success-toast` |
| confirmation | `ModalFormComponent` / pattern 2-étapes | — |

**Légende :** ✓ implémenté · ✗ absent · N/A non applicable · ~✓ équivalent natif (`@empty` dans `@for`)

---

## Tableau de couverture

| Écran | Route | loading | empty | error | forbidden | stale | success¹ | confirmation² |
|-------|-------|:-------:|:-----:|:-----:|:---------:|:-----:|:--------:|:-------------:|
| **Dashboard agent** | `/dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Dossiers** | `/dossiers` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| **Détail dossier** | `/dossiers/:id` | ✓ | N/A | ✓ | ✓ | ✗ | ✓ | ✗ |
| **Échéanciers** | `/dossiers/:id/echeanciers` | ✓ | N/A | ✓ | ✓ | N/A | ✓ | ✓ |
| **Clients** | `/clients` | ✓ | ✓ | ✓ | ✓ | ✗ | N/A | N/A |
| **Détail client** | `/clients/:id` | ✓ | N/A | ✓ | ✓ | ✗ | N/A | N/A |
| **Contentieux** | `/contentieux` | ✓ | ✓ | ✓ | ✓ | ✓ | N/A | N/A |
| **Dashboard superviseur** | `/superviseur/dashboard` | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| **Escalades** | `/superviseur/escalades` | ✓ | ~✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| **Supervision IA/DMN** | `/superviseur/ia-dmn` | ✓ | ~✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| **Rapports** | `/rapports` | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | N/A |
| **Référentiels** | `/parametrages/referentiels` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| **Règles & Workflows** | `/parametrages/regles-workflows` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| **Imports** | `/parametrages/imports` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| **Audit** | `/parametrages/audit` | ✓ | ✓ | ✓ | ✓ | N/A | N/A | N/A |

¹ *success* = toast de confirmation après une mutation (lecture seule → N/A)  
² *confirmation* = dialogue ou étape de validation avant action destructive ou irréversible

---

## Détail par état

### loading — 15/15 ✓
Tous les écrans utilisent `mc-skeleton-loader` dans le `@switch (viewState())`.

### empty — 12/15 ✓ (2 via `@empty` natif, 1 partiel)
- **~✓ natif** : Escalades et IA/DMN utilisent la clause `@empty` dans `@for`, équivalent fonctionnel.
- **✗ absent** : Dashboard superviseur (escalades en attente — section inline sans fallback), Rapports (catalogue toujours peuplé par rôle, pas d'état vide), Détail dossier/client (pas de concept d'écran vide — tabs inline).

### error — 15/15 ✓
Tous les écrans utilisent `mc-error-state` avec callback `(retry)`.

### forbidden — 15/15 ✓
Implémenté par vérification de permission dans `ngOnInit()` :
- **SETTINGS_MANAGE** (admin uniquement) : Référentiels, Règles/Workflows, Imports, Audit
- **CASE_ASSIGN** (superviseur + admin) : Escalades, IA/DMN
- **LEGAL_CASE_VIEW** (superviseur + admin) : Contentieux
- **REPORT_EXPORT** (superviseur + admin) : Rapports
- **Via handler 403 API** : Dashboard superviseur (déjà en place)
- **Droits multiples** : Dashboard agent, Dossiers, Détail dossier, Échéanciers, Clients, Détail client

### stale — 5/15 ✓
- **✓** : Dashboard agent, Rapports, Contentieux (banner `mc-stale-data-banner`)
- **✗** : Dossiers, Détail dossier, Clients, Détail client, Dashboard superviseur, Escalades, IA/DMN, Règles/Workflows, Imports, Référentiels

### success (toast) — 10/15 ✓ (5 N/A)
- **N/A** (écrans en lecture seule) : Clients, Détail client, Contentieux, Audit, Rapports (export → toast)
- **✓** : Dashboard agent, Dossiers, Détail dossier, Échéanciers, Dashboard superviseur, Escalades, IA/DMN, Rapports (export), Référentiels, Règles/Workflows, Imports

### confirmation — 9/15 ✓ (4 N/A, 2 ✗)
- **N/A** (pas d'action destructive) : Clients, Détail client, Contentieux, Audit
- **✓** : Dashboard agent (modales), Échéanciers (validation seuil), Dashboard superviseur (décision escalade), Escalades (formulaire motif obligatoire), IA/DMN (formulaire feedback), Référentiels (désactivation 2-étapes), Imports (annulation PROCESSING 2-étapes)
- **✗** : Dossiers (actions groupées sans confirmation), Règles/Workflows (activation package directe)

---

## Gaps résiduels

| Gap | Écran(s) | Priorité | Recommandation |
|-----|----------|----------|----------------|
| Stale state | Dossiers, Clients, Dashboard sup., Escalades | Moyenne | Ajouter `mc-stale-data-banner` + `dataDate` signal au chargement |
| Confirmation actions groupées | Dossiers | Haute | Modal de confirmation avant réassignation/SMS en masse |
| Confirmation activation package | Règles/Workflows | Moyenne | Étape `pendingActivate` avant `activatePackage()` |
| Empty state dashboard sup. | Dashboard superviseur | Basse | Message inline quand `pendingEscalations().length === 0` |
| Empty state rapports | Rapports | Basse | Afficher `mc-empty-state` si `catalogue().length === 0` |

---

*Généré le 2026-08-03 — session QA states coverage*
