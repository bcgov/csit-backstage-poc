import { Card, CardHeader, CardContent } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';

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
        <MarkdownContent content={description ?? 'No description provided.'} />
      </CardContent>
    </Card>
  );
};