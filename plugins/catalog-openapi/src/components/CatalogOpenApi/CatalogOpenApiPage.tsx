import { Grid, Card, CardContent, Typography, Link } from '@material-ui/core';

import { EntityRelationWarning } from '@backstage/plugin-catalog';

import { useEntity } from '@backstage/plugin-catalog-react';
import { isOpenApiEntity } from '../../types';

import { MainCard } from './MainCard';

import { PartOfConnectedServices } from './PartOfConnectedServices';

import { AboutThisApiCard } from './AboutThisApiCard';

import { AccessOverviewCard } from './AccessOverviewCard';

import { DataSourceCard } from './DataSourceCard';

import { AccessAndOnboardingCard } from './AccessAndOnboardingCard';

import { TechnicalReferenceCard } from './TechnicalReferenceCard';
import { DataAndSemanticsCard } from './DataAndSemanticsCard';

import { VersioningAndChangeGovernanceCard } from './VersioningAndChangeGovernanceCard';

import { SupportCard } from './SupportCard';

import { RelatedResourcesCard } from './RelatedResourcesCard';

export const CatalogOpenApiDetailsContent = () => {
  const { entity } = useEntity();

  if (!isOpenApiEntity(entity)) {
    return null;
  }

  const apiEntity = entity;

  return (
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
                <Link href="#overview">Overview</Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#about-this-api">About this API</Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#data-source">Data Source</Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#access-and-onboarding">
                  Access and Onboarding
                </Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#technical-reference">Technical Reference</Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#data-and-semantics">Data and Semantics</Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#versioning-and-change-governance">
                  Versioning and Change Governance
                </Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#support">Support</Link>
              </Typography>

              <Typography variant="body2">
                <Link href="#related-resources">Related Resources</Link>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <div id="overview">
            <MainCard entity={apiEntity} />
          </div>

          <div style={{ marginTop: 24 }}>
            <PartOfConnectedServices entity={apiEntity} />
          </div>

          <div style={{ marginTop: 24 }}>
            <AccessOverviewCard entity={apiEntity} />
          </div>

          <div id="about-this-api" style={{ marginTop: 24 }}>
            <AboutThisApiCard entity={apiEntity} />
          </div>

          <div id="data-source" style={{ marginTop: 24 }}>
            <DataSourceCard entity={apiEntity} />
          </div>

          <div id="access-and-onboarding" style={{ marginTop: 24 }}>
            <AccessAndOnboardingCard entity={apiEntity} />
          </div>

          <div id="technical-reference" style={{ marginTop: 24 }}>
            <TechnicalReferenceCard entity={apiEntity} />
          </div>

          <div id="data-and-semantics" style={{ marginTop: 24 }}>
            <DataAndSemanticsCard entity={apiEntity} />
          </div>

          <div id="versioning-and-change-governance" style={{ marginTop: 24 }}>
            <VersioningAndChangeGovernanceCard entity={apiEntity} />
          </div>

          <div id="support" style={{ marginTop: 24 }}>
            <SupportCard entity={apiEntity} />
          </div>

          <div id="related-resources" style={{ marginTop: 24 }}>
            <RelatedResourcesCard entity={apiEntity} />
          </div>
        </Grid>
      </Grid>
    </>
  );
};
