import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef, EntityRefLink } from '@backstage/plugin-catalog-react';
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { isOpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { useAsync } from 'react-use';

type Props = {
  open: boolean;
  onClose: () => void;
  datasetTitle: string;
  apiEntityRefs: string[];
  namespace?: string;
};

type ApiCard = {
  entityRef: string;
  title: string;
  type: string;
  security: string[];
  environments: Array<{
    name?: string;
    url?: string;
    description?: string;
  }>;
  isOpenApi: boolean;
};

const GAP = 'Gap';

export const DatasetApisDialog = ({
  open,
  onClose,
  datasetTitle,
  apiEntityRefs,
  namespace,
}: Props) => {
  const catalogApi = useApi(catalogApiRef);

  const { value: apiEntities, loading: apiEntitiesLoading } = useAsync(
    async () => {
      if (!open || !apiEntityRefs.length) {
        return [];
      }

      const resolved = await Promise.all(
        apiEntityRefs.map(async apiRef => {
          try {
            return await catalogApi.getEntityByRef(apiRef);
          } catch {
            return undefined;
          }
        }),
      );

      return resolved.filter(
        (api): api is NonNullable<typeof api> => Boolean(api),
      );
    },
    [open, apiEntityRefs, catalogApi],
  );

  const { value: apiCards = [], loading: apiCardsLoading } = useAsync(
    async (): Promise<ApiCard[]> => {
      if (!open || !apiEntities?.length) {
        return [];
      }

      return apiEntities.map(api => {
        const apiSpec = (api.spec ?? {}) as Record<string, unknown>;
        const isOpenApi = isOpenApiEntity(api);
        const customMetadata = isOpenApi
          ? api.metadata.customMetadata
          : undefined;
        const technicalReference = customMetadata?.technicalReference ?? {};
        const environments = Array.isArray(customMetadata?.environments)
          ? customMetadata.environments
          : [];

        return {
          entityRef: stringifyEntityRef(api),
          title: api.metadata.title ?? api.metadata.name,
          type: typeof apiSpec.type === 'string' ? apiSpec.type : '—',
          security:
            isOpenApi && Array.isArray(technicalReference.authentication)
              ? technicalReference.authentication
              : [],
          environments: isOpenApi
            ? environments.map(environment => ({
                name:
                  typeof environment?.name === 'string'
                    ? environment.name
                    : undefined,
                url:
                  typeof environment?.url === 'string'
                    ? environment.url
                    : undefined,
                description:
                  typeof environment?.description === 'string'
                    ? environment.description
                    : undefined,
              }))
            : [],
          isOpenApi,
        };
      });
    },
    [open, apiEntities],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle disableTypography>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: 8,
          }}
        >
          <div>
            <Typography variant="h3" component="h2" gutterBottom>
              APIs
            </Typography>
            <Typography variant="body1">Dataset: {datasetTitle}</Typography>
          </div>
        </div>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="h6" gutterBottom style={{ marginBottom: 20 }}>
          Consumed by:
        </Typography>

        {apiEntitiesLoading || apiCardsLoading ? (
          <Typography variant="body2">Loading...</Typography>
        ) : apiCards.length ? (
          <Grid container spacing={3}>
            {apiCards.map(api => (
              <Grid item xs={12} md={6} lg={4} key={api.entityRef}>
                <Card
                  variant="outlined"
                  style={{
                    height: '100%',
                    borderWidth: 2,
                    borderRadius: 8,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      style={{ fontWeight: 600, textDecoration: 'underline' }}
                    >
                      <EntityRefLink
                        entityRef={api.entityRef}
                        title={api.title}
                      />
                    </Typography>

                    <Typography variant="body1">Type: {api.type}</Typography>

                    <Typography variant="body1" style={{ marginTop: 8 }}>
                      <strong>Security:</strong>
                    </Typography>
                    {api.security.length ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {api.security.map((security, i) => (
                          <li key={i}>
                            <Typography variant="body2">
                              {security}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2">
                        {api.isOpenApi ? '—' : GAP}
                      </Typography>
                    )}

                    <Typography variant="body1" style={{ marginTop: 8 }}>
                      <strong>Environments:</strong>
                    </Typography>
                    {api.environments.length ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {api.environments.map((environment, i) => (
                          <li key={i}>
                            <Typography variant="body2">
                              {environment.name ||
                                environment.description ||
                                environment.url ||
                                '—'}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2">
                        {api.isOpenApi ? '—' : GAP}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {apiEntityRefs.map(apiRef => {
              const parsed = parseEntityRef(apiRef, {
                defaultKind: 'API',
                defaultNamespace: namespace ?? 'default',
              });

              return (
                <li key={apiRef}>
                  <EntityRefLink entityRef={apiRef} title={parsed.name} />
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          color="default"
          style={{ minWidth: 'auto', padding: 0, textTransform: 'none' }}
        >
          <Typography variant="h6" style={{ textDecoration: 'underline' }}>
            X Close
          </Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
};