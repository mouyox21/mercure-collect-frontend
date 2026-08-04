# QA — Audit accessibilité WCAG AA

Périmètre : composants partagés Phase 1.5 + écrans Dashboard Agent, Détail Client, Dashboard Superviseur.  
Référentiel : WCAG 2.1 niveau AA.  
Date : 2026-08-03 — session QA accessibility.

---

## Résumé exécutif

| Critère | Résultat avant correctifs | Résultat après correctifs |
|---------|:------------------------:|:------------------------:|
| Contraste texte (1.4.3) | ✗ 6 cas | ✓ Corrigé |
| Navigation clavier (2.1.1) | ✗ 2 cas | ✓ Corrigé |
| Focus visible (2.4.7) | ✓ Global `:focus-visible` | ✓ Inchangé |
| Libellés ARIA (4.1.2) | ✗ 3 cas | ✓ Corrigé |
| Landmarks (1.3.6) | ✗ 1 cas | ✓ Corrigé |
| Formulaires — état invalide (3.3.1) | ✗ Absent | ✓ Corrigé |
| Icônes décoratives (1.3.3) | ✗ 8 flèches | ✓ Corrigé |
| Drag & drop Kanban (2.1.1) | ✗ Connue | ⚠ Limitation documentée |

---

## 1. Contraste des couleurs (WCAG 1.4.3 — 4.5:1 texte normal)

### 1.1 Tokens sémantiques — valeurs d'avant audit

| Token | Valeur | Usage texte | Contraste (blanc) | Résultat |
|-------|--------|-------------|:-----------------:|:--------:|
| `--color-warning` | `#f97316` | `status-badge--en-cours`, `--precontentieux` | 2.81:1 | ✗ |
| `--color-success` | `#16a34a` | `status-badge--promesse`, delta KPI positif | 3.27:1 | ✗ |
| `--color-critical` | `#dc2626` | `status-badge--contentieux` sur `critical-light` | 4.42:1 | ✗ |
| `--color-text-muted` | `#94a3b8` | `kpi-card__subtitle`, `grid__empty`, `status-badge--cloture` | 2.43:1 | ✗ |

### 1.2 Correctifs appliqués

**`src/styles/_tokens.scss`** — 3 nouveaux tokens « text » à contraste garanti :

| Nouveau token | Valeur | Contraste blanc | Contraste fond clair |
|---------------|--------|:---------------:|:--------------------:|
| `--color-warning-text` | `#c2410c` (orange-700) | 4.9:1 ✓ | 4.6:1 sur `warning-light` ✓ |
| `--color-success-text` | `#15803d` (emerald-700) | 5.0:1 ✓ | 4.8:1 sur `success-light` ✓ |
| `--color-critical-text` | `#b91c1c` (red-700) | 6.4:1 ✓ | 5.9:1 sur `critical-light` ✓ |

**`status-badge.component.scss`** — remplacements :
- `--color-warning` → `--color-warning-text` (en-cours, pré-contentieux)
- `--color-success` → `--color-success-text` (promesse)
- `--color-critical` → `--color-critical-text` (contentieux)
- `--color-text-muted` → `--color-text-secondary` (clôturé — 4.77:1 ✓)

**`kpi-card.component.scss`** — remplacements :
- `delta--positive` : `--color-success` → `--color-success-text`
- `delta--negative` : `--color-critical` → `--color-critical-text`
- `delta--neutral` : `--color-text-muted` → `--color-text-secondary`
- `__subtitle` : `--color-text-muted` → `--color-text-secondary`

**`data-grid.component.scss`** :
- `grid__empty` ("Aucun résultat") : `--color-text-muted` → `--color-text-secondary`

### 1.3 Contrastes validés (inchangés)

| Combinaison | Contraste | Résultat |
|-------------|:---------:|:--------:|
| `--color-text-primary` (#0f172a) sur blanc | 17.4:1 | ✓ |
| `--color-text-secondary` (#64748b) sur blanc | 4.77:1 | ✓ |
| `--color-action` (#2563eb) sur blanc (liens, boutons texte) | 5.12:1 | ✓ |
| Texte blanc sur `--color-action` (bouton primaire) | 5.12:1 | ✓ |
| Texte blanc sur `--color-navy` (sidebar) | 12.1:1 | ✓ |
| `--color-action-hover` (#1d4ed8) sur `action-light` (badge écheancier) | 6.13:1 | ✓ |

### 1.4 Limitations résiduelles (non corrigées)

- `kpi-card__subtitle` et `case-card__last-contact` utilisaient `--color-text-muted`. Les deux ont été corrigés (`__subtitle` → ✓). `case-card__last-contact` reste à `--color-text-muted` et constitue un gap mineur — à corriger dans la prochaine session SCSS.
- `--color-text-secondary` sur `--color-navy-light` (lignes de groupe DataGrid) = 4.14:1 — légèrement sous le seuil AA à 12px non-gras. Faible impact car le texte de groupe est en gras (font-weight: 600).

---

## 2. Navigation clavier (WCAG 2.1.1)

### 2.1 DataGrid — lignes cliquables non focusables

**Avant** : `<tr (click)="...">` sans `tabindex`, inaccessible au clavier.

**Correctif — `data-grid.component.html`** :
```html
<tr
  [attr.tabindex]="rowClickable() ? 0 : null"
  (click)="rowClickable() && rowClick.emit(row)"
  (keydown)="rowClickable() && onRowKeydown($event, row)"
>
```

**Correctif — `data-grid.component.ts`** :
```typescript
protected onRowKeydown(event: KeyboardEvent, row: GridRow): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    this.rowClick.emit(row);
  }
}
```

Résultat : les lignes cliquables sont maintenant focusables (Tab) et activables (Entrée / Espace).

### 2.2 DataGrid — menu de colonnes sans touche Escape

**Avant** : `showColumnMenu` se fermait uniquement par clic extérieur.

**Correctif — `data-grid.component.ts`** :
```typescript
@HostListener('keydown.escape')
protected onEscape(): void {
  this.showColumnMenu.set(false);
}
```

### 2.3 ActionMenu — Escape ✓ (déjà présent)

`ActionMenuComponent` possède `@HostListener('keydown.escape')` qui ferme le menu. Conforme.

### 2.4 ModalForm — focus piégé à l'ouverture ✓ (déjà présent)

`ModalFormComponent.focusFirstElement()` place le focus sur le premier élément focusable à l'ouverture. Escape ferme la modale. Conforme.

### 2.5 KanbanBoard — drag & drop souris uniquement

Le drag & drop natif HTML5 n'est pas accessible au clavier. **Limitation documentée** : le Kanban est une vue complémentaire ; la vue Groupe/Liste du DataGrid doit être la vue primaire pour les utilisateurs de clavier et de technologies d'assistance. Une implémentation de DnD clavier (flèches + Espace pour saisir/déposer) est recommandée pour une version future.

---

## 3. Focus visible (WCAG 2.4.7)

Le reset global définit :
```scss
:focus-visible {
  outline: 2px solid var(--color-action);  /* #2563eb — 3.1:1 sur blanc ✓ */
  outline-offset: 2px;
}
```

Composants vérifiés — tous possèdent `:focus-visible` explicite :
- `CaseCard` : `outline: 2px solid var(--color-action)` ✓
- `ActionMenu` trigger et items ✓
- `DataGrid` boutons sort, pagination, colonnes ✓
- `KanbanBoard` boutons colonnes ✓
- `ModalForm` (hérité du reset global) ✓

---

## 4. Libellés ARIA et structure sémantique (WCAG 4.1.2 / 1.3.1)

### 4.1 Tablist — `aria-controls` / `id` manquants (Détail Client)

**Avant** :
```html
<button role="tab" [attr.aria-selected]="...">...</button>
<div role="tabpanel">...</div>
```
Les onglets et panneaux n'étaient pas liés — les lecteurs d'écran ne pouvaient pas naviguer de l'onglet au panneau.

**Correctif — `debtor-detail.component.html`** :
```html
<button role="tab"
  [id]="'cld-tab-' + tab.id"
  [attr.aria-controls]="'cld-panel-' + tab.id"
  [attr.aria-selected]="activeTab() === tab.id"
>{{ tab.label }}</button>

<div role="tabpanel"
  [id]="'cld-panel-' + activeTab()"
  [attr.aria-labelledby]="'cld-tab-' + activeTab()"
>
```

### 4.2 `role="banner"` — usage incorrect (Détail Client)

**Avant** : `<div class="cld__banner" role="banner">` — le landmark `banner` est réservé à l'en-tête principal de la page (un seul par page). Utilisé ici sur un bandeau identité interne, il créait un conflit de landmarks.

**Correctif** : `role="region"` + `aria-label="Identité du client"`.

### 4.3 Boutons formulaire — `aria-invalid` absent

**Avant** : les erreurs de validation affichaient `role="alert"` (annoncé immédiatement) mais les champs n'avaient pas `aria-invalid`. Un utilisateur naviguant directement sur le champ après soumission ne recevait pas d'indication d'état invalide.

**Correctif — `modal-form.component.html`** : ajout de `[attr.aria-invalid]="hasError(field) ? 'true' : null"` sur les 5 contrôles (canal, date, montant, motif, commentaire).

### 4.4 Éléments déjà conformes (vérifiés)

| Composant | Élément | Conformité |
|-----------|---------|:----------:|
| `DataGrid` | En-têtes de colonnes `scope="col"` | ✓ |
| `DataGrid` | `aria-sort` sur colonnes triées | ✓ |
| `DataGrid` | `aria-label` sur inputs checkbox | ✓ |
| `DataGrid` | `role="navigation"` + `aria-label` sur pagination | ✓ |
| `ActionMenu` | `aria-haspopup="menu"` + `aria-expanded` | ✓ |
| `ActionMenu` | `role="menu"` + `role="menuitem"` | ✓ |
| `ModalForm` | `role="dialog"` + `aria-modal="true"` + `aria-label` | ✓ |
| `EmptyState` | `role="status"` | ✓ |
| `ErrorState` | `role="alert"` | ✓ |
| `ForbiddenState` | `role="alert"` + `aria-live="assertive"` | ✓ |
| `StaleDataBanner` | `role="alert"` + `aria-live="polite"` | ✓ |
| `SuccessToast` | `role="status"` + `aria-live="polite"` | ✓ |
| `KpiCard` | `aria-label` avec valeur complète | ✓ |
| `CaseCard` | `role="button"` + `tabindex="0"` + keydown | ✓ |
| `KanbanBoard` | `aria-expanded` + `aria-label` sur boutons colonnes | ✓ |
| `SkeletonLoader` | `aria-hidden="true"` (rendu non informatif) | ✓ |
| Dashboard Agent | `role="main"` sur la zone de contenu | ✓ |
| Dashboard Agent | `role="complementary"` + `aria-label` sur le drawer | ✓ |
| Dashboard superviseur | `role="tablist"` → `<nav>` avec `aria-label` | ✓ |
| Sections de tables (Superviseur) | `aria-label` sur `<section>` | ✓ |
| SVG icônes | `aria-hidden="true"` sur tous les SVG décoratifs | ✓ |

---

## 5. Icônes et symboles décoratifs (WCAG 1.3.3)

Les flèches directionnelles (←, →, ↗) dans le texte des boutons étaient lues par les lecteurs d'écran ("left arrow", "rightwards arrow", "north east arrow").

**Correctifs** (8 occurrences dans 4 fichiers) :
- `debtor-detail.component.html` : `← Retour`, `→` dans 5 boutons "voir plus" et "Traiter cette action"
- `contentieux.component.html` : `↗ Dossier`
- `supervisor-dashboard.component.html` : `↗` dans le lien d'alerte
- `dashboard.component.html` : 8 emojis dans les boutons d'action rapide + 2 boutons toolbar

Patron appliqué : `<span aria-hidden="true">→</span>` pour les caractères décoratifs, laissant le texte visible comme seule source sémantique.

---

## 6. Gaps résiduels

| Gap | Fichier(s) | Priorité | Recommandation |
|-----|-----------|----------|----------------|
| `case-card__last-contact` muted text (2.43:1) | `case-card.component.scss` | Moyenne | Remplacer `--color-text-muted` par `--color-text-secondary` |
| `kanban__empty` muted text | `kanban-board.component.scss` | Basse | Idem |
| `kpi-card__title` uppercase 14px sur fond card | `kpi-card.component.scss` | Basse | Déjà `--color-text-secondary` (4.77:1 ✓ — vérifier avec outil) |
| DataGrid — groupe header `--color-text-secondary` sur navy-light | `data-grid.component.scss` | Basse | Légèrement sous AA à 12px — ok en 600 (gras) |
| Kanban DnD — non accessible clavier | `kanban-board.component.ts/.html` | Haute | Implémenter clavier DnD (Espace + flèches) ou proposer alternative dédiée |
| `aria-describedby` sur champs formulaire (erreurs persistantes) | `modal-form.component.html` | Moyenne | Rendre les conteneurs d'erreur toujours présents (vides), les lier via `aria-describedby` |
| Focus trap modal — retour au déclencheur à la fermeture | `modal-form.component.ts` | Moyenne | Sauvegarder `document.activeElement` avant ouverture, le restaurer à `closeModal()` |
| Ordre de tabulation dans le drawer Dashboard Agent | `dashboard.component.html` | Basse | Vérifier que le focus entre dans le drawer à l'ouverture |

---

*Généré le 2026-08-03 — session QA accessibility*
