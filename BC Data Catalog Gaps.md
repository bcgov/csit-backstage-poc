#

## Dataset

## BC Data Catalogue

Primary purpose is to provide access to public data rather than document datasets and APIs.

### BC Data Catalogue Onboarding
#### Checklist
- The data MUST be free of Personal Information that may directly identify an individual?

- The data MUST be free of information that may indirectly identify an individual? (Exceptions do not apply to our use case)

- The data MUST NOT include intellectual property.

- The data MUST be created solely by BC Government employees.

- The data MUST only include content owned by the BC Government.

- There MUST not be an existing exclusive licence for aother party to use or access the materials.

- The public release of the data MUST be permittable under law, contract, or policy.

- The data MUST be available to the public without collecting a fee.

- The data MUST be complete, not a subset.

- The data MUST be provided in a machine readable format.

## BC Data Catalog → Backstage Dataset UI Mapping

### Detailed Mapping Table

| UI section | UI property | BC Data Catalog source | Transformation / logic | Backstage mapping | Notes / gaps |
|---|---|---|---|---|---|
|**main**|title|title|direct|entity.metadata.title|—|
|---|description|notes|direct|entity.metadata.description|—|
|---|tags|tags[].display_name|direct|entity.metadata.tags|—|
|---|Part of Connected Services|---|not available|custom|gap|
|---|Learn more|more_info[]|direct|entity.metadata.links|—|
|---|Type|---|not available|custom|gap|
|---|Custodian|organization.title|direct|entity.spec.owner|The BCDC Organizations are currently being mapped to Backstage Groups|
|---|Status|publish_state|direct (mapping)|entity.spec.status|[PENDING ARCHIVE, PUBLISHED]|
|---|Security Classification|security_class|direct (mapping)|entity.spec.securityClassification|[PROTECTED A, PROTECTED B, PROTECTED C, PUBLIC]|
|---|Data quality Score|---|not available|custom|gap|
|---|Update frequency|---|not available|custom|gap - We have an update frequecy for the access methods but not for the Dataset as a whole|
|---|Retention|---|not available|custom|gap|
|---|View APIs - Button|resources[]|direct|/catalog?filters[kind]=API&filters[relations.providedBy]=entityRef|When an API is created based on an API resource we can define the relationship in Backstage|
|---|View APIs - Dialog - title|entity.metadata.title|direct|openapi.title||
|---|View APIs - Dialog - Type|---|not available|custom|gap|
|---|View APIs - Dialog - Security|entity.spec.definition|direct|openapi.security|—|
|---|View APIs - Dialog - Environments|entity.spec.definition|direct|openapi.environments|—|
|---|Technical documentation|---|not available|direct|gap|
|---|View Data Dictionary|---|not available|direct|gap - The Data Dictionary and Schema terminology are being used interchangably and inconsistently in the design.  We need to clarify these concepts.|
|---|Download schema|resources[].resource_type=='data'|custom|custom|gap- There is no downloadable schema.  We would need to identify if/how we want to format the 'data' resource type as a file and then create an endpoint to create it.|
|---|Need help?|contacts[]|map to support info|custom|It is not clear from the page mockups what is expected from the link.|
|**About this Dataset**|description|purpose|direct|custom|—|
|***Authoritative Designation***|description|---|not available|custom|gap -  Maybe this is just boilerplate that we show if the Dataset has a specific tag sesignating it as an Authoritative Data Source|
|***Access Methods***|APIs|resources[]|direct|spec.providesApis|When an API is created based on an API resource we can define the relationship in Backstage|
|---|other|resources[]|direct|custom|Not sure how or if we are going to surface non-API dataset resources.  Is this jsut a link like in BCDC or a first class entity like an API?|
|***Schema***|Table name|resource[].object_name|direct|custom|The prototype does not include the Table Name or show multiple objects in the schema.  This is section is labeled as Data Dictionary in the prototype but appears to be just the Schema.|
|---|Field name|resource[].details[].column_name|direct|custom|—|
|---|Type|resource[].details[].data_type|direct|custom|—|
|---|Description|resource[].details[].column_comments|direct|custom|—|
|***Fields & definitions***|field name|---|not available|custom|gap -  There is a lot of similarity and overlap here with **Schema**.  Not sure if we need both or if we would just provide differnt formatting to the same source of schema data.  We don't have a data source for this.|
|---|Definition|---|not available|custom|gap|
|---|Semantic Domain|---|not available|custom|gap|
|---|Meaning of Values|---|not available|custom|gap|
|---|Business Rules|---|not available|custom|gap|
|---|Relationships|---|not available|custom|gap|
|---|Governance|---|not available|custom|gap|
|***Lineage and Quality***|Source System|---|not available|custom|gap|
|---|Transformation|lineage_statement|direct|custom|—|
|---|Validation|---|not available|custom|gap|
|---|Lineage refresh||---|not available|custom|gap|
|---|Quality controls include|---|not available|custom|gap|
|***Versioning and Change Governance***|Current Version|---|not available|custom|gap - BCDC version is not populated|
|---|Initial Release|record_publish_date|direct|custom|—|
|---|Last Updated|record_last_modified|direct|custom|—|
|---|description|---|not available|custom|gap|
|---|Governance and Usage Constraints|---|not available|custom|gap|
|***Support***|description|organization.description|direct|custom|—|
|---|Dataset Owernership - Data Custodian|organization.title|direct|entity.spec.owner|Is this a duplicate of **main** Custodian?|
|---|Dataset Owernership - Governance Authority|---|not available|custom|gap|
|---|Support Pathways|---|not available|custom|Is this boilerplate?|
|---|Data and Semantics - description|---|not available|custom|Is this boilerplate?|
|---|Data and Semantics - Channel|contacts[].email|direct|custom|We may be able to use the contacts[].role to identify the correct appropriate contact.  Looks like we may be limited to email addresses.  [businessExpert, custodian, dataManager, dataSteward, distributor, pointOfContact]|
|---|Data and Semantics - Response time|---|not available|custom|gap|
|---|Data and Semantics - Escalation|---|not available|custom|gap|
|---|Access and Integration - description|---|not available|custom|Is this boilerplate?|
|---|Access and Integration - Channel|contacts[].email|direct|custom|We may be able to use the contacts[].role to identify the correct appropriate contact.  Looks like we may be limited to email addresses.  [businessExpert, custodian, dataManager, dataSteward, distributor, pointOfContact]|
|---|Access and Integration - Response time|---|not available|custom|gap|
|---|Access and Integration - Escalation|---|not available|custom|gap|
|---|Governance and Produciton Escalation - description|---|not available|custom|gap|
|---|Governance and Produciton Escalation - Channel|contacts[].email|direct|custom|We may be able to use the contacts[].role to identify the correct appropriate contact.  Looks like we may be limited to email addresses.  [businessExpert, custodian, dataManager, dataSteward, distributor, pointOfContact]|
|---|Governance and Produciton Escalation - Reference dataset name + version + environment|---|not available|custom|Not sure what this is.  Is this a typo?|
|---|Governance and Produciton Escalation - Response time|---|not available|custom|gap|
|***Related resources***|link|more_info[].url + resources[].url|merge arrays|entity.metadata.links|Do we want to dump all of the relations here or just show links to resources that have not already been linked above in **Lean more** and **Access Methods**?|
---

### DatasetEntity Design Table

| UI section | UI property | Recommended entity representation | Notes |
|---|---|---|---|
| main | title | `metadata.title` | Standard Backstage metadata field. |
| main | description | `metadata.description` | Standard Backstage metadata field. |
| main | tags | `metadata.tags: string[]` | Standard Backstage metadata field. |
| main | Part of Connected Services | `spec.connectedServicesDescription` | Simple text field; descriptive only (not relationships). |
| main | Learn more | `metadata.links` | Standard Backstage metadata field. |
| main | Type | `spec.type` | Dataset-level functional type. |
| main | Custodian | `spec.owner` | Standard Backstage ownership field. |
| main | Status | `spec.status` | Normalized enum, e.g. `published`, `pending-archive`, `unknown`. |
| main | Security Classification | `spec.securityClassification` | Normalized enum, e.g. `public`, `protected-a`, etc. |
| main | Data quality Score | `spec.quality.score` | Nested quality object. |
| main | Update frequency | `spec.updateFrequency` | Dataset-level value; may be derived from resources for now. |
| main | Retention | `spec.governance.retention` | Governance concern; nested structure fits better. |
| main | View APIs | derived from `spec.providesApis` | Do not duplicate as a display field; derive from API relationships. |
| main | Technical documentation | `metadata.annotations['backstage.io/techdocs-ref']` | Standard Backstage TechDocs integration. |
| main | Download schema | not stored in entity | UI constructs URL dynamically from dataset/resource identifiers. |
| main | Need help? | `spec.support.primary` | Derived/selected support contact or support channel. |
| About this Dataset | description | `spec.about.description` | Separate from `metadata.description` if richer/domain-specific text is needed. |
| About this Dataset | It includes | not stored in entity | Covered by description for now. |
| About this Dataset | Intended Use | not stored in entity | Covered by description for now. |
| About this Dataset | Not Intended For | not stored in entity | Covered by description for now. |
| Authoritative Designation | authoritative for | `spec.authoritativeDesignation.authoritativeFor` | Nested object leaves room for future related fields. |
| Access Methods | APIs | derived from `spec.providesApis` | Prefer relationships over duplication. |
| Access Methods | other | `spec.accessMethods: DatasetAccessMethod[]` | Non-API resource access methods belong in spec. |
| Schema | Table name | `spec.schema.tables[].name` | Supports multiple tables per dataset. |
| Schema | Field name | `spec.schema.tables[].fields[].name` | Nested under table. |
| Schema | Type | `spec.schema.tables[].fields[].type` | Nested under table. |
| Schema | Format | `spec.schema.tables[].fields[].format` | Optional; only if distinct from type. |
| Schema | Required | `spec.schema.tables[].fields[].required` | Boolean. |
| Fields & definitions | Entity name | `spec.entityDefinitions.entities[].name` | Top-level grouping for fields/definitions. |
| Fields & definitions | field name | `spec.entityDefinitions.entities[].fields[].name` | Nested under entity. |
| Fields & definitions | Definition | `spec.entityDefinitions.entities[].fields[].definition` | Field-level definition. |
| Fields & definitions | Semantic Domain | `spec.entityDefinitions.entities[].fields[].semanticDomain` | Optional field-level attribute. |
| Fields & definitions | Meaning of Values | `spec.entityDefinitions.entities[].fields[].meaningOfValues` | Optional field-level attribute. |
| Fields & definitions | Business Rules | `spec.entityDefinitions.entities[].fields[].businessRules` | Optional field-level attribute. |
| Fields & definitions | Relationships | `spec.entityDefinitions.entities[].fields[].relationships` | `string[]` for now; can evolve later. |
| Fields & definitions | Governance | `spec.entityDefinitions.entities[].fields[].governance` | Optional field-level attribute. |
| Lineage and Quality | Source System | `spec.lineage.sourceSystem` | Single source system (string). |
| Lineage and Quality | Transformation | `spec.lineage.transformation` | Free-text lineage statement. |
| Lineage and Quality | Validation | `spec.quality.validation` | Quality concern; nested structure. |
| Lineage and Quality | Lineage refresh | `spec.lineage.refresh` | String/date/interval depending source maturity. |
| Lineage and Quality | Quality controls include | `spec.quality.controls: string[]` | Nested quality object. |
| Versioning and Change Governance | Current Version | `spec.versioning.currentVersion` | Keep versioning grouped. |
| Versioning and Change Governance | Initial Release | `spec.versioning.initialRelease` | ISO date string. |
| Versioning and Change Governance | Last Updated | `spec.versioning.lastUpdated` | ISO date string. |
| Versioning and Change Governance | description | `spec.versioning.description` | Free-text version/change notes. |
| Versioning and Change Governance | Governance and Usage Constraints | `spec.governance.usageConstraints` | Governance concern; nested structure. |
| Support | description | `spec.support.description` | Section-level support description. |
| Support | Dataset Ownership - Data Custodian | `spec.support.dataCustodian` | Kept separate from `spec.owner`; owner is canonical, this is display-oriented. |
| Support | Dataset Ownership - Governance Authority | `spec.support.governanceAuthority` | Display/support field. |
| Support | Support Pathways | `spec.support.pathways` | Simple text description. |
| Support | Data and Semantics - description | `spec.support.dataAndSemantics.description` | Nested support channel category. |
| Support | Data and Semantics - Channel | `spec.support.dataAndSemantics.channel` | Simple text field for now; structure can evolve later. |
| Support | Data and Semantics - Response time | `spec.support.dataAndSemantics.responseTime` | Simple string unless SLA structure is needed. |
| Support | Data and Semantics - Escalation | `spec.support.dataAndSemantics.escalation` | Simple string for now. |
| Support | Access and Integration - description | `spec.support.accessAndIntegration.description` | Nested support channel category. |
| Support | Access and Integration - Channel | `spec.support.accessAndIntegration.channel` | Simple text field for now; structure can evolve later. |
| Support | Access and Integration - Response time | `spec.support.accessAndIntegration.responseTime` | Simple string. |
| Support | Access and Integration - Escalation | `spec.support.accessAndIntegration.escalation` | Simple string. |
| Support | Governance and Produciton Escalation - description | `spec.support.governanceAndProductionEscalation.description` | Nested support channel category. |
| Support | Governance and Produciton Escalation - Channel | `spec.support.governanceAndProductionEscalation.channel` | Simple text field for now; structure can evolve later. |
| Support | Governance and Produciton Escalation - Reference dataset name + version + environment | `spec.support.governanceAndProductionEscalation.referenceDataset` | Simple text field for now. |
| Support | Governance and Produciton Escalation - Response time | `spec.support.governanceAndProductionEscalation.responseTime` | Simple string. |
| Related resources | link | `spec.relatedResources: Array<{ url: string; title?: string }>` | Kept separate from `metadata.links` if UI needs curated related resources. |

## Key Takeaways

### Heavy reuse fields (high impact)
These drive large parts of the UI:
- `resources[]*` → **drives ~50% of UI**
- `notes*` → description everywhere
- `organization.title*` → ownership everywhere
- `record_* dates*` → governance + header
- `tags*` → classification + discovery

### Backstage-native vs custom

**Fits cleanly into Backstage:**
- name/title/description
- tags
- links (partially)
- API entities (from resources)

**Needs custom modeling:**
- access methods grouping
- schema rendering
- governance sections
- designation section
- most resource-derived UI

---

## Recommendation

Do NOT try to map everything directly to Backstage entity fields.

Instead:
1. Store only core metadata in entity (`metadata`, minimal `spec`)
2. Put raw BCDC payload in:
   - annotation (small) OR
   - external fetch (better)
3. Build a **normalized view model in the frontend plugin**

This avoids:
- overloading annotations
- brittle mappings
- fighting Backstage’s data model