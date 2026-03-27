import { Card, CardContent, Button, Grid, Typography, Link } from '@material-ui/core';
import type { OpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { EntityRefLink } from '@backstage/plugin-catalog-react';

type Props = {
  spec: OpenApiEntity['spec'];
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

const formatEnvironments = (environments?: OpenApiEntity['spec']['environments']) => {
  if (!environments?.length) {
    return '—';
  }

  const values = environments
    .map(environment => environment.name?.trim() || environment.url?.trim())
    .filter(Boolean);

  return values.length ? values.join(' | ') : '—';
};

const renderMetadataRow = (label: string, value: string) => (
  <Grid container spacing={1}>
    <Grid item xs={6}>
      <Typography variant="body2">
        {label}
      </Typography>
    </Grid>
    <Grid item xs={6}>
      <Typography variant="body2" align="right">
        {value}
      </Typography>
    </Grid>
  </Grid>
);

export const AccessOverviewCard = ({ spec }: Props) => {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            {renderMetadataRow('Provider Ministry:', renderValue(spec.providerMinistry))}
            {renderMetadataRow('Status:', renderValue(spec.status))}
            {renderMetadataRow(
              'Security Classification:',
              renderValue(spec.securityClassification),
            )}
            {renderMetadataRow('Application:', renderValue(spec.application))}
            {renderMetadataRow('Type:', renderValue(spec.type))}
            {renderMetadataRow('SDX Required:', renderValue(spec.sdxRequired))}
            {renderMetadataRow('Environments:', formatEnvironments(spec.environments))}

            <Typography
              variant="body2"
              style={{ letterSpacing: '4px', fontWeight: 'bold' }}
            >
              --------------------
            </Typography>

            <Typography variant="body2">
              Access Model:
            </Typography>
            <Typography variant="body2">
              {renderValue(spec.accessModel)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: 16,
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <Button
                  variant="contained"
                  color="primary"
                  component="a"
                  href="https://www.notimplemented.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Access this API
                </Button>
              </div>

              <Typography variant="body2">
                <strong>Technical documentation</strong>
              </Typography>
              <Typography variant="body2">
                <Link
                  href={spec.urls.openapiSpecUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View OpenAPI spec
                </Link>
              </Typography>
              <Typography variant="body2">
                {spec.dataSource?.dataset ? (
                  <EntityRefLink
                    entityRef={spec.dataSource.dataset}
                    title={`View authoritative dataset (${spec.dataSource.dataset})`}
                  />
                ) : (
                  '—'
                )}
              </Typography>
              <Typography variant="body2">
                <Link
                  href={spec.urls.bcdcDatasetResourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View in BC Data Catalogue
                </Link>
              </Typography>

              <Typography
                variant="body2"
                style={{ letterSpacing: '4px', fontWeight: 'bold' }}
              >
                --------------------
              </Typography>

              <Typography variant="body2">
                <strong>Need help?</strong>
              </Typography>
              <Typography variant="body2">
                <Link
                  href="https://www.notimplemented.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get help and contact information
                </Link>
              </Typography>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};