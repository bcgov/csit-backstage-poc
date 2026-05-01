import { Card, CardContent, Grid, Typography } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import type {
  OpenApiEntity,
  OpenApiSupportChannel,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  spec: OpenApiEntity['spec'];
};

type SupportChannelCardProps = {
  title: string;
  channel?: OpenApiSupportChannel;
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

const SupportChannelCard = ({ title, channel }: SupportChannelCardProps) => {
  return (
    <Card variant="outlined" style={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 700 }}>
          {title}
        </Typography>

        {channel?.description ? (
          <MarkdownContent content={channel.description} />
        ) : (
          <Typography variant="body2" paragraph>
            —
          </Typography>
        )}

        <Typography variant="body2">
          <strong>Channel:</strong> {renderValue(channel?.contact)}
        </Typography>
        <Typography variant="body2">
          <strong>Response time:</strong> {renderValue(channel?.responseTime)}
        </Typography>
        <Typography variant="body2">
          <strong>Escalation:</strong> {renderValue(channel?.escalation)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export const SupportCard = ({ spec }: Props) => {
  const support = spec.support;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Support
        </Typography>


        <Typography variant="body2" paragraph>
          Find help based on where you are in your API journey.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SupportChannelCard
              title="Access and SDX Onboarding"
              channel={support?.accessAndSdxOnboarding}
            />
          </Grid>

          <Grid item xs={12}>
            <SupportChannelCard
              title="Technical Support"
              channel={support?.technicalSupport}
            />
          </Grid>

          <Grid item xs={12}>
            <SupportChannelCard
              title="Data and Semantics Support"
              channel={support?.dataAndSemanticsSupport}
            />
          </Grid>

          <Grid item xs={12}>
            <Card
              variant="outlined"
              style={{
                height: '100%',
                backgroundColor: '#fdecef',
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 700 }}>
                  Production Incident Escalation
                </Typography>

                {support?.productionIncidentEscalation ? (
                  <MarkdownContent content={support.productionIncidentEscalation} />
                ) : (
                  <Typography variant="body2">
                    —
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card
              variant="outlined"
              style={{
                backgroundColor: '#f5f5f5',
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 700 }}>
                  API Ownership
                </Typography>

                {support?.apiOwnership ? (
                  <MarkdownContent content={support.apiOwnership} />
                ) : (
                  <Typography variant="body2">
                    —
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>          
        </Grid>
      </CardContent>
    </Card>
  );
};