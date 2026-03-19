import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Link,
} from '@material-ui/core';

type RelatedResource = {
  url: string;
  title?: string;
};

type Props = {
  relatedResources?: RelatedResource[];
};

export const RelatedResourcesCard = ({
  relatedResources,
}: Props) => {
  return (
    <Card
      style={{
        borderRadius: 8,
        marginBottom: 16,
        border: '2px solid rgba(0,0,0,0.23)',
      }}
      variant="outlined"
    >
      <CardHeader title="Related resources" />
      <CardContent>
        {relatedResources?.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {relatedResources.map(resource => (
              <li key={`${resource.url}-${resource.title ?? ''}`}>
                <Typography variant="body2">
                  <Link
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {resource.title ?? resource.url}
                  </Link>
                </Typography>
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2">No related resources defined.</Typography>
        )}
      </CardContent>
    </Card>
  );
};