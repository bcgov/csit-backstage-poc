import {
  Card,
  CardContent,
  Typography,
} from '@material-ui/core';
import type { Entity } from '@backstage/catalog-model';
import { MarkdownContent } from '@backstage/core-components';

type OpenApiEnvironment = {
  name?: string;
  url: string;
  description?: string;
};

type OpenApiSpec = {
  description?: string;
  connectedServicesDescription?: string;
  type?: string;
  providerMinistry?: string;
  status?: string;
  securityClassification?: string;
  application?: string;
  sdxRequired?: string;
  environments?: OpenApiEnvironment[];
  accessModel?: string;
};

type Props = {
  entity: Entity;
  spec: OpenApiSpec;
};

export const MainCard = ({
  entity,
  spec,
}: Props) => {
  return (
    <Card>
      <CardContent>
        <MarkdownContent content={spec.description ?? ''} />

        {entity.metadata.tags?.length ? (
          <div>
            <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
              API Tags
            </Typography>
            {entity.metadata.tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-block',
                  marginRight: 6,
                  marginBottom: 6,
                  padding: '2px 8px',
                  borderRadius: 12,
                  backgroundColor: '#eee',
                  fontSize: '0.75rem',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};