import { EntityLink } from '@backstage/catalog-model';
import {
  DATASET_API_VERSION,
  DATASET_KIND,
  type DatasetAccessMethod,
  type DatasetEntity,
  type DatasetSecurityClassification,
  type DatasetStatus,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import type { BcDataCataloguePackage } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueSchemaUtils } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

const GAP = 'GAP';

type DatasetEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
  schemaUtils: BcDataCatalogueSchemaUtils;
};

type BuildDatasetEntityOptions = {
  pkg: BcDataCataloguePackage;
  safeName: string;
  ownerGroupId: string;
  systemId: string;
  providesApis: string[];
  bcdcDatasetUrl: string;
};

export class DatasetEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;
  private readonly schemaUtils: BcDataCatalogueSchemaUtils;

  constructor(options: DatasetEntityBuilderOptions) {
    this.naming = options.naming;
    this.schemaUtils = options.schemaUtils;
  }

  build(options: BuildDatasetEntityOptions): DatasetEntity {
    const { pkg, safeName, ownerGroupId, systemId, providesApis, bcdcDatasetUrl } = options;

    const learnMoreLinks = this.buildLearnMoreLinks(pkg, bcdcDatasetUrl);
    const relatedResources = this.buildRelatedResources(pkg);
    const accessMethods = this.buildAccessMethods(pkg);
    const schema = this.schemaUtils.buildDatasetSchema(pkg.resources);
    const normalizedTags = this.buildTags(pkg, schema?.tables?.length ?? 0);
    const managedByLocation = `url:${bcdcDatasetUrl}`;

    return {
      apiVersion: DATASET_API_VERSION,
      kind: DATASET_KIND,
      spec: {
        owner: ownerGroupId,
        system: systemId,
        type: GAP + '<type>',

        description: pkg.notes || 'No description available',
        status: this.normalizeStatus(pkg.publish_state),
        securityClassification: this.normalizeSecurityClassification(
          pkg.security_class,
        ),
        connectedServicesDescription: GAP + '<connectedServicesDescription>',
        updateFrequency: GAP + '<updateFrequency>',
        providesApis,
        accessMethods: accessMethods.length > 0 ? accessMethods : undefined,
        schema,
        quality: {
          score: GAP + '<quality.score>',
          validation: GAP + '<quality.validation>',
          controls: [GAP + '<quality.controls>'],
        },
        governance: {
          retention: GAP + '<governance.retention>',
          description: GAP + '<governance.description>',
        },
        about: {
          description: pkg.purpose || 'No description available',
        },
        authoritativeDesignation: {
          authoritativeFor: GAP + '<authoritativeDesignation.authoritativeFor>',
        },
        lineage: {
          sourceSystem: GAP + '<lineage.sourceSystem>',
          transformation:
            pkg.lineage_statement || 'No transformation information available',
          refresh: GAP + '<lineage.refresh>',
        },
        versioning: {
          currentVersion: GAP + '<versioning.currentVersion>',
          initialRelease: pkg.record_publish_date,
          lastUpdated: pkg.record_last_modified,
          description: GAP + '<versioning.description>',
        },
        support: {
          description: pkg.organization.description,
          dataCustodian: pkg.organization.title,
          governanceAuthority: GAP + '<support.governanceAuthority>',
          pathways: GAP + '<support.pathways>',
          dataAndSemantics: {
            description: GAP + '<support.dataAndSemantics.description>',
            channel: GAP + '<support.dataAndSemantics.channel>',
            responseTime: GAP + '<support.dataAndSemantics.responseTime>',
            escalation: GAP + '<support.dataAndSemantics.escalation>',
          },
          accessAndIntegration: {
            description: GAP + '<support.accessAndIntegration.description>',
            channel: GAP + '<support.accessAndIntegration.channel>',
            responseTime: GAP + '<support.accessAndIntegration.responseTime>',
            escalation: GAP + '<support.accessAndIntegration.escalation>',
          },
          governanceAndProductionEscalation: {
            description:
              GAP +
              '<support.governanceAndProductionEscalation.description>',
            channel: GAP + '<support.governanceAndProductionEscalation.channel>',
            referenceDataset:
              GAP +
              '<support.governanceAndProductionEscalation.referenceDataset>',
            responseTime:
              GAP + '<support.governanceAndProductionEscalation.responseTime>',
          },
        },
        relatedResources:
          relatedResources.length > 0 ? relatedResources : undefined,
      },
      metadata: {
        name: safeName,
        title: pkg.title || pkg.name,
        description: pkg.notes || 'No description available',
        annotations: {
          'backstage.io/managed-by-location': managedByLocation,
          'backstage.io/managed-by-origin-location': managedByLocation,

          'bcdata.gov.bc.ca/package-author': pkg.author || 'Unknown',
          'bcdata.gov.bc.ca/package-author_email':
            pkg.author_email || 'Unknown',
          'bcdata.gov.bc.ca/package-creator_user_id': pkg.creator_user_id,
          'bcdata.gov.bc.ca/package-download_audience': pkg.download_audience,
          'bcdata.gov.bc.ca/package-id': pkg.id,
          'bcdata.gov.bc.ca/package-isopen': `${pkg.isopen}`,
          'bcdata.gov.bc.ca/package-license_id': pkg.license_id,
          'bcdata.gov.bc.ca/package-license_title':
            pkg.license_title || 'Unknown',
          'bcdata.gov.bc.ca/package-license_url': pkg.license_url,
          'bcdata.gov.bc.ca/package-maintainer': pkg.maintainer || 'Unknown',
          'bcdata.gov.bc.ca/package-maintainer_email':
            pkg.maintainer_email || 'Unknown',
          'bcdata.gov.bc.ca/package-metadata_created': pkg.metadata_created,
          'bcdata.gov.bc.ca/package-metadata_modified': pkg.metadata_modified,
          'bcdata.gov.bc.ca/package-metadata_visibility':
            pkg.metadata_visibility,
          'bcdata.gov.bc.ca/package-name': pkg.name,
          'bcdata.gov.bc.ca/package-notes': pkg.notes || 'Unknown',
          'bcdata.gov.bc.ca/package-owner_org': pkg.owner_org,
          'bcdata.gov.bc.ca/package-private': `${pkg.private}`,
          'bcdata.gov.bc.ca/package-publish_state': pkg.publish_state,
          'bcdata.gov.bc.ca/package-record_create_date':
            pkg.record_create_date || 'Unknown',
          'bcdata.gov.bc.ca/package-record_last_modified':
            pkg.record_last_modified,
          'bcdata.gov.bc.ca/package-record_publish_date':
            pkg.record_publish_date,
          'bcdata.gov.bc.ca/package-resource_status': pkg.resource_status,
          'bcdata.gov.bc.ca/package-security_class': pkg.security_class,
          'bcdata.gov.bc.ca/package-state': pkg.state,
          'bcdata.gov.bc.ca/package-title': pkg.title || 'Unknown',
          'bcdata.gov.bc.ca/package-type': pkg.type,
          'bcdata.gov.bc.ca/package-url': pkg.url || 'Unknown',
          'bcdata.gov.bc.ca/package-version': pkg.version || 'Unknown',
          'bcdata.gov.bc.ca/package-view_audience': pkg.view_audience,
        },
        links: learnMoreLinks.length > 0 ? learnMoreLinks : undefined,
        tags: normalizedTags,
      },
    };
  }

  private buildLearnMoreLinks(pkg: BcDataCataloguePackage, bcdcDatasetUrl: string): EntityLink[] {
    const learnMoreLinks: EntityLink[] = [
      {
        url: bcdcDatasetUrl,
        title: 'BC Data Catalogue Record',
        icon: 'docs',
        type: 'bcdc_record',
      },
    ];

    pkg.more_info?.forEach(moreInfo => {
      if (moreInfo.url.length > 0) {
        learnMoreLinks.push({
          url: moreInfo.url,
          title: moreInfo.description || moreInfo.url,
          icon: 'externalLink',
          type: 'more_info',
        });
      }
    });

    return learnMoreLinks;
  }

  private buildRelatedResources(
    pkg: BcDataCataloguePackage,
  ): Array<{ url: string; title?: string }> {
    const relatedResources: Array<{ url: string; title?: string }> = [];

    pkg.more_info?.forEach(moreInfo => {
      if (moreInfo.url.length > 0) {
        relatedResources.push({
          url: moreInfo.url,
          title: moreInfo.description || moreInfo.url,
        });
      }
    });

    pkg.resources?.forEach(resource => {
      if (resource.bcdc_type === 'geographic') {
        return;
      }

      if (resource.url.length > 0) {
        relatedResources.push({
          url: resource.url,
          title: resource.name,
        });
      }
    });

    return relatedResources;
  }

  private buildAccessMethods(
    pkg: BcDataCataloguePackage,
  ): DatasetAccessMethod[] {
    const accessMethods: DatasetAccessMethod[] = [];

    pkg.resources?.forEach(resource => {
      if (resource.bcdc_type === 'geographic') {
        return;
      }

      if (resource.url.length > 0) {
        accessMethods.push({
          id: resource.id,
          title: resource.name,
          description: resource.description,
          url: resource.url,
          type: resource.bcdc_type,
          format: resource.format,
          updateFrequency: resource.resource_update_cycle,
        });
      }
    });

    return accessMethods;
  }

  private buildTags(
    pkg: BcDataCataloguePackage,
    tableCount: number,
  ): string[] {
    const normalizedTags: string[] = [];

    pkg.tags?.forEach(tag => {
      normalizedTags.push(this.naming.toSafeName(tag.display_name));
    });

    if (tableCount > 0) {
      normalizedTags.push('has-schema');
    } else {
      normalizedTags.push('has-no-schema');
    }

    if (tableCount >= 2 && tableCount <= 5) {
      normalizedTags.push('has-two-to-five-tables');
    } else if (tableCount >= 6 && tableCount <= 10) {
      normalizedTags.push('has-six-to-10-tables');
    } else if (tableCount >= 11) {
      normalizedTags.push('has-11-or-more-tables');
    }

    return normalizedTags;
  }

  private normalizeStatus(publishState: string): DatasetStatus {
    switch (publishState.trim().toUpperCase()) {
      case 'PUBLISHED':
        return 'Published';
      case 'PENDING ARCHIVE':
        return 'Pending Archive';
      default:
        return 'Unknown';
    }
  }

  private normalizeSecurityClassification(
    securityClass: string,
  ): DatasetSecurityClassification {
    switch (securityClass.trim().toUpperCase()) {
      case 'PUBLIC':
        return 'Public';
      case 'PROTECTED A':
        return 'Protected A';
      case 'PROTECTED B':
        return 'Protected B';
      case 'PROTECTED C':
        return 'Protected C';
      default:
        return 'Unknown';
    }
  }
}