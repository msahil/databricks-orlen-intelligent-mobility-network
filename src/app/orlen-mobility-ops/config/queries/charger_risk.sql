-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- @param site_id STRING = SITE-00007
SELECT
  `Site` AS site_id,
  `Risk Band` AS risk_band,
  MEASURE(`Charger Predictions`) AS charger_predictions,
  MEASURE(`High Risk Predictions`) AS high_risk_predictions,
  MEASURE(`Average Failure Probability`) AS average_failure_probability,
  MEASURE(`Average Baseline Probability`) AS average_baseline_probability
FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_mv_charger_risk'))
WHERE `Site` = :site_id
GROUP BY ALL

