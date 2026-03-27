import { Card, CardContent, Grid, Link, Typography } from '@material-ui/core';
import type { OpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  spec: OpenApiEntity['spec'];
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

const CodeBlock = ({ content }: { content?: string }) => {
  return (
    <pre
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 4,
        padding: 12,
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        margin: 0,
      }}
    >
      <code>{renderValue(content)}</code>
    </pre>
  );
};

export const TechnicalReferenceCard = ({ spec }: Props) => {
  const technicalReference = spec.technicalReference;
  const endpoints = technicalReference?.endpoints ?? [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Technical Reference
        </Typography>

        <Typography variant="body2" paragraph>
          For full endpoint and schema details{' '}
          {technicalReference?.openApiSpecUrl ? (
            <Link
              href={technicalReference.openApiSpecUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Definition
            </Link>
          ) : (
            'View Definition'
          )}{' '}
          tab.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Base URLs
        </Typography>

        {technicalReference?.baseUrls?.length ? (
          <div style={{ marginBottom: 24 }}>
            {technicalReference.baseUrls.map(baseUrl => (
              <Grid container spacing={1} key={`${baseUrl.name}-${baseUrl.description}`}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" style={{ fontWeight: 700 }}>
                    {baseUrl.name}:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Typography variant="body2">
                    {renderValue(baseUrl.description)}
                  </Typography>
                </Grid>
              </Grid>
            ))}
          </div>
        ) : (
          <Typography variant="body2" paragraph>
            —
          </Typography>
        )}

        <Typography variant="h6" gutterBottom>
          Endpoints
        </Typography>

        {endpoints.length ? (
          <div style={{ marginBottom: 24 }}>
            {endpoints.map(endpoint => {
              const hasExampleRequest =
                endpoint.exampleRequest && endpoint.exampleRequest.trim() !== '';
              const hasExampleResponse =
                endpoint.exampleResponse && endpoint.exampleResponse.trim() !== '';

              return (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  style={{
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <Typography variant="body2">
                    <strong>{endpoint.method}</strong> {endpoint.path}
                  </Typography>

                  {endpoint.authentication ? (
                    <Typography variant="body2" style={{ marginTop: 8 }}>
                      <strong>Authentication:</strong> {endpoint.authentication}
                    </Typography>
                  ) : null}

                  {hasExampleRequest ? (
                    <div style={{ marginTop: 16 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Example Request
                      </Typography>
                      <CodeBlock content={endpoint.exampleRequest} />
                    </div>
                  ) : null}

                  {hasExampleResponse ? (
                    <div style={{ marginTop: 16 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Example Response
                      </Typography>
                      <CodeBlock content={endpoint.exampleResponse} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <Typography variant="body2" paragraph>
            —
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};