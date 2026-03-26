import {
  Card,
  CardHeader,
  CardContent,
  Typography,
} from '@material-ui/core';

type Props = {
  sourceSystem?: string;
  transformation?: string;
  validation?: string;
  refresh?: string;
  qualityControls?: string[];
};

export const LineageAndQualityCard = ({
  sourceSystem,
  transformation,
  validation,
  refresh,
  qualityControls,
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
      <CardHeader title="Lineage & Quality" />
      <CardContent>
        <Typography variant="body2">
          <strong>Source:</strong> {sourceSystem ?? 'N/A'}
        </Typography>
        <Typography variant="body2">
          <strong>Transformation:</strong> {transformation ?? 'N/A'}
        </Typography>
        <Typography variant="body2" style={{ marginBottom: 8 }}>
          <strong>Validation:</strong> {validation ?? 'N/A'}
        </Typography>
        <Typography variant="body2" style={{ marginBottom: 8 }}>
          <strong>Lineage Refresh:</strong> {refresh ?? 'N/A'}
        </Typography>
        <Typography variant="body2">
          Quality controls include:
        </Typography>
        {qualityControls?.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {qualityControls.map((qc, i) => (
              <li key={i}>
                <Typography variant="body2">{qc}</Typography>
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2">N/A</Typography>
        )}
      </CardContent>
    </Card>
  );
};