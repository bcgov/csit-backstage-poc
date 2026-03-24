import type { BcResource } from '../model/BcDataCatalogueModel';
import type {
  DatasetSchema,
  DatasetSchemaField,
  DatasetSchemaTable,
} from '../model/DatasetEntity';

export class BcDataCatalogueSchemaUtils {
  hasResourceDetails(resource: BcResource): boolean {
    return (
      resource.resource_type === 'data' &&
      !!resource.details?.length
    );
  }

  getResourcesWithSchemas(
    resources: BcResource[] | null | undefined,
  ): BcResource[] {
    if (!resources || resources.length === 0) {
      return [];
    }

    return [...resources]
      .filter(resource => this.hasResourceDetails(resource))
      .sort((a, b) => a.position - b.position);
  }

  buildDatasetSchema(
    resources: BcResource[] | null | undefined,
  ): DatasetSchema | undefined {
    if (!resources || resources.length === 0) {
      return undefined;
    }

    const tables: DatasetSchemaTable[] = [];
    const seenTableKeys = new Set<string>();

    const orderedResources = [...resources].sort(
      (a, b) => a.position - b.position,
    );

    for (const resource of orderedResources) {
      if (!this.hasResourceDetails(resource)) {
        continue;
      }

      const tableKey = resource.object_name?.trim() || resource.name;

      if (seenTableKeys.has(tableKey)) {
        continue;
      }

      seenTableKeys.add(tableKey);

      tables.push({
        name: tableKey,
        resourceType: resource.resource_type,
        fields: (resource.details ?? []).map<DatasetSchemaField>(detail => ({
          columnName: detail.column_name,
          dataType: detail.data_type || undefined,
          dataPrecision:
            detail.data_precision !== undefined && detail.data_precision !== null
              ? String(detail.data_precision)
              : undefined,
          shortName: detail.short_name || undefined,
          columnComments: detail.column_comments || undefined,
        })),
      });
    }

    return tables.length > 0 ? { tables } : undefined;
  }

  countSchemaFields(
    resources: BcResource[] | null | undefined,
  ): number {
    if (!resources || resources.length === 0) {
      return 0;
    }

    const schema = this.buildDatasetSchema(resources);

    return (
      schema?.tables?.reduce(
        (count, table) => count + (table.fields?.length ?? 0),
        0,
      ) ?? 0
    );
  }
}