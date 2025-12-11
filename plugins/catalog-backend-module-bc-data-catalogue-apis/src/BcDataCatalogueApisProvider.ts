import { 
  Entity, 
  ApiEntity, 
  ComponentEntity, 
  GroupEntity, 
  SystemEntity, 
  UserEntity, 
  EntityLink 
} from '@backstage/catalog-model';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  SchedulerServiceTaskRunner,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { LoggerService } from '@backstage/backend-plugin-api';
import { 
  BcDataCataloguePackageSchema
} from './BcDataCatalogueModel';
import type { 
  BcDataCataloguePackage, 
  BcOrganization, 
  BcResource, 
} from './BcDataCatalogueModel';

/**
 * Provides entities from the BC Data Catalogue service.
 */
export class BcDataCatalogueApisProvider implements EntityProvider {
  private readonly logger: LoggerService;
  private readonly env: string;
  private readonly reader: UrlReaderService;
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;
  private allowedHosts: string[];

  /** [1] */
  constructor(
    env: string,
    reader: UrlReaderService,
    taskRunner: SchedulerServiceTaskRunner,
    allowedHosts: string[],
    logger: LoggerService
  ) {
    this.env = env;
    this.reader = reader;
    this.taskRunner = taskRunner;
    this.allowedHosts = allowedHosts;
    this.logger = logger;
  }

  /** [2] */
  getProviderName(): string {
    return `bc-data-catalogue-apis-${this.env}`;
  }

  /** [3] */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.logger.info('<connect');
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
    this.logger.info('>connect');
  }

  /** [4] */
  async run(): Promise<void> {
    this.logger.info('<run');

    if (!this.connection) {
      throw new Error('Not initialized');
    }
    
    let page = 0;
    let retries = 0;

    let allEntities: Entity[] = [];

    let allPackages: BcDataCataloguePackage[] = [];

    do {

      const start = 1000 * page;

      const url: string = `https://catalogue.data.gov.bc.ca/api/3/action/package_search?start=${start}&rows=1000`;

      const response = await this.reader.readUrl(url);

      const data = JSON.parse((await response.buffer()).toString());

      if (!data?.success || !Array.isArray(data.result?.results)) {
        this.logger.warn('Invalid or unsuccessful response', { success: data?.success });
        ++retries;
        continue;
      }

      // Reset the retries on success
      retries = 0;

      const results = data.result.results as unknown[];

      if (results.length > 0) {

        const packages: BcDataCataloguePackage[] = this.getBcDataCataloguePackages(results);

        allPackages.push(...packages);
        ++page;
      } else {
        page = -1;
      }
    } while (page > 0 && retries < 3);

    this.logger.info(`Total packages ${allPackages.length}`)

    const allGroups = new Map<string, GroupEntity> ;

    const bcGovGroupId = this.getGroupId('gov.bc.ca');

    allGroups.set(bcGovGroupId, this.createGroupEntity('gov.bc.ca', 'Governent of British Columbia', undefined));

    const allOrganizations = new Map<string, BcOrganization>;
    allPackages.forEach(pkg => {
      
      const organization = pkg.organization;

      allOrganizations.set(organization.id, organization);
    });

    const allSystems = new Map<string, SystemEntity> ;
    this.logger.info(`Organizations ${allOrganizations.size}`);
    allOrganizations.forEach(organization => { 

      const systemEntity: SystemEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'System',
        spec: {
          owner: bcGovGroupId,
          type: 'government',
        },
        metadata: {
          name: this.toSafeName(organization.name),
          title: organization.title,
          description: organization.description,
          annotations: {
            'backstage.io/managed-by-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
            'backstage.io/managed-by-origin-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',

            'bcdata.gov.bc.ca/organization-id': organization.id,
            'bcdata.gov.bc.ca/organization-type': organization.type,
            'bcdata.gov.bc.ca/organization-created': organization.created,
            'bcdata.gov.bc.ca/organization-approval-status': organization.approval_status,
            'bcdata.gov.bc.ca/organization-state': organization.state,
          },
        }
      };

      allSystems.set(this.getSystemId(organization.name), systemEntity)
     });

    const allUsers = new Map<string, UserEntity>;
    allPackages.forEach(pkg => {
      
      pkg.contacts?.forEach(contact => {

        const email = contact.email.toLowerCase();

        let user: UserEntity | undefined = allUsers.get(email);

        if (user == undefined) {

          user = {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'User',
            spec: {
              profile: {
                email: email
              },
              memberOf: []
            },
            metadata: {
              name: this.toSafeName(email),
              annotations: {
                'backstage.io/managed-by-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
                'backstage.io/managed-by-origin-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
              },
            }
          };

          allUsers.set(this.getUserId(email), user);
        }

        if (user?.spec.profile?.displayName == undefined) {
          
          user!.spec.profile!.displayName = contact.name
        }

        const hostName = this.getEmailHostname(email);

        if (hostName == undefined) {

          this.logger.warn(`Failed to extract hostname from email address ${email}`);
        } else {

          const groupId = this.getGroupId(hostName);
          
          let group = allGroups.get(groupId);
          
          if (group == undefined) {

            allGroups.set(groupId, this.createGroupEntity(hostName, hostName, bcGovGroupId));
          }

          if (!user.spec.memberOf?.includes(groupId)) {

            user.spec.memberOf?.push(groupId);
          }
        }
      });
    });
    
    const allComponents = new Map<string, ComponentEntity>;
    const allApis = new Map<string, ApiEntity>;

    for (const pkg of allPackages) {

      const safeName = this.toSafeName(pkg.name);

      const systemId = this.getSystemId(pkg.organization.name);

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

      pkg.resources?.forEach (resource => {

        if (resource.bcdc_type == 'webservice' && resource.format != 'kml'
           || resource.format == 'arcgis_rest' 
           || resource.format == 'openapi-json' 
           ) {

          // this.logger.info(`Found ${resource.bcdc_type} ${resource.format} ${resource.name}`);
          apiResources.push(resource);
        } else if (resource.bcdc_type == 'geographic') {

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

          this.logger.info(`Missing URL ${resource.bcdc_type} ${resource.format} ${pkg.name}`);
        }
      });

      const labels: Record<string, string>[] = [];

      pkg.dates.forEach(date => {

        const label: Record<string, string> = { type: date.type, date: date.type };

        labels.push(label);
      });

      const tags: string[] = [];

      pkg.tags?.forEach(tag => {

        tags.push(this.toSafeName(tag.display_name));
      });

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
          system: systemId
        },
        metadata: {
            name: safeName,
            description: pkg.notes || 'No description available',
            annotations: {
              'backstage.io/managed-by-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
              'backstage.io/managed-by-origin-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',

              'bcdata.gov.bc.ca/package-author': pkg.author || 'Unknown',
              'bcdata.gov.bc.ca/package-author_email': pkg.author_email || 'Unknown',
              'bcdata.gov.bc.ca/package-creator_user_id': pkg.creator_user_id,
              'bcdata.gov.bc.ca/package-download_audience': pkg.download_audience,
              'bcdata.gov.bc.ca/package-id': pkg.id,
              'bcdata.gov.bc.ca/package-isopen': `${pkg.isopen}`,
              'bcdata.gov.bc.ca/package-license_id': pkg.license_id,
              'bcdata.gov.bc.ca/package-license_title': pkg.license_title || 'Unknown',
              'bcdata.gov.bc.ca/package-license_url': pkg.license_url,
              'bcdata.gov.bc.ca/package-maintainer': pkg.maintainer || 'Unknown',
              'bcdata.gov.bc.ca/package-maintainer_email': pkg.maintainer_email || 'Unknown',
              'bcdata.gov.bc.ca/package-metadata_created': pkg.metadata_created,
              'bcdata.gov.bc.ca/package-metadata_modified': pkg.metadata_modified,
              'bcdata.gov.bc.ca/package-metadata_visibility': pkg.metadata_visibility,
              'bcdata.gov.bc.ca/package-name': pkg.name,
              'bcdata.gov.bc.ca/package-notes': pkg.notes || 'Unknown',
              'bcdata.gov.bc.ca/package-owner_org': pkg.owner_org,
              'bcdata.gov.bc.ca/package-private': `${pkg.private}`,
              'bcdata.gov.bc.ca/package-publish_state': pkg.publish_state,
              'bcdata.gov.bc.ca/package-record_create_date': pkg.record_create_date || 'Unknown',
              'bcdata.gov.bc.ca/package-record_last_modified': pkg.record_last_modified,
              'bcdata.gov.bc.ca/package-record_publish_date': pkg.record_publish_date,
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
            tags: tags,
        },
      };

      allComponents.set(this.getComponentId(safeName), componentEntity);

      for (const apiResource of apiResources) {

        const name = apiResource.name;
        let resourceSafeName = this.toSafeName(name);
        let apiSafeName = resourceSafeName;

        // For all webservice resources, prefix with format to ensure uniqueness
        if (apiResource.bcdc_type === 'webservice' || apiResource.format === 'arcgis_rest') {
          // Use 'api' prefix for openapi-json, otherwise use the format as prefix
          const prefix = apiResource.format === 'openapi-json' ? 'api' : apiResource.format;
          const formatSafeName = this.toSafeName(prefix);
          // Start with package name as base (most informative)
          let baseName = this.toSafeName(`${formatSafeName}-${safeName}`);
          
          // Check if this would create a duplicate
          let candidateName = baseName;
          let candidateApiId = this.getApiId(candidateName);
          
          if (allApis.has(candidateApiId)) {
            // Append distinguishing information from resource name to ensure uniqueness
            const distinguishingSuffix = this.extractDistinguishingSuffix(name);
            
            // Calculate space needed: suffix + separator dash (max 63 chars total)
            const suffixWithSeparator = `-${distinguishingSuffix}`;
            const maxBaseLength = 63 - suffixWithSeparator.length;
            
            // Truncate baseName if needed to ensure suffix fits
            let truncatedBase = baseName;
            if (baseName.length > maxBaseLength) {
              truncatedBase = baseName.slice(0, maxBaseLength).replace(/[-_.]+$/, '');
            }
            
            candidateName = this.toSafeName(`${truncatedBase}${suffixWithSeparator}`);
            candidateApiId = this.getApiId(candidateName);
            
            // If still a duplicate, append a counter to ensure uniqueness
            let counter = 1;
            while (allApis.has(candidateApiId)) {
              // Reserve space for counter: suffix + counter + 2 dashes
              const counterSuffix = `-${counter}`;
              const maxBaseWithCounter = 63 - suffixWithSeparator.length - counterSuffix.length;
              let truncatedBaseForCounter = baseName;
              if (baseName.length > maxBaseWithCounter) {
                truncatedBaseForCounter = baseName.slice(0, maxBaseWithCounter).replace(/[-_.]+$/, '');
              }
              candidateName = this.toSafeName(`${truncatedBaseForCounter}${suffixWithSeparator}${counterSuffix}`);
              candidateApiId = this.getApiId(candidateName);
              counter++;
            }
          }
          
          apiSafeName = candidateName;
        }

        const definition = apiResource.url;
        const url = new URL(definition);
        const host = url.host.toLowerCase();
        
        if (!this.allowedHosts.includes(host)) {

          this.logger.warn(`API definition host is NOT allowed: "${host}"`);
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

        // For openapi-json resources, fetch the content and embed it directly
        let definitionContent: string = apiResource.url;
        if (apiResource.format === 'openapi-json') {
          try {
            const response = await this.reader.readUrl(apiResource.url);
            const content = (await response.buffer()).toString();
            definitionContent = content;
            // this.logger.info(`Fetched OpenAPI definition for ${apiResource.name}`);
          } catch (error) {
            this.logger.warn(`Failed to fetch OpenAPI definition from ${apiResource.url}: ${error}`);
            // Fall back to URL if fetch fails
            definitionContent = apiResource.url;
          }
        }

        const apiEntity: ApiEntity = {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          spec: {
            type: apiResource.format === 'openapi-json' ? 'openapi' : apiResource.bcdc_type,
            lifecycle: 'production',
            owner: bcGovGroupId,
            definition: definitionContent,
            system: systemId
          },
          metadata: {
            name: apiSafeName,
            description: apiResource.description || 'No description available',
            links: apiEntityLinks,
            // tags: [this.toSafeName(apiResource.format)],
            tags: [this.toSafeName(apiResource.format)],
            annotations: {
              'backstage.io/managed-by-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
              'backstage.io/managed-by-origin-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',

              'bcdata.gov.bc.ca/resource-bcdc_type': apiResource.bcdc_type,
              'bcdata.gov.bc.ca/resource-cache_last_updated': apiResource.cache_last_updated || 'Undefined',
              'bcdata.gov.bc.ca/resource-cache_url': apiResource.cache_url || 'Undefined',
              'bcdata.gov.bc.ca/resource-created': apiResource.created,
              'bcdata.gov.bc.ca/resource-datastore_active': `${apiResource.datastore_active}`,
              'bcdata.gov.bc.ca/resource-description': apiResource.description || 'Undefined',
              // 'bcdata.gov.bc.ca/resource-details': apiResource.details,
              'bcdata.gov.bc.ca/resource-format': apiResource.format,
              // 'bcdata.gov.bc.ca/resource-geographic_extent': apiResource.geographic_extent,
              'bcdata.gov.bc.ca/resource-hash': apiResource.hash,
              'bcdata.gov.bc.ca/resource-id': apiResource.id,
              // 'bcdata.gov.bc.ca/resource-iso_topic_category': apiResource.iso_topic_category || 'Undefined',
              'bcdata.gov.bc.ca/resource-metadata_modified': apiResource.metadata_modified,
              'bcdata.gov.bc.ca/resource-mimetype': apiResource.mimetype || 'Undefined',
              'bcdata.gov.bc.ca/resource-name': apiResource.name,
              'bcdata.gov.bc.ca/resource-package_id': apiResource.package_id,
              'bcdata.gov.bc.ca/resource-position': `${apiResource.position}`,
              // 'bcdata.gov.bc.ca/resource-preview_info': apiResource.preview_info,
              'bcdata.gov.bc.ca/resource-projection_name': apiResource.projection_name || 'Undefined',
              'bcdata.gov.bc.ca/resource-resource_access_method': apiResource.resource_access_method,
              'bcdata.gov.bc.ca/resource-resource_storage_location': apiResource.resource_storage_location,
              'bcdata.gov.bc.ca/resource-resource_type': apiResource.resource_type,
              'bcdata.gov.bc.ca/resource-resource_update_cycle': apiResource.resource_update_cycle,
              'bcdata.gov.bc.ca/resource-size': `${apiResource.size}`,
              'bcdata.gov.bc.ca/resource-spatial_datatype': apiResource.spatial_datatype || 'Undefined',
              'bcdata.gov.bc.ca/resource-state': apiResource.state,
              'bcdata.gov.bc.ca/resource-url': apiResource.url,
              'bcdata.gov.bc.ca/resource-url_type': apiResource.url_type || 'Undefined',
            }
          }
        };

        const apiId = this.getApiId(apiSafeName);

        // Check for duplicate API names
        if (allApis.has(apiId)) {
          const existingApi = allApis.get(apiId)!;
          this.logger.warn(
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
            `The new API will overwrite the existing one.`
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

    await this.connection.applyMutation({
      type: 'full',
      entities: allEntities.map(entity => ({
        entity,
        locationKey: `bc-data-catalogue-provider:${this.env}`,
      })),
    });

    this.logger.info('>run');
  }

  private getEmailHostname(email: string): string | undefined {
    const match = email.trim().toLowerCase().match(/@([\w.-]+)/);
    return match ? match[1] : undefined;
  }

  private getSystemId(name: string) {

    return `system:default/${this.toSafeName(name)}`;
  }

  private getGroupId(hostName: string) {

    return `group:default/${this.toSafeName(hostName)}`;
  }

  private getUserId(email: string) {

    return `user:default/${email.toLowerCase()}`;
  }

  private getComponentId(name: string) {

    return `component:default/${name.toLowerCase()}`;
  }

  private getApiId(name: string) {

    return `api:default/${name.toLowerCase()}`;
  }

  private createGroupEntity(hostName: string, displayName: string, parentGroup?: string): GroupEntity {

    const groupEntity: GroupEntity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: this.toSafeName(hostName),
        annotations: {
            'backstage.io/managed-by-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
            'backstage.io/managed-by-origin-location': 'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search',
        },
      },
      spec: {
        type: 'government',
        profile: {
          displayName: displayName
        },
        parent: parentGroup,
        children: [],
        members: []
      }
    };

    return groupEntity;
  }

  /**
   * Converts BC Data Catalogue (CKAN package_search) results into Backstage Entities
   */
  private getBcDataCataloguePackages(results: any): BcDataCataloguePackage[] {
    this.logger.info('<getBcDataCataloguePackages', {
      resultCount: Array.isArray(results) ? results.length : 'unknown',
    });

    const rawPackages = results as unknown[];
    this.logger.info(`rawPackageCount ${rawPackages.length}`);

    // Parse and validate each package with Zod
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
        this.logger.warn(JSON.stringify(item));
        this.logger.warn('Invalid package skipped', {
          error: parseResult.error.message,
        });
        
        throw new Error(
          `BC Data Catalogue package validation failed` +
          `See logs for details. First issue: ${parseResult.error.issues[0]?.message}`
        );
      }
    }

    this.logger.info(`>getBcDataCataloguePackages ${validPackages.length}`);
    return validPackages;
  }

  private toSafeName(name: string): string {
    return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')           // collapse any non-alnum to single '-'
            .replace(/(?:^[-_.]+|[-_.]+$)/g, '')   // trim leading/trailing -_. 
            .slice(0, 63)                          // max 63 chars
            .replace(/[-_.]+$/, '');                // ensure it doesn't end with -_. if truncated
  }

  /**
   * Extracts distinguishing information from a resource name to help make API names unique.
   * Tries to extract meaningful parts like years, version numbers, or other identifiers.
   */
  private extractDistinguishingSuffix(resourceName: string): string {
    const safeName = this.toSafeName(resourceName);
    
    // Try to extract year (4-digit number, likely 1900-2100)
    const yearMatch = resourceName.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return yearMatch[0];
    }
    
    // Try to extract version-like patterns (v1, v2, version-1, etc.)
    const versionMatch = resourceName.match(/\b(?:v|version)[\s_-]?(\d+)\b/i);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }
    
    // Try to extract any trailing numbers that might be identifiers
    const trailingNumberMatch = resourceName.match(/\b(\d{2,})\b/);
    if (trailingNumberMatch) {
      return trailingNumberMatch[0];
    }
    
    // If no clear distinguishing pattern, use a shortened version of the resource name
    // Take the last meaningful words (avoiding common suffixes like "service", "request", etc.)
    const words = safeName.split('-').filter(w => 
      w.length > 0 && 
      !['service', 'request', 'getcapabilities', 'wms', 'kml', 'arcgis', 'rest', 'online'].includes(w)
    );
    
    // Use last 2-3 meaningful words if available, otherwise last 5 chars
    if (words.length >= 2) {
      return words.slice(-2).join('-');
    } else if (words.length === 1) {
      return words[0];
    } else {
      // Fallback: use last part of safe name (up to 10 chars)
      return safeName.split('-').slice(-1)[0].slice(0, 10);
    }
  }

}