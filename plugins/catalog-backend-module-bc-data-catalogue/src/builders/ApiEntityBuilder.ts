import { ApiEntity, EntityLink } from '@backstage/catalog-model';
import type { BcResource } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

type ApiEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
};

type BuildApiEntityOptions = {
  apiResource: BcResource;
  ownerGroupId: string;
  systemId: string;
  apiSafeName: string;
  definition: string;
  apiType?: string;
  bcdcDatasetResourceUrl: string;
};

export class ApiEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;

  constructor(options: ApiEntityBuilderOptions) {
    this.naming = options.naming;
  }

  build(options: BuildApiEntityOptions): ApiEntity {
    const {
      apiResource,
      ownerGroupId,
      systemId,
      apiSafeName,
      definition,
      apiType,
      bcdcDatasetResourceUrl,
    } = options;

    const apiEntityLinks = this.buildLinks(apiResource, bcdcDatasetResourceUrl);
    const managedByLocation = `url:${bcdcDatasetResourceUrl}`;

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      spec: {
        type: apiType ?? apiResource.bcdc_type,
        lifecycle: 'production',
        owner: ownerGroupId,
        definition,
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