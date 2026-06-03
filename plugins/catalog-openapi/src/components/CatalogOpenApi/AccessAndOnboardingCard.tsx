import { Card, CardContent, Grid, Typography } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import type { OpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  entity: OpenApiEntity;
};

type EnvironmentBoxProps = {
  name: string;
  description?: string;
  backgroundColor?: string;
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

const getEnvironmentColor = (index: number) => {
  switch (index) {
    case 0:
      return '#eef6fb';
    case 1:
      return '#fff8e1';
    case 2:
      return '#e8eef7';
    default:
      return undefined;
  }
};

const EnvironmentBox = ({
  name,
  description,
  backgroundColor,
}: EnvironmentBoxProps) => {
  return (
    <Card
      variant="outlined"
      style={{
        backgroundColor,
        height: '100%',
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 700 }}>
          {renderValue(name)}
        </Typography>

        {description ? (
          <MarkdownContent content={description} />
        ) : (
          <Typography variant="body2">—</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const AccessAndOnboardingCard = ({ entity }: Props) => {
  const bcdc = entity.metadata.customMetadata;

  const accessAndOnboarding = bcdc?.accessAndOnboarding;
  const environments = accessAndOnboarding?.environments ?? [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Access and Onboarding
        </Typography>

        <Typography variant="body2" style={{ marginBottom: 16 }}>
          {renderValue(accessAndOnboarding?.description)}
        </Typography>

        <Grid container spacing={2}>
          {environments.length > 0 ? (
            environments.map((environment, index) => (
              <Grid
                item
                xs={12}
                md={4}
                key={`${environment.name}-${index}`}
                style={{
                  paddingLeft: index === 0 ? 0 : undefined,
                  paddingRight:
                    index === environments.length - 1 ? 0 : undefined,
                }}
              >
                <EnvironmentBox
                  name={environment.name}
                  description={environment.description}
                  backgroundColor={getEnvironmentColor(index)}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12} style={{ paddingLeft: 0, paddingRight: 0 }}>
              <Typography variant="body2">—</Typography>
            </Grid>
          )}
        </Grid>

        <div style={{ marginTop: 24 }}>
          <Typography variant="h6" gutterBottom>
            Scope and Access Model
          </Typography>

          {accessAndOnboarding?.scopeAndAccessModelDescription ? (
            <MarkdownContent
              content={accessAndOnboarding.scopeAndAccessModelDescription}
            />
          ) : (
            <>
              <Typography variant="body2" paragraph>
                Access is governed through scopes enforced at the API gateway.
              </Typography>

              <Typography variant="body2">
                <strong>Example scope:</strong>
              </Typography>

              <div
                style={{
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 4,
                  padding: 12,
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                <Typography variant="body2">
                  <strong>residency.verify</strong> Allows verification of
                  residency status for eligibility determination.
                </Typography>
              </div>

              <Typography variant="body2" paragraph>
                <strong>Scopes define:</strong>
              </Typography>

              <ul style={{ marginTop: 0 }}>
                <li>
                  <Typography variant="body2">
                    What operations the consumer application may perform
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Which environments may be accessed
                  </Typography>
                </li>
              </ul>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
