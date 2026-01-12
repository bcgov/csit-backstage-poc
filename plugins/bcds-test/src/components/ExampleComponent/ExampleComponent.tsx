import { Grid } from '@backstage/ui';
import {
  Header,
  Page,
  Content,
} from '@backstage/core-components';
import { BcdsExampleComponentBc, BcdsExampleComponentBui, BcdsExampleComponentMui } from '../BcdsExampleComponent';

export const ExampleComponent = () => (
  <Page themeId="tool">
    <Header
      title="Manage application"
      subtitle="Configure application settings and metadata"
    ></Header>
    <Content>
      <Grid.Root columns="1">
        <Grid.Item colSpan="1">
          <BcdsExampleComponentBui />
        </Grid.Item>
        <Grid.Item colSpan="1">
          <BcdsExampleComponentBc />
        </Grid.Item>
        <Grid.Item colSpan="1">
          <BcdsExampleComponentMui />
        </Grid.Item>
      </Grid.Root>
    </Content>
  </Page>
);
