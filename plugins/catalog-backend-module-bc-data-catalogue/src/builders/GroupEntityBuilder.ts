import { GroupEntity } from '@backstage/catalog-model';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

const MANAGED_BY_LOCATION =
  'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search';

type GroupEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
};

type BuildGroupEntityOptions = {
  hostName: string;
  displayName: string;
  parentGroup?: string;
};

export class GroupEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;

  constructor(options: GroupEntityBuilderOptions) {
    this.naming = options.naming;
  }

  build(options: BuildGroupEntityOptions): GroupEntity {
    const { hostName, displayName, parentGroup } = options;

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