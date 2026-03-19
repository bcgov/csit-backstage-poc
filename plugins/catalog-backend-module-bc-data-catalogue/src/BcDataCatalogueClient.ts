import {
  LoggerService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import {
  BcDataCataloguePackageSchema,
} from './BcDataCatalogueModel';
import type {
  BcDataCataloguePackage,
} from './BcDataCatalogueModel';

type BcDataCatalogueClientOptions = {
  reader: UrlReaderService;
  logger: LoggerService;
};

/**
 * Client for reading dataset packages from the BC Data Catalogue API.
 */
export class BcDataCatalogueClient {
  private readonly reader: UrlReaderService;
  private readonly logger: LoggerService;

  constructor(options: BcDataCatalogueClientOptions) {
    this.reader = options.reader;
    this.logger = options.logger;
  }

  async getAllPackages(): Promise<BcDataCataloguePackage[]> {
    this.logger.info('[BCDC Client] <getAllPackages');

    let page = 0;
    let retries = 0;
    const allPackages: BcDataCataloguePackage[] = [];

    do {
      const start = 1000 * page;
      const url = `https://catalogue.data.gov.bc.ca/api/3/action/package_search?start=${start}&rows=1000`;

      const response = await this.reader.readUrl(url);
      const data = JSON.parse((await response.buffer()).toString());

      if (!data?.success || !Array.isArray(data.result?.results)) {
        this.logger.warn('[BCDC Client] Invalid or unsuccessful response', {
          success: data?.success,
        });
        retries++;
        continue;
      }

      retries = 0;

      const results = data.result.results as unknown[];

      if (results.length > 0) {

        const packages = this.parsePackages(results);
        allPackages.push(...packages);
        page++;
      } else {
        page = -1;
      }
    } while (page > 0 && retries < 3);

    this.logger.info(`[BCDC Client] >getAllPackages ${allPackages.length}`);
    return allPackages;
  }

  /**
   * Converts BC Data Catalogue (CKAN package_search) results into validated package objects.
   */
  private parsePackages(results: unknown[]): BcDataCataloguePackage[] {
    this.logger.info('[BCDC Client] <parsePackages', {
      resultCount: Array.isArray(results) ? results.length : 'unknown',
    });

    const rawPackages = results as unknown[];
    this.logger.info(`[BCDC Client] rawPackageCount ${rawPackages.length}`);

    const validPackages: BcDataCataloguePackage[] = [];

    for (const item of rawPackages) {
      const parseResult = BcDataCataloguePackageSchema.safeParse(item);

      if (parseResult.success) {
        const pkg = parseResult.data;

        // Extra runtime filter: only active BC Data Catalogue datasets
        if (pkg.type === 'bcdc_dataset' && pkg.state === 'active') {
          validPackages.push(pkg);
        }
      } else {
        this.logger.warn('[BCDC Client] ' + JSON.stringify(item));
        this.logger.warn('[BCDC Client] Invalid package skipped', {
          error: parseResult.error.message,
        });

        throw new Error(
          `BC Data Catalogue package validation failed` +
          `See logs for details. First issue: ${parseResult.error.issues[0]?.message}`,
        );
      }
    }

    this.logger.info(`[BCDC Client] >parsePackages ${validPackages.length}`);
    return validPackages;
  }
}