import {
  Card,
  CardContent,
  Typography,
  Link,
} from '@material-ui/core';
import type { Entity } from '@backstage/catalog-model';
import { MarkdownContent } from '@backstage/core-components';

type OpenApiSpec = {
  connectedServicesDescription?: string;
};

type Props = {
  entity: Entity;
  spec: OpenApiSpec;
};

export const PartOfConnectedServices = ({
  entity,
  spec,
}: Props) => {
  return (
    <Card
      style={{
        borderLeft: '4px solid #1a5a96',
        backgroundColor: '#f5f5f5',
      }}
    >
      <CardContent>
        <div style={{ marginTop: 12 }}>
          <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
            Part of Connected Services
          </Typography>

          <MarkdownContent content={spec.connectedServicesDescription ?? '—'} />
        </div>

        <div style={{ marginTop: 12 }}>
          <Typography variant="body2">
            Learn more:
          </Typography>

          {entity.metadata.links?.length ? (
            <ul style={{ marginTop: 4, paddingLeft: 20 }}>
              {entity.metadata.links.map(link => (
                <li key={link.url}>
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.title || 'More Info'}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">—</Typography>
          )}
        </div>
      </CardContent>
    </Card>
  );
};