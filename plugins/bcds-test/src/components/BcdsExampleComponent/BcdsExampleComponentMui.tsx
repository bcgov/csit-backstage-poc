import { Grid, TextField, IconButton } from '@material-ui/core';
import { Edit as EditIcon } from '@material-ui/icons';
import { InfoCard } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import * as tokens from '@bcgov/design-tokens/js';
import './BcsdsExampleComponent.css';

const useStyles = makeStyles(() => ({
  iconButton: {    
    backgroundColor: tokens.surfaceColorPrimaryButtonDefault,
    '&:hover': {
      backgroundColor: tokens.surfaceColorPrimaryButtonHover,
    },
  },
}));

const APPLICATION_DATA = {
  name: 'UsingMaterialUI',
  id: '848600CD5EA',
  description:
    'This application groups the APIs required to support income assistance workflows. It provides a single place to manage access, environments, credentials, and usage for all related APIs used by this solution.',
};

export const BcdsExampleComponentMui = () => {
  const classes = useStyles();

  return (
    <>
      <InfoCard
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Application details</span>
            <IconButton
              className={classes.iconButton}
              size="small"
              aria-label="Edit application"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </div>
        }
      >
        <Grid container>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Application name"
              value={APPLICATION_DATA.name}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="ID" value={APPLICATION_DATA.id} disabled />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={APPLICATION_DATA.description}
              disabled
              multiline
              fullWidth
              minRows={2}
            />
          </Grid>
        </Grid>
      </InfoCard>
    </>
  );
};
