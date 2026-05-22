import {
  ApiEntity,
  Entity,
  GroupEntity,
  ResourceEntity,
  SystemEntity,
  UserEntity,
} from '@backstage/catalog-model';
import {
  LoggerService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import {
  parseOpenApiDocument,
  type DatasetEntity,
  type OpenApiEntity,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import type {
  BcDataCataloguePackage,
  BcOrganization,
  BcResource,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from './BcDataCatalogueNaming';
import { BcDataCatalogueSchemaUtils } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { ApiEntityBuilder } from './builders/ApiEntityBuilder';
import { DatasetEntityBuilder } from './builders/DatasetEntityBuilder';
import { GroupEntityBuilder } from './builders/GroupEntityBuilder';
import { OpenApiEntityBuilder } from './builders/OpenApiEntityBuilder';
import { ResourceEntityBuilder } from './builders/ResourceEntityBuilder';
import { SystemEntityBuilder } from './builders/SystemEntityBuilder';
import { UserEntityBuilder } from './builders/UserEntityBuilder';

type BcDataCatalogueEntityFactoryOptions = {
  reader: UrlReaderService;
  logger: LoggerService;
  allowedHosts: string[];
};

type ApiResourceCandidate = {
  apiResource: BcResource;
  definitionUrl: string;
  definitionHost?: string;
  isGraphQlCandidate: boolean;
};

type GenericWebserviceResource = {
  resource: BcResource;
  definitionUrl: string;
  definitionHost?: string;
};

type SpatialResourceType =
  | 'ogc-wms'
  | 'kml-ground-overlay'
  | 'arcgis-online-item'
  | 'arcgis-mapserver'
  | 'arcgis-featureserver';

export class BcDataCatalogueEntityFactory {
  private readonly reader: UrlReaderService;
  private readonly logger: LoggerService;
  private readonly allowedHosts: string[];
  private readonly naming: BcDataCatalogueNaming;
  private readonly schemaUtils: BcDataCatalogueSchemaUtils;
  private readonly apiEntityBuilder: ApiEntityBuilder;
  private readonly datasetEntityBuilder: DatasetEntityBuilder;
  private readonly groupEntityBuilder: GroupEntityBuilder;
  private readonly openApiEntityBuilder: OpenApiEntityBuilder;
  private readonly resourceEntityBuilder: ResourceEntityBuilder;
  private readonly systemEntityBuilder: SystemEntityBuilder;
  private readonly userEntityBuilder: UserEntityBuilder;

  constructor(options: BcDataCatalogueEntityFactoryOptions) {
    this.reader = options.reader;
    this.logger = options.logger;
    this.allowedHosts = options.allowedHosts;
    this.naming = new BcDataCatalogueNaming();
    this.schemaUtils = new BcDataCatalogueSchemaUtils();
    this.apiEntityBuilder = new ApiEntityBuilder({
      naming: this.naming,
    });
    this.datasetEntityBuilder = new DatasetEntityBuilder({
      naming: this.naming,
      schemaUtils: this.schemaUtils,
    });
    this.groupEntityBuilder = new GroupEntityBuilder({
      naming: this.naming,
    });
    this.openApiEntityBuilder = new OpenApiEntityBuilder({
      naming: this.naming,
    });
    this.resourceEntityBuilder = new ResourceEntityBuilder({
      naming: this.naming,
    });
    this.systemEntityBuilder = new SystemEntityBuilder({
      naming: this.naming,
    });
    this.userEntityBuilder = new UserEntityBuilder({
      naming: this.naming,
    });
  }

  async createEntities(
    allPackages: BcDataCataloguePackage[],
  ): Promise<Entity[]> {
    this.logger.info('[BCDC Entity Factory] <createEntities');

    const allEntities: Entity[] = [];
    const allGroups = new Map<string, GroupEntity>();

    const bcGovGroupId = this.naming.getGroupId('gov.bc.ca');
    allGroups.set(
      bcGovGroupId,
      this.groupEntityBuilder.build({
        hostName: 'gov.bc.ca',
        displayName: 'Government of British Columbia',
      }),
    );

    const allOrganizations = new Map<string, BcOrganization>();
    allPackages.forEach(pkg => {
      allOrganizations.set(pkg.organization.id, pkg.organization);
    });

    const allSystems = new Map<string, SystemEntity>();
    this.logger.info(
      `[BCDC Entity Factory] Organizations ${allOrganizations.size}`,
    );

    allOrganizations.forEach(organization => {
      const organizationGroupId = this.naming.getGroupId(organization.name);

      if (!allGroups.has(organizationGroupId)) {
        allGroups.set(
          organizationGroupId,
          this.groupEntityBuilder.build({
            hostName: organization.name,
            displayName: organization.title,
            parentGroup: bcGovGroupId,
          }),
        );
      }

      const systemEntity = this.systemEntityBuilder.build({
        organization,
        ownerGroupId: organizationGroupId,
      });

      allSystems.set(this.naming.getSystemId(organization.name), systemEntity);
    });

    const allUsers = new Map<string, UserEntity>();

    allPackages.forEach(pkg => {
      pkg.contacts?.forEach(contact => {
        const email = contact.email.toLowerCase();

        let user: UserEntity | undefined = allUsers.get(email);

        if (user === undefined) {
          user = this.userEntityBuilder.build({ email });
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
            group = this.groupEntityBuilder.build({
              hostName,
              displayName: hostName,
              parentGroup: bcGovGroupId,
            });
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
    const allOpenApis = new Map<string, OpenApiEntity>();
    const allResources = new Map<string, ResourceEntity>();
    const allApiIds = new Set<string>();
    const allResourceIds = new Set<string>();
    const openApiDefinitionToId = new Map<string, string>();

    for (const pkg of allPackages) {
      const safeName = this.naming.toSafeName(pkg.name);
      const datasetEntityRef = this.naming.getDatasetId(safeName);
      const systemId = this.naming.getSystemId(pkg.organization.name);
      const ownerGroupId = this.naming.getGroupId(pkg.organization.name);
      const apiResources: ApiResourceCandidate[] = [];
      const genericWebserviceResources: GenericWebserviceResource[] = [];
      const providesApis: string[] = [];
      const promotedApiResourceIds = new Set<string>();
      const accessMethodEntityRefs = new Map<string, string>();
      const bcdcDatasetUrl = `https://catalogue.data.gov.bc.ca/dataset/${pkg.name}`;
      let hasOpenApi = false;
      let hasSpatialResources = false;
      let hasGenericWebserviceApis = false;

      pkg.resources?.forEach(resource => {
        const definitionUrl = this.getDefinitionUrl(resource.url);
        const definitionHost = definitionUrl
          ? this.getUrlHost(definitionUrl)
          : undefined;
        const spatialResourceType = this.getSpatialResourceType(
          resource,
          definitionUrl,
        );

        if (spatialResourceType) {
          const resourceSafeName = this.buildResourceSafeName(
            pkg.name,
            resource.name,
            spatialResourceType,
            resource.id,
            allResourceIds,
          );
          const resourceId = this.naming.getResourceId(resourceSafeName);
          const bcdcDatasetResourceUrl = `${bcdcDatasetUrl}/resource/${resource.id}`;

          const resourceEntity = this.resourceEntityBuilder.build({
            resource,
            ownerGroupId,
            systemId,
            resourceSafeName,
            resourceType: spatialResourceType,
            datasetEntityRef,
            bcdcDatasetResourceUrl,
          });

          allResources.set(resourceId, resourceEntity);
          accessMethodEntityRefs.set(resource.id, resourceId);
          hasSpatialResources = true;
          return;
        }

        const apiResourceCandidate = this.getApiResourceCandidate(resource);

        if (apiResourceCandidate) {
          apiResources.push(apiResourceCandidate);
          return;
        }

        if (resource.bcdc_type === 'webservice' && definitionUrl) {
          genericWebserviceResources.push({
            resource,
            definitionUrl,
            definitionHost,
          });
        }
      });

      for (const candidate of apiResources) {
        const {
          apiResource,
          definitionUrl,
          definitionHost,
          isGraphQlCandidate,
        } = candidate;

        if (definitionHost && !this.allowedHosts.includes(definitionHost)) {
          this.logger.warn(
            `[BCDC Entity Factory] API definition host is NOT allowed: "${definitionHost}"`,
          );
        }

        let definitionContent = definitionUrl;
        let openApiDefinition: string | undefined;

        if (!isGraphQlCandidate) {
          const fetchedDefinition = await this.tryReadDefinition(definitionUrl);

          if (fetchedDefinition !== undefined) {
            openApiDefinition =
              await this.tryNormalizeOpenApiDefinition(fetchedDefinition);
          }
        }

        const bcdcDatasetResourceUrl = `${bcdcDatasetUrl}/resource/${apiResource.id}`;

        if (openApiDefinition !== undefined) {
          hasOpenApi = true;
          definitionContent = openApiDefinition;

          const normalizedDefinitionUrl =
            this.normalizeOpenApiDefinitionUrl(definitionUrl);
          const existingOpenApiId = openApiDefinitionToId.get(
            normalizedDefinitionUrl,
          );

          if (existingOpenApiId) {
            const existingOpenApi = allOpenApis.get(existingOpenApiId)!;

            this.logger.warn(
              '[BCDC Entity Factory] ' +
                `Duplicate OpenApi definition detected for "${normalizedDefinitionUrl}".\n` +
                `Existing OpenApi: name="${existingOpenApi.metadata.name}", ` +
                `owner="${existingOpenApi.spec.owner}", ` +
                `system="${existingOpenApi.spec.system ?? ''}", ` +
                `bcdc_type="${existingOpenApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-bcdc_type']}", ` +
                `format="${existingOpenApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-format']}", ` +
                `resource-url="${existingOpenApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-url']}", ` +
                `openapi-url="${normalizedDefinitionUrl}".\n` +
                `New OpenApi resource: name="${apiResource.name}", ` +
                `owner="${ownerGroupId}", ` +
                `system="${systemId}", ` +
                `bcdc_type="${apiResource.bcdc_type}", ` +
                `format="${apiResource.format}", ` +
                `resource-url="${apiResource.url}", ` +
                `openapi-url="${normalizedDefinitionUrl}".\n` +
                `Reusing existing OpenApi entity.`,
            );

            if (!providesApis.includes(existingOpenApiId)) {
              providesApis.push(existingOpenApiId);
            }

            promotedApiResourceIds.add(apiResource.id);
            continue;
          }

          const openApiSafeName = this.buildApiSafeName(
            apiResource.name,
            definitionHost,
            apiResource.id,
            allApiIds,
          );
          const openApiId = this.naming.getApiId(openApiSafeName);

          const openApiEntity = await this.openApiEntityBuilder.build({
            pkg,
            apiResource,
            ownerGroupId,
            systemId,
            openApiSafeName,
            datasetEntityRef,
            definitionUrl,
            definition: definitionContent,
            bcdcDatasetResourceUrl,
          });

          allOpenApis.set(openApiId, openApiEntity);
          openApiDefinitionToId.set(normalizedDefinitionUrl, openApiId);
          providesApis.push(openApiId);
          promotedApiResourceIds.add(apiResource.id);
          continue;
        }

        if (!isGraphQlCandidate) {
          genericWebserviceResources.push({
            resource: apiResource,
            definitionUrl,
            definitionHost,
          });
          continue;
        }

        const apiId = await this.createGenericApiEntity({
          apiResource,
          definitionUrl,
          definitionHost,
          apiType: 'graphql',
          ownerGroupId,
          systemId,
          allApiIds,
          allApis,
          bcdcDatasetResourceUrl,
        });

        providesApis.push(apiId);
        promotedApiResourceIds.add(apiResource.id);
      }

      for (const generic of genericWebserviceResources) {
        const bcdcDatasetResourceUrl = `${bcdcDatasetUrl}/resource/${generic.resource.id}`;
        const apiId = await this.createGenericApiEntity({
          apiResource: generic.resource,
          definitionUrl: generic.definitionUrl,
          definitionHost: generic.definitionHost,
          apiType: generic.resource.bcdc_type,
          ownerGroupId,
          systemId,
          allApiIds,
          allApis,
          bcdcDatasetResourceUrl,
        });

        providesApis.push(apiId);
        promotedApiResourceIds.add(generic.resource.id);
        hasGenericWebserviceApis = true;
      }

      const datasetEntity = this.datasetEntityBuilder.build({
        pkg,
        safeName,
        ownerGroupId,
        systemId,
        providesApis,
        promotedApiResourceIds,
        accessMethodEntityRefs,
        bcdcDatasetUrl,
      });

      if (datasetEntity.spec.providesApis?.length) {
        if (!datasetEntity.metadata.tags?.includes('has-api')) {
          datasetEntity.metadata.tags = [
            ...(datasetEntity.metadata.tags ?? []),
            'has-api',
          ];
        }

        if (hasOpenApi && !datasetEntity.metadata.tags?.includes('has-openapi')) {
          datasetEntity.metadata.tags = [
            ...(datasetEntity.metadata.tags ?? []),
            'has-openapi',
          ];
        }

        if (
          hasGenericWebserviceApis &&
          !datasetEntity.metadata.tags?.includes('has-generic-webservice-apis')
        ) {
          datasetEntity.metadata.tags = [
            ...(datasetEntity.metadata.tags ?? []),
            'has-generic-webservice-apis',
          ];
        }
      }

      if (
        hasSpatialResources &&
        !datasetEntity.metadata.tags?.includes('has-spatial-resources')
      ) {
        datasetEntity.metadata.tags = [
          ...(datasetEntity.metadata.tags ?? []),
          'has-spatial-resources',
        ];
      }

      allDatasets.set(this.naming.getComponentId(safeName), datasetEntity);
    }

    const userEntities: UserEntity[] = Array.from(allUsers.values());
    const groupEntities: GroupEntity[] = Array.from(allGroups.values());
    const systemEntities: SystemEntity[] = Array.from(allSystems.values());
    const datasetEntities: DatasetEntity[] = Array.from(allDatasets.values());
    const apiEntities: ApiEntity[] = Array.from(allApis.values());
    const openApiEntities: OpenApiEntity[] = Array.from(allOpenApis.values());
    const resourceEntities: ResourceEntity[] = Array.from(allResources.values());

    allEntities.push(...userEntities);
    allEntities.push(...groupEntities);
    allEntities.push(...systemEntities);
    allEntities.push(...datasetEntities);
    allEntities.push(...apiEntities);
    allEntities.push(...openApiEntities);
    allEntities.push(...resourceEntities);

    this.logger.info(
      `[BCDC Entity Factory] >createEntities ${allEntities.length}`,
    );

    return allEntities;
  }

  private async createGenericApiEntity(options: {
    apiResource: BcResource;
    definitionUrl: string;
    definitionHost?: string;
    apiType: string;
    ownerGroupId: string;
    systemId: string;
    allApiIds: Set<string>;
    allApis: Map<string, ApiEntity>;
    bcdcDatasetResourceUrl: string;
  }): Promise<string> {
    const {
      apiResource,
      definitionUrl,
      definitionHost,
      apiType,
      ownerGroupId,
      systemId,
      allApiIds,
      allApis,
      bcdcDatasetResourceUrl,
    } = options;

    const apiSafeName = this.buildApiSafeName(
      apiResource.name,
      definitionHost,
      apiResource.id,
      allApiIds,
    );
    const apiId = this.naming.getApiId(apiSafeName);

    if (allApis.has(apiId)) {
      return apiId;
    }

    const apiEntity = await this.apiEntityBuilder.build({
      apiResource,
      ownerGroupId,
      systemId,
      apiSafeName,
      definitionUrl,
      apiType,
      bcdcDatasetResourceUrl,
    });

    allApis.set(apiId, apiEntity);

    return apiId;
  }

  private buildApiSafeName(
    resourceName: string,
    host: string | undefined,
    resourceId: string,
    usedApiIds: Set<string>,
  ): string {
    const baseName = host
      ? this.naming.toSafeName(`${resourceName}-${host}`)
      : this.naming.toSafeName(resourceName);

    const baseApiId = this.naming.getApiId(baseName);

    if (!usedApiIds.has(baseApiId)) {
      usedApiIds.add(baseApiId);
      return baseName;
    }

    const resourceIdSuffix = this.naming.toSafeName(resourceId);
    let candidateName = this.appendSuffix(baseName, resourceIdSuffix);
    let candidateApiId = this.naming.getApiId(candidateName);

    let counter = 1;

    while (usedApiIds.has(candidateApiId)) {
      candidateName = this.appendSuffix(
        baseName,
        `${resourceIdSuffix}-${counter}`,
      );
      candidateApiId = this.naming.getApiId(candidateName);
      counter++;
    }

    usedApiIds.add(candidateApiId);
    return candidateName;
  }

  private buildResourceSafeName(
    datasetName: string,
    resourceName: string,
    resourceType: SpatialResourceType,
    resourceId: string,
    usedResourceIds: Set<string>,
  ): string {
    const baseName = this.naming.toSafeName(
      `${datasetName}-${resourceName}-${resourceType}`,
    );
    const baseResourceId = this.naming.getResourceId(baseName);

    if (!usedResourceIds.has(baseResourceId)) {
      usedResourceIds.add(baseResourceId);
      return baseName;
    }

    const resourceIdSuffix = this.naming.toSafeName(resourceId);
    let candidateName = this.appendSuffix(baseName, resourceIdSuffix);
    let candidateResourceId = this.naming.getResourceId(candidateName);

    let counter = 1;

    while (usedResourceIds.has(candidateResourceId)) {
      candidateName = this.appendSuffix(
        baseName,
        `${resourceIdSuffix}-${counter}`,
      );
      candidateResourceId = this.naming.getResourceId(candidateName);
      counter++;
    }

    usedResourceIds.add(candidateResourceId);
    return candidateName;
  }

  private appendSuffix(baseName: string, suffix: string): string {
    const safeSuffix = this.naming.toSafeName(suffix || 'item');
    const suffixWithSeparator = `-${safeSuffix}`;
    const maxBaseLength = 63 - suffixWithSeparator.length;
    const truncatedBase = baseName
      .slice(0, Math.max(maxBaseLength, 0))
      .replace(/[-_.]+$/, '');

    return this.naming.toSafeName(`${truncatedBase}${suffixWithSeparator}`);
  }

  private getApiResourceCandidate(
    resource: BcResource,
  ): ApiResourceCandidate | undefined {
    const definitionUrl = this.getDefinitionUrl(resource.url);

    if (!definitionUrl) {
      return undefined;
    }

    const definitionHost = this.getUrlHost(definitionUrl);

    if (this.isGraphQlResource(resource, definitionUrl)) {
      return {
        apiResource: resource,
        definitionUrl,
        definitionHost,
        isGraphQlCandidate: true,
      };
    }

    if (!this.isPotentialOpenApiResource(resource, definitionUrl)) {
      return undefined;
    }

    return {
      apiResource: resource,
      definitionUrl,
      definitionHost,
      isGraphQlCandidate: false,
    };
  }

  private isPotentialOpenApiResource(
    resource: BcResource,
    definitionUrl: string,
  ): boolean {
    const format = resource.format.toLowerCase();
    const name = resource.name.toLowerCase();
    const description = resource.description?.toLowerCase() ?? '';
    const rawUrl = resource.url.toLowerCase();
    const normalizedUrl = definitionUrl.toLowerCase();

    if (format === 'openapi-json') {
      return true;
    }

    if (rawUrl.includes('oas-editor.apps.gov.bc.ca/?url=')) {
      return true;
    }

    return (
      resource.bcdc_type === 'webservice' &&
      ['json', 'yaml', 'yml', 'html'].includes(format) &&
      (name.includes('openapi') ||
        name.includes('swagger') ||
        name.includes('oas') ||
        description.includes('openapi') ||
        description.includes('swagger') ||
        description.includes('oas') ||
        normalizedUrl.includes('openapi') ||
        normalizedUrl.includes('swagger') ||
        normalizedUrl.includes('/api-specs/'))
    );
  }

  private isGraphQlResource(
    resource: BcResource,
    definitionUrl: string,
  ): boolean {
    const name = resource.name.toLowerCase();
    const description = resource.description?.toLowerCase() ?? '';
    const normalizedUrl = definitionUrl.toLowerCase();

    return (
      resource.bcdc_type === 'webservice' &&
      (name.includes('graphql') ||
        description.includes('graphql') ||
        normalizedUrl.includes('/graphql'))
    );
  }

  private getSpatialResourceType(
    resource: BcResource,
    definitionUrl: string | undefined,
  ): SpatialResourceType | undefined {
    const format = resource.format.toLowerCase();
    const name = resource.name.toLowerCase();
    const rawUrl = resource.url.toLowerCase();
    const normalizedUrl = definitionUrl?.toLowerCase() ?? rawUrl;

    if (normalizedUrl.includes('/featureserver')) {
      return 'arcgis-featureserver';
    }

    if (normalizedUrl.includes('/mapserver')) {
      return 'arcgis-mapserver';
    }

    if (
      normalizedUrl.includes('governmentofbc.maps.arcgis.com/home/item.html') ||
      name.includes('arcgis online') ||
      name.includes('ago feature service')
    ) {
      return 'arcgis-online-item';
    }

    if (
      format === 'wms' ||
      (normalizedUrl.includes('service=wms') &&
        normalizedUrl.includes('request=getcapabilities'))
    ) {
      return 'ogc-wms';
    }

    if (
      format === 'kml' ||
      normalizedUrl.endsWith('.kml') ||
      normalizedUrl.includes('/kml/geo/layers/')
    ) {
      return 'kml-ground-overlay';
    }

    return undefined;
  }

  private async tryNormalizeOpenApiDefinition(
    definition: string,
  ): Promise<string | undefined> {
    const parsed = await parseOpenApiDocument(definition);

    if (parsed === undefined) {
      return undefined;
    }

    return this.tryCompactJsonOpenApiDefinition(definition) ?? definition;
  }

  private tryCompactJsonOpenApiDefinition(
    definition: string,
  ): string | undefined {
    try {
      const parsed = JSON.parse(definition);

      if (!this.isOpenApiObject(parsed)) {
        return undefined;
      }

      return JSON.stringify(parsed);
    } catch {
      return undefined;
    }
  }

  private isOpenApiObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      ('openapi' in value || 'swagger' in value) &&
      'paths' in value
    );
  }

  private getDefinitionUrl(resourceUrl: string): string | undefined {
    const trimmedUrl = resourceUrl?.trim();

    if (!trimmedUrl) {
      return undefined;
    }

    try {
      const parsedUrl = new URL(trimmedUrl);
      const nestedUrl = parsedUrl.searchParams.get('url')?.trim();

      if (nestedUrl) {
        return nestedUrl;
      }

      return trimmedUrl;
    } catch {
      return undefined;
    }
  }

  private getUrlHost(url: string): string | undefined {
    try {
      return new URL(url).host.toLowerCase();
    } catch {
      return undefined;
    }
  }

  private normalizeOpenApiDefinitionUrl(url: string): string {
    return url.trim().toLowerCase();
  }

  private async tryReadDefinition(url: string): Promise<string | undefined> {
    try {
      const response = await this.reader.readUrl(url);

      return (await response.buffer()).toString();
    } catch (error) {
      this.logger.warn(
        `[BCDC Entity Factory] Failed to fetch API definition from ${url}: ${error}`,
      );

      return undefined;
    }
  }

  private getEmailHostname(email: string): string | undefined {
    const match = email.trim().toLowerCase().match(/@([\w.-]+)/);

    return match ? match[1] : undefined;
  }
}
