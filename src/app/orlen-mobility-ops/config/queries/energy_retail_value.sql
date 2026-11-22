-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- @param site_id STRING = SITE-00007
SELECT
  `Energy Type` AS energy_type,
  `Service Type` AS service_type,
  MEASURE(`Energy KWh`) AS energy_kwh,
  MEASURE(`Energy Revenue EUR`) AS energy_revenue_eur,
  MEASURE(`Convenience Revenue EUR`) AS convenience_revenue_eur,
  MEASURE(`Total Revenue EUR`) AS total_revenue_eur,
  MEASURE(`Margin Proxy EUR`) AS margin_proxy_eur
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_mv_energy_retail_performance'))
WHERE `Site` = :site_id
GROUP BY ALL

