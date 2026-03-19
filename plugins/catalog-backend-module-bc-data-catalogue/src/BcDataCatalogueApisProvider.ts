import { Entity } from '@backstage/catalog-model';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  LoggerService,
  SchedulerServiceTaskRunner,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { BcDataCatalogueClient } from './BcDataCatalogueClient';
import { BcDataCatalogueEntityFactory } from './BcDataCatalogueEntityFactory';

/**
 * Provides entities from the BC Data Catalogue service.
 */
export class BcDataCatalogueApisProvider implements EntityProvider {
  private readonly logger: LoggerService;
  private readonly env: string;
  private readonly reader: UrlReaderService;
  private connection?: EntityProviderConnection;
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private readonly allowedHosts: string[];

  constructor(
    env: string,
    reader: UrlReaderService,
    taskRunner: SchedulerServiceTaskRunner,
    allowedHosts: string[],
    logger: LoggerService,
  ) {
    this.env = env;
    this.reader = reader;
    this.taskRunner = taskRunner;
    this.allowedHosts = allowedHosts;
    this.logger = logger;
  }

  getProviderName(): string {
    return `bc-data-catalogue-${this.env}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.logger.info('[BCDC Entity Provider] <connect');
    this.connection = connection;

    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });

    this.logger.info('[BCDC Entity Provider] >connect');
  }

  async run(): Promise<void> {
    this.logger.info('[BCDC Entity Provider] <run');

    if (!this.connection) {
      throw new Error('Not initialized');
    }

    const client = new BcDataCatalogueClient({
      reader: this.reader,
      logger: this.logger,
    });

    const factory = new BcDataCatalogueEntityFactory({
      reader: this.reader,
      logger: this.logger,
      allowedHosts: this.allowedHosts,
    });

    const packages = await client.getAllPackages();
    const entities: Entity[] = await factory.createEntities(packages);

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        entity,
        locationKey: `bc-data-catalogue:${this.env}`,
      })),
    });

    this.logger.info('[BCDC Entity Provider] >run');
  }
}