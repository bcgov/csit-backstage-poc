import { Entity } from '@backstage/catalog-model';

export const DATASET_KIND = 'Dataset';
export const DATASET_API_VERSION = 'bcgov.io/v1alpha1';

export type DatasetStatus = 'Published' | 'Pending Archive' | 'Unknown';

export type DatasetSecurityClassification =
  | 'Public'
  | 'Protected A'
  | 'Protected B'
  | 'Protected C'
  | 'Unknown';

export type DatasetContact = {
  name: string;
  email: string;
  role: string;
  organization?: string;
};

export type DatasetAccessMethod = {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: string;
  format?: string;
  updateFrequency?: string;
};

export type DatasetSchemaField = {
  columnName: string;
  dataType?: string;
  dataPrecision?: string;
  shortName?: string;
  columnComments?: string;
};

export type DatasetSchemaTable = {
  name: string;
  resourceType?: string;
  fields?: DatasetSchemaField[];
};

export type DatasetSchema = {
  tables?: DatasetSchemaTable[];
};

export type DatasetEntityDefinitionField = {
  name: string;
  definition?: string;
  semanticDomain?: string;
  meaningOfValues?: string;
  businessRules?: string;
  relationships?: string[];
  governance?: string;
};

export type DatasetEntityDefinition = {
  name: string;
  fields?: DatasetEntityDefinitionField[];
};

export type DatasetEntityDefinitions = {
  entities?: DatasetEntityDefinition[];
};

export type DatasetSupportChannel = {
  description?: string;
  channel?: string;
  responseTime?: string;
  escalation?: string;
};

export type DatasetGovernanceAndProductionEscalation = {
  description?: string;
  channel?: string;
  referenceDataset?: string;
  responseTime?: string;
};

export type DatasetSupport = {
  primary?: string;
  description?: string;
  dataCustodian?: string;
  governanceAuthority?: string;
  pathways?: string;

  dataAndSemantics?: DatasetSupportChannel;
  accessAndIntegration?: DatasetSupportChannel;
  governanceAndProductionEscalation?: DatasetGovernanceAndProductionEscalation;
};

export interface DatasetEntity extends Entity {
  apiVersion: typeof DATASET_API_VERSION;
  kind: typeof DATASET_KIND;
  spec: {
    owner: string;
    system?: string;
    type: string;

    description: string;
    status: DatasetStatus;
    securityClassification: DatasetSecurityClassification;

    connectedServicesDescription?: string;

    updateFrequency?: string;

    quality?: {
      score?: string;
      validation?: string;
      controls?: string[];
    };

    governance?: {
      retention?: string;
      description?: string;
    };

    about?: {
      description?: string;
    };

    authoritativeDesignation?: {
      authoritativeFor?: string;
    };

    providesApis?: string[];

    accessMethods?: DatasetAccessMethod[];

    schema?: DatasetSchema;

    entityDefinitions?: DatasetEntityDefinitions;

    lineage?: {
      sourceSystem?: string;
      transformation?: string;
      refresh?: string;
    };

    versioning?: {
      currentVersion?: string;
      initialRelease?: string;
      lastUpdated?: string;
      description?: string;
    };

    support?: DatasetSupport;

    relatedResources?: Array<{
      url: string;
      title?: string;
    }>;
  };
}