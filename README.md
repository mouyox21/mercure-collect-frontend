# MercureCollectFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.13.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Déploiement Docker

Le projet inclut un **Dockerfile multi-stage** (build Node 22 + runtime nginx:alpine) et un `nginx.conf` configuré pour :

- le routing SPA Angular (`try_files` → `index.html`)
- la compression gzip des assets JS/CSS
- le cache long (1 an, immutable) sur les fichiers hashés et no-cache sur `index.html`
- un endpoint `/healthz` pour les sondes Kubernetes/OpenShift
- un port `8080` non-privilégié (compatible avec les politiques non-root)

### Build production (défaut)

```bash
docker build --build-arg BUILD_CONFIGURATION=production -t mercure-collect-frontend .
```

### Lancer le conteneur

```bash
docker run -p 8080:8080 mercure-collect-frontend
```

L'application est accessible sur `http://localhost:8080`.

### Image de démonstration (mode mock, sans backend)

Pour un environnement de preview ou de démo ne disposant pas de backend disponible, builder avec la configuration `mock` — les données sont fournies par les fixtures JSON embarquées dans le bundle :

```bash
docker build --build-arg BUILD_CONFIGURATION=mock -t mercure-collect-frontend:mock .
docker run -p 8080:8080 mercure-collect-frontend:mock
```

### Image api-dev (backend local)

```bash
docker build --build-arg BUILD_CONFIGURATION=api-dev -t mercure-collect-frontend:api-dev .
```

Les trois valeurs acceptées pour `BUILD_CONFIGURATION` correspondent aux configurations définies dans `angular.json` : `production`, `mock`, `api-dev`.

## Déploiement Vercel (preview mock)

Le fichier `vercel.json` configure un déploiement Vercel **destiné exclusivement à la démonstration produit et à la revue UX/QA**. Il n'est pas conçu pour un environnement de production connecté à l'API réelle.

**Usages cibles :**
- Preview automatique sur chaque Pull Request (Vercel crée une URL de preview unique par PR)
- Démonstrations produit et recettes UX sans dépendance à un backend disponible
- Revue de design et de navigation par des parties prenantes non techniques

Le build utilise la configuration `mock` : toutes les données sont fournies par les fixtures JSON embarquées dans le bundle (`assets/mock-data/`). Aucune requête réseau vers un backend n'est émise.

### Déployer manuellement via Vercel CLI

```bash
npx vercel --prod
```

### Variables d'environnement

En mode `mock` (configuration par défaut du `vercel.json`), **aucune variable d'environnement n'est requise**.

Si une future configuration `api-dev` devait être déployée sur Vercel (preview connectée à un backend réel), les valeurs suivantes seraient à définir dans le tableau de bord Vercel (**jamais commitées dans le dépôt**) :

| Variable Vercel | Correspond à | Exemple |
|---|---|---|
| `MERCURE_API_BASE_URL` | `environment.api.ts → apiBaseUrl` | `https://api.mercure-collect.example.com` |
| `MERCURE_SUPERSET_EMBED_URL` | `environment.api.ts → supersetEmbedUrl` | `https://reporting.mercure-collect.example.com` |

> **Important :** Angular compile ces valeurs dans le bundle au moment du build (via `fileReplacements` dans `angular.json`). Un script de pré-build générant `environment.api.ts` à partir des variables Vercel serait nécessaire pour les injecter — ce cas d'usage n'est pas implémenté. Le mode `mock` ne nécessite rien de tel.

### Routing SPA

Le `vercel.json` inclut une règle `rewrites` qui renvoie toute URL inconnue vers `index.html`, garantissant que les routes Angular (`/dossiers`, `/clients/:debtorId`, `/superviseur/escalades`, etc.) fonctionnent au chargement direct et au rafraîchissement de page.

### Stratégie de cache

| Type de fichier | En-tête Cache-Control | Raison |
|---|---|---|
| `*.js`, `*.mjs`, `*.css` | `public, max-age=31536000, immutable` | Angular ajoute un hash de contenu au nom — le fichier change à chaque build |
| `/assets/*` | `public, max-age=31536000, immutable` | Assets statiques versionnés |
| `index.html` | `no-cache, no-store, must-revalidate` | Doit toujours être récupéré pour pointer vers les nouveaux bundles |
