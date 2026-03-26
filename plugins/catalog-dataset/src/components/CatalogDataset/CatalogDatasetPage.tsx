import { Grid, Card, CardContent, Typography, Link } from '@material-ui/core';
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
                  <Typography variant="body2">
                    <Link href="#overview">
                      Overview
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    <Link href="#about-this-dataset">
                      About this Dataset
                    </Link>
                  </Typography>
                  {entity.metadata.tags?.includes('authoritative-data-register') ? (
                  <Typography variant="body2">
                    <Link href="#authoritative-designation">
                      Authoritative Designation
                    </Link>
                  </Typography>
                  ) : null}
                  <Typography variant="body2">
                    <Link href="#access-methods">
                      Access Methods
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    <Link href="#schema">
                      Schema
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    <Link href="#fields-and-definitions">
                      Fields &amp; definitions
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    <Link href="#lineage-and-quality">
                      Lineage and Quality
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    <Link href="#versioning-and-change-governance">
                      Versioning and Change Governance
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    <Link href="#support">
                      Support
                    </Link>
                  </Typography>
                  <Typography variant="body2">
                    <Link href="#related-resources">
                      Related Resources
                    </Link>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <div id="overview">
                <MainCard
                  entity={entity}
                  spec={spec}
                  ownerLabel={ownerLabel}
                  onViewApis={() => setApisOpen(true)}
                />
              </div>

              <div id="about-this-dataset">
                <AboutDatasetCard description={spec.about?.description} />
              </div>

              {entity.metadata.tags?.includes('authoritative-data-register') ? (
                <div id="authoritative-designation">
                  <AuthoritativeDesignationCard />
                </div>
              ) : null}

              <div id="access-methods">
                <AccessMethodsCard
                  accessMethods={spec.accessMethods}
                  apiEntityRefs={apiEntityRefs}
                />
              </div>

              <div id="schema">
                <SchemaCard tables={spec.schema?.tables} />
              </div>

              <div id="fields-and-definitions">
                <FieldsAndDefinitionCard />
              </div>

              <div id="lineage-and-quality">
                <LineageAndQualityCard
                  sourceSystem={spec.lineage?.sourceSystem}
                  transformation={spec.lineage?.transformation}
                  validation={spec.quality?.validation}
                  refresh={spec.lineage?.refresh}
                  qualityControls={spec.quality?.controls}
                />
              </div>

              <div id="versioning-and-change-governance">
                <VersioningAndChangeGovernanceCard
                  currentVersion={spec.versioning?.currentVersion}
                  initialRelease={spec.versioning?.initialRelease}
                  lastUpdated={spec.versioning?.lastUpdated}
                  versioningDescription={spec.versioning?.description}
                  governanceDescription={spec.governance?.description}
                />
              </div>

              <div id="support">
                <SupportCard support={spec.support} />
              </div>

              <div id="related-resources">
                <RelatedResourcesCard
                  relatedResources={spec.relatedResources}
                />
              </div>
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