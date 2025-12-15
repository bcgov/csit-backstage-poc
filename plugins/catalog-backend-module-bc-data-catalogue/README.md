# @internal/plugin-catalog-backend-module-bc-data-catalogue

This plugin integrates the BC Data Catalogue with Backstage, allowing you to import datasets, resources, and their metadata as entities in Backstage's software catalogue.

## Installation

This package is published to GitHub Packages and requires authentication to install, even though it's public.

### Prerequisites

1. Create a GitHub Personal Access Token (PAT)
   - Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "Backstage Package Access")
   - Select the `read:packages` scope
   - Give a lifespan of 90 days (or less)
   - **Important**: Authorize the token for SSO with the `bcgov` organization after creating it
   - Copy the token (you won't be able to see it again)

2. Set the token as an environment variable
   
   ```export GITHUB_TOKEN=your_token_here```

3. Create or update a `.npmrc` file in your project root:

    ```
    @bcgov:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
    ```
    **Note**: The `.npmrc` file uses environment variable substitution, so your token is stored in your environment, not in the file. This makes it safe to commit `.npmrc` to your repository.

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