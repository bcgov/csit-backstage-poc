import {
  Entity,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  RELATION_PART_OF,
  RELATION_HAS_PART,
  parseEntityRef,
  getCompoundEntityRef,
} from '@backstage/catalog-model';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import {
  OPENAPI_API_VERSION,
  OPENAPI_KIND,
  type OpenApiEntity,
} from '@bcgov/plugin-catalog-common-bc-data-catalogue';

export class BcDataCatalogueOpenApiProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'BcDataCatalogueOpenApiProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    return (
      entity.apiVersion === OPENAPI_API_VERSION &&
      entity.kind === OPENAPI_KIND
    );
  }

  async postProcessEntity(
    entity: Entity,
    _location: unknown,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    function doEmit(
      targets: string | string[] | undefined,
      context: { defaultKind?: string; defaultNamespace: string },
      outgoingRelation: string,
      incomingRelation: string,
    ): void {
      if (!targets) {
        return;
      }
      for (const target of [targets].flat()) {
        const targetRef = parseEntityRef(target, context);
        emit(
          processingResult.relation({
            source: selfRef,
            type: outgoingRelation,
            target: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
          }),
        );
        emit(
          processingResult.relation({
            source: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
            type: incomingRelation,
            target: selfRef,
          }),
        );
      }
    }

    const openApi = entity as OpenApiEntity;
    doEmit(
      openApi.spec.owner,
      { defaultKind: 'Group', defaultNamespace: selfRef.namespace },
      RELATION_OWNED_BY,
      RELATION_OWNER_OF,
    );
    doEmit(
      openApi.spec.system,
      { defaultKind: 'System', defaultNamespace: selfRef.namespace },
      RELATION_PART_OF,
      RELATION_HAS_PART,
    );

    return entity;
  }
}