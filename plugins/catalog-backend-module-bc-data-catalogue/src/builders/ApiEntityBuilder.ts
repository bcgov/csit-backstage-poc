import { ApiEntity, EntityLink } from '@backstage/catalog-model';
import type { BcResource } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

type ApiEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
};

type BuildApiEntityOptions = {
  apiResource: BcResource;
  ownerGroupId: string;
  systemId: string;
  apiSafeName: string;
  definitionUrl: string;
  apiType?: string;
  bcdcDatasetResourceUrl: string;
};

type GraphQlIntrospectionResponse = {
  data?: IntrospectionQuery;
  errors?: unknown[];
};

export class ApiEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;

  constructor(options: ApiEntityBuilderOptions) {
    this.naming = options.naming;
  }

  async build(options: BuildApiEntityOptions): Promise<ApiEntity> {
    const {
      apiResource,
      ownerGroupId,
      systemId,
      apiSafeName,
      definitionUrl,
      apiType,
      bcdcDatasetResourceUrl,
    } = options;

    const resolvedApiType = apiType ?? apiResource.bcdc_type;
    const resolvedDefinition = await this.resolveDefinition(
      resolvedApiType,
      definitionUrl,
    );
    const apiEntityLinks = this.buildLinks(apiResource, bcdcDatasetResourceUrl);
    const managedByLocation = `url:${bcdcDatasetResourceUrl}`;

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      spec: {
        type: resolvedApiType,
        lifecycle: 'production',
        owner: ownerGroupId,
        definition: resolvedDefinition,
        system: systemId,
      },
      metadata: {
        name: apiSafeName,
        title: apiResource.name,
        description: apiResource.description || 'No description available',
        links: apiEntityLinks,
        tags: [this.naming.toSafeName(apiResource.format)],
        annotations: {
          'backstage.io/managed-by-location': managedByLocation,
          'backstage.io/managed-by-origin-location': managedByLocation,

          'bcdata.gov.bc.ca/resource-bcdc_type': apiResource.bcdc_type,
          'bcdata.gov.bc.ca/resource-cache_last_updated':
            apiResource.cache_last_updated || 'Undefined',
          'bcdata.gov.bc.ca/resource-cache_url':
            apiResource.cache_url || 'Undefined',
          'bcdata.gov.bc.ca/resource-created': apiResource.created,
          'bcdata.gov.bc.ca/resource-datastore_active': `${apiResource.datastore_active}`,
          'bcdata.gov.bc.ca/resource-description':
            apiResource.description || 'Undefined',
          'bcdata.gov.bc.ca/resource-format': apiResource.format,
          'bcdata.gov.bc.ca/resource-hash': apiResource.hash,
          'bcdata.gov.bc.ca/resource-id': apiResource.id,
          'bcdata.gov.bc.ca/resource-metadata_modified':
            apiResource.metadata_modified,
          'bcdata.gov.bc.ca/resource-mimetype':
            apiResource.mimetype || 'Undefined',
          'bcdata.gov.bc.ca/resource-name': apiResource.name,
          'bcdata.gov.bc.ca/resource-package_id': apiResource.package_id,
          'bcdata.gov.bc.ca/resource-position': `${apiResource.position}`,
          'bcdata.gov.bc.ca/resource-projection_name':
            apiResource.projection_name || 'Undefined',
          'bcdata.gov.bc.ca/resource-resource_access_method':
            apiResource.resource_access_method,
          'bcdata.gov.bc.ca/resource-resource_storage_location':
            apiResource.resource_storage_location,
          'bcdata.gov.bc.ca/resource-resource_type':
            apiResource.resource_type,
          'bcdata.gov.bc.ca/resource-resource_update_cycle':
            apiResource.resource_update_cycle,
          'bcdata.gov.bc.ca/resource-size': `${apiResource.size}`,
          'bcdata.gov.bc.ca/resource-spatial_datatype':
            apiResource.spatial_datatype || 'Undefined',
          'bcdata.gov.bc.ca/resource-state': apiResource.state,
          'bcdata.gov.bc.ca/resource-url': apiResource.url,
          'bcdata.gov.bc.ca/resource-url_type':
            apiResource.url_type || 'Undefined',
        },
      },
    };
  }

  private async resolveDefinition(
    apiType: string,
    definition: string,
  ): Promise<string> {
    if (apiType !== 'graphql' || !this.isHttpUrl(definition)) {
      return definition;
    }

    const schema = await this.fetchGraphQlSchema(definition);

    return schema ?? definition;
  }

  private async fetchGraphQlSchema(url: string): Promise<string | undefined> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: getIntrospectionQuery(),
        }),
      });

      if (!response.ok) {
        return undefined;
      }

      const result = (await response.json()) as GraphQlIntrospectionResponse;

      if (!result.data || result.errors?.length) {
        return undefined;
      }

      return printSchema(buildClientSchema(result.data));
    } catch {
      return undefined;
    }
  }

  private isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private buildLinks(apiResource: BcResource, bcdcDatasetResourceUrl: string): EntityLink[] | undefined {
    if (!apiResource.url || apiResource.url.length === 0) {
      return undefined;
    }

    return [
      {
        url: bcdcDatasetResourceUrl,
        title: 'BC Data Catalogue Record',
        icon: 'docs',
        type: 'bcdc_record',
      },
      {
        url: apiResource.url,
        title: apiResource.name,
        icon: 'api',
        type: apiResource.bcdc_type,
      },
    ];
  }
}
