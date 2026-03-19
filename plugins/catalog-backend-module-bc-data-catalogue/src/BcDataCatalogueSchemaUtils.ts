import type { BcResource } from './BcDataCatalogueModel';

export class BcDataCatalogueSchemaUtils {
  hasNonEmptyJsonTableSchema(resource: BcResource): boolean {
    const schema = resource.json_table_schema;

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      return false;
    }

    return Object.keys(schema).length > 0;
  }

  getResourcesWithSchemas(resources: BcResource[] | null | undefined): BcResource[] {
    if (!resources || resources.length === 0) {
      return [];
    }

    return resources.filter(resource => this.hasNonEmptyJsonTableSchema(resource));
  }

  buildSchemaDescription(resources: BcResource[] | null | undefined): string | undefined {
    const resourcesWithSchemas = this.getResourcesWithSchemas(resources);

    if (resourcesWithSchemas.length === 0) {
      return undefined;
    }

    const sections = resourcesWithSchemas.map(resource => {
      const schemaJson = JSON.stringify(resource.json_table_schema, null, 2);
      return `Schema (${resource.name}):\n${schemaJson}`;
    });

    return `Schemas:\n\n${sections.join('\n\n')}`;
  }
}