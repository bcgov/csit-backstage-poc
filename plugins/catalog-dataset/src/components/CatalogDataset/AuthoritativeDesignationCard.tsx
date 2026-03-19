import { Card, CardHeader, CardContent, Typography } from '@material-ui/core';

type Props = {

};

export const AuthoritativeDesignationCard = ({ }: Props) => {
  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader title="Authoritative Designation" />
      <CardContent>
        <Typography variant="body2">
          This dataset is designated authoritative.

          Authoritative status means:
          <ul>
            <li>Stewardship accountability is assigned.</li>
            <li>Change management is governed.</li>
            <li>Definitions are standardized and versioned.</li>
          </ul>
        </Typography>
      </CardContent>
    </Card>
  );
};