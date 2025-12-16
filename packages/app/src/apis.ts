import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import {
  graphQlBrowseApiRef,
  GraphQLEndpoints,
} from '@backstage-community/plugin-graphiql';
export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: graphQlBrowseApiRef,
    deps: {},
    factory: () =>
      GraphQLEndpoints.from([
        GraphQLEndpoints.create({
          id: 'pokemon',
          title: 'Pokémon API',
          url: 'https://graphql-pokeapi.graphcdn.app/',
        }),
      ]),
  }),
];
