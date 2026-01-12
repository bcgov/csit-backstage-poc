import { createDevApp } from '@backstage/dev-utils';
import { bcdsTestPlugin, BcdsTestPage } from '../src/plugin';

createDevApp()
  .registerPlugin(bcdsTestPlugin)
  .addPage({
    element: <BcdsTestPage />,
    title: 'Root Page',
    path: '/bcds-test',
  })
  .render();
