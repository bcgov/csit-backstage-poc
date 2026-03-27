import { Card, CardContent, Link, Typography } from '@material-ui/core';
import type { OpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  spec: OpenApiEntity['spec'];
};

export const RelatedResourcesCard = ({ spec }: Props) => {
  const relatedResources = spec.relatedResources ?? [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Related Resources
        </Typography>

        {relatedResources.length ? (
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {relatedResources.map(resource => (
              <li key={resource.url}>
                <Typography variant="body2">
                  <Link
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {resource.title || resource.url}
                  </Link>
                </Typography>
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2">
            —
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};