import {
  Card,
  CardHeader,
  CardContent,
  Typography,
} from '@material-ui/core';

type Props = {
};

export const FieldsAndDefinitionCard = ({ }: Props) => {
  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader title="Fields & Definitions" />
      <CardContent>
        <Typography variant="body2">{'GAP<fieldsAndDefinitions>'}</Typography>
      </CardContent>
    </Card>
  );
};