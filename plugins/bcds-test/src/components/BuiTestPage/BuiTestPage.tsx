import {
  Page,
  Content,
  Header,
} from '@backstage/core-components';
import { IntegrationToolkitCards } from './IntegrationToolkitCards';

export const BuiTestPage = () => (
  <Page themeId="tool">
    <Header
      title="Integration toolkit"
    />
    <Content>
      <IntegrationToolkitCards />
    </Content>
  </Page>
);

