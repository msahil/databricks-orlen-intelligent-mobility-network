-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- @param site_id STRING = SITE-00007
SELECT
  DATE_TRUNC('HOUR', event_ts) AS signal_hour,
  COUNT(*) AS observations,
  COUNT(DISTINCT charger_id) AS observed_chargers,
  AVG(telemetry_error_rate) AS average_error_rate,
  MAX(telemetry_error_rate) AS highest_error_rate,
  AVG(telemetry_temperature_c) AS average_temperature_c,
  MAX(telemetry_temperature_c) AS highest_temperature_c,
  AVG(demand_index) AS average_demand_index,
  MAX(event_ts) AS latest_event_ts,
  MAX(ingestion_ts) AS latest_ingestion_ts
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_silver_charging_operations'))
WHERE site_id = :site_id
GROUP BY DATE_TRUNC('HOUR', event_ts)
ORDER BY signal_hour DESC
LIMIT 8
