import { Card, CardContent, Grid, Typography } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import type { OpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  spec: OpenApiEntity['spec'];
};

type SectionBoxProps = {
  title: string;
  content?: string;
  backgroundColor?: string;
};

const SectionBox = ({ title, content, backgroundColor }: SectionBoxProps) => {
  return (
    <Card
      variant="outlined"
      style={{
        backgroundColor,
        height: '100%',
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 700 }}>
          {title}
        </Typography>

        {content ? (
          <MarkdownContent content={content} />
        ) : (
          <Typography variant="body2">—</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const AboutThisApiCard = ({ spec }: Props) => {
  const about = spec.about;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          About this API
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6} style={{ paddingLeft: 0 }}>
            <SectionBox
              title="Intended Use"
              content={about?.intendedUse}
              backgroundColor="#eef6fb"
            />
          </Grid>

          <Grid item xs={12} md={6} style={{ paddingRight: 0 }}>
            <SectionBox
              title="Not Intended For"
              content={about?.notIntendedFor}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};