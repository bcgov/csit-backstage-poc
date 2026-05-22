import { Card, CardContent, Typography, Link } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import type { OpenApiEntity } from '../../types';

type Props = {
  entity: OpenApiEntity;
};

export const PartOfConnectedServices = ({ entity }: Props) => {
  const bcdc = entity.metadata.customMetadata;

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

          <MarkdownContent
            content={bcdc?.connectedServicesDescription ?? '—'}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Typography variant="body2">Learn more:</Typography>

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
