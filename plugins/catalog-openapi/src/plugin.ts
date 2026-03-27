import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const catalogOpenApiPlugin = createPlugin({
  id: 'catalog-openapi',
  routes: {
    root: rootRouteRef,
  },
});

export const CatalogOpenApiPage = catalogOpenApiPlugin.provide(
  createRoutableExtension({
    name: 'CatalogOpenApiPage',
    component: () =>
      import('./components/CatalogOpenApi').then(m => m.CatalogOpenApiPage),
    mountPoint: rootRouteRef,
  }),
);
