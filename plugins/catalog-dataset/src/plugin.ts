import { createPlugin } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const catalogDatasetPlugin = createPlugin({
  id: 'catalog-dataset',
  routes: {
    root: rootRouteRef,
  },
});
