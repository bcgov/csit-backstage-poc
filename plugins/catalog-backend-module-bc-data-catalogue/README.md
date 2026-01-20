# plugin-catalog-backend-module-bc-data-catalogue

This plugin integrates the BC Data Catalogue with Backstage, allowing you to import datasets, resources, and their metadata as entities in Backstage's software catalogue.

## Installation

This package is published to npmjs.com under the scope `@bcgov`.

### Install the Package

#### Using Yarn

yarn add @bcgov/plugin-catalog-backend-module-bc-data-catalogue

### Usage in Backstage

Add the module to your Backstage backend in `packages/backend/src/index.ts`:

```diff
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
// ... other backend.add() calls ...

+ backend.add(import('@bcgov/plugin-catalog-backend-module-bc-data-catalogue'));

backend.start();
```

### Configure backend reading allowlist

Add the following configuration to your `app-config.yaml` to allow the backend to access the BC Data Catalogue API:

```
backend:
reading:
    allow:
    - host: catalogue.data.gov.bc.ca
        scheme: https
```

**Note:** Additional hosts may be required depending what resources are being loaded. See https://github.com/bcgov/csit-backstage-poc/blob/main/app-config.yaml for example.
