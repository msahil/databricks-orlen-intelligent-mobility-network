-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- Governed site measures for the control tower and Network tab. The UI only
-- maps publicly named sites at approximate city centres, never station GPS.
SELECT
  `Site` AS site_id,
  `Site Name` AS site_name,
  `City` AS city,
  `Country` AS country,
  `Station Format` AS station_format,
  `Road Context` AS road_context,
  `Location Data Status` AS location_data_status,
  `Operating Status` AS operating_status,
  `Snapshot Time` AS snapshot_time,
  MEASURE(`Available Chargers`) AS available_chargers,
  MEASURE(`Expected Wait Minutes`) AS expected_wait_minutes,
  MEASURE(`Traffic Demand Index`) AS traffic_demand_index,
  MEASURE(`Stop Cafe Demand Index`) AS stop_cafe_demand_index,
  MEASURE(`Inventory Risk Score`) AS inventory_risk_score,
  MEASURE(`At Risk Sites`) AS at_risk_sites
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_mv_site_performance'))
GROUP BY ALL
ORDER BY at_risk_sites DESC, expected_wait_minutes DESC
LIMIT 80
