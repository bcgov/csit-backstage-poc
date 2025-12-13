import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Child schemas (defined in order of dependency)
// ─────────────────────────────────────────────────────────────────────────────

const BcMoreInfoSchema = z.object({
  url: z.string(),
  description: z.string().nullable().optional(),
});

const BcTagSchema = z.object({
  display_name: z.string(),
  id: z.string(),
  name: z.string(),
  state: z.string(),
  vocabulary_id: z.string().nullable(),
});

const BcGroupSchema = z.object({
  description: z.string(),
  display_name: z.string(),
  id: z.string(),
  image_display_url: z.string(),
  name: z.string(),
  title: z.string(),
});

const BcContactSchema = z.object({
  displayed: z.array(z.string()).optional(),
  email: z.string(),
  name: z.string(),
  org: z.string(),
  role: z.string(),
});

const BcOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  type: z.string(),   
  description: z.string(),
  image_url: z.string(),
  created: z.string(), // ISO date string
  is_organization: z.literal(true),
  approval_status: z.string(),
  state: z.string(),
});

const BcGeographicExtentSchema = z.object({
  east_bound_longitude: z.string(),
  north_bound_latitude: z.string(),
  south_bound_latitude: z.string(),
  west_bound_longitude: z.string(),
});

const BcResourceDetailsSchema = z.object({
  column_comments: z.string().optional(),
  column_name: z.string(),
  data_precision: z.number().or(z.string()),
  data_type: z.string(),
  short_name: z.string().optional(),
});

const BcResourcePreviewInfoSchema = z.object({
  layer_name: z.string().optional(),
  name: z.string().optional(),
  preview_latitude: z.string().optional(),
  preview_longitude: z.string().optional(),
  preview_zoom_level: z.string().optional(),
  link_to_imap: z.string().optional(),
  preview_map_service_url: z.string().optional(),
});

const BcResourceSchema = z.object({
  bcdc_type: z.string(),
  cache_last_updated: z.string().nullable(),
  cache_url: z.string().nullable(),
  created: z.string(),
  datastore_active: z.string().or(z.boolean()),
  description: z.string().optional(),
  details: z.array(BcResourceDetailsSchema).optional(),
  format: z.string(),
  geographic_extent: z.array(BcGeographicExtentSchema).optional(),
  hash: z.string(),
  id: z.string(),
  iso_topic_category: z.array(z.string()).optional(),
  metadata_modified: z.string(),
  mimetype: z.string().nullable(),
  name: z.string(),
  package_id: z.string(),
  position: z.number(),
  preview_info: z.array(BcResourcePreviewInfoSchema).optional(),
  projection_name: z.string().optional(),
  resource_access_method: z.string(),
  resource_storage_location: z.string(),
  resource_type: z.string(),
  resource_update_cycle: z.string(),
  size: z.number().nullable(),
  spatial_datatype: z.string().optional(),
  state: z.string(),
  url: z.string(),
  url_type: z.string().nullable(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Main schema
// ─────────────────────────────────────────────────────────────────────────────

export const BcDataCataloguePackageSchema = z.object({
  author: z.string().nullable(),
  author_email: z.string().email().nullable(),
  creator_user_id: z.string(),
  download_audience: z.string(),
  id: z.string(),
  isopen: z.boolean(),
  license_id: z.string(),
  license_title: z.string().nullable(),
  license_url: z.string().url(),
  maintainer: z.string().nullable(),
  maintainer_email: z.string().email().nullable(),
  metadata_created: z.string(),
  metadata_modified: z.string(),
  metadata_visibility: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  num_resources: z.number(),
  num_tags: z.number(),
  organization: BcOrganizationSchema,
  owner_org: z.string(),
  private: z.boolean().nullable(),
  publish_state: z.string(),
  record_create_date: z.string().optional(),
  record_last_modified: z.string(),
  record_publish_date: z.string(),
  resource_status: z.string(),
  security_class: z.string(),
  state: z.string(),
  title: z.string().nullable(),
  type: z.string(),
  url: z.string().nullable(),
  version: z.string().nullable(),
  view_audience: z.string(),

  // Arrays
  contacts: z.array(BcContactSchema),
  dates: z.array(z.object({
    date: z.string(),
    type: z.string(),
  })),
  groups: z.array(BcGroupSchema),
  more_info: z.array(BcMoreInfoSchema).nullable().optional(),
  resources: z.array(BcResourceSchema).nullable(),
  tags: z.array(BcTagSchema).nullable(),

  // These are usually empty arrays of relationship IDs
  relationships_as_subject: z.array(z.string()),
  relationships_as_object: z.array(z.string()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types (exactly match your original interfaces)
// ─────────────────────────────────────────────────────────────────────────────

export type BcDataCataloguePackage = z.infer<typeof BcDataCataloguePackageSchema>;
export type BcOrganization = z.infer<typeof BcOrganizationSchema>;
export type BcContact = z.infer<typeof BcContactSchema>;
export type BcGroup = z.infer<typeof BcGroupSchema>;
export type BcTag = z.infer<typeof BcTagSchema>;
export type BcResource = z.infer<typeof BcResourceSchema>;
export type BcMoreInfo = z.infer<typeof BcMoreInfoSchema>;