import { EntityLink, ResourceEntity } from '@backstage/catalog-model';
import type { BcResource } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

type ResourceEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
};

type BuildResourceEntityOptions = {
  resource: BcResource;
  ownerGroupId: string;
  systemId: string;
  resourceSafeName: string;
  resourceType: string;
  datasetEntityRef: string;
  datasetTitle: string;
  bcdcDatasetResourceUrl: string;
};

export class ResourceEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;

  constructor(options: ResourceEntityBuilderOptions) {
    this.naming = options.naming;
  }

  build(options: BuildResourceEntityOptions): ResourceEntity {
    const {
      resource,
      ownerGroupId,
      systemId,
      resourceSafeName,
      resourceType,
      datasetEntityRef,
      datasetTitle,
      bcdcDatasetResourceUrl,
    } = options;

    const managedByLocation = `url:${bcdcDatasetResourceUrl}`;
    const links = this.buildLinks(resource, bcdcDatasetResourceUrl);
    const tags = this.buildTags(resource, resourceType);

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Resource',
      metadata: {
        name: resourceSafeName,
        title: `${datasetTitle} - ${resource.name}`,
        description: resource.description || 'No description available',
        links,
        tags,
        annotations: {
          'backstage.io/managed-by-location': managedByLocation,
          'backstage.io/managed-by-origin-location': managedByLocation,
          'backstage.io/view-url': resource.url,
          'bcdata.gov.bc.ca/resource-bcdc_type': resource.bcdc_type,
          'bcdata.gov.bc.ca/resource-cache_last_updated':
            resource.cache_last_updated || 'Undefined',
          'bcdata.gov.bc.ca/resource-cache_url':
            resource.cache_url || 'Undefined',
          'bcdata.gov.bc.ca/resource-created': resource.created,
          'bcdata.gov.bc.ca/resource-datastore_active': `${resource.datastore_active}`,
          'bcdata.gov.bc.ca/resource-description':
            resource.description || 'Undefined',
          'bcdata.gov.bc.ca/resource-format': resource.format,
          'bcdata.gov.bc.ca/resource-hash': resource.hash,
          'bcdata.gov.bc.ca/resource-id': resource.id,
          'bcdata.gov.bc.ca/resource-metadata_modified':
            resource.metadata_modified,
          'bcdata.gov.bc.ca/resource-mimetype':
            resource.mimetype || 'Undefined',
          'bcdata.gov.bc.ca/resource-name': resource.name,
          'bcdata.gov.bc.ca/resource-package_id': resource.package_id,
          'bcdata.gov.bc.ca/resource-position': `${resource.position}`,
          'bcdata.gov.bc.ca/resource-projection_name':
            resource.projection_name || 'Undefined',
          'bcdata.gov.bc.ca/resource-resource_access_method':
            resource.resource_access_method,
          'bcdata.gov.bc.ca/resource-resource_storage_location':
            resource.resource_storage_location,
          'bcdata.gov.bc.ca/resource-resource_type': resource.resource_type,
          'bcdata.gov.bc.ca/resource-resource_update_cycle':
            resource.resource_update_cycle,
          'bcdata.gov.bc.ca/resource-size': `${resource.size}`,
          'bcdata.gov.bc.ca/resource-spatial_datatype':
            resource.spatial_datatype || 'Undefined',
          'bcdata.gov.bc.ca/resource-state': resource.state,
          'bcdata.gov.bc.ca/resource-url': resource.url,
          'bcdata.gov.bc.ca/resource-url_type':
            resource.url_type || 'Undefined',
        },
      },
      spec: {
        type: resourceType,
        owner: ownerGroupId,
        system: systemId,
        dependencyOf: [datasetEntityRef],
      },
    };
  }

  private buildLinks(
    resource: BcResource,
    bcdcDatasetResourceUrl: string,
  ): EntityLink[] {
    const links: EntityLink[] = [
      {
        url: bcdcDatasetResourceUrl,
        title: 'BC Data Catalogue Record',
        icon: 'docs',
        type: 'bcdc_record',
      },
    ];

    if (resource.url.length > 0) {
      links.push({
        url: resource.url,
        title: resource.name,
        icon: 'externalLink',
        type: resource.bcdc_type,
      });
    }

    return links;
  }

  private buildTags(resource: BcResource, resourceType: string): string[] {
    const tags = new Set<string>();

    tags.add(this.naming.toSafeName(resourceType));

    if (resource.format) {
      tags.add(this.naming.toSafeName(resource.format));
    }

    if (resource.bcdc_type) {
      tags.add(this.naming.toSafeName(resource.bcdc_type));
    }

    return Array.from(tags);
  }
}
