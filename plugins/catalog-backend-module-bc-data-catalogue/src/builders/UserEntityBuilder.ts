import { UserEntity } from '@backstage/catalog-model';
import { BcDataCatalogueNaming } from '../BcDataCatalogueNaming';

const MANAGED_BY_LOCATION =
  'url:https://catalogue.data.gov.bc.ca/api/3/action/package_search';

type UserEntityBuilderOptions = {
  naming: BcDataCatalogueNaming;
};

type BuildUserEntityOptions = {
  email: string;
};

export class UserEntityBuilder {
  private readonly naming: BcDataCatalogueNaming;

  constructor(options: UserEntityBuilderOptions) {
    this.naming = options.naming;
  }

  build(options: BuildUserEntityOptions): UserEntity {
    const { email } = options;

    return {
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
          'backstage.io/managed-by-location': MANAGED_BY_LOCATION,
          'backstage.io/managed-by-origin-location': MANAGED_BY_LOCATION,
        },
      },
    };
  }
}