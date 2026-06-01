import { LoggerService } from '@backstage/backend-plugin-api';
import {
  BcDataCatalogueSchemaUtils,
  type DatasetAccessMethod,
  type DatasetSchema,
  parseOpenApiDocument,
  type OpenApiEntity,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import type {
  BcDataCataloguePackage,
  BcResource,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from './BcDataCatalogueNaming';
import { UrlReaderService } from './BcDataCatalogueUrlReader';
import { ApiEntityBuilder } from './builders/ApiEntityBuilder';
import { OpenApiEntityBuilder } from './builders/OpenApiEntityBuilder';
import { ResourceEntityBuilder } from './builders/ResourceEntityBuilder';

type ApiEntity = Awaited<ReturnType<ApiEntityBuilder['build']>>;
type ResourceEntity = ReturnType<ResourceEntityBuilder['build']>;
type BcDataCatalogueResourceEntity = ApiEntity | OpenApiEntity | ResourceEntity;

type BcDataCatalogueResourceFactoryOptions = {
  reader: UrlReaderService;
  logger: LoggerService;
  naming: BcDataCatalogueNaming;
  schemaUtils: BcDataCatalogueSchemaUtils;
};

type ProcessPackageResourcesOptions = {
  pkg: BcDataCataloguePackage;
  datasetEntityRef: string;
  ownerGroupId: string;
  systemId: string;
  bcdcDatasetUrl: string;
};

export type ProcessedBcDataCatalogueResources = {
  entities: BcDataCatalogueResourceEntity[];
  providesApis: string[];
  datasetTags: string[];
  accessMethods: DatasetAccessMethod[];
  relatedResources: Array<{ url: string; title?: string }>;
  schema?: DatasetSchema;
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

export class BcDataCatalogueResourceFactory {
  private readonly reader: UrlReaderService;
  private readonly logger: LoggerService;
  private readonly naming: BcDataCatalogueNaming;
  private readonly schemaUtils: BcDataCatalogueSchemaUtils;
  private readonly apiEntityBuilder: ApiEntityBuilder;
  private readonly openApiEntityBuilder: OpenApiEntityBuilder;
  private readonly resourceEntityBuilder: ResourceEntityBuilder;
  private readonly allApis = new Map<string, ApiEntity>();
  private readonly allOpenApis = new Map<string, OpenApiEntity>();
  private readonly allApiIds = new Set<string>();
  private readonly allResourceIds = new Set<string>();
  private readonly openApiDefinitionToId = new Map<string, string>();

  constructor(options: BcDataCatalogueResourceFactoryOptions) {
    this.reader = options.reader;
    this.logger = options.logger;
    this.naming = options.naming;
    this.schemaUtils = options.schemaUtils;
    this.apiEntityBuilder = new ApiEntityBuilder({
      naming: this.naming,
      reader: this.reader,
    });
    this.openApiEntityBuilder = new OpenApiEntityBuilder({
      naming: this.naming,
    });
    this.resourceEntityBuilder = new ResourceEntityBuilder({
      naming: this.naming,
    });
  }

  async processPackageResources(
    options: ProcessPackageResourcesOptions,
  ): Promise<ProcessedBcDataCatalogueResources> {
    const { pkg, datasetEntityRef, ownerGroupId, systemId, bcdcDatasetUrl } =
      options;

    const apiResources: ApiResourceCandidate[] = [];
    const genericWebserviceResources: GenericWebserviceResource[] = [];
    const entities: BcDataCatalogueResourceEntity[] = [];
    const providesApis: string[] = [];
    const excludedDatasetResourceIds = new Set<string>();
    const accessMethodEntityRefs = new Map<string, string>();
    const datasetTags = new Set<string>();

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
          datasetTitle: pkg.title || pkg.name,
          bcdcDatasetResourceUrl,
        });

        entities.push(resourceEntity);
        accessMethodEntityRefs.set(resource.id, resourceId);
        datasetTags.add('has-spatial-resource');
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
      const { apiResource, definitionUrl, definitionHost, isGraphQlCandidate } =
        candidate;

      let definitionContent = definitionUrl;
      let openApiDefinition: string | undefined;

      if (!isGraphQlCandidate) {
        const fetchedDefinition = await this.tryReadDefinition(definitionUrl);

        if (fetchedDefinition !== undefined) {
          openApiDefinition = await this.tryNormalizeOpenApiDefinition(
            fetchedDefinition,
          );
        }
      }

      const bcdcDatasetResourceUrl = `${bcdcDatasetUrl}/resource/${apiResource.id}`;

      if (openApiDefinition !== undefined) {
        datasetTags.add('has-openapi');
        definitionContent = openApiDefinition;

        const normalizedDefinitionUrl =
          this.normalizeOpenApiDefinitionUrl(definitionUrl);
        const existingOpenApiId = this.openApiDefinitionToId.get(
          normalizedDefinitionUrl,
        );

        if (existingOpenApiId) {
          const existingOpenApi = this.allOpenApis.get(existingOpenApiId)!;

          this.logger.warn(
            '[BCDC Resource Factory] ' +
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

          excludedDatasetResourceIds.add(apiResource.id);
          continue;
        }

        const openApiSafeName = this.buildApiSafeName(
          apiResource.name,
          definitionHost,
          apiResource.id,
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

        this.allOpenApis.set(openApiId, openApiEntity);
        this.openApiDefinitionToId.set(normalizedDefinitionUrl, openApiId);
        entities.push(openApiEntity);
        providesApis.push(openApiId);
        excludedDatasetResourceIds.add(apiResource.id);
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
        entities,
        bcdcDatasetResourceUrl,
      });

      providesApis.push(apiId);
      excludedDatasetResourceIds.add(apiResource.id);
      datasetTags.add('has-graphql-api');
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
        entities,
        bcdcDatasetResourceUrl,
      });

      providesApis.push(apiId);
      excludedDatasetResourceIds.add(generic.resource.id);
      datasetTags.add('has-generic-api');
    }

    const accessMethods = this.buildAccessMethods(
      pkg,
      excludedDatasetResourceIds,
      accessMethodEntityRefs,
    );
    const relatedResources = this.buildRelatedResources(
      pkg,
      excludedDatasetResourceIds,
    );
    const schema = this.schemaUtils.buildDatasetSchema(pkg.resources);

    return {
      entities,
      providesApis,
      datasetTags: Array.from(datasetTags),
      accessMethods,
      relatedResources,
      schema,
    };
  }

  private buildRelatedResources(
    pkg: BcDataCataloguePackage,
    excludedDatasetResourceIds: Set<string>,
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
      if (excludedDatasetResourceIds.has(resource.id)) {
        return;
      }

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
    excludedDatasetResourceIds: Set<string>,
    accessMethodEntityRefs: Map<string, string>,
  ): DatasetAccessMethod[] {
    const accessMethods: DatasetAccessMethod[] = [];

    pkg.resources?.forEach(resource => {
      if (excludedDatasetResourceIds.has(resource.id)) {
        return;
      }

      const entityRef = accessMethodEntityRefs.get(resource.id);

      if (resource.bcdc_type === 'geographic' && !entityRef) {
        return;
      }

      if (resource.url.length > 0) {
        accessMethods.push({
          id: resource.id,
          title: resource.name,
          description: resource.description,
          url: resource.url,
          type: entityRef
            ? this.getEntityBackedAccessMethodType(entityRef)
            : resource.bcdc_type,
          format: resource.format,
          updateFrequency: resource.resource_update_cycle,
          ...(entityRef ? { entityRef } : {}),
        });
      }
    });

    return accessMethods;
  }

  private getEntityBackedAccessMethodType(entityRef: string): string {
    return entityRef.startsWith('resource:')
      ? 'spatial-resource'
      : 'catalog-resource';
  }

  private async createGenericApiEntity(options: {
    apiResource: BcResource;
    definitionUrl: string;
    definitionHost?: string;
    apiType: string;
    ownerGroupId: string;
    systemId: string;
    entities: BcDataCatalogueResourceEntity[];
    bcdcDatasetResourceUrl: string;
  }): Promise<string> {
    const {
      apiResource,
      definitionUrl,
      definitionHost,
      apiType,
      ownerGroupId,
      systemId,
      entities,
      bcdcDatasetResourceUrl,
    } = options;

    const apiSafeName = this.buildApiSafeName(
      apiResource.name,
      definitionHost,
      apiResource.id,
    );
    const apiId = this.naming.getApiId(apiSafeName);

    if (this.allApis.has(apiId)) {
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

    this.allApis.set(apiId, apiEntity);
    entities.push(apiEntity);

    return apiId;
  }

  private buildApiSafeName(
    resourceName: string,
    host: string | undefined,
    resourceId: string,
  ): string {
    const baseName = host
      ? this.naming.toSafeName(`${resourceName}-${host}`)
      : this.naming.toSafeName(resourceName);

    const baseApiId = this.naming.getApiId(baseName);

    if (!this.allApiIds.has(baseApiId)) {
      this.allApiIds.add(baseApiId);
      return baseName;
    }

    const resourceIdSuffix = this.naming.toSafeName(resourceId);
    let candidateName = this.appendSuffix(baseName, resourceIdSuffix);
    let candidateApiId = this.naming.getApiId(candidateName);

    let counter = 1;

    while (this.allApiIds.has(candidateApiId)) {
      candidateName = this.appendSuffix(
        baseName,
        `${resourceIdSuffix}-${counter}`,
      );
      candidateApiId = this.naming.getApiId(candidateName);
      counter++;
    }

    this.allApiIds.add(candidateApiId);
    return candidateName;
  }

  private buildResourceSafeName(
    datasetName: string,
    resourceName: string,
    resourceType: SpatialResourceType,
    resourceId: string,
  ): string {
    const baseName = this.naming.toSafeName(
      `${datasetName}-${resourceName}-${resourceType}`,
    );
    const baseResourceId = this.naming.getResourceId(baseName);

    if (!this.allResourceIds.has(baseResourceId)) {
      this.allResourceIds.add(baseResourceId);
      return baseName;
    }

    const resourceIdSuffix = this.naming.toSafeName(resourceId);
    let candidateName = this.appendSuffix(baseName, resourceIdSuffix);
    let candidateResourceId = this.naming.getResourceId(candidateName);

    let counter = 1;

    while (this.allResourceIds.has(candidateResourceId)) {
      candidateName = this.appendSuffix(
        baseName,
        `${resourceIdSuffix}-${counter}`,
      );
      candidateResourceId = this.naming.getResourceId(candidateName);
      counter++;
    }

    this.allResourceIds.add(candidateResourceId);
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
        `[BCDC Resource Factory] Failed to fetch API definition from ${url}: ${error}`,
      );

      return undefined;
    }
  }
}
