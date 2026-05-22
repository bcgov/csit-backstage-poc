import { ApiEntity, Entity } from '@backstage/catalog-model';

export const OPENAPI_API_TYPE = 'openapi';

export type OpenApiStatus = string;
export type OpenApiSecurityClassification = string;

export type OpenApiLink = {
  url: string;
  title?: string;
  icon?: string;
  type?: string;
};

export type OpenApiEnvironment = {
  name?: string;
  url: string;
  description?: string;
};

export type OpenApiEndpoint = {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  authentication?: string;
  exampleRequest?: string;
  exampleResponse?: string;
};

export type OpenApiSchemaField = {
  name: string;
  type?: string;
  format?: string;
  required?: boolean;
  description?: string;
};

export type OpenApiSchemaObject = {
  name: string;
  label?: string;
  description?: string;
  fields?: OpenApiSchemaField[];
};

export type OpenApiSupportChannel = {
  description?: string;
  contact?: string;
  responseTime?: string;
  escalation?: string;
};

export type OpenApiCustomMetadata = {
  description?: string;
  status?: OpenApiStatus;
  securityClassification?: OpenApiSecurityClassification;

  connectedServicesDescription?: string;

  providerMinistry?: string;
  application?: string;
  sdxRequired?: string;
  environments?: OpenApiEnvironment[];
  accessModel?: string;

  urls?: {
    bcdcDatasetResourceUrl?: string;
    openapiSpecUrl?: string;
  };

  about?: {
    intendedUse?: string;
    notIntendedFor?: string;
  };

  dataSource?: {
    apiUses?: string;
    type?: string;
    authoritativeFor?: string;
    updateFrequency?: string;
    provinceWideCoverage?: string;
    governance?: string;
    dataset?: string;
  };

  accessAndOnboarding?: {
    description?: string;
    environments?: Array<{
      name: string;
      url?: string;
      description?: string;
    }>;
    scopeAndAccessModelDescription?: string;
  };

  technicalReference?: {
    openApiSpecUrl?: string;
    baseUrls?: Array<{
      name?: string;
      description?: string;
    }>;
    authentication?: string[];
    endpoints?: OpenApiEndpoint[];
  };

  dataAndSemantics?: {
    dataReturned?: OpenApiSchemaObject[];
    dataReturnedNote?: string;
    authoritativeDataSource?: string;
    fieldDefinitions?: string;
  };

  versioningAndChangeGovernance?: {
    currentVersion?: string;
    initialRelease?: string;
    lastUpdated?: string;
    description?: string;
    changeManagement?: Array<{
      version?: string;
      releaseDate?: string;
      status?: string;
      notes?: string;
    }>;
    changeManagementNotes?: string;
    governanceAndUsageConstraints?: string;
  };

  support?: {
    apiOwnership?: string;
    supportPathways?: string;
    accessAndSdxOnboarding?: OpenApiSupportChannel;
    technicalSupport?: OpenApiSupportChannel;
    dataAndSemanticsSupport?: OpenApiSupportChannel;
    productionIncidentEscalation?: string;
  };

  relatedResources?: Array<{
    url: string;
    title?: string;
  }>;
};

export interface OpenApiEntity extends ApiEntity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'API';
  spec: ApiEntity['spec'] & {
    type: typeof OPENAPI_API_TYPE;
  };
  metadata: ApiEntity['metadata'] & {
    customMetadata?: OpenApiCustomMetadata;
  };
}

export function isOpenApiEntity(entity: Entity): entity is OpenApiEntity {
  return (
    entity.kind.toLocaleLowerCase('en-US') === 'api' &&
    entity.spec?.type === OPENAPI_API_TYPE
  );
}
