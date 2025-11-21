import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';

export const catalogModuleBcDataCatalogueApis = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'bc-data-catalogue-apis',
  register(reg) {
    reg.registerInit({
      deps: { logger: coreServices.logger },
      async init({ logger }) {
        logger.info('Hello World!');
      },
    });
  },
});
