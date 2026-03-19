import { Grid, Card, CardContent, Typography } from '@material-ui/core';
import { EntityLayout, EntityRelationWarning } from '@backstage/plugin-catalog';
import { useEntity } from '@backstage/plugin-catalog-react';
import type { DatasetEntity } from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useAsync } from 'react-use';
import { RELATION_PROVIDES_API } from '@backstage/catalog-model';
import { useMemo, useState } from 'react';
import { AboutDatasetCard } from './AboutDatasetCard';
import { AuthoritativeDesignationCard } from './AuthoritativeDesignationCard';
import { AccessMethodsCard } from './AccessMethodsCard';
import { SchemaCard } from './SchemaCard';
import { FieldsAndDefinitionCard } from './FieldsAndDefinitionCard';
import { MainCard } from './MainCard';
import { LineageAndQualityCard } from './LineageAndQualityCard';
import { VersioningAndChangeGovernanceCard } from './VersioningAndChangeGovernanceCard';
import { SupportCard } from './SupportCard';
import { DatasetApisDialog } from './DatasetApisDialog';
import { RelatedResourcesCard } from './RelatedResourcesCard';

export const CatalogDatasetPage = () => {
  const { entity } = useEntity();
  const spec = (entity as DatasetEntity).spec;

  const catalogApi = useApi(catalogApiRef);
  const [apisOpen, setApisOpen] = useState(false);

  const datasetTitle = entity.metadata.title ?? entity.metadata.name;

  const { value: ownerEntity } = useAsync(
    async () => {
      if (!spec.owner) {
        return undefined;
      }
      return await catalogApi.getEntityByRef(spec.owner);
    },
    [catalogApi, spec.owner],
  );

  const ownerLabel =
    (ownerEntity?.spec?.profile as { displayName?: string } | undefined)?.displayName ??
    ownerEntity?.metadata.title ??
    ownerEntity?.metadata.name ??
    spec.owner;

  const apiEntityRefs = useMemo(() => {
    const refs =
      entity.relations
        ?.filter(relation => relation.type === RELATION_PROVIDES_API)
        .map(relation => relation.targetRef) ??
      spec.providesApis ??
      [];

    return [...new Set(refs)];
  }, [entity.relations, spec.providesApis]);

  return (
    <EntityLayout>
      <EntityLayout.Route path="/" title="Overview">
        <>
          <EntityRelationWarning />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" style={{ marginBottom: 8 }}>
                    On this page
                  </Typography>
                  <Typography variant="body2">Overview</Typography>
                  <Typography variant="body2">About this Dataset</Typography>
                  <Typography variant="body2">Authoritative Designation</Typography>
                  <Typography variant="body2">Access Methods</Typography>
                  <Typography variant="body2">Schema</Typography>
                  <Typography variant="body2">Fields &amp; definitions</Typography>
                  <Typography variant="body2">Lineage and Quality</Typography>
                  <Typography variant="body2">
                    Versioning and Change Governance
                  </Typography>
                  <Typography variant="body2">Support</Typography>
                  <Typography variant="body2">Related Resources</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <MainCard
                entity={entity}
                spec={spec}
                ownerLabel={ownerLabel}
                onViewApis={() => setApisOpen(true)}
              />

              <AboutDatasetCard description={spec.about?.description} />

              {entity.metadata.tags?.includes('authoritative-data-register') ? (
                <AuthoritativeDesignationCard />
              ) : null}

              <AccessMethodsCard
                accessMethods={spec.accessMethods}
                apiEntityRefs={apiEntityRefs}
              />

              <SchemaCard tables={spec.schema?.tables} />

              <FieldsAndDefinitionCard />

              <LineageAndQualityCard
                sourceSystem={spec.lineage?.sourceSystem}
                transformation={spec.lineage?.transformation}
                refresh={spec.lineage?.refresh}
              />

              <VersioningAndChangeGovernanceCard
                currentVersion={spec.versioning?.currentVersion}
                initialRelease={spec.versioning?.initialRelease}
                lastUpdated={spec.versioning?.lastUpdated}
                versioningDescription={spec.versioning?.description}
                governanceDescription={spec.governance?.description}
              />

              <SupportCard support={spec.support} />

              <RelatedResourcesCard
                relatedResources={spec.relatedResources}
              />
            </Grid>
          </Grid>

          <DatasetApisDialog
            open={apisOpen}
            onClose={() => setApisOpen(false)}
            datasetTitle={datasetTitle}
            apiEntityRefs={apiEntityRefs}
            namespace={entity.metadata.namespace}
          />
        </>
      </EntityLayout.Route>
    </EntityLayout>
  );
};