import {
  Card,
  CardHeader,
  CardContent,
  Typography,
} from '@material-ui/core';

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

        {versioningDescription ? (
          <>
            <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
              {versioningDescription ?? 'N/A'}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" gutterBottom>
            N/A
          </Typography>
        )}

        <Typography
          variant="body2"
          style={{ marginTop: 16 }}
        >
          <strong>Governance and Usage Constraints</strong>
        </Typography>

        {governanceDescription ? (
          <>
            <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
              {governanceDescription ?? 'N/A'}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" gutterBottom>
            N/A
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};