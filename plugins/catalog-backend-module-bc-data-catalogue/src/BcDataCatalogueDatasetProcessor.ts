import {
  Entity,
  RELATION_PROVIDES_API,
  parseEntityRef,
} from '@backstage/catalog-model';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import {
  DATASET_API_VERSION,
  DATASET_KIND,
  type DatasetEntity,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';

export class BcDataCatalogueDatasetProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'BcDataCatalogueDatasetProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    return (
      entity.apiVersion === DATASET_API_VERSION &&
      entity.kind === DATASET_KIND
    );
  }

  async postProcessEntity(
    entity: Entity,
    _location: unknown,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    const dataset = entity as DatasetEntity;

    const datasetRef = {
      kind: dataset.kind,
      namespace: dataset.metadata.namespace ?? 'default',
      name: dataset.metadata.name,
    };

    for (const apiRef of dataset.spec.providesApis ?? []) {
      
      emit(
        processingResult.relation({
          source: datasetRef,
          type: RELATION_PROVIDES_API,
          target: parseEntityRef(apiRef),
        }),
      );
    }

    return entity;
  }
}