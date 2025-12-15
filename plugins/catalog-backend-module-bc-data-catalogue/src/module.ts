import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { BcDataCatalogueApisProvider } from './BcDataCatalogueApisProvider';

export const catalogModuleBcDataCatalogueApis = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'bc-data-catalogue',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint, // For adding the provider
        reader: coreServices.urlReader, // Injects UrlReaderService
        scheduler: coreServices.scheduler, // For creating task runners
        config: coreServices.rootConfig, // Optional: For env-specific config
        logger: coreServices.logger,
      },
      async init({ catalog, reader, scheduler, config, logger }) {
        
        logger.info('BcDataCatalogue provider module is starting...');

        const env = config.getString('backend.baseUrl').includes('dev') ? 'dev' : 'prod';

        const allowedHosts = config.getConfigArray('backend.reading.allow').map(entry => entry.getString('host')).map(h => h.toLowerCase());

        // Create a task runner with your schedule
        const taskRunner = scheduler.createScheduledTaskRunner({
          frequency: { minutes: 1 },
          timeout: { seconds: 45 },
        });
        
        // Instantiate with your constructor deps
        const provider = new BcDataCatalogueApisProvider(
          env, 
          reader, 
          taskRunner, 
          allowedHosts, 
          logger,
        );

        // Register the provider
        catalog.addEntityProvider(provider);

        logger.info('BcDataCatalogue provider registered and scheduled');
      },
    });
  },
});
