import { SystemEntity } from '@backstage/catalog-model';
import type { BcOrganization } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

const MANAGED_BY_LOCATION =
  'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search';

type SystemEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
};

type BuildSystemEntityOptions = {
  organization: BcOrganization;
  ownerGroupId: string;
};

export class SystemEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;

  constructor(options: SystemEntityBuilderOptions) {
    this.naming = options.naming;
  }

  build(options: BuildSystemEntityOptions): SystemEntity {
    const { organization, ownerGroupId } = options;

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'System',
      spec: {
        owner: ownerGroupId,
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
  }
}