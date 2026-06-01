import {
  Entity,
  GroupEntity,
  SystemEntity,
  UserEntity,
} from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  BcDataCatalogueSchemaUtils,
  type DatasetEntity,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import type {
  BcDataCataloguePackage,
  BcOrganization,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';
import { BcDataCatalogueNaming } from './BcDataCatalogueNaming';
import {
  BcDataCatalogueResourceFactory,
  type ProcessedBcDataCatalogueResources,
} from './BcDataCatalogueResourceFactory';
import { UrlReaderService } from './BcDataCatalogueUrlReader';
import { DatasetEntityBuilder } from './builders/DatasetEntityBuilder';
import { GroupEntityBuilder } from './builders/GroupEntityBuilder';
import { SystemEntityBuilder } from './builders/SystemEntityBuilder';
import { UserEntityBuilder } from './builders/UserEntityBuilder';

type BcDataCatalogueEntityFactoryOptions = {
  reader: UrlReaderService;
  logger: LoggerService;
};

export class BcDataCatalogueEntityFactory {
  private readonly logger: LoggerService;
  private readonly naming: BcDataCatalogueNaming;
  private readonly datasetEntityBuilder: DatasetEntityBuilder;
  private readonly groupEntityBuilder: GroupEntityBuilder;
  private readonly resourceFactory: BcDataCatalogueResourceFactory;
  private readonly systemEntityBuilder: SystemEntityBuilder;
  private readonly userEntityBuilder: UserEntityBuilder;

  constructor(options: BcDataCatalogueEntityFactoryOptions) {
    this.logger = options.logger;
    this.naming = new BcDataCatalogueNaming();
    this.datasetEntityBuilder = new DatasetEntityBuilder({
      naming: this.naming,
    });
    this.groupEntityBuilder = new GroupEntityBuilder({
      naming: this.naming,
    });
    this.resourceFactory = new BcDataCatalogueResourceFactory({
      reader: options.reader,
      logger: this.logger,
      naming: this.naming,
      schemaUtils: new BcDataCatalogueSchemaUtils(),
    });
    this.systemEntityBuilder = new SystemEntityBuilder({
      naming: this.naming,
    });
    this.userEntityBuilder = new UserEntityBuilder({
      naming: this.naming,
    });
  }

  async createEntities(
    allPackages: BcDataCataloguePackage[],
  ): Promise<Entity[]> {
    this.logger.info('[BCDC Entity Factory] <createEntities');

    const allEntities: Entity[] = [];
    const allGroups = new Map<string, GroupEntity>();

    const bcGovGroupId = this.naming.getGroupId('gov.bc.ca');
    allGroups.set(
      bcGovGroupId,
      this.groupEntityBuilder.build({
        hostName: 'gov.bc.ca',
        displayName: 'Government of British Columbia',
      }),
    );

    const allOrganizations = new Map<string, BcOrganization>();
    allPackages.forEach(pkg => {
      allOrganizations.set(pkg.organization.id, pkg.organization);
    });

    const allSystems = new Map<string, SystemEntity>();
    this.logger.info(
      `[BCDC Entity Factory] Organizations ${allOrganizations.size}`,
    );

    allOrganizations.forEach(organization => {
      const organizationGroupId = this.naming.getGroupId(organization.name);

      if (!allGroups.has(organizationGroupId)) {
        allGroups.set(
          organizationGroupId,
          this.groupEntityBuilder.build({
            hostName: organization.name,
            displayName: organization.title,
            parentGroup: bcGovGroupId,
          }),
        );
      }

      const systemEntity = this.systemEntityBuilder.build({
        organization,
        ownerGroupId: organizationGroupId,
      });

      allSystems.set(this.naming.getSystemId(organization.name), systemEntity);
    });

    const allUsers = new Map<string, UserEntity>();

    allPackages.forEach(pkg => {
      pkg.contacts?.forEach(contact => {
        const email = contact.email.toLowerCase();

        let user: UserEntity | undefined = allUsers.get(email);

        if (user === undefined) {
          user = this.userEntityBuilder.build({ email });
          allUsers.set(this.naming.getUserId(email), user);
        }

        if (user.spec.profile?.displayName === undefined) {
          user.spec.profile!.displayName = contact.name;
        }

        const hostName = this.getEmailHostname(email);

        if (hostName === undefined) {
          this.logger.warn(
            `[BCDC Entity Factory] Failed to extract hostname from email address ${email}`,
          );
        } else {
          const groupId = this.naming.getGroupId(hostName);
          let group = allGroups.get(groupId);

          if (group === undefined) {
            group = this.groupEntityBuilder.build({
              hostName,
              displayName: hostName,
              parentGroup: bcGovGroupId,
            });
            allGroups.set(groupId, group);
          }

          if (!user.spec.memberOf?.includes(groupId)) {
            user.spec.memberOf?.push(groupId);
          }
        }
      });
    });

    const allDatasets = new Map<string, DatasetEntity>();
    const resourceDerivedEntities: Entity[] = [];

    for (const pkg of allPackages) {
      const safeName = this.naming.toSafeName(pkg.name);
      const datasetEntityRef = this.naming.getDatasetId(safeName);
      const systemId = this.naming.getSystemId(pkg.organization.name);
      const ownerGroupId = this.naming.getGroupId(pkg.organization.name);
      const bcdcDatasetUrl = `https://catalogue.data.gov.bc.ca/dataset/${pkg.name}`;
      const processedResources =
        await this.resourceFactory.processPackageResources({
          pkg,
          datasetEntityRef,
          ownerGroupId,
          systemId,
          bcdcDatasetUrl,
        });

      resourceDerivedEntities.push(...processedResources.entities);

      const datasetEntity = this.datasetEntityBuilder.build({
        pkg,
        safeName,
        ownerGroupId,
        systemId,
        providesApis: processedResources.providesApis,
        accessMethods: processedResources.accessMethods,
        relatedResources: processedResources.relatedResources,
        schema: processedResources.schema,
        bcdcDatasetUrl,
      });

      this.applyResourceTags(datasetEntity, processedResources);

      allDatasets.set(this.naming.getComponentId(safeName), datasetEntity);
    }

    const userEntities: UserEntity[] = Array.from(allUsers.values());
    const groupEntities: GroupEntity[] = Array.from(allGroups.values());
    const systemEntities: SystemEntity[] = Array.from(allSystems.values());
    const datasetEntities: DatasetEntity[] = Array.from(allDatasets.values());

    allEntities.push(...userEntities);
    allEntities.push(...groupEntities);
    allEntities.push(...systemEntities);
    allEntities.push(...datasetEntities);
    allEntities.push(...resourceDerivedEntities);

    this.logger.info(
      `[BCDC Entity Factory] >createEntities ${allEntities.length}`,
    );

    return allEntities;
  }

  private applyResourceTags(
    datasetEntity: DatasetEntity,
    processedResources: ProcessedBcDataCatalogueResources,
  ): void {
    for (const tag of processedResources.datasetTags) {
      this.addTag(datasetEntity, tag);
    }
  }

  private addTag(datasetEntity: DatasetEntity, tag: string): void {
    if (datasetEntity.metadata.tags?.includes(tag)) {
      return;
    }

    datasetEntity.metadata.tags = [...(datasetEntity.metadata.tags ?? []), tag];
  }

  private getEmailHostname(email: string): string | undefined {
    const match = email
      .trim()
      .toLowerCase()
      .match(/@([\w.-]+)/);

    return match ? match[1] : undefined;
  }
}
