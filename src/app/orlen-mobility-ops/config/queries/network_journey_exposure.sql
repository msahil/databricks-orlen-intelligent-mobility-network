-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- Scenario-window journey and margin evidence; values are synthetic, not a forecast.
SELECT
  `Site` AS site_id,
  `Customer Segment` AS customer_segment,
  MEASURE(`Journey Count`) AS journey_count,
  MEASURE(`Affected Journeys`) AS affected_journeys,
  MEASURE(`Journey Margin Proxy EUR`) AS margin_proxy_eur
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_mv_customer_journey_value'))
GROUP BY ALL
LIMIT 400
