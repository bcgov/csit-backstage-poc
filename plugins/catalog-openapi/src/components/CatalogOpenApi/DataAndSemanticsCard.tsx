import { Card, CardContent, Grid, Typography } from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import type { OpenApiEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';

type Props = {
  entity: OpenApiEntity;
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

export const DataAndSemanticsCard = ({ entity }: Props) => {
  const bcdc = entity.metadata.customMetadata;

  const dataAndSemantics = bcdc?.dataAndSemantics;
  const schemas = dataAndSemantics?.dataReturned ?? [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Data and Semantics
        </Typography>

        <Typography variant="body2" paragraph>
          Understand the data returned by this API and its semantics.
        </Typography>

        <Typography variant="h6" gutterBottom>
          Data Returned
        </Typography>

        {schemas.length ? (
          schemas.map(schema => (
            <div key={schema.name} style={{ marginBottom: 24 }}>
              <Typography variant="subtitle1" style={{ fontWeight: 700 }}>
                {renderValue(schema.label || schema.name)}
              </Typography>

              {schema.description ? (
                <MarkdownContent content={schema.description} />
              ) : null}

              {schema.fields?.length ? (
                <div
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginTop: 8,
                  }}
                >
                  <Grid
                    container
                    spacing={1}
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '10px 12px',
                    }}
                  >
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" style={{ fontWeight: 700 }}>
                        Field Name
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" style={{ fontWeight: 700 }}>
                        Type
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" style={{ fontWeight: 700 }}>
                        Description
                      </Typography>
                    </Grid>
                  </Grid>

                  {schema.fields.map((field, index) => (
                    <Grid
                      container
                      spacing={1}
                      key={`${schema.name}-${field.name}`}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                        padding: '10px 12px',
                      }}
                    >
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2">
                          {renderValue(field.name)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2">
                          {renderValue(field.type)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2">
                          {renderValue(field.description)}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
                </div>
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </div>
          ))
        ) : (
          <Typography variant="body2" paragraph>
            —
          </Typography>
        )}

        {dataAndSemantics?.dataReturnedNote ? (
          <Typography variant="body2" paragraph>
            <strong>Note:</strong> {dataAndSemantics.dataReturnedNote}
          </Typography>
        ) : null}

        <Typography variant="h6" gutterBottom>
          Authoritative Data Source
        </Typography>

        {dataAndSemantics?.authoritativeDataSource ? (
          <MarkdownContent content={dataAndSemantics.authoritativeDataSource} />
        ) : (
          <Typography variant="body2" paragraph>
            —
          </Typography>
        )}

        <Typography variant="h6" gutterBottom>
          Field Definitions
        </Typography>

        {dataAndSemantics?.fieldDefinitions ? (
          <MarkdownContent content={dataAndSemantics.fieldDefinitions} />
        ) : (
          <Typography variant="body2">—</Typography>
        )}
      </CardContent>
    </Card>
  );
};
