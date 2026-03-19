import {
  Card,
  CardContent,
  Typography,
  Link,
  Grid,
  Button,
} from '@material-ui/core';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import type { Entity } from '@backstage/catalog-model';

type DatasetSpec = {
  description?: string;
  connectedServicesDescription?: string;
  type?: string;
  owner?: string;
  status?: string;
  securityClassification?: string;
  quality?: {
    score?: string | number;
  };
  updateFrequency?: string;
  governance?: {
    retention?: string;
  };
};

type Props = {
  entity: Entity;
  spec: DatasetSpec;
  ownerLabel: string;
  onViewApis: () => void;
};

export const MainCard = ({
  entity,
  spec,
  ownerLabel,
  onViewApis,
}: Props) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="body1" style={{ whiteSpace: 'pre-line' }} paragraph>
          {spec.description ?? ''}
        </Typography>

        {entity.metadata.tags?.length ? (
          <div>
            {entity.metadata.tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-block',
                  marginRight: 6,
                  marginBottom: 6,
                  padding: '2px 8px',
                  borderRadius: 12,
                  backgroundColor: '#eee',
                  fontSize: '0.75rem',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
            Part of Connected Services
          </Typography>
          <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
            {spec.connectedServicesDescription ?? '—'}
          </Typography>
        </div>

        <div style={{ marginTop: 12 }}>
          <Typography variant="body2">
            Learn more:
          </Typography>

          {entity.metadata.links?.length ? (
            <ul style={{ marginTop: 4, paddingLeft: 20 }}>
              {entity.metadata.links.map(link => (
                <li key={link.url}>
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.title || 'More Info'}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">—</Typography>
          )}
        </div>

        <Grid container spacing={2} style={{ marginTop: 12 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2">
              Type: <strong>{spec.type ?? '—'}</strong>
            </Typography>

            <Typography variant="body2">
              Custodian:{' '}
              {spec.owner ? (
                <strong>
                  <EntityRefLink entityRef={spec.owner} title={ownerLabel} />
                </strong>
              ) : (
                <strong>—</strong>
              )}
            </Typography>

            <Typography variant="body2">
              Status: <strong>{spec.status ?? '—'}</strong>
            </Typography>

            <Typography variant="body2">
              Security Classification: <strong>{spec.securityClassification ?? '—'}</strong>
            </Typography>

            <Typography variant="body2">
              Data quality Score: <strong>{spec.quality?.score ?? '—'}</strong>
            </Typography>

            <Typography variant="body2">
              Update frequency: <strong>{spec.updateFrequency ?? '—'}</strong>
            </Typography>

            <Typography variant="body2">
              Retention: <strong>{spec.governance?.retention ?? '—'}</strong>
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              size="small"
              onClick={onViewApis}
            >
              View APIs
            </Button>

            <Typography variant="body2">
              <strong>Technical documentation</strong>
            </Typography>
            <ul style={{ marginTop: 4, paddingLeft: 20 }}>
              <li>
                <Link
                  href="https://www.notimplemented.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {'View data dictionary'}
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.notimplemented.net/"
                  target="_blank"
                >
                  {'Download schema'}
                </Link>
              </li>
            </ul>

            <Typography
              variant="body2"
              style={{ letterSpacing: '4px', fontWeight: 'bold' }}
            >
              --------------------
            </Typography>

            <Typography variant="body2">
              <strong>Need help?:</strong>
            </Typography>
            <Typography variant="body2">
              <Link
                href="https://www.notimplemented.net/"
                target="_blank"
              >
                {'Get help and contact information'}
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};