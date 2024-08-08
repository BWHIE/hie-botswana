export interface Mapping {
  extras: Extras
  checksums: Checksums
  external_id?: string
  retired: boolean
  map_type: string
  source: string
  owner: string
  owner_type: string
  from_concept_code: string
  from_concept_name: any
  from_concept_url: string
  to_concept_code: string
  to_concept_name?: string
  to_concept_url: string
  from_source_owner: string
  from_source_owner_type: string
  from_source_url: string
  from_source_name: string
  to_source_owner: string
  to_source_owner_type: string
  to_source_url: string
  to_source_name: string
  url: string
  version: string
  id: string
  versioned_object_id: number
  versioned_object_url: string
  is_latest_version: boolean
  update_comment: any
  version_url: string
  uuid: string
  version_created_on: string
  from_source_version: any
  to_source_version: any
  from_concept_name_resolved: string
  to_concept_name_resolved: string
  type: string
  sort_weight: any
  version_updated_on: string
  version_updated_by: string
  latest_source_version: any
  created_on: string
  updated_on: string
  created_by: string
  updated_by: string
  public_can_view: boolean
}

export interface Extras {}

export interface Checksums {
  smart: string
  standard: string
}
