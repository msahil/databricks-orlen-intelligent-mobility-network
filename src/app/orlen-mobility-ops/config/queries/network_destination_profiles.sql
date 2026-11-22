-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- Conformed workshop destination attributes. Public names are city-level context;
-- services, capacity, and facilities are deterministic synthetic data.
SELECT
  site_id,
  concat_ws(',', first(fuel_types)) AS fuel_types_csv,
  concat_ws(',', sort_array(collect_set(CASE WHEN is_available THEN facility_type END))) AS facilities_csv,
  MAX(ev_charger_count) AS installed_chargers,
  MAX(max_charger_kw) AS max_charger_kw
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_silver_sites_and_facilities'))
GROUP BY site_id
LIMIT 80
