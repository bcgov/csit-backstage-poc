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


## BC Data Catalog → Backstage API UI Mapping

### Detailed Mapping Table

| UI section | UI property | BC Data Catalog source | Transformation / logic | Backstage mapping | Notes / gaps |
|---|---|---|---|---|---|
|**main**|title|oad.info.title|direct|entity.metadata.title|—|
|---|description|oad.info.description or summary|direct|entity.metadata.description|—|
|---|tags|oad.*.tags[].name|direct|entity.metadata.tags|—|
|---|Part of Connected Services|---|not available|custom|gap|
|---|Learn more|oas.*.extenalDocs|direct|entity.metadata.links|—|
|---|Provider Ministry|---|not available|custom|gap - We have an Organization but it does not corrispond directly to a Ministry |
|---|Status|---|not available|custom|gap - we have an "active" status but it does not map to anything like "Beta"|
|---|Security Classification|security_class|direct (mapping)|entity.spec.securityClassification|This is mirroring the Dataset security classification. No independant source for APIs|
|---|Application|---|not available|custom|gap|
|---|Type|---|not available|custom|gap - Not sure what types we are expecting here.  If it is API then that is redundant.|
|---|SDX Required|oad.tags[].name == 'SDX'|direct|custom|—|
|---|Environments|oad.servers[]|direct|custom|—|
|---|Access Model|---|not available|custom|gap - Not user what we are tying to do here.  Looks like a hodgepoge of data.  If we want to provide additional details for each environment then we should have a section for each environment in the UI.  We can pull the security info from the OAD but this info will be the same for all environments.  We have no other datasource right now.|
|**About this API**|description|---|not available|custom|We aleady have the top level description we do not have a source for another description.|
|**Data Source**|This API uses|---|not available|custom|gap|
|---|Type|---|not available|custom|gap - What is our source for this?  Maybe we can look for specific tags.  This would not guarantee us a unique "Type" though|
|---|Authoritative for|---|not available|custom|gap|
|---|update frequency|resource_update_cycle|direct|custom|—|
|---|Province-wide coverage|---|not available|custom|gap|
|---|Governance|---|not available|custom|gap|
|---|View Dataset Record|parent dataset|direct|entity.relation|—|
|**Access and Onboarding**|description|---|not available|custom|gap - this data is not well structured so it looks like just a freeform text property.  We dont have a source for this although we potientially have access to detailed scope information in the OAD.  Although ideally we would present that in the Swagger UI as that is where developers would be looking for this.|
|---|Environments.<dev|test|prod>|oad.servers[].url|direct|custom|—|
|---|Environments.description|oad.servers[].description|direct|custom|—|
|**Technical Reference**|View OpenAPI description|---|not available|custom|gap - Is this a link to the raw OpenAPI Spec? Are we creating our own custom inteface for this or are we going to use the existing Backstage functionality?|
|---|Base URLs|oad.servers[]|direct|custom|It would be nice if we had one section for environment information instead of sprinkling it around the interface|
|---|Endpoint|oad.paths[].operations[]|direct|custom|Looks like we are trying to recreate the Swagger UI here again but with less functionality|
|---|Authentication|oad.paths[].operations[]|direct|custom|—|
|---|Example Request|oad.paths[].operations[]|direct|custom|—|
|---|Example Response|oad.paths[].operations[]|direct|custom|—|
|**Data and Semantics**|Data returned|---|not available|custom|There are potentially dozens of differnt endpoints in an API so the data returned could be dozens of different data structures.  This is all provided by the Swagger UI and would be duplicated here except without the meaningfull context|
|---|Authoratative Data source|---|not available|custom|gap - Is this just a link to the Dataset like we do above with View Dataset Record?|
|---|Field Definitions|---|not available|custom|gap - This looks like links to the Dataset Record again and a link to the Data Dictionany which we want to be part of the Dataset.  The Data Dictionary is not directly applicable to the API. The API has its own documentation for the data it exposes.|
|**Versioning and Change Governance**|Current Version|oad.info.version|direct|custom|—|
|---|Initial Release|resource.created|direct|custom|This just indicates when the resource was added to BCDC.|
|---|Last Updated|resource.metadata_modified|direct|custom|This probably just indicates when BCDC was updated.|
|---|description|---|not available|custom|gap|
|---|Change Management|---|not available|custom|gap|
|---|Governance and Usage Constraints|---|not available|custom|gap|
|**Support**|API Ownership|---|not available|custom|gap|
|---|Support Pathways|---|not available|custom|gap - This looks like boilerplate|
|---|Access and SDX Onboarding - description|not available|custom|gap|
|---|Access and SDX Onboarding - Contact|contacts[].email|direct|custom|We may be able to use the contacts[].role to identify the correct appropriate contact.  Looks like we may be limited to email addresses.  [businessExpert, custodian, dataManager, dataSteward, distributor, pointOfContact]|
|---|Access and SDX Onboarding - Response Time|---|not available|custom|gap|
|---|Access and SDX Onboarding - Escalation|---|not available|custom|gap|
|---|Technical Support - description|not available|custom|gap|
|---|Technical Support - Contact|contacts[].email|direct|custom|We may be able to use the contacts[].role to identify the correct appropriate contact.  Looks like we may be limited to email addresses.  [businessExpert, custodian, dataManager, dataSteward, distributor, pointOfContact]|
|---|Technical Support - Response Time|---|not available|custom|gap|
|---|Technical Support - Escalation|---|not available|custom|gap|
|---|Data & Semantics Support - description|not available|custom|gap|
|---|Data & Semantics Support - Contact|contacts[].email|direct|custom|We may be able to use the contacts[].role to identify the correct appropriate contact.  Looks like we may be limited to email addresses.  [businessExpert, custodian, dataManager, dataSteward, distributor, pointOfContact]|
|---|Data & Semantics Support - Response Time|---|not available|custom|gap|
|---|Data & Semantics Support - Escalation|---|not available|custom|gap|
|---|Production Incident Escalation|---|not available|custom|gap|
|**Related Resources**|oas.*.extenalDocs|direct|entity.metadata.links|This gives us the same content as More Info.  |


```json
{
    "help": "https://catalogue.data.gov.bc.ca/api/3/action/help_show?name=package_show",
    "success": true,
    "result": {
        "author": "a79cf565-4b26-4ae7-94cb-f274ab562ef2",
        "author_email": null,
        "creator_user_id": "a79cf565-4b26-4ae7-94cb-f274ab562ef2",
        "download_audience": "Public",
        "id": "6e815cf7-cb83-4655-9ad4-a926ae4e59f7",
        "isopen": false,
        "license_id": "25",
        "license_title": "King's Printer Licence - British Columbia",
        "license_url": "https://www.bclaws.gov.bc.ca/standards/Licence.html",
        "maintainer": null,
        "maintainer_email": null,
        "metadata_created": "2015-02-18T21:40:07.828528",
        "metadata_modified": "2024-02-15T23:38:00.603956",
        "metadata_visibility": "Public",
        "name": "bc-laws-api",
        "notes": "BC Laws is an electronic library providing free public access to the laws of British Columbia. BC Laws is hosted by the Queen’s Printer of British Columbia and published in partnership with the Ministry of Justice and the Law Clerk of the Legislative Assembly.\n\nBC Laws contains a comprehensive collection of BC legislation and related materials. It is available on the internet in two forms:\nFirst: The library is available as a web site in which users can browse and search the laws of British Columbia.\nSecond: The library is available as a portal to legislation in raw XML data format, accessible via the BC Laws API.\n\n This direct access to raw data is intended to enable third parties to build or add their own custom applications based on the structure of the data and all the associated search functionality inherent in that structure. The BC Laws website itself is an example of one such application of the BC Laws API.\n\nThe BC Laws API is available according to the [Queen's Printer License – British Columbia] (https://www.bclaws.gov.bc.ca/standards/QP-License.html).",
        "num_resources": 4,
        "num_tags": 4,
        "organization": {
            "id": "e0abc95e-b3f1-4c84-abc5-cddd817e0ea1",
            "name": "king-s-printer",
            "title": "King's Printer",
            "type": "organization",
            "description": "",
            "image_url": "",
            "created": "2015-02-18T13:36:56.424917",
            "is_organization": true,
            "approval_status": "approved",
            "state": "active"
        },
        "owner_org": "e0abc95e-b3f1-4c84-abc5-cddd817e0ea1",
        "private": false,
        "publish_state": "PUBLISHED",
        "record_create_date": "2015-02-18",
        "record_last_modified": "2024-02-15",
        "record_publish_date": "2015-02-19",
        "resource_status": "onGoing",
        "security_class": "PUBLIC",
        "state": "active",
        "title": "BC Laws API",
        "type": "bcdc_dataset",
        "url": "https://raw.githubusercontent.com/BCDevExchange/API-Management/master/swagger-json/bclaws.json",
        "version": null,
        "view_audience": "Public",
        "contacts": [
            {
                "displayed": [
                    "displayed"
                ],
                "email": "niel.li@gov.bc.ca",
                "name": "Niel Li",
                "org": "e0abc95e-b3f1-4c84-abc5-cddd817e0ea1",
                "role": "businessExpert"
            },
            {
                "displayed": [],
                "email": "priyanka.alexander@gov.bc.ca",
                "name": "Priyanka Alexander",
                "org": "e0abc95e-b3f1-4c84-abc5-cddd817e0ea1",
                "role": "businessExpert"
            }
        ],
        "dates": [
            {
                "date": "2015-02-18",
                "type": "Created"
            }
        ],
        "groups": [
            {
                "description": "An API Registry for BC Government, [click here for BC Government API Guidelines](https://developer.gov.bc.ca/Data-and-APIs/BC-Government-API-Guidelines)",
                "display_name": "BC Government API Registry",
                "id": "65c44d61-ff6e-418f-b1aa-6023c3f7ed4c",
                "image_display_url": "https://catalogue.data.gov.bc.ca/uploads/group/2018-02-21-215929.13946617069795.png",
                "name": "bc-government-api-registry",
                "title": "BC Government API Registry"
            }
        ],
        "more_info": [
            {
                "description": "",
                "url": "http://www.bclaws.ca/civix/template/complete/api/index.html"
            }
        ],
        "resources": [
            {
                "bcdc_type": "webservice",
                "cache_last_updated": null,
                "cache_url": null,
                "created": "2015-02-18T13:40:58.220000",
                "datastore_active": false,
                "description": "",
                "details": [],
                "format": "html",
                "geographic_extent": [],
                "hash": "",
                "id": "361a7459-8f6f-4b02-bea8-bbe9ed764176",
                "iso_topic_category": [],
                "json_table_schema": {},
                "metadata_modified": "2015-02-18T13:40:58.220000",
                "mimetype": null,
                "mimetype_inner": null,
                "name": "API Application Programming Interface",
                "package_id": "6e815cf7-cb83-4655-9ad4-a926ae4e59f7",
                "position": 0,
                "preview_info": [],
                "projection_name": "na",
                "resource_access_method": "service",
                "resource_storage_location": "na",
                "resource_type": "data",
                "resource_update_cycle": "asNeeded",
                "size": null,
                "spatial_datatype": "",
                "state": "active",
                "url": "http://www.bclaws.ca/civix/template/complete/api/index.html",
                "url_type": null,
                "temporal_extent": [
                    {
                        "beginning_date": "",
                        "end_date": ""
                    }
                ]
            },
            {
                "bcdc_type": "webservice",
                "cache_last_updated": null,
                "cache_url": null,
                "created": "2016-03-11T10:22:44.026000",
                "datastore_active": false,
                "description": "",
                "details": [],
                "format": "openapi-json",
                "geographic_extent": [],
                "hash": "",
                "id": "6505a462-75de-44df-8db9-60a63cf7ab2f",
                "iso_topic_category": [],
                "json_table_schema": {},
                "metadata_modified": "2016-03-11T10:22:44.026000",
                "mimetype": null,
                "mimetype_inner": null,
                "name": "API Console",
                "package_id": "6e815cf7-cb83-4655-9ad4-a926ae4e59f7",
                "position": 1,
                "preview_info": [],
                "projection_name": "na",
                "resource_access_method": "service",
                "resource_storage_location": "na",
                "resource_type": "data",
                "resource_update_cycle": "asNeeded",
                "size": 0,
                "spatial_datatype": "",
                "state": "active",
                "url": "https://raw.githubusercontent.com/bcgov/api-specs/master/bclaws/bclaws.json",
                "url_type": "",
                "temporal_extent": [
                    {
                        "beginning_date": "",
                        "end_date": ""
                    }
                ]
            },
            {
                "bcdc_type": "webservice",
                "cache_last_updated": null,
                "cache_url": null,
                "created": "2015-12-18T17:44:48.147000",
                "datastore_active": false,
                "description": "",
                "details": [],
                "format": "json",
                "geographic_extent": [],
                "hash": "",
                "id": "3664d2d3-6dcb-4307-9652-a28332981ca3",
                "iso_topic_category": [],
                "json_table_schema": {},
                "metadata_modified": "2015-12-18T17:44:48.147000",
                "mimetype": null,
                "mimetype_inner": null,
                "name": "API Specs",
                "package_id": "6e815cf7-cb83-4655-9ad4-a926ae4e59f7",
                "position": 2,
                "preview_info": [],
                "projection_name": "na",
                "resource_access_method": "service",
                "resource_storage_location": "na",
                "resource_type": "data",
                "resource_update_cycle": "asNeeded",
                "size": null,
                "spatial_datatype": "",
                "state": "active",
                "url": "https://raw.githubusercontent.com/bcgov/api-specs/master/bclaws/bclaws.json",
                "url_type": "",
                "temporal_extent": [
                    {
                        "beginning_date": "",
                        "end_date": ""
                    }
                ]
            },
            {
                "bcdc_type": "webservice",
                "cache_last_updated": null,
                "cache_url": null,
                "created": "2015-12-17T16:48:45.099000",
                "datastore_active": false,
                "description": "",
                "details": [],
                "format": "html",
                "geographic_extent": [],
                "hash": "",
                "id": "fbadcf16-a7cf-4128-b7d1-65b5d5b5aa79",
                "iso_topic_category": [],
                "json_table_schema": {},
                "metadata_modified": "2015-12-17T16:48:45.099000",
                "mimetype": null,
                "mimetype_inner": null,
                "name": "API Spec Editor",
                "package_id": "6e815cf7-cb83-4655-9ad4-a926ae4e59f7",
                "position": 3,
                "preview_info": [],
                "projection_name": "na",
                "resource_access_method": "service",
                "resource_storage_location": "na",
                "resource_type": "data",
                "resource_update_cycle": "asNeeded",
                "size": 0,
                "spatial_datatype": "",
                "state": "active",
                "url": "https://oas-editor.apps.gov.bc.ca/?url=https://raw.githubusercontent.com/bcgov/api-specs/master/bclaws/bclaws.json",
                "url_type": "",
                "temporal_extent": [
                    {
                        "beginning_date": "",
                        "end_date": ""
                    }
                ]
            }
        ],
        "tags": [
            {
                "display_name": "API",
                "id": "4bd16f13-e4af-48ab-9676-255d04600fd4",
                "name": "API",
                "state": "active",
                "vocabulary_id": null
            },
            {
                "display_name": "BCDevExchange",
                "id": "68c0b5f9-51e8-40d9-9988-87e17b672c48",
                "name": "BCDevExchange",
                "state": "active",
                "vocabulary_id": null
            },
            {
                "display_name": "LAWS",
                "id": "b9260b3e-1cc0-4a42-ba37-08d7e59cfabb",
                "name": "LAWS",
                "state": "active",
                "vocabulary_id": null
            },
            {
                "display_name": "OpenAPI spec",
                "id": "5c1e7cd0-d772-4430-8efd-63bb6954f803",
                "name": "OpenAPI spec",
                "state": "active",
                "vocabulary_id": null
            }
        ],
        "relationships_as_subject": [],
        "relationships_as_object": []
    }
}
```

```json
{
      "bcdc_type": "webservice",
      "cache_last_updated": null,
      "cache_url": null,
      "created": "2016-03-11T10:22:44.026000",
      "datastore_active": false,
      "description": "",
      "details": [],
      "format": "openapi-json",
      "geographic_extent": [],
      "hash": "",
      "id": "6505a462-75de-44df-8db9-60a63cf7ab2f",
      "iso_topic_category": [],
      "json_table_schema": {},
      "metadata_modified": "2016-03-11T10:22:44.026000",
      "mimetype": null,
      "mimetype_inner": null,
      "name": "API Console",
      "package_id": "6e815cf7-cb83-4655-9ad4-a926ae4e59f7",
      "position": 1,
      "preview_info": [],
      "projection_name": "na",
      "resource_access_method": "service",
      "resource_storage_location": "na",
      "resource_type": "data",
      "resource_update_cycle": "asNeeded",
      "size": 0,
      "spatial_datatype": "",
      "state": "active",
      "url": "https://raw.githubusercontent.com/bcgov/api-specs/master/bclaws/bclaws.json",
      "url_type": "",
      "temporal_extent": [
         {
            "beginning_date": "",
            "end_date": ""
         }
      ]
}
```

```json
{
      "bcdc_type": "webservice",
      "cache_last_updated": null,
      "cache_url": null,
      "created": "2026-02-04T00:10:02.783733",
      "datastore_active": false,
      "format": "openapi-json",
      "hash": "",
      "id": "9289ded0-fbcf-4cb4-ada7-aee5883206e5",
      "isUrl": "true",
      "iso_topic_category": [],
      "json_table_schema": {},
      "metadata_modified": "2026-02-04T00:10:02.774965",
      "mimetype": null,
      "mimetype_inner": null,
      "name": "Directory API spec",
      "package_id": "84aa4145-e8d9-4596-b4ee-9b568209f180",
      "position": 2,
      "projection_name": "na",
      "resource_access_method": "service",
      "resource_storage_location": "web or ftp site",
      "resource_type": "data",
      "resource_update_cycle": "asNeeded",
      "size": null,
      "spatial_datatype": "",
      "state": "active",
      "url": "https://api.gov.bc.ca/ds/api/v3/openapi.yaml",
      "url_type": null
}
```

```json
{
      "bcdc_type": "webservice",
      "cache_last_updated": null,
      "cache_url": "null",
      "created": "2016-03-11T10:09:28.901000",
      "datastore_active": "false",
      "description": "",
      "details": [],
      "format": "openapi-json",
      "geographic_extent": [],
      "hash": "",
      "id": "40d6411e-ab98-4df9-a24e-67f81c45f6fa",
      "iso_topic_category": [],
      "json_table_schema": {},
      "metadata_modified": "2016-03-11T10:09:28.901000",
      "mimetype": "null",
      "mimetype_inner": "null",
      "name": "API Specification",
      "package_id": "8f4a016f-14db-4def-8ef9-7c797de1cdd9",
      "position": 0,
      "preview_info": [],
      "projection_name": "epsg4326",
      "resource_access_method": "service",
      "resource_storage_location": "na",
      "resource_type": "data",
      "resource_update_cycle": "asNeeded",
      "size": 0,
      "spatial_datatype": "",
      "state": "active",
      "url": "https://raw.githubusercontent.com/bcgov/api-specs/master/geocoder/geocoder-combined.json",
      "url_type": "",
      "temporal_extent": [
         {
            "__extras": {
                  "[object Object]": ""
            },
            "beginning_date": "",
            "end_date": ""
         }
      ]
}
```

```json
{
      "bcdc_type": "webservice",
      "cache_last_updated": null,
      "cache_url": null,
      "created": "2018-02-21T22:18:49.675000",
      "datastore_active": false,
      "description": "",
      "details": [],
      "format": "openapi-json",
      "geographic_extent": [],
      "hash": "",
      "id": "3692fd5e-87e2-47ab-8eee-9131ea249436",
      "iso_topic_category": [],
      "metadata_modified": "2018-02-21T22:18:49.675000",
      "mimetype": null,
      "mimetype_inner": null,
      "name": "API Console - OAS3",
      "package_id": "f44a884d-8fed-4b6a-99e7-19e8a01691ec",
      "position": 0,
      "preview_info": [],
      "projection_name": "na",
      "resource_access_method": "service",
      "resource_storage_location": "na",
      "resource_type": "data",
      "resource_update_cycle": "asNeeded",
      "size": 0,
      "spatial_datatype": "",
      "state": "active",
      "url": "https://raw.githubusercontent.com/bcgov/api-specs/master/news/news-oas3.yaml",
      "url_type": "",
      "temporal_extent": [
         {
            "beginning_date": "",
            "end_date": ""
         }
      ]
}
```

```json
{
      "bcdc_type": "webservice",
      "cache_last_updated": null,
      "cache_url": "null",
      "created": "2016-03-17T12:04:28.837000",
      "datastore_active": "false",
      "description": "",
      "format": "openapi-json",
      "hash": "",
      "id": "82cd3194-0955-4d7e-b35a-78a98fda153a",
      "iso_topic_category": [],
      "json_table_schema": {},
      "metadata_modified": "2025-01-17T17:44:59.241069",
      "mimetype": "null",
      "mimetype_inner": "null",
      "name": "API Specification",
      "package_id": "3dad0c30-ef32-4f4c-82fa-33787d5f85f8",
      "position": 0,
      "projection_name": "epsg4326",
      "resource_access_method": "service",
      "resource_storage_location": "na",
      "resource_type": "data",
      "resource_update_cycle": "asNeeded",
      "size": null,
      "spatial_datatype": "",
      "state": "active",
      "supplemental_info": "",
      "url": "https://raw.githubusercontent.com/bcgov/api-specs/master/router/router.json",
      "url_type": ""
}
```