import {
  Card,
  CardHeader,
  CardContent,
  Typography,
} from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';

type Props = {
  currentVersion?: string;
  initialRelease?: string;
  lastUpdated?: string;
  versioningDescription?: string;
  governanceDescription?: string;
};

export const VersioningAndChangeGovernanceCard = ({
  currentVersion,
  initialRelease,
  lastUpdated,
  versioningDescription,
  governanceDescription,
}: Props) => {
  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader title="Versioning and Change Governance" />
      <CardContent>
        <Typography variant="body2">
          <strong>Version Information</strong>
        </Typography>

        <Typography variant="body2">
          <strong>Current Version:</strong> {currentVersion ?? 'N/A'}
        </Typography>
        <Typography variant="body2">
          <strong>Initial Release:</strong> {initialRelease ?? 'N/A'}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Last Updated:</strong> {lastUpdated ?? 'N/A'}
        </Typography>

        <MarkdownContent content={versioningDescription ?? 'N/A'} />

        <Typography
          variant="body2"
          style={{ marginTop: 16 }}
        >
          <strong>Governance and Usage Constraints</strong>
        </Typography>

        <MarkdownContent content= {governanceDescription ?? 'N/A'} />
      </CardContent>
    </Card>
  );
};