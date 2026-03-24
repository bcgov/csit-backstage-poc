import {
  ApiEntity,
  Entity,
  EntityLink,
  GroupEntity,
  SystemEntity,
  UserEntity,
} from '@backstage/catalog-model';
import {
  LoggerService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import {
  DATASET_API_VERSION,
  DATASET_KIND,
  type DatasetAccessMethod,
  type DatasetEntity,
  type DatasetSecurityClassification,
  type DatasetStatus,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import type {
  BcDataCataloguePackage,
  BcOrganization,
  BcResource,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from './BcDataCatalogueNaming';
import { BcDataCatalogueSchemaUtils } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type BcDataCatalogueEntityFactoryOptions = {
  reader: UrlReaderService;
  logger: LoggerService;
  allowedHosts: string[];
};

const MANAGED_BY_LOCATION =
  'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search';

const GAP = '<gap>';

export class BcDataCatalogueEntityFactory {
  private readonly reader: UrlReaderService;
  private readonly logger: LoggerService;
  private readonly allowedHosts: string[];
  private readonly naming: BcDataCatalogueNaming;
  private readonly schemaUtils: BcDataCatalogueSchemaUtils;

  constructor(options: BcDataCatalogueEntityFactoryOptions) {
    this.reader = options.reader;
    this.logger = options.logger;
    this.allowedHosts = options.allowedHosts;
    this.naming = new BcDataCatalogueNaming();
    this.schemaUtils = new BcDataCatalogueSchemaUtils();
  }

  async createEntities(allPackages: BcDataCataloguePackage[]): Promise<Entity[]> {
    this.logger.info('[BCDC Entity Factory] <createEntities');

    const allEntities: Entity[] = [];

    const allGroups = new Map<string, GroupEntity>();
    const bcGovGroupId = this.naming.getGroupId('gov.bc.ca');

    allGroups.set(
      bcGovGroupId,
      this.createGroupEntity('gov.bc.ca', 'Governent of British Columbia', undefined),
    );

    const allOrganizations = new Map<string, BcOrganization>();
    allPackages.forEach(pkg => {
      allOrganizations.set(pkg.organization.id, pkg.organization);
    });

    const allSystems = new Map<string, SystemEntity>();
    this.logger.info(`[BCDC Entity Factory] Organizations ${allOrganizations.size}`);
    allOrganizations.forEach(organization => {
      const organizationGroupId = this.naming.getGroupId(organization.name);

      if (!allGroups.has(organizationGroupId)) {
        allGroups.set(
          organizationGroupId,
          this.createGroupEntity(
            organization.name,
            organization.title,
            bcGovGroupId,
          ),
        );
      }

      const systemEntity: SystemEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'System',
        spec: {
          owner: organizationGroupId,
          type: 'government',
        },
        metadata: {
          name: this.naming.toSafeName(organization.name),
          title: organization.title,
          description: organization.description,
          annotations: {
            'backstage.io/managed-by-location': MANAGED_BY_LOCATION,
            'backstage.io/managed-by-origin-location': MANAGED_BY_LOCATION,

            'bcdata.gov.bc.ca/organization-id': organization.id,
            'bcdata.gov.bc.ca/organization-type': organization.type,
            'bcdata.gov.bc.ca/organization-created': organization.created,
            'bcdata.gov.bc.ca/organization-approval-status':
              organization.approval_status,
            'bcdata.gov.bc.ca/organization-state': organization.state,
          },
        },
      };

      allSystems.set(this.naming.getSystemId(organization.name), systemEntity);
    });

    const allUsers = new Map<string, UserEntity>();
    allPackages.forEach(pkg => {
      pkg.contacts?.forEach(contact => {
        const email = contact.email.toLowerCase();

        let user: UserEntity | undefined = allUsers.get(email);

        if (user === undefined) {
          user = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'User',
            spec: {
              profile: {
                email,
              },
              memberOf: [],
            },
            metadata: {
              name: this.naming.toSafeName(email),
              annotations: {
                'backstage.io/managed-by-location': MANAGED_BY_LOCATION,
                'backstage.io/managed-by-origin-location': MANAGED_BY_LOCATION,
              },
            },
          };

          allUsers.set(this.naming.getUserId(email), user);
        }

        if (user.spec.profile?.displayName === undefined) {
          user.spec.profile!.displayName = contact.name;
        }

        const hostName = this.getEmailHostname(email);

        if (hostName === undefined) {
          this.logger.warn(
            `[BCDC Entity Factory] Failed to extract hostname from email address ${email}`,
          );
        } else {
          const groupId = this.naming.getGroupId(hostName);

          let group = allGroups.get(groupId);

          if (group === undefined) {
            group = this.createGroupEntity(hostName, hostName, bcGovGroupId);
            allGroups.set(groupId, group);
          }

          if (!user.spec.memberOf?.includes(groupId)) {
            user.spec.memberOf?.push(groupId);
          }
        }
      });
    });

    const allDatasets = new Map<string, DatasetEntity>();
    const allApis = new Map<string, ApiEntity>();

    for (const pkg of allPackages) {
      const safeName = this.naming.toSafeName(pkg.name);
      const systemId = this.naming.getSystemId(pkg.organization.name);
      const ownerGroupId = this.naming.getGroupId(pkg.organization.name);

      const learnMoreLinks: EntityLink[] = [];
      const relatedResources: Array<{ url: string; title?: string }> = [];
      const accessMethods: DatasetAccessMethod[] = [];
      const apiResources: BcResource[] = [];
      const providesApis: string[] = [];

      pkg.more_info?.forEach(moreInfo => {
        if (moreInfo.url.length > 0) {
          const entityLink: EntityLink = {
            url: moreInfo.url,
            title: moreInfo.description || moreInfo.url,
            icon: 'externalLink',
            type: 'more_info',
          };

          learnMoreLinks.push(entityLink);
          relatedResources.push({
            url: moreInfo.url,
            title: moreInfo.description || moreInfo.url,
          });
        }
      });

      pkg.resources?.forEach(resource => {
        if (this.isApiResource(resource)) {
          apiResources.push(resource);
          return;
        }

        if (resource.bcdc_type === 'geographic') {
          return;
        }

        if (resource.url.length > 0) {
          accessMethods.push(this.toDatasetAccessMethod(resource));
          relatedResources.push({
            url: resource.url,
            title: resource.name,
          });
        } else {
          this.logger.info(
            `[BCDC Entity Factory] Missing URL ${resource.bcdc_type} ${resource.format} ${pkg.name}`,
          );
        }
      });

      const tags: string[] = [];

      pkg.tags?.forEach(tag => {
        tags.push(this.naming.toSafeName(tag.display_name));
      });

      const schema = this.schemaUtils.buildDatasetSchema(pkg.resources);
      const tableCount = schema?.tables?.length ?? 0;

      if (tableCount > 0) {
        tags.push('has-schema');
      }

      if (tableCount >= 2 && tableCount <= 5) {
        tags.push('has-two-to-five-tables');
      } else if (tableCount >= 6 && tableCount <= 10) {
        tags.push('has-six-to-10-tables');
      } else if (tableCount >= 11) {
        tags.push('has-11-or-more-tables');
      }

      const datasetEntity: DatasetEntity = {
        apiVersion: DATASET_API_VERSION,
        kind: DATASET_KIND,
        spec: {
          owner: ownerGroupId,
          system: systemId,
          type: GAP,
          description: pkg.notes || 'No description available',
          status: this.normalizeStatus(pkg.publish_state),
          securityClassification: this.normalizeSecurityClassification(
            pkg.security_class,
          ),
          connectedServicesDescription: GAP,
          updateFrequency: GAP,
          providesApis,
          accessMethods: accessMethods.length > 0 ? accessMethods : undefined,
          schema,
          quality: {
            score: GAP,
            validation: GAP,
            controls: [GAP],
          },
          governance: {
            retention: GAP,
            description: GAP,
          },
          about: {
            description: pkg.purpose || 'No description available',
          },
          authoritativeDesignation: {
            authoritativeFor: GAP,
          },
          lineage: {
            sourceSystem: GAP,
            transformation: GAP,
            refresh: GAP,
          },
          versioning: {
            currentVersion: GAP, // pkg.version is not populated for any of the 3000+ datasets
            initialRelease: pkg.record_publish_date,
            lastUpdated: pkg.record_last_modified,
            description: GAP,
          },
          support: {
            primary: this.getPrimarySupport(pkg),
            description: pkg.organization.description,
            dataCustodian: pkg.organization.title,
            governanceAuthority: GAP,
            pathways: GAP,
            dataAndSemantics: {
              description: GAP,
              channel: GAP,
              responseTime: GAP,
              escalation: GAP,
            },
            accessAndIntegration: {
              description: GAP,
              channel: GAP,
              responseTime: GAP,
              escalation: GAP,
            },
            governanceAndProductionEscalation: {
              description: GAP,
              channel: GAP,
              referenceDataset: GAP,
              responseTime: GAP,
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
            'backstage.io/managed-by-location': MANAGED_BY_LOCATION,
            'backstage.io/managed-by-origin-location': MANAGED_BY_LOCATION,

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
          tags,
        },
      };

      allDatasets.set(this.naming.getComponentId(safeName), datasetEntity);

      let hasOpenApi = false;

      for (const apiResource of apiResources) {
        const name = apiResource.name;
        let apiSafeName = this.naming.toSafeName(name);

        if (
          apiResource.bcdc_type === 'webservice' ||
          apiResource.format === 'arcgis_rest'
        ) {
          const prefix =
            apiResource.format === 'openapi-json' ? 'api' : apiResource.format;
          const formatSafeName = this.naming.toSafeName(prefix);
          const baseName = this.naming.toSafeName(`${formatSafeName}-${safeName}`);

          let candidateName = baseName;
          let candidateApiId = this.naming.getApiId(candidateName);

          if (allApis.has(candidateApiId)) {
            const distinguishingSuffix =
              this.naming.extractDistinguishingSuffix(name);
            const suffixWithSeparator = `-${distinguishingSuffix}`;
            const maxBaseLength = 63 - suffixWithSeparator.length;

            let truncatedBase = baseName;
            if (baseName.length > maxBaseLength) {
              truncatedBase = baseName
                .slice(0, maxBaseLength)
                .replace(/[-_.]+$/, '');
            }

            candidateName = this.naming.toSafeName(
              `${truncatedBase}${suffixWithSeparator}`,
            );
            candidateApiId = this.naming.getApiId(candidateName);

            let counter = 1;
            while (allApis.has(candidateApiId)) {
              const counterSuffix = `-${counter}`;
              const maxBaseWithCounter =
                63 - suffixWithSeparator.length - counterSuffix.length;

              let truncatedBaseForCounter = baseName;
              if (baseName.length > maxBaseWithCounter) {
                truncatedBaseForCounter = baseName
                  .slice(0, maxBaseWithCounter)
                  .replace(/[-_.]+$/, '');
              }

              candidateName = this.naming.toSafeName(
                `${truncatedBaseForCounter}${suffixWithSeparator}${counterSuffix}`,
              );
              candidateApiId = this.naming.getApiId(candidateName);
              counter++;
            }
          }

          apiSafeName = candidateName;
        }

        const definition = apiResource.url;
        const url = new URL(definition);
        const host = url.host.toLowerCase();

        if (!this.allowedHosts.includes(host)) {
          this.logger.warn(
            `[BCDC Entity Factory] API definition host is NOT allowed: "${host}"`,
          );
        }

        const apiEntityLinks: EntityLink[] = [];

        if (apiResource.url && apiResource.url.length > 0) {
          const apiEntityLink: EntityLink = {
            url: apiResource.url,
            title: apiResource.name,
            icon: 'api',
            type: apiResource.bcdc_type,
          };

          apiEntityLinks.push(apiEntityLink);
        }

        let definitionContent: string = apiResource.url;
        if (apiResource.format === 'openapi-json') {
          hasOpenApi = true;

          try {
            const response = await this.reader.readUrl(apiResource.url);
            const content = (await response.buffer()).toString();
            definitionContent = content;
          } catch (error) {
            this.logger.warn(
              `[BCDC Entity Factory] Failed to fetch OpenAPI definition from ${apiResource.url}: ${error}`,
            );
            definitionContent = apiResource.url;
          }
        }

        const apiEntity: ApiEntity = {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          spec: {
            type:
              apiResource.format === 'openapi-json'
                ? 'openapi'
                : apiResource.bcdc_type,
            lifecycle: 'production',
            owner: ownerGroupId,
            definition: definitionContent,
            system: systemId,
          },
          metadata: {
            name: apiSafeName,
            description: apiResource.description || 'No description available',
            links: apiEntityLinks,
            tags: [this.naming.toSafeName(apiResource.format)],
            annotations: {
              'backstage.io/managed-by-location': MANAGED_BY_LOCATION,
              'backstage.io/managed-by-origin-location': MANAGED_BY_LOCATION,

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

        const apiId = this.naming.getApiId(apiSafeName);

        if (allApis.has(apiId)) {
          const existingApi = allApis.get(apiId)!;
          this.logger.warn(
            '[BCDC Entity Factory] ' +
              `Duplicate API name detected: "${apiSafeName}" (ID: ${apiId}). ` +
              `Existing API: name="${existingApi.metadata.name}", ` +
              `Format: "${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-format']}", ` +
              `resource-id="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-id']}", ` +
              `package-id="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-package_id']}", ` +
              `url="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-url']}". ` +
              `New API: name="${apiEntity.metadata.name}", ` +
              `resource-id="${apiResource.id}", ` +
              `package-id="${apiResource.package_id}", ` +
              `url="${apiResource.url}". ` +
              `The new API will overwrite the existing one.`,
          );
        }

        allApis.set(apiId, apiEntity);
        datasetEntity.spec.providesApis?.push(apiId);
      }

      if (datasetEntity.spec.providesApis?.length) {
        if (!tags.includes('has-api')) {
          tags.push('has-api');
        }

        if (hasOpenApi && !tags.includes('has-openapi')) {
          tags.push('has-openapi');
        }
      }
    }

    const userEntities: UserEntity[] = Array.from(allUsers.values());
    const groupEntities: GroupEntity[] = Array.from(allGroups.values());
    const systemEntities: SystemEntity[] = Array.from(allSystems.values());
    const datasetEntities: DatasetEntity[] = Array.from(allDatasets.values());
    const apiEntities: ApiEntity[] = Array.from(allApis.values());

    allEntities.push(...userEntities);
    allEntities.push(...groupEntities);
    allEntities.push(...systemEntities);
    allEntities.push(...datasetEntities);
    allEntities.push(...apiEntities);

    this.logger.info(`[BCDC Entity Factory] >createEntities ${allEntities.length}`);
    return allEntities;
  }

  private isApiResource(resource: BcResource): boolean {
    return (
      (resource.bcdc_type === 'webservice' && resource.format !== 'kml') ||
      resource.format === 'arcgis_rest' ||
      resource.format === 'openapi-json'
    );
  }

  private toDatasetAccessMethod(resource: BcResource): DatasetAccessMethod {
    return {
      id: resource.id,
      title: resource.name,
      description: resource.description,
      url: resource.url,
      type: resource.bcdc_type,
      format: resource.format,
      updateFrequency: resource.resource_update_cycle,
    };
  }

  private getPrimarySupport(pkg: BcDataCataloguePackage): string | undefined {
    const preferredRoles = [
      'pointOfContact',
      'distributor',
      'custodian',
      'dataSteward',
      'dataManager',
      'businessExpert',
    ];

    for (const role of preferredRoles) {
      const match = pkg.contacts.find(contact => contact.role === role);
      if (match?.email) {
        return match.email.toLowerCase();
      }
    }

    return pkg.contacts[0]?.email?.toLowerCase();
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

  private getEmailHostname(email: string): string | undefined {
    const match = email.trim().toLowerCase().match(/@([\w.-]+)/);
    return match ? match[1] : undefined;
  }

  private createGroupEntity(
    hostName: string,
    displayName: string,
    parentGroup?: string,
  ): GroupEntity {
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: this.naming.toSafeName(hostName),
        annotations: {
          'backstage.io/managed-by-location': MANAGED_BY_LOCATION,
          'backstage.io/managed-by-origin-location': MANAGED_BY_LOCATION,
        },
      },
      spec: {
        type: 'government',
        profile: {
          displayName,
        },
        parent: parentGroup,
        children: [],
        members: [],
      },
    };
  }
}