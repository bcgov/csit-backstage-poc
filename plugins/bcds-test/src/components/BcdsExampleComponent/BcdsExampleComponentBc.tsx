import { Grid } from '@backstage/ui';
import { Edit as EditIcon } from '@material-ui/icons';
import { InfoCard } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import {
  Button,
  TextField,
  TextArea,
} from "@bcgov/design-system-react-components";

const useStyles = makeStyles(() => ({
  textareaWrapper: {
    '& > *': {
      width: '100%',
    },
  },
}));

const APPLICATION_DATA = {
  name: "UsingBCGovDesignSystemComponents",
  id: "848600CD5EA",
  description: "This application groups the APIs required to support income assistance workflows. It provides a single place to manage access, environments, credentials, and usage for all related APIs used by this solution."
};

export const BcdsExampleComponentBc = () => {
  const classes = useStyles();

  return (
    <>
      <InfoCard 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Application details</span>
            <Button 
              isIconButton={true}
              size="small" 
              aria-label="Edit application"
            >
              <EditIcon style={{ fill: 'white' }} fontSize="small" />
            </Button>
          </div>
        }
      >
        <Grid.Root columns="12" gap="md">
          <Grid.Item colSpan={{ xs: "12", sm: "5" }}>
            <TextField
              label="Application name"
              value={APPLICATION_DATA.name}
              isReadOnly
            />
          </Grid.Item>
          <Grid.Item colSpan={{ xs: "12", sm: "5" }}>
            <TextField
              label="ID"
              value={APPLICATION_DATA.id}
              isReadOnly
            />
          </Grid.Item>
          <Grid.Item colSpan="12">
            <div className={classes.textareaWrapper}>
              <TextArea
                label="Description"
                value={APPLICATION_DATA.description}
                isReadOnly
              />
            </div>
          </Grid.Item>
        </Grid.Root>
      </InfoCard>
    </>
  );
};

