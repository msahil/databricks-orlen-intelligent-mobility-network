-- @param catalog_name STRING = msahil_demo_workspace_catalog
-- @param schema_name STRING = orlen_intelligent_mobility
-- @param site_id STRING = SITE-00007
SELECT charger_id, scored_at, feature_snapshot_ts, prediction_horizon_minutes, failure_probability,
  baseline_probability, risk_band, model_name, model_version
FROM (
  SELECT charger_id, scored_at, feature_snapshot_ts, prediction_horizon_minutes, failure_probability,
    baseline_probability, risk_band, model_name, model_version,
    ROW_NUMBER() OVER (PARTITION BY charger_id ORDER BY feature_snapshot_ts DESC, scored_at DESC, prediction_id DESC) AS recency
  FROM IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_ml_charger_failure_predictions'))
  WHERE site_id = :site_id
)
WHERE recency = 1
ORDER BY failure_probability DESC, charger_id
