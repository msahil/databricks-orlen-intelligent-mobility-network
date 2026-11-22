-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- @param site_id STRING = SITE-00007
SELECT
  `Customer Segment` AS customer_segment,
  MEASURE(`Journey Count`) AS journey_count,
  MEASURE(`Completed Journeys`) AS completed_journeys,
  MEASURE(`Affected Journeys`) AS affected_journeys,
  MEASURE(`Average Wait Minutes`) AS average_wait_minutes,
  MEASURE(`Stop Cafe Conversion`) AS stop_cafe_conversion,
  MEASURE(`Journey Revenue EUR`) AS journey_revenue_eur,
  MEASURE(`Journey Margin Proxy EUR`) AS journey_margin_proxy_eur,
  MEASURE(`Journey Completion Rate`) AS journey_completion_rate
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_mv_customer_journey_value'))
WHERE `Site` = :site_id
GROUP BY ALL
