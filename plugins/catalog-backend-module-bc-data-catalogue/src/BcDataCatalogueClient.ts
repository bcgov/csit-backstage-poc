import { LoggerService } from '@backstage/backend-plugin-api';
import { BcDataCataloguePackageSchema } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import type { BcDataCataloguePackage } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { UrlReaderService } from './BcDataCatalogueUrlReader';

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

    this.logResourceTypesWithDetails(allPackages);
    this.logDataResourceObjectNameStats(allPackages);

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

  private logResourceTypesWithDetails(
    packages: BcDataCataloguePackage[],
  ): void {
    const datasetCountByResourceType = new Map<string, number>();

    for (const pkg of packages) {
      const resourceTypesForDataset = new Set<string>();

      for (const resource of pkg.resources ?? []) {
        if (resource.details?.length) {
          resourceTypesForDataset.add(resource.resource_type);
        }
      }

      for (const resourceType of resourceTypesForDataset) {
        datasetCountByResourceType.set(
          resourceType,
          (datasetCountByResourceType.get(resourceType) ?? 0) + 1,
        );
      }
    }

    const sortedCounts = Object.fromEntries(
      Array.from(datasetCountByResourceType.entries()).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );

    this.logger.info(
      `[BCDC Client] dataset counts by resource_type with details ${JSON.stringify(sortedCounts)}`,
    );
  }

  private logDataResourceObjectNameStats(
    packages: BcDataCataloguePackage[],
  ): void {
    let totalDataResources = 0;
    let dataResourcesWithDetails = 0;
    let dataResourcesWithObjectName = 0;
    let dataResourcesWithoutObjectName = 0;
    let dataResourcesWithDetailsAndObjectName = 0;
    let dataResourcesWithDetailsAndNoObjectName = 0;

    const resourcesByObjectName = new Map<
      string,
      Array<{
        packageName: string;
        resourceName: string;
        detailsSignature: string;
      }>
    >();

    for (const pkg of packages) {
      for (const resource of pkg.resources ?? []) {
        if (resource.resource_type !== 'data') {
          continue;
        }

        totalDataResources++;

        const hasDetails = !!resource.details?.length;
        const hasObjectName = !!resource.object_name?.trim();

        if (hasDetails) {
          dataResourcesWithDetails++;
        }

        if (hasObjectName) {
          dataResourcesWithObjectName++;
        } else {
          dataResourcesWithoutObjectName++;
        }

        if (hasDetails && hasObjectName) {
          dataResourcesWithDetailsAndObjectName++;

          const objectName = resource.object_name!.trim();
          const detailsSignature = this.buildDetailsSignature(resource.details ?? []);

          const entries = resourcesByObjectName.get(objectName) ?? [];
          entries.push({
            packageName: pkg.name,
            resourceName: resource.name,
            detailsSignature,
          });
          resourcesByObjectName.set(objectName, entries);
        }

        if (hasDetails && !hasObjectName) {
          dataResourcesWithDetailsAndNoObjectName++;
        }
      }
    }

    let uniqueObjectNames = 0;
    let duplicatedObjectNames = 0;
    let duplicatedObjectNamesWithMatchingDetails = 0;
    let duplicatedObjectNamesWithDifferentDetails = 0;

    const inconsistentObjectNames: string[] = [];

    for (const [objectName, entries] of resourcesByObjectName.entries()) {
      uniqueObjectNames++;

      if (entries.length > 1) {
        duplicatedObjectNames++;

        const distinctSignatures = new Set(
          entries.map(entry => entry.detailsSignature),
        );

        if (distinctSignatures.size === 1) {
          duplicatedObjectNamesWithMatchingDetails++;
        } else {
          duplicatedObjectNamesWithDifferentDetails++;
          inconsistentObjectNames.push(objectName);
        }
      }
    }

    this.logger.info(
      `[BCDC Client] data resource object_name stats ${JSON.stringify({
        totalDataResources,
        dataResourcesWithDetails,
        dataResourcesWithObjectName,
        dataResourcesWithoutObjectName,
        dataResourcesWithDetailsAndObjectName,
        dataResourcesWithDetailsAndNoObjectName,
        uniqueObjectNames,
        duplicatedObjectNames,
        duplicatedObjectNamesWithMatchingDetails,
        duplicatedObjectNamesWithDifferentDetails,
      })}`,
    );

    if (inconsistentObjectNames.length > 0) {
      this.logger.warn(
        `[BCDC Client] duplicated object_name values with different details ${JSON.stringify(
          inconsistentObjectNames.sort(),
        )}`,
      );
    }
  }

  private buildDetailsSignature(
    details: Array<{
      column_name: string;
      data_type: string;
      data_precision: string | number;
      short_name?: string;
      column_comments?: string;
    }>,
  ): string {
    return JSON.stringify(
      details.map(detail => ({
        column_name: detail.column_name,
        data_type: detail.data_type,
        data_precision: String(detail.data_precision),
        short_name: detail.short_name ?? '',
        column_comments: detail.column_comments ?? '',
      })),
    );
  }
}