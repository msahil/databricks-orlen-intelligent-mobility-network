-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- @param site_id STRING = SITE-00007
SELECT
  `Site` AS site_id,
  `Site Name` AS site_name,
  `City` AS city,
  `Country` AS country,
  `Station Format` AS station_format,
  `Road Context` AS road_context,
  `Location Data Status` AS location_data_status,
  `Operating Status` AS operating_status,
  MEASURE(`Available Chargers`) AS available_chargers,
  MEASURE(`Expected Wait Minutes`) AS expected_wait_minutes,
  MEASURE(`Traffic Demand Index`) AS traffic_demand_index,
  MEASURE(`Stop Cafe Demand Index`) AS stop_cafe_demand_index,
  MEASURE(`Inventory Risk Score`) AS inventory_risk_score,
  MEASURE(`At Risk Sites`) AS at_risk_sites
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_mv_site_performance'))
WHERE `Site` = :site_id
GROUP BY ALL
