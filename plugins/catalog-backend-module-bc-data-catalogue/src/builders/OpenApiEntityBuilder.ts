import { EntityLink } from '@backstage/catalog-model';
import { JsonObject, JsonValue } from '@backstage/types';
import {
  getOpenApiSummary,
  OPENAPI_API_TYPE,
  type OpenApiEntity,
  type OpenApiCustomMetadata,
  type BcDataCataloguePackage,
  type BcResource,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

const GAP = 'GAP';

type OpenApiEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
};

type BuildOpenApiEntityOptions = {
  pkg: BcDataCataloguePackage;
  apiResource: BcResource;
  ownerGroupId: string;
  systemId: string;
  openApiSafeName: string;
  datasetEntityRef: string;
  definitionUrl: string;
  definition: string;
  packageEntityLinks?: EntityLink[];
  packageTags?: string[];
  bcdcDatasetResourceUrl: string;
};

export class OpenApiEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;

  constructor(options: OpenApiEntityBuilderOptions) {
    this.naming = options.naming;
  }

  async build(options: BuildOpenApiEntityOptions): Promise<OpenApiEntity> {
    const {
      pkg,
      apiResource,
      ownerGroupId,
      systemId,
      openApiSafeName,
      datasetEntityRef,
      definitionUrl,
      definition,
      bcdcDatasetResourceUrl,
    } = options;

    const openApiSummary = await getOpenApiSummary(definition);

    const metadataLinks = this.buildMetadataLinks(openApiSummary.links);

    const metadataTags = this.buildMetadataTags(openApiSummary.tags);

    const managedByLocation = `url:${bcdcDatasetResourceUrl}`;

    const description =
      openApiSummary.description ||
      apiResource.description ||
      'No description available';

    const environments =
      openApiSummary.environments.length > 0
        ? openApiSummary.environments.map(environment => ({
            name: environment.label,
            url: environment.url,
            description: environment.description,
          }))
        : undefined;

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      spec: {
        owner: ownerGroupId,
        system: systemId,
        type: OPENAPI_API_TYPE,
        lifecycle: 'production',
        definition,
      },
      metadata: {
        name: openApiSafeName,
        title: this.buildMetadataTitle(
          openApiSummary.title || apiResource.name,
          openApiSummary.version,
          openApiSummary.specificationVersion,
        ),
        description,
        links: metadataLinks,
        tags: metadataTags,
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
        customMetadata: this.removeUndefined({
          description,
          status: GAP + '<status>',
          securityClassification: this.normalizeSecurityClassification(
            pkg.security_class,
          ),

          connectedServicesDescription:
            GAP + '<connectedServicesDescription>',

          providerMinistry: GAP + '<providerMinistry>',
          application: GAP + '<application>',
          sdxRequired: this.hasSdxTag(openApiSummary.tags) ? 'Yes' : 'No',
          environments,
          accessModel: GAP + '<accessModel>',

          urls: {
            bcdcDatasetResourceUrl,
            openapiSpecUrl: definitionUrl,
          },

          about: {
            intendedUse: GAP + '<about.intendedUse>',
            notIntendedFor: GAP + '<about.notIntendedFor>',
          },

          dataSource: {
            apiUses: GAP + '<dataSource.apiUses>',
            type: GAP + '<dataSource.type>',
            authoritativeFor: GAP + '<dataSource.authoritativeFor>',
            updateFrequency: apiResource.resource_update_cycle || '',
            provinceWideCoverage: GAP + '<dataSource.provinceWideCoverage>',
            governance: GAP + '<dataSource.governance>',
            dataset: datasetEntityRef,
          },

          accessAndOnboarding: {
            description: GAP + '<accessAndOnboarding.description>',
            environments:
              openApiSummary.environments.length > 0
                ? openApiSummary.environments.map(environment => ({
                    name: environment.label || environment.url,
                    url: environment.url,
                    description: environment.description || '--',
                  }))
                : undefined,
          },

          technicalReference: {
            openApiSpecUrl: apiResource.url || '',
            baseUrls:
              openApiSummary.environments.length > 0
                ? openApiSummary.environments.map(environment => ({
                    name: environment.label || environment.url,
                    description: environment.url,
                  }))
                : undefined,
            authentication:
              openApiSummary.securityRequirements.length > 0
                ? openApiSummary.securityRequirements
                : undefined,
            endpoints:
              openApiSummary.endpoints.length > 0
                ? openApiSummary.endpoints.map(endpoint => ({
                    path: endpoint.path,
                    method: endpoint.method,
                    summary: endpoint.summary,
                    description: endpoint.description,
                    authentication: endpoint.authentication,
                    exampleRequest: endpoint.exampleRequest,
                    exampleResponse: endpoint.exampleResponse,
                  }))
                : undefined,
          },

          dataAndSemantics: {
            dataReturned:
              openApiSummary.schemas.length > 0
                ? openApiSummary.schemas.map(schema => ({
                    name: schema.name,
                    label: schema.label,
                    description: schema.description,
                    fields: schema.fields?.map(field => ({
                      name: field.name,
                      type: field.type,
                      format: field.format,
                      required: field.required,
                      description: field.description,
                    })),
                  }))
                : undefined,
            dataReturnedNote: GAP + '<dataAndSemantics.dataReturnedNote>',
            authoritativeDataSource:
              GAP + '<dataAndSemantics.authoritativeDataSource>',
            fieldDefinitions: GAP + '<dataAndSemantics.fieldDefinitions>',
          },

          versioningAndChangeGovernance: {
            currentVersion: openApiSummary.version || '',
            initialRelease: apiResource.created || '',
            lastUpdated: apiResource.metadata_modified || '',
            description: GAP + '<versioningAndChangeGovernance.description>',
            changeManagement: [
              {
                version: GAP + '<version>',
                releaseDate: GAP + '<releaseDate>',
                status: GAP + '<status>',
                notes: GAP + '<notes>',
              },
            ],
            changeManagementNotes:
              GAP + '<versioningAndChangeGovernance.changeManagementNotes>',
            governanceAndUsageConstraints:
              GAP +
              '<versioningAndChangeGovernance.governanceAndUsageConstraints>',
          },

          support: {
            apiOwnership: GAP + '<support.apiOwnership>',
            supportPathways: GAP + '<support.supportPathways>',
            accessAndSdxOnboarding: {
              description:
                GAP + '<support.accessAndSdxOnboarding.description>',
              contact: GAP + '<support.accessAndSdxOnboarding.contact>',
              responseTime:
                GAP + '<support.accessAndSdxOnboarding.responseTime>',
              escalation:
                GAP + '<support.accessAndSdxOnboarding.escalation>',
            },
            technicalSupport: {
              description: GAP + '<support.technicalSupport.description>',
              contact: GAP + '<support.technicalSupport.contact>',
              responseTime: GAP + '<support.technicalSupport.responseTime>',
              escalation: GAP + '<support.technicalSupport.escalation>',
            },
            dataAndSemanticsSupport: {
              description:
                GAP + '<support.dataAndSemanticsSupport.description>',
              contact: GAP + '<support.dataAndSemanticsSupport.contact>',
              responseTime:
                GAP + '<support.dataAndSemanticsSupport.responseTime>',
              escalation:
                GAP + '<support.dataAndSemanticsSupport.escalation>',
            },
            productionIncidentEscalation:
              GAP + '<support.productionIncidentEscalation>',
          },

          relatedResources:
            metadataLinks && metadataLinks.length > 0
              ? metadataLinks.map(link => ({
                  url: link.url,
                  title: link.title,
                }))
              : undefined,
        }) as OpenApiCustomMetadata,
      },
    };
  }

  private buildMetadataTitle(
    baseTitle: string,
    apiVersion?: string,
    specificationVersion?: string,
  ): string {
    const parts: string[] = [];

    if (apiVersion && apiVersion.trim().length > 0) {
      parts.push(`v${apiVersion.trim()}`);
    }

    if (specificationVersion && specificationVersion.trim().length > 0) {
      const specLabel = specificationVersion.trim().startsWith('2.')
        ? `Swagger ${specificationVersion.trim()}`
        : `OAS ${specificationVersion.trim()}`;
      parts.push(specLabel);
    }

    return parts.length > 0 ? `${baseTitle} (${parts.join(', ')})` : baseTitle;
  }

  private buildMetadataLinks(
    openApiLinks: Array<{ url: string; title?: string; type?: string }>,
  ): EntityLink[] | undefined {
    const links: EntityLink[] = [];

    for (const link of openApiLinks) {
      if (!links.some(existing => existing.url === link.url)) {
        links.push({
          url: link.url,
          title: link.title,
          type: link.type,
          icon: 'externalLink',
        });
      }
    }

    return links.length > 0 ? links : undefined;
  }

  private buildMetadataTags(openApiTags: string[]): string[] {
    const normalizedTags = new Set<string>();

    for (const tag of openApiTags) {
      normalizedTags.add(this.naming.toSafeName(tag));
    }

    return Array.from(normalizedTags);
  }

  private hasSdxTag(tags: string[]): boolean {
    return tags.some(tag => tag.trim().toLowerCase() === 'secure-data-exchange');
  }

  private normalizeSecurityClassification(securityClass?: string): string {
    switch (securityClass?.trim().toUpperCase()) {
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

  /**
   * Backstage entity metadata extension fields must be JSON-safe.
   *
   * Several optional BCDC/OpenAPI-derived fields are intentionally omitted when
   * source data is unavailable. TypeScript represents those omitted values as
   * undefined, but undefined is not a valid JSON value and can cause catalog
   * validation issues on built-in entity kinds like API.
   *
   * This recursively removes undefined properties before attaching the custom
   * BCDC metadata object to entity.metadata.
   */
  private removeUndefined(value: JsonValue | undefined): JsonValue | undefined {
    if (Array.isArray(value)) {
      return value
        .map(item => this.removeUndefined(item))
        .filter((item): item is JsonValue => item !== undefined);
    }

    if (value && typeof value === 'object') {
      const result: JsonObject = {};

      for (const [key, item] of Object.entries(value)) {
        const cleaned = this.removeUndefined(item as JsonValue | undefined);

        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      }

      return result;
    }

    return value;
  }
}
