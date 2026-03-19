import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const catalogDatasetPlugin = createPlugin({
  id: 'catalog-dataset',
  routes: {
    root: rootRouteRef,
  },
});

export const CatalogDatasetPage = catalogDatasetPlugin.provide(
  createRoutableExtension({
    name: 'CatalogDatasetPage',
    component: () =>
      import('./components/CatalogDataset').then(m => m.CatalogDatasetPage),
    mountPoint: rootRouteRef,
  }),
);
