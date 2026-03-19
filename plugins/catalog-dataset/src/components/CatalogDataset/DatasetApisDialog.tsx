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
import { useAsync } from 'react-use';
import { getOpenApiSummary } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  open: boolean;
  onClose: () => void;
  datasetTitle: string;
  apiEntityRefs: string[];
  namespace?: string;
};

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
    async () => {
      if (!open || !apiEntities?.length) {
        return [];
      }

      return await Promise.all(
        apiEntities.map(async api => {
          const apiSpec = (api.spec ?? {}) as Record<string, any>;
          const openApiSummary = await getOpenApiSummary(apiSpec.definition);

          return {
            entityRef: stringifyEntityRef(api),
            title: api.metadata.title ?? api.metadata.name,
            type: apiSpec.type ?? '—',
            security: openApiSummary.securityRequirements ?? [],
            environments: openApiSummary.environments ?? [],
          };
        }),
      );
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
            <Typography variant="body1">
              Dataset: {datasetTitle}
            </Typography>
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

                    <Typography variant="body1">
                      Type: {api.type}
                    </Typography>

                    <Typography variant="body1" style={{ marginTop: 8 }}>
                      <strong>Security:</strong>
                    </Typography>
                    {api.security.length ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {api.security.map((s: string, i: number) => (
                          <li key={i}>
                            <Typography variant="body2">{s}</Typography>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2">—</Typography>
                    )}

                    <Typography variant="body1" style={{ marginTop: 8 }}>
                      <strong>Environments:</strong>
                    </Typography>
                    {api.environments.length ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {api.environments.map((e: string, i: number) => (
                          <li key={i}>
                            <Typography variant="body2">{e}</Typography>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2">—</Typography>
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
                  <EntityRefLink
                    entityRef={apiRef}
                    title={parsed.name}
                  />
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