import { Card, CardHeader, CardContent, Typography } from '@material-ui/core';

type Props = {
  description?: string;
};

export const AboutDatasetCard = ({ description }: Props) => {
  return (
    <Card
    style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
    }}
    variant="outlined"
    >
      <CardHeader title="About this dataset" />
      <CardContent>
        <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
          {description ?? 'No description provided.'}
        </Typography>
      </CardContent>
    </Card>
  );
};