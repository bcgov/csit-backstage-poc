import {
  ApiEntity,
  Entity,
  GroupEntity,
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
  isOpenApiCandidate: boolean;
};

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
    this.systemEntityBuilder = new SystemEntityBuilder({
      naming: this.naming,
    });
    this.userEntityBuilder = new UserEntityBuilder({
      naming: this.naming,
    });
  }

  async createEntities(allPackages: BcDataCataloguePackage[]): Promise<Entity[]> {
    this.logger.info('[BCDC Entity Factory] <createEntities');

    const allEntities: Entity[] = [];

    const allGroups = new Map<string, GroupEntity>();
    const bcGovGroupId = this.naming.getGroupId('gov.bc.ca');

    allGroups.set(
      bcGovGroupId,
      this.groupEntityBuilder.build({
        hostName: 'gov.bc.ca',
        displayName: 'Governent of British Columbia',
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
    const openApiDefinitionToId = new Map<string, string>();

    for (const pkg of allPackages) {
      const safeName = this.naming.toSafeName(pkg.name);
      const systemId = this.naming.getSystemId(pkg.organization.name);
      const ownerGroupId = this.naming.getGroupId(pkg.organization.name);

      const apiResources: ApiResourceCandidate[] = [];
      const providesApis: string[] = [];

      pkg.resources?.forEach(resource => {
        const apiResourceCandidate = this.getApiResourceCandidate(resource);

        if (apiResourceCandidate) {
          apiResources.push(apiResourceCandidate);
          return;
        }
      });

      const bcdcDatasetUrl =`https://catalogue.data.gov.bc.ca/dataset/${pkg.name}`;

      const datasetEntity = this.datasetEntityBuilder.build({
        pkg,
        safeName,
        ownerGroupId,
        systemId,
        providesApis,
        bcdcDatasetUrl,
      });

      allDatasets.set(this.naming.getComponentId(safeName), datasetEntity);

      let hasOpenApi = false;

      for (const candidate of apiResources) {
        
        const { apiResource, definitionUrl, definitionHost, isOpenApiCandidate } =
          candidate;
        const name = apiResource.name;

        if (definitionHost && !this.allowedHosts.includes(definitionHost)) {
          this.logger.warn(
            `[BCDC Entity Factory] API definition host is NOT allowed: "${definitionHost}"`,
          );
        }

        let definitionContent = definitionUrl;
        let isOpenApiResource = false;

        if (isOpenApiCandidate) {
          const fetchedDefinition = await this.tryReadDefinition(definitionUrl);

          if (fetchedDefinition !== undefined) {
            definitionContent = fetchedDefinition;
            isOpenApiResource =
              (await parseOpenApiDocument(fetchedDefinition)) !== undefined;
          }

          if (isOpenApiResource) {
            hasOpenApi = true;
          }
        }

        const bcdcDatasetResourceUrl =`${bcdcDatasetUrl}/resource/${apiResource.id}`;

        if (isOpenApiResource) {
          const normalizedDefinitionUrl =
            this.normalizeOpenApiDefinitionUrl(definitionUrl);
          const existingOpenApiId =
            openApiDefinitionToId.get(normalizedDefinitionUrl);

          if (existingOpenApiId) {
            const existingOpenApi = allOpenApis.get(existingOpenApiId)!;

            this.logger.warn(
              '[BCDC Entity Factory] ' +
                `Duplicate OpenApi definition detected for "${normalizedDefinitionUrl}". ` +
                `Existing OpenApi: name="${existingOpenApi.metadata.name}", ` +
                `owner="${existingOpenApi.spec.owner}", ` +
                `system="${existingOpenApi.spec.system ?? ''}", ` +
                `bcdc_type="${existingOpenApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-bcdc_type']}", ` +
                `format="${existingOpenApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-format']}", ` +
                `resource-url="${existingOpenApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-url']}", ` +
                `openapi-url="${normalizedDefinitionUrl}". ` +
                `New OpenApi resource: name="${apiResource.name}", ` +
                `owner="${ownerGroupId}", ` +
                `system="${systemId}", ` +
                `bcdc_type="${apiResource.bcdc_type}", ` +
                `format="${apiResource.format}", ` +
                `resource-url="${apiResource.url}", ` +
                `openapi-url="${normalizedDefinitionUrl}". ` +
                `Reusing existing OpenApi entity.`,
            );

            if (!datasetEntity.spec.providesApis?.includes(existingOpenApiId)) {
              datasetEntity.spec.providesApis?.push(existingOpenApiId);
            }

            continue;
          }

          const openApiSafeName = this.buildOpenApiSafeName(
            name,
            definitionHost,
            allOpenApis,
          );
          const openApiId = this.naming.getOpenApiId(openApiSafeName);

          const openApiEntity = await this.openApiEntityBuilder.build({
            pkg,
            apiResource,
            ownerGroupId,
            systemId,
            openApiSafeName,
            datasetEntityRef: this.naming.getDatasetId(safeName),
            definitionUrl,
            definition: definitionContent,
            bcdcDatasetResourceUrl,
          });

          allOpenApis.set(openApiId, openApiEntity);
          openApiDefinitionToId.set(normalizedDefinitionUrl, openApiId);
          datasetEntity.spec.providesApis?.push(openApiId);
          continue;
        }

        const apiSafeName = this.buildApiSafeName(name, definitionHost);
        const apiId = this.naming.getApiId(apiSafeName);
        const existingApi = allApis.get(apiId);
        const expectedApiType = apiResource.bcdc_type;

        if (existingApi) {
          if (
            existingApi.spec.type !== expectedApiType ||
            existingApi.spec.owner !== ownerGroupId ||
            existingApi.spec.system !== systemId
          ) {
            this.logger.warn(
              '[BCDC Entity Factory] ' +
                `Duplicate API identity detected for "${apiSafeName}" (ID: ${apiId}). ` +
                `Existing API: type="${existingApi.spec.type}", owner="${existingApi.spec.owner}", system="${existingApi.spec.system ?? ''}", ` +
                `bcdc_type="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-bcdc_type']}", ` +
                `format="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-format']}", ` +
                `resource-id="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-id']}", ` +
                `package-id="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-package_id']}", ` +
                `url="${existingApi.metadata.annotations?.['bcdata.gov.bc.ca/resource-url']}". ` +
                `New API: type="${expectedApiType}", owner="${ownerGroupId}", system="${systemId}", ` +
                `bcdc_type="${apiResource.bcdc_type}", ` +
                `format="${apiResource.format}", ` +
                `resource-id="${apiResource.id}", ` +
                `package-id="${apiResource.package_id}", ` +
                `url="${apiResource.url}". ` +
                `Reusing existing API entity.`,
            );
          }

          if (!datasetEntity.spec.providesApis?.includes(apiId)) {
            datasetEntity.spec.providesApis?.push(apiId);
          }

          continue;
        }

        const apiEntity = this.apiEntityBuilder.build({
          apiResource,
          ownerGroupId,
          systemId,
          apiSafeName,
          definition: definitionContent,
          apiType: expectedApiType,
          bcdcDatasetResourceUrl,
        });

        allApis.set(apiId, apiEntity);
        datasetEntity.spec.providesApis?.push(apiId);
      }

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
      }
    }

    const userEntities: UserEntity[] = Array.from(allUsers.values());
    const groupEntities: GroupEntity[] = Array.from(allGroups.values());
    const systemEntities: SystemEntity[] = Array.from(allSystems.values());
    const datasetEntities: DatasetEntity[] = Array.from(allDatasets.values());
    const apiEntities: ApiEntity[] = Array.from(allApis.values());
    const openApiEntities: OpenApiEntity[] = Array.from(allOpenApis.values());

    allEntities.push(...userEntities);
    allEntities.push(...groupEntities);
    allEntities.push(...systemEntities);
    allEntities.push(...datasetEntities);
    allEntities.push(...apiEntities);
    allEntities.push(...openApiEntities);

    this.logger.info(
      `[BCDC Entity Factory] >createEntities ${allEntities.length}`,
    );
    return allEntities;
  }

  private buildOpenApiSafeName(
    resourceName: string,
    host: string | undefined,
    allOpenApis: Map<string, OpenApiEntity>,
  ): string {
    const baseName = host
      ? this.naming.toSafeName(`${resourceName}-${host}`)
      : this.naming.toSafeName(resourceName);

    let candidateName = baseName;
    let candidateOpenApiId = this.naming.getOpenApiId(candidateName);

    if (!allOpenApis.has(candidateOpenApiId)) {
      return candidateName;
    }

    const distinguishingSuffix =
      host && host.length > 0
        ? this.naming.toSafeName(host)
        : this.naming.extractDistinguishingSuffix(resourceName);

    const suffixWithSeparator = `-${distinguishingSuffix}`;
    const maxBaseLength = 63 - suffixWithSeparator.length;

    let truncatedBase = baseName;
    if (baseName.length > maxBaseLength) {
      truncatedBase = baseName.slice(0, maxBaseLength).replace(/[-_.]+$/, '');
    }

    candidateName = this.naming.toSafeName(
      `${truncatedBase}${suffixWithSeparator}`,
    );
    candidateOpenApiId = this.naming.getOpenApiId(candidateName);

    let counter = 1;
    while (allOpenApis.has(candidateOpenApiId)) {
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
      candidateOpenApiId = this.naming.getOpenApiId(candidateName);
      counter++;
    }

    return candidateName;
  }

  private buildApiSafeName(resourceName: string, host?: string): string {
    return host
      ? this.naming.toSafeName(`${resourceName}-${host}`)
      : this.naming.toSafeName(resourceName);
  }

  private getApiResourceCandidate(
    resource: BcResource,
  ): ApiResourceCandidate | undefined {
    const definitionUrl = this.getDefinitionUrl(resource.url);
    if (!definitionUrl) {
      return undefined;
    }

    const definitionHost = this.getUrlHost(definitionUrl);

    const isOpenApiCandidate =
      resource.format === 'openapi-json' ||
      (resource.bcdc_type === 'webservice' &&
        ['json', 'xml', 'html'].includes(resource.format) &&
        this.looksLikeOpenApiUrl(resource.url, definitionUrl));

    if (isOpenApiCandidate) {
      return {
        apiResource: resource,
        definitionUrl,
        definitionHost,
        isOpenApiCandidate: true,
      };
    }

    if (resource.bcdc_type !== 'webservice') {
      return undefined;
    }

    if (['kml', 'wms', 'arcgis_rest', 'xml'].includes(resource.format)) {
      return undefined;
    }

    return {
      apiResource: resource,
      definitionUrl,
      definitionHost,
      isOpenApiCandidate: false,
    };
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

  private looksLikeOpenApiUrl(
    resourceUrl: string,
    definitionUrl: string,
  ): boolean {
    const raw = resourceUrl.toLowerCase();
    const normalized = definitionUrl.toLowerCase();

    if (raw.includes('oas-editor.apps.gov.bc.ca/?url=')) {
      return true;
    }

    return (
      normalized.includes('openapi') ||
      normalized.includes('swagger') ||
      normalized.includes('/api-specs/')
    );
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