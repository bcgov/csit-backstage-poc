# DevHub Backstage Integration for BC Data Catalogue Plugins

This guide explains how to update the DevHub Backstage project to use the three BC Data Catalogue packages together:

- `@bcgov/plugin-catalog-backend-module-bc-data-catalogue`
- `@bcgov/plugin-catalog-common-bc-data-catalogue`
- `@bcgov/catalog-dataset`

These packages work together to provide:

- backend ingestion of BC Data Catalogue content into the Backstage catalog
- shared dataset types and utilities
- a frontend dataset page for rendering `Dataset` entities

---

## What Each Package Does

### `@bcgov/plugin-catalog-backend-module-bc-data-catalogue`

Provides the backend catalog module that connects to the BC Data Catalogue and creates catalog entities such as:

- `Dataset`
- `API`
- `System`
- `Group`
- `User`

### `@bcgov/plugin-catalog-common-bc-data-catalogue`

Provides shared types, helpers, and utilities used by the backend and frontend integration.

### `@bcgov/catalog-dataset`

Provides the frontend dataset page and related UI components for rendering `Dataset` entities in DevHub.

---

## Prerequisites

These packages are published to both **npmjs.org** and **GitHub Packages**.

If you are installing the packages from **npmjs.org**, no additional configuration or authentication is required.

If you choose to pull from **GitHub Packages**, follow these steps to authenticate, as it is required even for public packages:

### 1. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Give it a descriptive name such as `Backstage Package Access`
4. Select the `read:packages` scope
5. Set a lifespan (90 days or less recommended)
6. Authorize the token for SSO with the `bcgov` organization
7. Copy the token

### 2. Export the Token

```bash
export GITHUB_TOKEN=your_token_here
```

---

## Configure Package Registry Access (GitHub Packages Only)

The following configuration is only required if you are pulling the packages from the GitHub registry instead of npmjs.org.

### `.npmrc`

```
@bcgov:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### `.yarnrc.yaml` (if required)

```yaml
npmScopes:
  bcgov:
    npmRegistryServer: "https://npm.pkg.github.com"

npmRegistries:
  "https://npm.pkg.github.com":
    npmAuthToken: "${GITHUB_TOKEN:-}"
```

---

## Install the Packages

```bash
yarn add @bcgov/plugin-catalog-backend-module-bc-data-catalogue
yarn add @bcgov/plugin-catalog-common-bc-data-catalogue
yarn add @bcgov/catalog-dataset
```

---

## Backend Changes

### 1. Register the Backend Module

Update:

`packages/backend/src/index.ts`

```diff
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other backend.add() calls ...

+ backend.add(import('@bcgov/plugin-catalog-backend-module-bc-data-catalogue'));

backend.start();
```

---

### 2. Allow BC Data Catalogue API Access

Update `app-config.yaml`:

```yaml
backend:
  reading:
    allow:
      - host: catalogue.data.gov.bc.ca
        scheme: https
```

---

### 3. Configure Provider Schedule

```yaml
catalog:
  providers:
    bc-data-catalogue:
      env: dev
      schedule:
        frequency: 10m
```

---

## Frontend Changes

The dataset plugin requires **two changes** in the DevHub frontend.

---

### 1. Add Dataset Route

Update:

`packages/app/src/App.tsx`

```diff
+ import { CatalogDatasetPage } from '@bcgov/catalog-dataset';

const routes = (
  <FlatRoutes>
    ...
+   <Route path="/catalog-dataset" element={<CatalogDatasetPage />} />
  </FlatRoutes>
);
```

---

### 2. Register Dataset Page in Entity Switch

Update:

`packages/app/src/components/catalog/EntityPage.tsx`

```diff
+ import { CatalogDatasetPage } from '@bcgov/catalog-dataset';

<EntitySwitch>
  <EntitySwitch.Case if={isKind('user')} children={userPage} />
  <EntitySwitch.Case if={isKind('system')} children={systemPage} />
  <EntitySwitch.Case if={isKind('domain')} children={domainPage} />

+ <EntitySwitch.Case if={isKind('dataset')} children={<CatalogDatasetPage />} />

  <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
</EntitySwitch>
```

---

## Expected Result

After completing all steps:

- BC Data Catalogue datasets are ingested into Backstage
- `Dataset` entities appear in the catalog
- Selecting a dataset opens the custom dataset page
- Dataset-specific UI (schema, lineage, support, etc.) is rendered

---

## Summary

### Install

- `@bcgov/plugin-catalog-backend-module-bc-data-catalogue`
- `@bcgov/plugin-catalog-common-bc-data-catalogue`
- `@bcgov/catalog-dataset`

### Backend

- Register backend module
- Allow API host
- Configure provider schedule

### Frontend

- Add route in `App.tsx`
- Add EntitySwitch case in `EntityPage.tsx`

---

## Notes

- Keep `GITHUB_TOKEN` out of source control
- Additional hosts may need to be added to `backend.reading.allow`
- The dataset plugin relies on all three packages working together