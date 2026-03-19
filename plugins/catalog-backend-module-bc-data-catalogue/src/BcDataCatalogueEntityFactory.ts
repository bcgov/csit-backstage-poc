import {
  ApiEntity,
  ComponentEntity,
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
import type {
  BcDataCataloguePackage,
  BcOrganization,
  BcResource,
} from './BcDataCatalogueModel';
import { BcDataCatalogueNaming } from './BcDataCatalogueNaming';
import { BcDataCatalogueSchemaUtils } from './BcDataCatalogueSchemaUtils';

type BcDataCatalogueEntityFactoryOptions = {
  reader: UrlReaderService;
  logger: LoggerService;
  allowedHosts: string[];
};

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
      const systemEntity: SystemEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'System',
        spec: {
          owner: bcGovGroupId,
          type: 'government',
        },
        metadata: {
          name: this.naming.toSafeName(organization.name),
          title: organization.title,
          description: organization.description,
          annotations: {
            'backstage.io/managed-by-location':
              'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
            'backstage.io/managed-by-origin-location':
              'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',

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
                'backstage.io/managed-by-location':
                  'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
                'backstage.io/managed-by-origin-location':
                  'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
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
          this.logger.warn(`[BCDC Entity Factory] Failed to extract hostname from email address ${email}`);
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

    const allComponents = new Map<string, ComponentEntity>();
    const allApis = new Map<string, ApiEntity>();

    for (const pkg of allPackages) {
      const safeName = this.naming.toSafeName(pkg.name);
      const systemId = this.naming.getSystemId(pkg.organization.name);

      const entityLinks: EntityLink[] = [];

      pkg.contacts.forEach(contact => {
        const email = contact.email.toLowerCase();

        const entityLink: EntityLink = {
          url: `mailto:${email}`,
          title: `Contact: ${contact.name}`,
          icon: 'email',
          type: 'contact',
        };

        entityLinks.push(entityLink);
      });

      pkg.more_info?.forEach(more_info => {
        if (more_info.url.length > 0) {
          const entityLink: EntityLink = {
            url: more_info.url,
            title: more_info.description || more_info.url,
            icon: 'externalLink',
            type: 'more_info',
          };

          entityLinks.push(entityLink);
        }
      });

      const apiResources: BcResource[] = [];

      pkg.resources?.forEach(resource => {
        if (
          (resource.bcdc_type === 'webservice' && resource.format !== 'kml') ||
          resource.format === 'arcgis_rest' ||
          resource.format === 'openapi-json'
        ) {
          apiResources.push(resource);
        } else if (resource.bcdc_type === 'geographic') {
          // TODO What to do with Geographic resources? No URL.
        } else if (resource.url.length > 0) {
          const entityLink: EntityLink = {
            url: resource.url,
            title: resource.name,
            icon: 'catalog',
            type: resource.bcdc_type,
          };

          entityLinks.push(entityLink);
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

      const schemaDescription = this.schemaUtils.buildSchemaDescription(pkg.resources);

      if (schemaDescription) {
        if (!tags.includes('has-schema')) {
          tags.push('has-schema');
        }
      }

      const baseDescription = pkg.notes || 'No description available';
      const componentDescription = schemaDescription
        ? `${baseDescription}\n\n${schemaDescription}`
        : baseDescription;

      const componentEntity: ComponentEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        spec: {
          type: pkg.type,
          lifecycle: 'production',
          owner: bcGovGroupId,
          subcomponentOf: undefined,
          providesApis: [],
          consumesApis: undefined,
          dependsOn: undefined,
          dependencyOf: undefined,
          system: systemId,
        },
        metadata: {
          name: safeName,
          description: componentDescription,
          annotations: {
            'backstage.io/managed-by-location':
              'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
            'backstage.io/managed-by-origin-location':
              'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',

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
          links: entityLinks,
          tags,
        },
      };

      allComponents.set(this.naming.getComponentId(safeName), componentEntity);

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
          this.logger.warn(`[BCDC Entity Factory] API definition host is NOT allowed: "${host}"`);
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
            owner: bcGovGroupId,
            definition: definitionContent,
            system: systemId,
          },
          metadata: {
            name: apiSafeName,
            description: apiResource.description || 'No description available',
            links: apiEntityLinks,
            tags: [this.naming.toSafeName(apiResource.format)],
            annotations: {
              'backstage.io/managed-by-location':
                'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
              'backstage.io/managed-by-origin-location':
                'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',

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
        componentEntity.spec.providesApis?.push(apiId);
      }
    }

    const userEntities: UserEntity[] = Array.from(allUsers.values());
    const groupEntities: GroupEntity[] = Array.from(allGroups.values());
    const systemEntities: SystemEntity[] = Array.from(allSystems.values());
    const componentEntities: ComponentEntity[] = Array.from(allComponents.values());
    const apiEntities: ApiEntity[] = Array.from(allApis.values());

    allEntities.push(...userEntities);
    allEntities.push(...groupEntities);
    allEntities.push(...systemEntities);
    allEntities.push(...componentEntities);
    allEntities.push(...apiEntities);

    this.logger.info(`[BCDC Entity Factory] >createEntities ${allEntities.length}`);
    return allEntities;
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
          'backstage.io/managed-by-location':
            'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
          'backstage.io/managed-by-origin-location':
            'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
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