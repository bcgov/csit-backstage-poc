import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef, buiTestRouteRef } from './routes';

export const bcdsTestPlugin = createPlugin({
  id: 'bcds-test',
  routes: {
    root: rootRouteRef,
    buiTest: buiTestRouteRef,
  },
});

export const BcdsTestPage = bcdsTestPlugin.provide(
  createRoutableExtension({
    name: 'BcdsTestPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);

export const BuiTestPage = bcdsTestPlugin.provide(
  createRoutableExtension({
    name: 'BuiTestPage',
    component: () =>
      import('./components/BuiTestPage').then(m => m.BuiTestPage),
    mountPoint: buiTestRouteRef,
  }),
);
