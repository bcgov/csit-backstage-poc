import { Card, CardContent, Typography } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import type { OpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  entity: OpenApiEntity;
};

export const MainCard = ({ entity }: Props) => {
  const bcdc = entity.metadata.customMetadata;

  const description =
    bcdc?.description ?? entity.metadata.description ?? '';

  return (
    <Card>
      <CardContent>
        <MarkdownContent content={description} />

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
