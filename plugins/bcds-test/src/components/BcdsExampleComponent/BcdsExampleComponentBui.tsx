import { Grid, TextField, ButtonIcon } from '@backstage/ui';
import { Edit as EditIcon } from '@material-ui/icons';
import { InfoCard } from '@backstage/core-components';
import { TextField as MuiTextField } from '@material-ui/core'; // Backstage UI doesn't support TextArea yet

const APPLICATION_DATA = {
  name: 'UsingBackstageUI',
  id: '848600CD5EA',
  description:
    'This application groups the APIs required to support income assistance workflows. It provides a single place to manage access, environments, credentials, and usage for all related APIs used by this solution.',
};

export const BcdsExampleComponentBui = () => {
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
            <ButtonIcon aria-label="Edit application" icon={<EditIcon />} />
          </div>
        }
      >
        <Grid.Root columns="12" gap="md">
          <Grid.Item colSpan={{ xs: '12', sm: '5' }}>
            <TextField
              label="Application name"
              value={APPLICATION_DATA.name}
              isDisabled
            />
          </Grid.Item>
          <Grid.Item colSpan={{ xs: '12', sm: '5' }}>
            <TextField label="ID" value={APPLICATION_DATA.id} isDisabled />
          </Grid.Item>
          <Grid.Item colSpan="12">
            <MuiTextField
              label="Description"
              value={APPLICATION_DATA.description}
              disabled
              multiline
              fullWidth
              minRows={2}
            />
          </Grid.Item>
        </Grid.Root>
      </InfoCard>
    </>
  );
};
