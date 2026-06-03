import {
  Card,
  CardContent,
  Button,
  Grid,
  Typography,
  Link,
} from '@material-ui/core';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import type {
  OpenApiEntity,
  OpenApiEnvironment,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  entity: OpenApiEntity;
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

const formatEnvironments = (environments?: OpenApiEnvironment[]) => {
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
      <Typography variant="body2">{label}</Typography>
    </Grid>
    <Grid item xs={6}>
      <Typography variant="body2" align="right">
        {value}
      </Typography>
    </Grid>
  </Grid>
);

export const AccessOverviewCard = ({ entity }: Props) => {
  const bcdc = entity.metadata.customMetadata;

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            {renderMetadataRow(
              'Provider Ministry:',
              renderValue(bcdc?.providerMinistry),
            )}
            {renderMetadataRow('Status:', renderValue(bcdc?.status))}
            {renderMetadataRow(
              'Security Classification:',
              renderValue(bcdc?.securityClassification),
            )}
            {renderMetadataRow('Application:', renderValue(bcdc?.application))}
            {renderMetadataRow('Type:', renderValue(entity.spec.type))}
            {renderMetadataRow(
              'SDX Required:',
              renderValue(bcdc?.sdxRequired),
            )}
            {renderMetadataRow(
              'Environments:',
              formatEnvironments(bcdc?.environments),
            )}

            <Typography
              variant="body2"
              style={{ letterSpacing: '4px', fontWeight: 'bold' }}
            >
              --------------------
            </Typography>

            <Typography variant="body2">Access Model:</Typography>
            <Typography variant="body2">
              {renderValue(bcdc?.accessModel)}
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
                {bcdc?.urls?.openapiSpecUrl ? (
                  <Link
                    href={bcdc.urls.openapiSpecUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View OpenAPI spec
                  </Link>
                ) : (
                  '—'
                )}
              </Typography>

              <Typography variant="body2">
                {bcdc?.dataSource?.dataset ? (
                  <EntityRefLink
                    entityRef={bcdc.dataSource.dataset}
                    title={`View authoritative dataset (${bcdc.dataSource.dataset})`}
                  />
                ) : (
                  '—'
                )}
              </Typography>

              <Typography variant="body2">
                {bcdc?.urls?.bcdcDatasetResourceUrl ? (
                  <Link
                    href={bcdc.urls.bcdcDatasetResourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View in BC Data Catalogue
                  </Link>
                ) : (
                  '—'
                )}
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
