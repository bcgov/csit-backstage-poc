import {
  Card,
  CardHeader,
  CardContent,
  Typography,
} from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';

type DatasetSupportChannel = {
  description?: string;
  channel?: string;
  responseTime?: string;
  escalation?: string;
};

type DatasetGovernanceAndProductionEscalation = {
  description?: string;
  channel?: string;
  referenceDataset?: string;
  responseTime?: string;
};

type Props = {
  support?: {
    description?: string;
    dataCustodian?: string;
    governanceAuthority?: string;
    pathways?: string;
    dataAndSemantics?: DatasetSupportChannel;
    accessAndIntegration?: DatasetSupportChannel;
    governanceAndProductionEscalation?: DatasetGovernanceAndProductionEscalation;
  };
};

const SupportChannelSection = ({
  title,
  channel,
}: {
  title: string;
  channel?: DatasetSupportChannel;
}) => {
  if (!channel) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <Typography variant="body2">
        <strong>{title}</strong>
      </Typography>

      <MarkdownContent content={channel.description ?? '-'} />

      <div style={{ marginTop: 8 }}>
        <Typography variant="body2">
          Channel: {channel.channel ?? 'N/A'}
        </Typography>
        <Typography variant="body2">
          Response time: {channel.responseTime ?? 'N/A'}
        </Typography>
        <Typography variant="body2">
          Escalation: {channel.escalation ?? 'N/A'}
        </Typography>
      </div>
    </div>
  );
};

export const SupportCard = ({ support }: Props) => {
  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader title="Support" />
      <CardContent>

        <MarkdownContent content={support?.description || 'No support information defined.'} />

        <Typography variant="body2">
          <strong>Dataset Ownership</strong>
        </Typography>

        <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>
          <li>
            <Typography variant="body2">
              Data Custodian: {support?.dataCustodian ?? 'N/A'}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Governance Authority: {support?.governanceAuthority ?? 'N/A'}
            </Typography>
          </li>
        </ul>

        <Typography variant="body2">
          <strong>Support Pathways</strong>
        </Typography>
        <div style={{ marginTop: 4 }}>
          <MarkdownContent content={support?.pathways ?? '-'} />
        </div>

        <SupportChannelSection
          title="Data and Semantics"
          channel={support?.dataAndSemantics}
        />

        <SupportChannelSection
          title="Access and Integration"
          channel={support?.accessAndIntegration}
        />

        <SupportChannelSection
          title="Governance and Production Escalation"
          channel={support?.governanceAndProductionEscalation}
        />
      </CardContent>
    </Card>
  );
};