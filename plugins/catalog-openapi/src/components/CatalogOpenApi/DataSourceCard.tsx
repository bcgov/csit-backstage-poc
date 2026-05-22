import { Card, CardContent, Grid, Typography } from '@material-ui/core';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import type { OpenApiEntity } from '../../types';

type Props = {
  entity: OpenApiEntity;
};

const renderValue = (value?: string) =>
  value && value.trim() !== '' ? value : '—';

type DetailRowProps = {
  label: string;
  children: React.ReactNode;
  shaded?: boolean;
};

const DetailRow = ({ label, children, shaded }: DetailRowProps) => {
  return (
    <Grid
      container
      spacing={1}
      style={{
        backgroundColor: shaded ? '#f5f5f5' : '#ffffff',
        padding: '10px 12px',
      }}
    >
      <Grid item xs={12} sm={4}>
        <Typography variant="body2" style={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={8}>
        <Typography variant="body2">{children}</Typography>
      </Grid>
    </Grid>
  );
};

export const DataSourceCard = ({ entity }: Props) => {
  const bcdc = entity.metadata.customMetadata;

  const dataSource = bcdc?.dataSource;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Data Source
        </Typography>

        <div
          style={{
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
          }}
        >
          <DetailRow label="Dataset Name" shaded>
            {renderValue(dataSource?.apiUses)}
          </DetailRow>

          <DetailRow label="Type">{renderValue(dataSource?.type)}</DetailRow>

          <DetailRow label="Authoritative for" shaded>
            {renderValue(dataSource?.authoritativeFor)}
          </DetailRow>

          <DetailRow label="Update Frequency">
            {renderValue(dataSource?.updateFrequency)}
          </DetailRow>

          <DetailRow label="Coverage" shaded>
            {renderValue(dataSource?.provinceWideCoverage)}
          </DetailRow>

          <DetailRow label="Governance">
            {renderValue(dataSource?.governance)}
          </DetailRow>

          <DetailRow label="Dataset Record" shaded>
            {dataSource?.dataset ? (
              <EntityRefLink
                entityRef={dataSource.dataset}
                title="View Dataset Record"
              />
            ) : (
              '—'
            )}
          </DetailRow>
        </div>
      </CardContent>
    </Card>
  );
};
