# BC Data Catalog Gaps

This document records the current implementation mapping from BC Data Catalogue (BCDC) package/resource fields into Backstage catalog entities.

The implementation currently creates:

- a custom `Dataset` entity using `apiVersion: bcgov.io/v1alpha1` and `kind: Dataset`;
- built-in Backstage `API` entities using `apiVersion: backstage.io/v1alpha1` and `kind: API`;
- related `Group`, `System`, and `User` entities used for ownership and organization structure.

`GAP` means the field is present in the implemented entity shape but is not currently populated from BCDC or OpenAPI source data.

## Implementation notes

### Ownership and supporting entities

| Implemented behaviour | Source | Backstage mapping | Notes / gaps |
|---|---|---|---|
| Government of British Columbia parent group | hardcoded `gov.bc.ca` | `Group` | Serves as the parent Organization group |
| Organization group | `pkg.organization.name`, `pkg.organization.title` | `Group` | Organization groups are children of the `gov.bc.ca` group. |
| Organization system | `pkg.organization` | `System` | Dataset and API entities reference this system. |
| Contact users | `pkg.contacts[].email`, `pkg.contacts[].name` | `User` | Contact users are created and associated to groups by email host. Contact details are **not** currently used to populate Dataset/API support channel fields. |

### API resource detection

| Implemented behaviour | Source / logic | Result | Notes / gaps |
|---|---|---|---|
| Extract definition URL | `resource.url`; if URL contains query parameter `url`, use that nested value | candidate definition URL | Invalid or blank URLs are ignored. |
| Detect OpenAPI candidates | `resource.format === 'openapi-json'`, or `resource.bcdc_type === 'webservice'` with `json`, `xml`, or `html` format and URL that appears OpenAPI-related | candidate may become OpenAPI-backed `API` | The definition is fetched and parsed before being treated as OpenAPI. |
| Exclude non-API resources from API creation | non-`webservice` resources, plus `kml`, `wms`, `arcgis_rest`, and `xml` generic resources | no `API` entity | These may still appear on the Dataset as access methods / related resources. |
| De-duplicate OpenAPI resources | normalized definition URL | reuse existing OpenAPI-backed `API` entity | Dataset `spec.providesApis` points at the reused API entity. |
| Generic API resources | qualifying `webservice` resources that are not parsed as OpenAPI | built-in `API` entity | `spec.definition` is the resource URL or nested definition URL, not parsed OpenAPI content. |

## BC Data Catalog → Backstage Dataset UI Mapping

### Actual implemented mapping

| UI section | UI property | BC Data Catalog source | Transformation / logic | Backstage mapping | Notes / gaps |
|---|---|---|---|---|---|
| **main** | title | `pkg.title` or `pkg.name` | fallback to package name | `entity.metadata.title` | Implemented. |
| **main** | description | `pkg.notes` | fallback to `No description available` | `entity.metadata.description`; also `entity.spec.description` | Implemented. |
| **main** | tags | `pkg.tags[].display_name` | normalized through `BcDataCatalogueNaming.toSafeName` | `entity.metadata.tags` | Additional implementation tags are added: `has-schema` / `has-no-schema`, schema table count buckets, and factory-added `has-api` / `has-openapi`.  These tags are added to make it easier to find examples in the Catalog during development and demonstrations |
| **main** | Part of Connected Services | none | hardcoded `GAP` | `entity.spec.connectedServicesDescription` | Gap. |
| **main** | Learn more | BCDC dataset URL and `pkg.more_info[]` | always adds BC Data Catalogue Record link; appends `more_info` links | `entity.metadata.links` | Implemented. |
| **main** | Type | none | hardcoded `GAP` | `entity.spec.type` | Gap. |
| **main** | Custodian | `pkg.organization.name`, `pkg.organization.title` | organization is mapped to a Backstage group | `entity.spec.owner` | Implemented as owner group id, not display title. |
| **main** | System | `pkg.organization.name` | organization is mapped to a Backstage system | `entity.spec.system` | Implemented. |
| **main** | Status | `pkg.publish_state` | `PUBLISHED` → `Published`; `PENDING ARCHIVE` → `Pending Archive`; otherwise `Unknown` | `entity.spec.status` | Implemented. |
| **main** | Security Classification | `pkg.security_class` | normalized to `Public`, `Protected A`, `Protected B`, `Protected C`, or `Unknown` | `entity.spec.securityClassification` | Implemented. |
| **main** | Data quality Score | none | hardcoded `GAP` | `entity.spec.quality.score` | Gap. |
| **main** | Update frequency | none at dataset level | hardcoded `GAP` | `entity.spec.updateFrequency` | Gap. Resource-level update frequency is captured on access methods. |
| **main** | Retention | none | hardcoded `GAP` | `entity.spec.governance.retention` | Gap. |
| **main** | View APIs | qualifying API resources | API entity refs are accumulated during factory processing | `entity.spec.providesApis` | Implemented. Factory appends refs for generic API and OpenAPI-backed API entities. |
| **main** | Technical documentation | none | not populated | none | Gap. No `backstage.io/techdocs-ref` annotation is currently set. |
| **main** | Download schema | BCDC resource details | no download endpoint is implemented | none | Gap. Schema is embedded in `spec.schema`; no downloadable schema link is created. |
| **main** | Need help? | none | not populated | none | Gap. Contacts are used to create `User` entities, not support channel values. |
| **About this Dataset** | description | `pkg.purpose` | fallback to `No description available` | `entity.spec.about.description` | Implemented. |
| **Authoritative Designation** | authoritative for | none | hardcoded `GAP` | `entity.spec.authoritativeDesignation.authoritativeFor` | Gap. |
| **Access Methods** | APIs | qualifying API resources | represented as API entity refs | `entity.spec.providesApis` | Implemented. |
| **Access Methods** | other | `pkg.resources[]` | excludes resources where `bcdc_type === 'geographic'`; includes id, title, description, url, type, format, updateFrequency | `entity.spec.accessMethods[]` | Implemented. Geographic resources are intentionally filtered out. |
| **Schema** | table name | `resource.object_name` or `resource.name` | only resources where `resource_type === 'data'` and `details[]` exists; de-duplicates by table key; sorted by `resource.position` | `entity.spec.schema.tables[].name` | Implemented. |
| **Schema** | field name | `resource.details[].column_name` | direct | `entity.spec.schema.tables[].fields[].columnName` | Implemented. |
| **Schema** | type | `resource.details[].data_type` | omitted if blank | `entity.spec.schema.tables[].fields[].dataType` | Implemented. |
| **Schema** | precision | `resource.details[].data_precision` | converted to string when present | `entity.spec.schema.tables[].fields[].dataPrecision` | Implemented. |
| **Schema** | short name | `resource.details[].short_name` | omitted if blank | `entity.spec.schema.tables[].fields[].shortName` | Implemented. |
| **Schema** | description | `resource.details[].column_comments` | omitted if blank | `entity.spec.schema.tables[].fields[].columnComments` | Implemented. |
| **Fields & definitions** | field name / definition / semantic domain / meaning of values / business rules / relationships / governance | none | not populated | `entity.spec.entityDefinitions` exists in the type but builder does not populate it | Gap. |
| **Lineage and Quality** | Source System | none | hardcoded `GAP` | `entity.spec.lineage.sourceSystem` | Gap. |
| **Lineage and Quality** | Transformation | `pkg.lineage_statement` | fallback to `No transformation information available` | `entity.spec.lineage.transformation` | Implemented. |
| **Lineage and Quality** | Validation | none | hardcoded `GAP` | `entity.spec.quality.validation` | Gap. |
| **Lineage and Quality** | Lineage refresh | none | hardcoded `GAP` | `entity.spec.lineage.refresh` | Gap. |
| **Lineage and Quality** | Quality controls include | none | hardcoded `[GAP]` | `entity.spec.quality.controls[]` | Gap. |
| **Versioning and Change Governance** | Current Version | none | hardcoded `GAP` | `entity.spec.versioning.currentVersion` | Gap. BCDC package version is retained as an annotation but not mapped here. |
| **Versioning and Change Governance** | Initial Release | `pkg.record_publish_date` | direct | `entity.spec.versioning.initialRelease` | Implemented. |
| **Versioning and Change Governance** | Last Updated | `pkg.record_last_modified` | direct | `entity.spec.versioning.lastUpdated` | Implemented. |
| **Versioning and Change Governance** | description | none | hardcoded `GAP` | `entity.spec.versioning.description` | Gap. |
| **Versioning and Change Governance** | Governance and Usage Constraints | none | not populated separately | none | Gap. Only `spec.governance.description` exists and is hardcoded `GAP`. |
| **Support** | description | `pkg.organization.description` | direct | `entity.spec.support.description` | Implemented. |
| **Support** | Dataset Ownership - Data Custodian | `pkg.organization.title` | direct | `entity.spec.support.dataCustodian` | Implemented. Canonical ownership is still `spec.owner`. |
| **Support** | Dataset Ownership - Governance Authority | none | hardcoded `GAP` | `entity.spec.support.governanceAuthority` | Gap. |
| **Support** | Support Pathways | none | hardcoded `GAP` | `entity.spec.support.pathways` | Gap. |
| **Support** | Data and Semantics - description | none | hardcoded `GAP` | `entity.spec.support.dataAndSemantics.description` | Gap. |
| **Support** | Data and Semantics - Channel | none | hardcoded `GAP` | `entity.spec.support.dataAndSemantics.channel` | Gap. Contacts are not currently selected by role for this value. |
| **Support** | Data and Semantics - Response time | none | hardcoded `GAP` | `entity.spec.support.dataAndSemantics.responseTime` | Gap. |
| **Support** | Data and Semantics - Escalation | none | hardcoded `GAP` | `entity.spec.support.dataAndSemantics.escalation` | Gap. |
| **Support** | Access and Integration - description | none | hardcoded `GAP` | `entity.spec.support.accessAndIntegration.description` | Gap. |
| **Support** | Access and Integration - Channel | none | hardcoded `GAP` | `entity.spec.support.accessAndIntegration.channel` | Gap. Contacts are not currently selected by role for this value. |
| **Support** | Access and Integration - Response time | none | hardcoded `GAP` | `entity.spec.support.accessAndIntegration.responseTime` | Gap. |
| **Support** | Access and Integration - Escalation | none | hardcoded `GAP` | `entity.spec.support.accessAndIntegration.escalation` | Gap. |
| **Support** | Governance and Production Escalation - description | none | hardcoded `GAP` | `entity.spec.support.governanceAndProductionEscalation.description` | Gap. |
| **Support** | Governance and Production Escalation - Channel | none | hardcoded `GAP` | `entity.spec.support.governanceAndProductionEscalation.channel` | Gap. Contacts are not currently selected by role for this value. |
| **Support** | Governance and Production Escalation - Reference dataset name + version + environment | none | hardcoded `GAP` | `entity.spec.support.governanceAndProductionEscalation.referenceDataset` | Gap. |
| **Support** | Governance and Production Escalation - Response time | none | hardcoded `GAP` | `entity.spec.support.governanceAndProductionEscalation.responseTime` | Gap. |
| **Related resources** | links | `pkg.more_info[]` and `pkg.resources[]` | excludes geographic resources; includes URL and title | `entity.spec.relatedResources[]` | Implemented. This duplicates some links also present in `metadata.links` / access methods. |
| **Annotations** | package metadata | many `pkg.*` fields | stored as strings; missing optional values often become `Unknown` | `entity.metadata.annotations['bcdata.gov.bc.ca/package-*']` | Implemented. Useful for traceability but not necessarily rendered in UI. |
| **Annotations** | managed by location | BCDC dataset URL | `url:${bcdcDatasetUrl}` | `backstage.io/managed-by-location`; `backstage.io/managed-by-origin-location` | Implemented. |

## BC Data Catalog → Backstage API UI Mapping

### Actual implemented mapping

The implementation creates built-in Backstage `API` entities for both OpenAPI-backed resources and generic BCDC webservice resources. OpenAPI-backed APIs carry additional UI-oriented data in `entity.metadata.customMetadata`.

| UI section | UI property | BC Data Catalog / OpenAPI source | Transformation / logic | Backstage mapping | Notes / gaps |
|---|---|---|---|---|---|
| **main** | entity kind | implementation | built-in Backstage API | `apiVersion: backstage.io/v1alpha1`, `kind: API` | Implemented. The previous custom `OpenApi` kind is not used for created OpenAPI resources in this branch. |
| **main** | title | OpenAPI `info.title` or `apiResource.name` | OpenAPI-backed APIs append `v{info.version}` and `OAS/Swagger {specificationVersion}` when available | `entity.metadata.title` | Implemented for OpenAPI-backed APIs. Generic API uses `apiResource.name` directly. |
| **main** | description | OpenAPI `info.description` or `apiResource.description` | fallback to `No description available` | `entity.metadata.description`; OpenAPI also `entity.metadata.customMetadata.description` | Implemented. |
| **main** | tags | OpenAPI `tags[].name` | normalized and de-duplicated | `entity.metadata.tags` | Implemented for OpenAPI-backed APIs. Generic API tags contain normalized `apiResource.format`. |
| **main** | Part of Connected Services | none | hardcoded `GAP` | `entity.metadata.customMetadata.connectedServicesDescription` | Gap. OpenAPI-backed only. |
| **main** | Learn more | OpenAPI `externalDocs` | de-duplicated links | `entity.metadata.links` | Implemented for OpenAPI-backed APIs. Generic API links include BCDC record and resource URL. |
| **main** | Provider Ministry | none | hardcoded `GAP` | `entity.metadata.customMetadata.providerMinistry` | Gap. Organization ownership is represented by `spec.owner`, but ministry is not independently mapped. |
| **main** | Owner | `pkg.organization.name` | organization group id | `entity.spec.owner` | Implemented. |
| **main** | System | `pkg.organization.name` | organization system id | `entity.spec.system` | Implemented. |
| **main** | Type | implementation / resource | OpenAPI-backed APIs use `openapi`; generic APIs use `apiResource.bcdc_type` | `entity.spec.type` | Implemented. |
| **main** | Lifecycle / status | implementation | lifecycle hardcoded to `production`; UI status hardcoded to `GAP` for OpenAPI-backed APIs | `entity.spec.lifecycle`; `entity.metadata.customMetadata.status` | Backstage lifecycle implemented; design-level status remains gap. |
| **main** | Security Classification | `pkg.security_class` | normalized to `Public`, `Protected A`, `Protected B`, `Protected C`, or `Unknown` | `entity.metadata.customMetadata.securityClassification` | Implemented for OpenAPI-backed APIs only. Generic API has package/resource annotations but no custom metadata field. |
| **main** | Application | none | hardcoded `GAP` | `entity.metadata.customMetadata.application` | Gap. |
| **main** | SDX Required | OpenAPI tags | `secure-data-exchange` tag → `Yes`; otherwise `No` | `entity.metadata.customMetadata.sdxRequired` | Implemented for OpenAPI-backed APIs. Uses exact normalized comparison against `secure-data-exchange`. |
| **main** | Environments | OpenAPI 3 `servers[]`; Swagger 2 `schemes`, `host`, `basePath` | infers environment labels such as Dev/Test/Prod from URL or description | `entity.metadata.customMetadata.environments[]` | Implemented for OpenAPI-backed APIs. |
| **main** | Access Model | none | hardcoded `GAP` | `entity.metadata.customMetadata.accessModel` | Gap. |
| **URLs** | BCDC resource URL | generated from package/resource ids | `https://catalogue.data.gov.bc.ca/dataset/{pkg.name}/resource/{apiResource.id}` | `entity.metadata.customMetadata.urls.bcdcDatasetResourceUrl`; `metadata.links[]` for generic API | Implemented. |
| **URLs** | OpenAPI spec URL | extracted from `apiResource.url` or nested `url` query parameter | direct | `entity.metadata.customMetadata.urls.openapiSpecUrl`; `entity.metadata.customMetadata.technicalReference.openApiSpecUrl` | Implemented for OpenAPI-backed APIs. |
| **About this API** | Intended Use | none | hardcoded `GAP` | `entity.metadata.customMetadata.about.intendedUse` | Gap. |
| **About this API** | Not Intended For | none | hardcoded `GAP` | `entity.metadata.customMetadata.about.notIntendedFor` | Gap. |
| **Data Source** | This API uses | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataSource.apiUses` | Gap. |
| **Data Source** | Type | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataSource.type` | Gap. |
| **Data Source** | Authoritative for | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataSource.authoritativeFor` | Gap. |
| **Data Source** | update frequency | `apiResource.resource_update_cycle` | direct, fallback blank string | `entity.metadata.customMetadata.dataSource.updateFrequency` | Implemented for OpenAPI-backed APIs. |
| **Data Source** | Province-wide coverage | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataSource.provinceWideCoverage` | Gap. |
| **Data Source** | Governance | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataSource.governance` | Gap. |
| **Data Source** | View Dataset Record | parent dataset entity ref | generated by factory from package name | `entity.metadata.customMetadata.dataSource.dataset` | Implemented for OpenAPI-backed APIs. |
| **Access and Onboarding** | description | none | hardcoded `GAP` | `entity.metadata.customMetadata.accessAndOnboarding.description` | Gap. |
| **Access and Onboarding** | Environments | OpenAPI environments | maps name, url, description; fallback description `--` in this section | `entity.metadata.customMetadata.accessAndOnboarding.environments[]` | Implemented for OpenAPI-backed APIs. |
| **Technical Reference** | View OpenAPI description | `apiResource.url` / extracted definition URL | direct | `entity.metadata.customMetadata.technicalReference.openApiSpecUrl` | Implemented for OpenAPI-backed APIs. |
| **Technical Reference** | Base URLs | OpenAPI environments | maps label/url into base URL entries | `entity.metadata.customMetadata.technicalReference.baseUrls[]` | Implemented for OpenAPI-backed APIs. |
| **Technical Reference** | Endpoint | OpenAPI `paths` operations | extracts path, method, summary, description | `entity.metadata.customMetadata.technicalReference.endpoints[]` | Implemented for OpenAPI-backed APIs. |
| **Technical Reference** | Authentication | OpenAPI security schemes / operation security | summarizes OAuth2, OIDC, mTLS, API key, HTTP auth, etc. | `entity.metadata.customMetadata.technicalReference.authentication`; endpoint-level `authentication` | Implemented for OpenAPI-backed APIs. |
| **Technical Reference** | Example Request | OpenAPI request body / parameter examples | JSON stringifies non-string examples | `entity.metadata.customMetadata.technicalReference.endpoints[].exampleRequest` | Implemented when examples are present in the OpenAPI document. |
| **Technical Reference** | Example Response | OpenAPI response examples / schema examples | JSON stringifies non-string examples | `entity.metadata.customMetadata.technicalReference.endpoints[].exampleResponse` | Implemented when examples are present in the OpenAPI document. |
| **Data and Semantics** | Data returned | OpenAPI schemas | only object schemas are included; extracts field name, type, format, required, description | `entity.metadata.customMetadata.dataAndSemantics.dataReturned[]` | Implemented for OpenAPI-backed APIs. |
| **Data and Semantics** | Data returned note | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataAndSemantics.dataReturnedNote` | Gap. |
| **Data and Semantics** | Authoritative Data source | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataAndSemantics.authoritativeDataSource` | Gap. |
| **Data and Semantics** | Field Definitions | none | hardcoded `GAP` | `entity.metadata.customMetadata.dataAndSemantics.fieldDefinitions` | Gap. OpenAPI schema field descriptions may partially cover this, but the mapped design field remains a gap. |
| **Versioning and Change Governance** | Current Version | OpenAPI `info.version` | direct, fallback blank string | `entity.metadata.customMetadata.versioningAndChangeGovernance.currentVersion` | Implemented for OpenAPI-backed APIs. |
| **Versioning and Change Governance** | Initial Release | `apiResource.created` | direct, fallback blank string | `entity.metadata.customMetadata.versioningAndChangeGovernance.initialRelease` | Implemented, but this is BCDC resource creation date, not necessarily API release date. |
| **Versioning and Change Governance** | Last Updated | `apiResource.metadata_modified` | direct, fallback blank string | `entity.metadata.customMetadata.versioningAndChangeGovernance.lastUpdated` | Implemented, but this is BCDC resource metadata date, not necessarily API change date. |
| **Versioning and Change Governance** | description | none | hardcoded `GAP` | `entity.metadata.customMetadata.versioningAndChangeGovernance.description` | Gap. |
| **Versioning and Change Governance** | Change Management | none | one placeholder object with GAP fields | `entity.metadata.customMetadata.versioningAndChangeGovernance.changeManagement[]` | Gap. |
| **Versioning and Change Governance** | Change Management Notes | none | hardcoded `GAP` | `entity.metadata.customMetadata.versioningAndChangeGovernance.changeManagementNotes` | Gap. |
| **Versioning and Change Governance** | Governance and Usage Constraints | none | hardcoded `GAP` | `entity.metadata.customMetadata.versioningAndChangeGovernance.governanceAndUsageConstraints` | Gap. |
| **Support** | API Ownership | none | hardcoded `GAP` | `entity.metadata.customMetadata.support.apiOwnership` | Gap. |
| **Support** | Support Pathways | none | hardcoded `GAP` | `entity.metadata.customMetadata.support.supportPathways` | Gap. |
| **Support** | Access and SDX Onboarding - description/contact/response/escalation | none | hardcoded `GAP` | `entity.metadata.customMetadata.support.accessAndSdxOnboarding.*` | Gap. Contacts are not currently selected by role for this value. |
| **Support** | Technical Support - description/contact/response/escalation | none | hardcoded `GAP` | `entity.metadata.customMetadata.support.technicalSupport.*` | Gap. Contacts are not currently selected by role for this value. |
| **Support** | Data & Semantics Support - description/contact/response/escalation | none | hardcoded `GAP` | `entity.metadata.customMetadata.support.dataAndSemanticsSupport.*` | Gap. Contacts are not currently selected by role for this value. |
| **Support** | Production Incident Escalation | none | hardcoded `GAP` | `entity.metadata.customMetadata.support.productionIncidentEscalation` | Gap. |
| **Related Resources** | OpenAPI external docs | OpenAPI `externalDocs` | reuses metadata links as `{ url, title }` | `entity.metadata.customMetadata.relatedResources[]` | Implemented for OpenAPI-backed APIs. |
| **Definition** | API definition | fetched OpenAPI content, or generic resource definition URL | OpenAPI resources store fetched definition content; generic APIs store URL/definition string | `entity.spec.definition` | Implemented. |
| **Annotations** | resource metadata | many `apiResource.*` fields | stored as strings, missing optional values often become `Undefined` | `entity.metadata.annotations['bcdata.gov.bc.ca/resource-*']` | Implemented for both OpenAPI-backed and generic API entities. |
| **Annotations** | managed by location | BCDC dataset resource URL | `url:${bcdcDatasetResourceUrl}` | `backstage.io/managed-by-location`; `backstage.io/managed-by-origin-location` | Implemented. |

### Generic BCDC webservice API mapping

Generic webservice resources that are not parsed as OpenAPI are much thinner than OpenAPI-backed APIs.

| Entity field | Source | Transformation / logic | Notes / gaps |
|---|---|---|---|
| `apiVersion` | implementation | `backstage.io/v1alpha1` | Built-in Backstage API. |
| `kind` | implementation | `API` | Built-in Backstage API. |
| `spec.type` | `apiResource.bcdc_type` | fallback option also accepts explicit `apiType` | Usually `webservice`. |
| `spec.lifecycle` | implementation | `production` | Hardcoded. |
| `spec.owner` | organization group id | from package organization | Implemented. |
| `spec.system` | organization system id | from package organization | Implemented. |
| `spec.definition` | extracted definition URL | direct | Not parsed; no endpoint/schema/security extraction. |
| `metadata.title` | `apiResource.name` | direct | Implemented. |
| `metadata.description` | `apiResource.description` | fallback to `No description available` | Implemented. |
| `metadata.tags` | `apiResource.format` | normalized through naming utility | Implemented. |
| `metadata.links` | generated BCDC resource URL and `apiResource.url` | two links: BCDC record and resource URL | Implemented. |
| `metadata.annotations` | `apiResource.*` | resource metadata annotations | Implemented. |
| `metadata.customMetadata` | none | not populated | Most API UI mapping fields are unavailable for generic APIs. |

## Remaining notable gaps

| Area | Gap |
|---|---|
| Dataset support contacts | BCDC contacts create `User` entities but do not populate Dataset support channel fields because there is no determaniztic mapping. |
| API support contacts | BCDC contacts do not populate OpenAPI support contact fields because there is no determaniztic mapping. |
| Dataset quality/governance/retention | Most fields are placeholders with `GAP`. |
| API governance/change management/support | Most fields are placeholders with `GAP`. |
| TechDocs | Dataset/API entities do not currently set TechDocs annotations. |
| Downloadable schema | Dataset schema is embedded in the entity; no download endpoint/link is implemented. |
| Generic APIs | Generic webservice resources are represented as built-in API entities but do not get OpenAPI-derived custom metadata. |
