# Design Tokens — MERCURE Collect AI

Source of truth: PRD §4 "Architecture applicative frontend" and §5 "Composants transverses".

## File structure

```
src/
├── styles.scss          ← entry point — imports the three partials below
└── styles/
    ├── _tokens.scss     ← all CSS custom properties (:root { … })
    ├── _reset.scss      ← minimal box-sizing / base reset / focus ring
    ├── _typography.scss ← Inter font import + utility classes
    └── README.md        ← this file
```

## Colours

| Token | Value | Usage |
|---|---|---|
| `--color-navy` | `#183B56` | Sidebar background, page headers |
| `--color-navy-dark` | `#0F2438` | Navy hover/pressed state |
| `--color-navy-light` | `rgba(24,59,86,0.08)` | Active row tint |
| `--color-action` | `#2563EB` | Primary buttons, links, focus rings |
| `--color-action-hover` | `#1D4ED8` | Button hover |
| `--color-action-light` | `#EFF6FF` | Tag/chip backgrounds |
| `--color-surface` | `#F8FAFC` | Page / app background |
| `--color-surface-card` | `#FFFFFF` | Card / panel background |
| `--color-border` | `#E2E8F0` | Card borders, dividers, input outlines |
| `--color-success` | `#16A34A` | Success badges, positive KPI delta |
| `--color-success-light` | `#F0FDF4` | Success chip background |
| `--color-warning` | `#F97316` | Alert badges, warning KPI delta |
| `--color-warning-light` | `#FFF7ED` | Warning chip background |
| `--color-critical` | `#DC2626` | Critical badges, overdue alerts |
| `--color-critical-light` | `#FEF2F2` | Critical chip background |
| `--color-text-primary` | `#0F172A` | Body copy, table cells |
| `--color-text-secondary` | `#64748B` | Labels, secondary info |
| `--color-text-muted` | `#94A3B8` | Placeholders, disabled text |

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `'Inter', 'Aptos', system-ui` | Global font stack |
| `--font-size-heading-xl` | `28px` | Page-level titles |
| `--font-size-heading-lg` | `24px` | Section headings |
| `--font-size-heading-md` | `20px` | Card / panel headings |
| `--font-size-subtitle` | `14px` | Sub-headings, column headers |
| `--font-size-body` | `14px` | Standard body copy |
| `--font-size-body-sm` | `13px` | Dense UI copy |
| `--font-size-table` | `13px` | DataGrid rows |
| `--font-size-table-sm` | `12px` | Compact table variants |

Utility classes from `_typography.scss`: `.text-heading-xl`, `.text-heading-lg`, `.text-heading-md`, `.text-subtitle`, `.text-body`, `.text-body-sm`, `.text-table`, `.text-table-sm`, `.text-secondary`, `.text-muted`, `.text-success`, `.text-warning`, `.text-critical`, `.text-action`.

## Border radius

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `16px` | KpiCard, DataGrid containers, ModalForm |
| `--radius-btn-lg` | `12px` | Large / primary buttons |
| `--radius-btn` | `10px` | Standard buttons |
| `--radius-badge` | `999px` | StatusBadge, chip, tag |
| `--radius-input` | `8px` | Form inputs, selects |
| `--radius-sm` | `4px` | Tooltips, small labels |

## Layout & grid

| Token | Value | Usage |
|---|---|---|
| `--layout-max-width` | `1440px` | Max container width (desktop target) |
| `--layout-sidebar-width` | `240px` | AppSidebar fixed width |
| `--layout-header-height` | `72px` | AppHeader fixed height |
| `--layout-margin` | `24px` | Page horizontal padding |
| `--layout-grid-columns` | `12` | CSS grid column count |
| `--layout-gap` | `24px` | Grid / flex gap |

## Spacing scale (4-point base)

`--space-1` (4px) → `--space-2` (8px) → `--space-3` (12px) → `--space-4` (16px) → `--space-5` (20px) → `--space-6` (24px) → `--space-8` (32px) → `--space-10` (40px) → `--space-12` (48px)

## Shadows

| Token | Usage |
|---|---|
| `--shadow-card` | Default card elevation |
| `--shadow-card-hover` | Card on hover |
| `--shadow-modal` | ModalForm / drawer backdrop |
| `--shadow-dropdown` | ActionMenu, select dropdown |

## Transitions

| Token | Value | Usage |
|---|---|---|
| `--transition-fast` | `120ms ease` | Hover colour changes, badge state |
| `--transition-normal` | `200ms ease` | Panel expand, drawer slide |

## Z-index layers

| Token | Value | Layer |
|---|---|---|
| `--z-sidebar` | `100` | AppSidebar |
| `--z-header` | `200` | AppHeader |
| `--z-dropdown` | `300` | ActionMenu, select popover |
| `--z-modal` | `400` | ModalForm, confirmation dialog |
| `--z-toast` | `500` | Success / error toasts |

## How to use tokens in component SCSS

```scss
// component.scss — no import needed; tokens are on :root
.my-card {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-6);
}
```

Tokens are defined on `:root` and are available globally — no `@use`/`@import` required in component stylesheets.
