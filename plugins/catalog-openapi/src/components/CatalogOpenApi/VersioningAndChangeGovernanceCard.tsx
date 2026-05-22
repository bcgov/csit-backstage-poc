import { Card, CardContent, Grid, Typography } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import type { OpenApiEntity } from '../../types';

type Props = {
  entity: OpenApiEntity;
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

const formatDate = (value?: string) => {
  if (!value || value.trim() === '') {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => {
  return (
    <Grid container spacing={1}>
      <Grid item xs={12} sm={4}>
        <Typography variant="body2" style={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={8}>
        <Typography variant="body2">{renderValue(value)}</Typography>
      </Grid>
    </Grid>
  );
};

export const VersioningAndChangeGovernanceCard = ({ entity }: Props) => {
  const bcdc = entity.metadata.customMetadata;

  const versioning = bcdc?.versioningAndChangeGovernance;
  const changeManagement = versioning?.changeManagement ?? [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Versioning and Change Governance
        </Typography>

        <Typography variant="h6" gutterBottom>
          Version Information
        </Typography>

        <div style={{ marginBottom: 16 }}>
          <DetailRow
            label="Current Version"
            value={versioning?.currentVersion}
          />
          <DetailRow
            label="Initial Release"
            value={formatDate(versioning?.initialRelease)}
          />
          <DetailRow
            label="Last Updated"
            value={formatDate(versioning?.lastUpdated)}
          />
        </div>

        {versioning?.description ? (
          <div style={{ marginBottom: 24 }}>
            <MarkdownContent content={versioning.description} />
          </div>
        ) : null}

        <Typography variant="h6" gutterBottom>
          Change Management
        </Typography>

        {changeManagement.length ? (
          <div
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            <Grid
              container
              spacing={1}
              style={{
                backgroundColor: '#f5f5f5',
                padding: '10px 12px',
              }}
            >
              <Grid item xs={12} sm={2}>
                <Typography variant="body2" style={{ fontWeight: 700 }}>
                  Version
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" style={{ fontWeight: 700 }}>
                  Release Date
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography variant="body2" style={{ fontWeight: 700 }}>
                  Status
                </Typography>
              </Grid>
              <Grid item xs={12} sm={5}>
                <Typography variant="body2" style={{ fontWeight: 700 }}>
                  Notes
                </Typography>
              </Grid>
            </Grid>

            {changeManagement.map((change, index) => (
              <Grid
                container
                spacing={1}
                key={`${change.version}-${change.releaseDate}-${index}`}
                style={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                  padding: '10px 12px',
                }}
              >
                <Grid item xs={12} sm={2}>
                  <Typography variant="body2">
                    {renderValue(change.version)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    {formatDate(change.releaseDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Typography variant="body2">
                    {renderValue(change.status)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Typography variant="body2">
                    {renderValue(change.notes)}
                  </Typography>
                </Grid>
              </Grid>
            ))}
          </div>
        ) : (
          <Typography variant="body2" paragraph>
            —
          </Typography>
        )}

        {versioning?.changeManagementNotes ? (
          <div style={{ marginBottom: 24 }}>
            <MarkdownContent content={versioning.changeManagementNotes} />
          </div>
        ) : null}

        <Card
          variant="outlined"
          style={{
            borderLeft: '4px solid #1a5a96',
            backgroundColor: '#eef6fb',
            marginBottom: 24,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Breaking Change Policy
            </Typography>

            <Typography variant="body2" paragraph>
              Breaking changes require a major version increment and a minimum
              90-day deprecation notice. Consuming applications will be notified
              through the appropriate support and notification channels.
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
          Governance and Usage Constraints
        </Typography>

        {versioning?.governanceAndUsageConstraints ? (
          <MarkdownContent content={versioning.governanceAndUsageConstraints} />
        ) : (
          <Typography variant="body2">—</Typography>
        )}
      </CardContent>
    </Card>
  );
};
