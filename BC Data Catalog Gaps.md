#

## Dataset

### Questions
What does a dataset map to?  A database schema, a table?

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

#### Confirm a few things about BC Data Catalogue:

- no private information is accessible via BCDC, even if you have an IDIR login

- private data cannot be published in BCDC

- the intention is to catalog and provide access to public data

- the intention is not to document APIs but only to identify them as a source of public data

- APIs that provide private data should not be in the BCDC

- there is no intention to expand BCDC to include private data or document services that provide private data in the near term


## BC Data Catalog → Backstage Dataset UI Mapping (Enhanced)

### Legend
- `*` = BCDC field reused across multiple **different UI properties**
- Backstage column:
  - `Entity` = maps cleanly to an existing Backstage entity property
  - `Annotation` = can be stored as annotation
  - `Spec` = fits in spec (custom kind)
  - `Custom` = requires custom UI-only transformation / view model

---

### Example BCDC Json

```json
Here is an example dataset from BCDC

{
        "author": null,
        "author_email": null,
        "creator_user_id": "edf2c9e7-b637-4828-8f19-a59738aff50c",
        "download_audience": "Not downloadable",
        "id": "b5c83fa8-89dd-4310-85cd-7413f2d36746",
        "isopen": false,
        "license_id": "22",
        "license_title": "Access Only",
        "license_url": "https://www2.gov.bc.ca/gov/content?id=1AAACC9C65754E4D89A118B875E0FBDA",
        "lineage_statement": "The data was extracted from the Ministry of Children and Family Development and provided to the Data Innovation Program for use and stewardship",
        "maintainer": null,
        "maintainer_email": null,
        "metadata_created": "2022-08-26T20:03:49.662531",
        "metadata_modified": "2024-12-06T01:52:37.641950",
        "metadata_visibility": "Public",
        "name": "metadata-for-child-care-subsidy-e01",
        "notes": "Jan 2011 to Dec 2021 - metadata for the complete list (by month) of children receiving the affordable child care benefit, by type of benefit.\n\nIf you are a researcher and want to work with us to help make BC programs and services better, apply to use this dataset and don't hesitate to ask questions here: https://dpdd.atlassian.net/servicedesk/customer/portal/2",
        "num_resources": 1,
        "num_tags": 2,
        "organization": {
            "id": "d8e38fa3-e522-4d65-9ae1-b1402dd342c3",
            "name": "data-innovation-program-dip",
            "title": "Data Innovation Program (DIP)",
            "type": "organization",
            "description": "The Data Innovation Program is a data integration and analytics program for government. Government’s programs and services span all aspects of life in B.C., such as education, health care, public safety, social services, the economy and the environment. While every B.C. ministry collects and manages its own data, the Data Innovation Program securely links and de-identifies data from multiple ministries, giving government analysts a better understanding of B.C.’s complex issues. This group represents the data sets that are part of the Data Innovation Program. For more information about the program, please visit https://www2.gov.bc.ca/gov/content?id=2F6E3BF426034EDBA62F3F016EE2313D",
            "image_url": "2020-07-22-170926.389405BCGov.png",
            "created": "2020-07-22T09:55:20.977420",
            "is_organization": true,
            "approval_status": "approved",
            "state": "active"
        },
        "owner_org": "d8e38fa3-e522-4d65-9ae1-b1402dd342c3",
        "private": false,
        "publish_state": "PUBLISHED",
        "purpose": "This record describes the fields (variables) in a collection of administrative data files created for statistical analysis. Access to the data in this record is granted through the Data Innovation Program. For more information about the program please visit [https://www2.gov.bc.ca/gov/content?id=2F6E3BF426034EDBA62F3F016EE2313D](https://www2.gov.bc.ca/gov/content?id=2F6E3BF426034EDBA62F3F016EE2313D)",
        "record_create_date": "2022-08-26",
        "record_last_modified": "2024-12-05",
        "record_publish_date": "2022-08-26",
        "resource_status": "onGoing",
        "security_class": "PROTECTED B",
        "state": "active",
        "title": "Metadata for Child Care Subsidy - E01",
        "type": "bcdc_dataset",
        "url": null,
        "version": null,
        "view_audience": "Named users",
        "contacts": [
            {
                "displayed": [
                    "displayed"
                ],
                "email": "data.innovation.program@gov.bc.ca",
                "name": "Data Innovation Program",
                "org": "d8e38fa3-e522-4d65-9ae1-b1402dd342c3",
                "role": "distributor"
            }
        ],
        "dates": [
            {
                "date": "2023-06-01",
                "type": "Created"
            }
        ],
        "groups": [
            {
                "description": "This group represents the datasets that are included in the Data Innovation Program. Learn more about the Data Innovation Program: https://bit.ly/36x6EXa\r\n\r\nThe Data Innovation Program is a data integration and analytics program for government and academics. While every B.C. ministry collects and manages its own data, the Data Innovation Program securely links and de-identifies data from multiple ministries, giving government analysts a better understanding of B.C.’s complex issues. \r\n\r\nIf your research requires a dataset that is not listed here, contact the Data Innovation Program. Although the Data Innovation Program does not currently support researcher-collected data, it may be able to accommodate requests for administrative data from government or similar organizations.  \r\n\r\nThe DIP Metadata Viewer is a helpful tool to explore the metadata for all datasets available through the Data Innovation Program: https://bit.ly/3hA49da\r\n\r\nFor more information, email the Data Innovation Program: data@gov.bc.ca",
                "display_name": "Data Innovation Program",
                "id": "0aca03a1-f756-442b-8188-e714c430489d",
                "image_display_url": "https://catalogue.data.gov.bc.ca/uploads/group/2019-07-02-201209.842149BCGov.png",
                "name": "data-innovation-program",
                "title": "Data Innovation Program"
            }
        ],
        "more_info": [
            {
                "description": "",
                "url": ""
            }
        ],
        "resources": [
            {
                "bcdc_type": "document",
                "cache_last_updated": null,
                "cache_url": "null",
                "created": "2023-06-01T19:23:32.357395",
                "datastore_active": "true",
                "description": "By month, the complete list of children receiving the affordable child care benefit, by type of benefit",
                "details": [],
                "format": "csv",
                "geographic_extent": [],
                "hash": "",
                "id": "da708f25-c9a1-40c1-af42-e3189f2a324f",
                "isUrl": "false",
                "iso_topic_category": [],
                "json_table_schema": {
                    "fields": [
                        {
                            "var_class": "3c. Direct Identifier Internal - replaced",
                            "description": "Replaced with coordinating id and then project specific encryption. ICM Pid - uniquely identifies the child eligible for Affordable Child Care Benefit. This field is the same as \"ppd_x_contact_num\" in the original data\n",
                            "name": "icmpid"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "The year and month the client was eligible for service\n",
                            "name": "iid_svcym"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "Number of full child care days required in the month\n",
                            "name": "if_full_days_num"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "Number of half child care days required in the month\n",
                            "name": "if_half_days_num"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "Payment for the child care service\n",
                            "name": "if_item_amt"
                        },
                        {
                            "var_class": "3c. Direct Identifier Internal - replaced",
                            "description": "Replaced with project specific encryption. ICM case number for the child eligible for child care services\n",
                            "name": "cd_case_num"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "Types of child care arrangements that are eligible for benefit (In Childs Own Home, Licence Not Required, Licensed Family, Licensed Group, Licensed OOS Care/Licensed Grp, Preschool, Registered Licence Not Rquired, Special Needs Supplement)\n",
                            "name": "bpid_benefit_cd"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "Reason for eligibility (Approved Work Search, CF and CS Referral, Employability Program, Employed, Medical Condition, No Eligible Reason, Preschool, Self-Employed, Training or Education)\n",
                            "name": "bpid_reason_care_cd"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "Code that represents the type of required child care service\n",
                            "name": "copsd_prod_name"
                        },
                        {
                            "var_class": "99a. Research Content",
                            "description": "Either one parent or two parents\n",
                            "name": "bpd_x_family_type_cd"
                        },
                        {
                            "name": "bpd_program_name",
                            "var_class": "99a. Research Content"
                        },
                        {
                            "var_class": "6c. Strong Indirect Identifier - modified",
                            "description": "Modified to 3 digits. Postal code where the child care service\n",
                            "name": "pcdh_base_postal_cd"
                        },
                        {
                            "var_class": "3c. Direct Identifier Internal - replaced",
                            "description": "See edition notes in the Dataset Summary. Replaced with coordinating ID and then project specific encryption. ICM unique identifier for case contacts (pids). Can be key player or any other case contact\n",
                            "name": "icmpid_cord"
                        },
                        {
                            "var_class": "99c. Popdata Variables (internal use)",
                            "description": "For Popdata internal use\n",
                            "name": "Datayr"
                        },
                        {
                            "var_class": "99c. Popdata Variables (internal use)",
                            "description": "Version ID. For Population Data BC internal use\n",
                            "name": "Version"
                        },
                        {
                            "var_class": "99c. Popdata Variables (internal use)",
                            "description": "Sequence Number. For Population Data BC internal use\n",
                            "name": "Seqno"
                        },
                        {
                            "var_class": "99c. Popdata Variables (internal use)",
                            "description": "Linkage ID. Research Content\n",
                            "name": "STUDYID"
                        }
                    ]
                },
                "last_modified": "2024-03-11T23:45:46.328600",
                "metadata_modified": "2023-06-01T19:23:32.357395",
                "mimetype": "application/json",
                "mimetype_inner": "null",
                "name": "Metadata for Child Care Subsidy - E01",
                "package_id": "b5c83fa8-89dd-4310-85cd-7413f2d36746",
                "position": 0,
                "preview_info": [],
                "projection_name": "",
                "resource_access_method": "direct access",
                "resource_storage_location": "catalogue data store",
                "resource_type": "data",
                "resource_update_cycle": "annually",
                "size": 1907,
                "spatial_datatype": "",
                "state": "active",
                "url": "https://catalogue.data.gov.bc.ca/dataset/b5c83fa8-89dd-4310-85cd-7413f2d36746/resource/da708f25-c9a1-40c1-af42-e3189f2a324f/download/dip_mcfd_child-subsidy-e01-20220810.csv",
                "url_type": "upload",
                "temporal_extent": [
                    {
                        "beginning_date": "2011-01-01",
                        "end_date": "2021-12-01"
                    }
                ]
            }
        ],
        "tags": [
            {
                "display_name": "Child Care Benefit",
                "id": "dab5df20-c2d9-4e89-a7a0-8ba257893257",
                "name": "Child Care Benefit",
                "state": "active",
                "vocabulary_id": null
            },
            {
                "display_name": "Child Subsidy",
                "id": "19deff6b-8b1c-4632-9f4a-5953006a79b5",
                "name": "Child Subsidy",
                "state": "active",
                "vocabulary_id": null
            }
        ],
        "relationships_as_subject": [],
        "relationships_as_object": []
    }
```

### Detailed Mapping Table

| UI section | UI property | BC Data Catalog source | Transformation / logic | Backstage mapping | Notes / gaps |
|---|---|---|---|---|---|
|**main**|title|title|direct|entity.metadata.title|—|
|---|description|notes|direct|entity.metadata.description|—|
|---|tags|tags[].display_name|map array → string[]|entity.metadata.tags|—|
|---|Part of Connected Services|---|not available|custom|gap|
|---|Learn more|more_info[]|direct|entity.metadata.links|—|
|---|Type|---|not available|custom|gap|
|---|Custodian|organization.title|direct|entity.spec.owner|—|
|---|Status|publish_state|direct (mapping)|custom|[PENDING ARCHIVE, PUBLISHED]|
|---|Security Classification|security_class|direct (mapping)|custom|[PROTECTED A, PROTECTED B, PROTECTED C, PUBLIC]|
|---|Data quality Score|---|not available|custom|gap|
|---|Update frequency|resources[].resource_update_cycle|take first resource|custom|Maybe update frequecy should be on the individual access methods? it may not map very well to datasets in general unless we are talking about specific entities within a dataset or single entity datasets.|
|---|Retention|---|not available|custom|gap|
|---|View APIs|resources[]|direct|/catalog?filters[kind]=API&filters[relations.providedBy]=entityRef|When an API is created based on an API resource we can define the relationship in Backstage|
|---|Technical documentation|---|not available|direct|gap|
|---|Download schema|resources[].json_table_schema|custom|custom endpoint|There is no consistent source of schema information in BCDC.  JSON table Schema is provided for only 6 out of 3000+ datasets.  Some other datasets provide Data Definitions in XLS documents but there is no way to consitently identify these and the contents of the XLS document is not consistent.|
|---|Need help?|contacts[]|map to support info|custom|It is not clear from the page mockups what is expected from the link.|
|**About this Dataset**|description|purpose|direct|custom|—|
|---|It includes|---|not available|custom|gap - maybe not required|
|---|Intended Use|---|not available|custom|gap - maybe not required|
|---|Not Intended For|---|not available|custom|gap - maybe not required|
|***Authoritative Designation***|authoritative for|---|not available|custom|gap|
|***Access Methods***|APIs|resources[]|direct|spec.providesApis|When an API is created based on an API resource we can define the relationship in Backstage|
|---|other|resources[]|direct|custom|Not sure how or if we are going to surface non-API dataset resources.  Is this jsut a link like in BCDC or a first class entity like an API?|
|***Schema***|Field name|---|not available|custom|There is no consistent source of schema information in BCDC.  JSON table Schema is provided for only 6 out of 3000+ datasets.  Some other datasets provide Data Definitions in XLS documents but there is no way to consitently identify these and the contents of the XLS document is not consistent.|
|---|Type|---|not available|custom|gap|
|---|Format|---|not available|custom|gap|
|---|Required|---|not available|custom|gap|
|***Fields & definitions***|field name|---|not available|custom|gap -  There is a lot of similarity and overlap here with **Schema**.  Not sure if we need both or if we would just provide differnt formatting to the same source of schema data.|
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