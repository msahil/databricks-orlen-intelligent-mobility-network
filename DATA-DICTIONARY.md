# ORLEN Mobility data dictionary

Canonical narrative: [STORYLINE.md](STORYLINE.md)  
Ontology contract: [GENIE-ONTOLOGY.md](GENIE-ONTOLOGY.md)

## Data contract

| Field | Value |
|---|---|
| Customer | ORLEN |
| Business unit | Mobility |
| Namespace | `msahil_demo_workspace_catalog.orlen_intelligent_mobility` |
| Data policy | Deterministic synthetic data only |
| Generator | `src/notebooks/generate_mobility_synthetic_data.py` |
| Replay boundary | `run_id` plus event-time window; reset restores the baseline batch |
| PII | None; `customer_segment` is synthetic and non-identifying |
| Shared-schema rule | Mobility uses `mobility_*`; future domains use `upstream_*` and `downstream_*` |

## Table inventory

This inventory includes future contract objects. `mobility_gold_action_outcomes` and
`mobility_gold_outcome_measurements` are **not deployed**. `mobility_ops_action_state` is an
earlier Lakebase contract name; the implemented operational objects are the
`mobility_ops_response_*` tables documented below. No existing source row is linked to an
executed Elmshorn action.

| Table | Layer/type | Grain | Primary key | Purpose |
|---|---|---|---|---|
| `mobility_bronze_sites` | Bronze/master | One row per modelled destination; 14 publicly named locations, one scenario-defined Elmshorn-area site, and 65 synthetic regional references | `site_id` | Site identity, provenance, facilities, energy types, and capacity |
| `mobility_bronze_site_facilities` | Bronze/master | One row per site and facility | `site_id`, `facility_type` | Journey qualification: Stop Cafe, VITAY, accessibility, family, wash, TIR |
| `mobility_bronze_chargers` | Bronze/master | One row per charger | `charger_id` | Charger type, power, and current maintenance status |
| `mobility_bronze_station_events` | Bronze/event | One row per observed station event | `event_id` | Replayable traffic, charging, POS, and inventory signals |
| `mobility_bronze_charger_telemetry` | Bronze/telemetry | One row per charger observation | `event_id` | Temperature, error rate, demand, and degradation signal |
| `mobility_bronze_charging_sessions` | Bronze/transaction | One row per charging session | `session_id` | EV energy delivered, wait, and charging value |
| `mobility_bronze_fuel_transactions` | Bronze/transaction | One row per fuel sale | `transaction_id` | Petrol, diesel, LPG, and future hydrogen sales/value |
| `mobility_bronze_convenience_transactions` | Bronze/transaction | One row per Stop Cafe transaction | `transaction_id` | Convenience demand and basket value |
| `mobility_bronze_inventory_snapshots` | Bronze/state | One row per site/product/time snapshot | `snapshot_id` | On-hand units, reorder point, and stockout risk |
| `mobility_bronze_traffic_demand` | Bronze/observation | One row per traffic observation | `traffic_observation_id` | Holiday surge and demand pressure |
| `mobility_bronze_weather_observations` | Bronze/context | One row per site and traffic observation | `weather_observation_id` | Weather context for demand and journey interpretation |
| `mobility_bronze_customer_journeys` | Bronze/journey | One row per synthetic journey | `journey_id` | Segment, wait, completion, and journey risk |
| `mobility_bronze_maintenance_history` | Bronze/work order | One row per maintenance event/work order | `work_order_id` | Inspection and charger intervention history |
| `mobility_bronze_vitay_interactions` | Bronze/customer activity | One row per synthetic VITAY interaction | `interaction_id` | Bounded benefit eligibility and journey engagement |
| `mobility_bronze_holiday_calendar` | Bronze/reference | One row per calendar day/event | `calendar_date` | Demand multiplier and travel-surge context |
| `mobility_silver_station_events` | Silver/event | One valid, deduplicated event | `event_id` | Quality-controlled event stream |
| `mobility_silver_sites_and_facilities` | Silver/reference | One row per site and facility | `site_id`, `facility_type` | Conformed destination and facility semantics |
| `mobility_silver_charging_operations` | Silver/telemetry | One row per charger observation | `event_id` | Telemetry joined to charger capability |
| `mobility_silver_energy_transactions` | Silver/transaction | One row per energy transaction | `record_id` | EV, petrol, diesel, LPG, and hydrogen services |
| `mobility_silver_convenience_and_inventory` | Silver/retail state | One row per convenience transaction or inventory snapshot | `record_id` | Stop Cafe value and stockout risk |
| `mobility_silver_demand_context` | Silver/context | One row per traffic observation | `traffic_observation_id` | Traffic, weather, and holiday context |
| `mobility_silver_customer_journeys` | Silver/journey | One row per journey | `journey_id` | Journey and VITAY engagement context |
| `mobility_silver_maintenance` | Silver/work order | One row per maintenance work order | `work_order_id` | Operational action context |
| `mobility_gold_site_operating_state` | Gold/current state | One row per site and snapshot time | `site_id`, `snapshot_ts` | Current operational condition and risk |
| `mobility_gold_customer_journey_metrics` | Gold/metrics | One row per site, segment, and interval | `site_id`, `metric_interval_start`, `customer_segment` | Journey, wait, demand, and convenience measures |
| `mobility_gold_energy_and_retail_performance` | Gold/metrics | One row per site, interval, energy type, and service | `site_id`, `metric_interval_start`, `energy_type`, `service_type` | Multi-energy and convenience value |
| `mobility_gold_network_capacity_and_demand` | Gold/metrics | One row per site and interval | `site_id`, `metric_interval_start` | Demand, wait, weather, and inventory pressure |
| `mobility_ml_charger_failure_predictions` | ML/classification | One score per charger observation and scoring time | `prediction_id` | Observed-degradation classification; legacy table name retained |
| `mobility_ml_charger_failure_features` | ML/features | One feature snapshot per charger telemetry event | `event_id` | Point-in-time features and synthetic degradation label for training |
| `mobility_ml_supporting_forecasts` | ML/forecast | One forecast per site, measure, and horizon | `forecast_id` | Congestion, demand, inventory, and value forecasts |
| `mobility_gold_action_outcomes` | Gold/outcome | One approved action and execution outcome | `action_id` | Action status and operational result |
| `mobility_gold_outcome_measurements` | Gold/outcome | One site, measure, and comparison window | `measurement_id` | Predicted versus realized customer and ORLEN value |
| `mobility_ops_action_state` | Lakebase/operational | One mutable action workflow | `action_id` | App approvals, ownership, and idempotent write-back |

## Column-level definitions

### `mobility_bronze_sites`

| Column | Type | Null | Key | Definition / allowed values | Source / quality rule |
|---|---|---:|---|---|---|
| `site_id` | STRING | No | PK | Synthetic ORLEN destination ID, `SITE-00001` format | Generator; unique and non-null |
| `site_name` | STRING | No |  | Publicly named ORLEN location where available, otherwise a scenario or reference display name; `SITE-00015` displays as `ORLEN Charge Elmshorn East` | Generator; non-empty; provenance stays in `location_data_status` and `data_provenance` |
| `city` | STRING | No |  | Public city/area for named locations, otherwise regional placeholder | Location mapping; non-empty |
| `country` | STRING | No |  | ORLEN retail market: Poland, Germany, Czechia, Lithuania, Austria, Hungary, or Slovakia | Seven-market footprint mapping |
| `station_format` | STRING | No |  | Multi-energy station, hydrogen station/hub, motorway fast-charge hub, or urban destination | Public location mapping plus synthetic fallback |
| `road_context` | STRING | No |  | Motorway, expressway, urban, or regional journey context | Public location mapping plus synthetic fallback |
| `location_data_status` | STRING | No |  | `publicly_named`, `synthetic_scenario_location`, or `synthetic_reference_location` | Identity provenance flag; `SITE-00015` is scenario-defined |
| `market` | STRING | No |  | ORLEN retail market | Weighted synthetic distribution with public-location overrides |
| `latitude` | DOUBLE | No |  | Approximate synthetic latitude; 53.75 for the Elmshorn East scenario waypoint | Range check by market; not a station address |
| `longitude` | DOUBLE | No |  | Approximate synthetic longitude; 9.75 for the Elmshorn East scenario waypoint | Range check by market; not a station address |
| `fuel_types` | ARRAY<STRING> | No |  | `petrol`, `diesel`, `lpg`, `hydrogen` where applicable | At least one fuel type |
| `ev_charger_count` | INT | No |  | Installed EV charger count | Non-negative |
| `max_charger_kw` | INT | No |  | Highest available charging power | Positive when charger count > 0 |
| `has_stop_cafe` | BOOLEAN | No |  | Stop Cafe availability | Generator |
| `has_vitay` | BOOLEAN | No |  | VITAY capability at the site | Generator |
| `has_tir_facility` | BOOLEAN | No |  | TIR/truck facility availability | Generator |
| `inventory_capacity_units` | INT | No |  | Convenience inventory capacity | Positive |
| `active_from` | DATE | No |  | Date destination became active in simulation | Generator |
| `public_source_url` | STRING | Yes |  | ORLEN public retail press-page provenance for named location identities; null for scenario-defined Elmshorn East | Public source reference; not a transaction source |
| `data_provenance` | STRING | No |  | Distinguishes public identity with synthetic operations from a scenario-defined destination without a verified public identity | Required transparency label |

`SITE-00015` replaces the former generic `ORLEN Mobility Hub 015` row in the fixed 80-site network. It is **ORLEN Charge Elmshorn East**, marked `synthetic_scenario_location`, with no public source URL. The App maps it to a scenario-defined waypoint at 53.75° N, 9.75° E, about 7 km straight-line from its Elmshorn city-centre reference. The deployed Gold state and Metric View show one modelled charger ready, 300 kW maximum power, 7.87-minute expected wait, 1.52 traffic-demand index, and normal operating state. Its Silver facility profile currently lists accessible, Stop Cafe, and wash; other facilities must not be inferred. The site passes EV screening but has no verified real address, drive route or current capacity. The Lakebase routing action names this site with `route_verified: false`.

### `mobility_bronze_station_events`

| Column | Type | Null | Key | Definition / allowed values | Source / quality rule |
|---|---|---:|---|---|---|
| `event_id` | STRING | No | PK | Unique replay event ID | Unique within `run_id` |
| `run_id` | STRING | No |  | Replay/reset identifier | Required for cleanup |
| `site_id` | STRING | No | FK | Destination receiving the event | Must exist in `mobility_bronze_sites` |
| `charger_id` | STRING | Yes |  | Charger identifier when event is charger-related | Required for charger events |
| `event_ts` | TIMESTAMP | No |  | Business event time in UTC | Watermark and late-data test |
| `ingestion_ts` | TIMESTAMP | No |  | Time event enters the pipeline | `ingestion_ts >= event_ts` normally |
| `event_type` | STRING | No |  | `traffic`, `charge_session`, `charger_telemetry`, `fuel_sale`, `cafe_sale`, `inventory`, `maintenance` | Allowed-value check |
| `status` | STRING | No |  | Event status such as `normal`, `degraded`, `failed`, `completed` | Allowed-value check |
| `energy_type` | STRING | Yes |  | `petrol`, `diesel`, `lpg`, `hydrogen`, `ev` | Required for energy events |
| `quantity` | DOUBLE | Yes |  | Litres, kWh, units, or sessions according to event type | Non-negative |
| `amount_eur` | DECIMAL(12,2) | Yes |  | Synthetic transaction value | Non-negative; never real payment data |
| `wait_seconds` | INT | Yes |  | Observed customer wait | Non-negative |
| `demand_index` | DOUBLE | Yes |  | Relative demand signal, baseline 1.0 | Non-negative |
| `telemetry_temperature_c` | DOUBLE | Yes |  | Synthetic charger temperature | Plausible engineering range |
| `telemetry_error_rate` | DOUBLE | Yes |  | Charger error rate | Range 0–1 |
| `source_system` | STRING | No |  | `traffic_simulator`, `charger_simulator`, `pos_simulator`, `inventory_simulator` | Allowed-value check |
| `is_hero_scenario` | BOOLEAN | No |  | True when the event belongs to the deterministic holiday-surge / degraded-charger site | Derived from `site_id`; must be true for `SITE-00007` events |

### Descriptive Bronze source datasets — complete column contract

These source objects intentionally separate business concepts so the Catalog,
schema, tables, Genie Ontology, ML features, and lineage are understandable
during the demo. Every implemented column is listed below; they are not
flattened into one generic event table.

| Table | Column | Type | Nullable | Definition / constraint |
|---|---|---|---:|---|
| `mobility_bronze_site_facilities` | `site_id` | STRING | No | FK to sites; destination identifier. |
|  | `facility_type` | STRING | No | `stop_cafe`, `vitay`, `accessible`, `family`, `wash`, or `tir`. |
|  | `is_available` | BOOLEAN | No | Whether the facility is currently offered at the site. |
|  | `capacity_units` | INT | No | Synthetic service capacity; positive. |
| `mobility_bronze_chargers` | `charger_id` | STRING | No | PK; charger identifier derived from site. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `charger_type` | STRING | No | `standard`, `fast`, or `ultra_fast`. |
|  | `max_kw` | INT | No | Rated charging power: 50, 150, or 350 kW. |
|  | `installed_date` | DATE | No | Synthetic commissioning date. |
|  | `charger_status` | STRING | No | `active` or deterministic `degraded` hero charger status. |
| `mobility_bronze_charger_telemetry` | `event_id` | STRING | No | PK and source-event reference. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `charger_id` | STRING | No | FK-like reference to charger asset. |
|  | `event_ts` | TIMESTAMP | No | Business observation time. |
|  | `ingestion_ts` | TIMESTAMP | No | Arrival time; normally five seconds after event time. |
|  | `status` | STRING | No | `normal`, `degraded`, or `completed`. |
|  | `telemetry_temperature_c` | DOUBLE | No | Charger temperature in Celsius; elevated at hero site. |
|  | `telemetry_error_rate` | DOUBLE | No | Error rate between 0 and 1; elevated at hero site. |
|  | `demand_index` | DOUBLE | No | Relative charging demand signal. |
| `mobility_bronze_charging_sessions` | `session_id` | STRING | No | PK; one synthetic EV session. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `charger_id` | STRING | No | Charger serving the session. |
|  | `event_ts` | TIMESTAMP | No | Session event time. |
|  | `energy_type` | STRING | No | `ev`. |
|  | `energy_kwh` | DOUBLE | No | Energy delivered in kWh. |
|  | `amount_eur` | DECIMAL(12,2) | No | Synthetic charging revenue proxy. |
|  | `wait_seconds` | INT | No | Customer wait before service. |
|  | `status` | STRING | No | Session status inherited from source event. |
| `mobility_bronze_fuel_transactions` | `transaction_id` | STRING | No | PK; one synthetic fuel sale. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `event_ts` | TIMESTAMP | No | Sale time. |
|  | `energy_type` | STRING | No | `petrol`, `diesel`, `lpg`, or `hydrogen`; all four are populated. |
|  | `litres` | DOUBLE | No | Synthetic litres sold. |
|  | `amount_eur` | DECIMAL(12,2) | No | Synthetic fuel revenue proxy. |
| `mobility_bronze_convenience_transactions` | `transaction_id` | STRING | No | PK; one Stop Cafe transaction. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `event_ts` | TIMESTAMP | No | Transaction time. |
|  | `channel` | STRING | No | `stop_cafe`. |
|  | `basket_type` | STRING | No | `travel_meal` at hero conditions, otherwise `beverage`. |
|  | `quantity` | DOUBLE | No | Synthetic basket quantity. |
|  | `amount_eur` | DECIMAL(12,2) | No | Synthetic convenience revenue proxy. |
| `mobility_bronze_inventory_snapshots` | `snapshot_id` | STRING | No | PK; one site/product/time state. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `event_ts` | TIMESTAMP | No | Snapshot time. |
|  | `product_category` | STRING | No | `travel_convenience`. |
|  | `on_hand_units` | INT | No | Synthetic inventory on hand. |
|  | `reorder_point_units` | INT | No | Replenishment threshold. |
|  | `stockout_risk_score` | DOUBLE | No | 0–1 risk score; high at hero site. |
| `mobility_bronze_traffic_demand` | `traffic_observation_id` | STRING | No | PK; one traffic observation. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `event_ts` | TIMESTAMP | No | Observation time. |
|  | `demand_index` | DOUBLE | No | Relative arrival demand. |
|  | `wait_seconds` | INT | No | Observed customer wait. |
|  | `traffic_condition` | STRING | No | `holiday_surge` or `normal`; hero trigger is explicit. |
| `mobility_bronze_weather_observations` | `weather_observation_id` | STRING | No | PK; one weather observation aligned to a traffic event. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `event_ts` | TIMESTAMP | No | Observation time. |
|  | `weather_condition` | STRING | No | `warm_and_busy` at hero conditions, otherwise `clear`. |
|  | `temperature_c` | DOUBLE | No | Synthetic temperature in Celsius. |
|  | `precipitation_mm` | DOUBLE | No | Synthetic precipitation in millimetres. |
| `mobility_bronze_customer_journeys` | `journey_id` | STRING | No | PK; one synthetic destination journey. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `event_ts` | TIMESTAMP | No | Journey event time. |
|  | `customer_segment` | STRING | No | `family`, `fleet`, `truck`, or `long_distance`. |
|  | `journey_status` | STRING | No | `at_risk` at hero site, otherwise `normal`. |
|  | `wait_seconds` | INT | No | Journey wait. |
|  | `completed` | BOOLEAN | No | Whether the journey completed successfully. |
| `mobility_bronze_maintenance_history` | `work_order_id` | STRING | No | PK; one maintenance work order. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `charger_id` | STRING | Yes | Charger reference when available. |
|  | `event_ts` | TIMESTAMP | No | Work-order event time. |
|  | `work_order_type` | STRING | No | `inspect_degraded_charger` or `routine_check`. |
|  | `work_order_status` | STRING | No | `open` at hero conditions, otherwise `completed`. |
| `mobility_bronze_vitay_interactions` | `interaction_id` | STRING | No | PK; one synthetic loyalty interaction. |
|  | `run_id` | STRING | No | Replay/reset identifier. |
|  | `site_id` | STRING | No | FK to sites. |
|  | `event_ts` | TIMESTAMP | No | Interaction time. |
|  | `synthetic_customer_id` | STRING | No | Non-identifying synthetic key; never real PII. |
|  | `interaction_type` | STRING | No | `affected_journey` or `standard_journey`. |
|  | `eligibility_status` | STRING | No | `eligible_for_bounded_benefit` or `no_offer`. |
| `mobility_bronze_holiday_calendar` | `calendar_date` | DATE | No | PK; simulated travel-calendar date. |
|  | `event_name` | STRING | No | `summer_travel_surge`. |
|  | `is_peak_travel_day` | BOOLEAN | No | Explicit peak-day context flag. |
|  | `expected_demand_multiplier` | DOUBLE | No | Expected demand multiplier, 1.50–2.15. |

### `mobility_silver_station_events`

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `event_id` | STRING | No | PK | Deduplicated source event ID | Unique |
| `run_id` | STRING | No |  | Replay identifier | Required |
| `site_id` | STRING | No | FK | Validated destination ID | Referential integrity |
| `charger_id` | STRING | Yes |  | Normalized charger ID | Required for charger events |
| `event_ts` | TIMESTAMP | No |  | Normalized event time | Not null |
| `ingestion_ts` | TIMESTAMP | No |  | Pipeline ingestion time | Not null |
| `event_type` | STRING | No |  | Standardized event category | Allowed values |
| `status` | STRING | No |  | Standardized status | Allowed values |
| `quantity` | DOUBLE | Yes |  | Validated event quantity | Non-negative |
| `amount_eur` | DECIMAL(12,2) | Yes |  | Validated synthetic value | Non-negative |
| `wait_seconds` | INT | Yes |  | Validated wait | Non-negative |
| `is_hero_scenario` | BOOLEAN | No |  | True for holiday surge/degrading charger events | Derived from scenario rules |
| `data_quality_status` | STRING | No |  | `accepted` or `quarantined` | Quarantined rows excluded from gold |

### `mobility_gold_site_operating_state`

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `site_id` | STRING | No | PK part | Destination ID | FK to sites |
| `snapshot_ts` | TIMESTAMP | No | PK part | State observation time | Monotonic per site |
| `available_chargers` | INT | No |  | Chargers available for use | 0–charger count |
| `charger_utilization_pct` | DOUBLE | No |  | Modelled last-hour charger-minute utilization from session kWh and rated kW divided by installed charger-minutes; not measured socket occupancy | 0–100 |
| `expected_wait_minutes` | DOUBLE | No |  | Current expected EV wait | Non-negative |
| `traffic_demand_index` | DOUBLE | No |  | Relative arrival demand | Non-negative |
| `stop_cafe_demand_index` | DOUBLE | No |  | Relative Stop Cafe demand | Non-negative |
| `inventory_risk_score` | DOUBLE | No |  | Stockout risk score | 0–1 |
| `site_operating_status` | STRING | No |  | `normal`, `watch`, `at_risk`, `degraded` | Derived status rules |
| `hero_trigger_active` | BOOLEAN | No |  | Whether the demo trigger is active | Derived from replay |
| `state_as_of_ts` | TIMESTAMP | No |  | Latest source event time included | Freshness check |

### `mobility_gold_customer_journey_metrics`

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `site_id` | STRING | No | PK part | Destination ID | FK |
| `metric_interval_start` | TIMESTAMP | No | PK part | UTC interval start | Fixed interval |
| `customer_segment` | STRING | No | PK part | `commuter`, `family`, `long_distance`, `fleet`, `truck` | Allowed values |
| `journey_count` | BIGINT | No |  | Synthetic journeys reaching the site | Non-negative |
| `completed_journey_count` | BIGINT | No |  | Journeys completed successfully | ≤ journey count |
| `affected_journey_count` | BIGINT | No |  | Journeys affected by risk | ≤ journey count |
| `avg_wait_minutes` | DOUBLE | No |  | Average observed/expected wait | Non-negative |
| `stop_cafe_conversion_pct` | DOUBLE | No |  | Cafe conversion rate | 0–100 |
| `revenue_eur` | DECIMAL(14,2) | No |  | Synthetic fuel, charging, and convenience value | Non-negative |
| `margin_proxy_eur` | DECIMAL(14,2) | No |  | Synthetic contribution proxy | Clearly labelled proxy |

### `mobility_ml_charger_failure_predictions`

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `prediction_id` | STRING | No | PK | Unique score ID | Unique |
| `run_id` | STRING | No |  | Replay identifier | Required |
| `site_id` | STRING | No | FK | Destination ID | Valid site |
| `charger_id` | STRING | No |  | Charger being scored | Valid charger |
| `scored_at` | TIMESTAMP | No |  | Prediction time | Not null |
| `prediction_horizon_minutes` | INT | No |  | Legacy field; 0 for observed-state classification after retraining | Must be 0 until future-outcome validation |
| `failure_probability` | DOUBLE | No |  | Model score for observed degradation; legacy field name | 0–1; never describe as future-failure probability |
| `risk_band` | STRING | No |  | `low`, `medium`, `high` | Derived from probability |
| `model_name` | STRING | No |  | Registered UC model name | Exact model identifier |
| `model_version` | STRING | No |  | Model version/alias | Registered version |
| `feature_snapshot_ts` | TIMESTAMP | No |  | Point-in-time feature cutoff | ≤ scored_at |
| `baseline_probability` | DOUBLE | No |  | Fixed-rule comparator | 0–1 |
| `recommended_intervention` | STRING | No |  | `inspect` or `monitor` | Bounded action vocabulary |

### `mobility_ml_supporting_forecasts`

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `forecast_id` | STRING | No | PK | Unique forecast ID | Unique |
| `site_id` | STRING | No | FK | Destination ID | Valid site |
| `forecast_generated_at` | TIMESTAMP | No |  | Forecast creation time | Not null |
| `forecast_interval_start` | TIMESTAMP | No |  | Predicted interval | After generation time |
| `forecast_type` | STRING | No |  | `congestion`, `demand`, `inventory`, `value` | Allowed values |
| `forecast_value` | DOUBLE | No |  | Predicted value | Non-negative where applicable |
| `forecast_unit` | STRING | No |  | `minutes`, `index`, `units`, `eur` | Matches type |
| `lower_bound` | DOUBLE | Yes |  | Lower uncertainty bound | ≤ forecast |
| `upper_bound` | DOUBLE | Yes |  | Upper uncertainty bound | ≥ forecast |
| `model_name` | STRING | No |  | Forecast model identifier | Registered or documented |

### `mobility_gold_action_outcomes`

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `action_id` | STRING | No | PK | Idempotent approved action ID | Unique |
| `run_id` | STRING | No |  | Workshop replay identifier | Required |
| `site_id` | STRING | No | FK | Affected destination | Valid site |
| `action_type` | STRING | No |  | `maintenance`, `routing`, `vitay`, `preparation`, `inventory` | Approved vocabulary |
| `action_status` | STRING | No |  | `proposed`, `approved`, `in_progress`, `completed`, `rejected` | State machine |
| `approved_by` | STRING | Yes |  | Synthetic facilitator/user handle | No real identity in data |
| `approved_at` | TIMESTAMP | Yes |  | Approval time | Required when approved |
| `executed_at` | TIMESTAMP | Yes |  | Execution time | ≥ approved_at |
| `expected_value_eur` | DECIMAL(14,2) | Yes |  | Expected protected value | Synthetic proxy |
| `actual_value_eur` | DECIMAL(14,2) | Yes |  | Realized protected value | Synthetic proxy |
| `customer_impact_status` | STRING | Yes |  | `improved`, `neutral`, `worse`, `unknown` | Allowed values |

### `mobility_gold_outcome_measurements`

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `measurement_id` | STRING | No | PK | Unique outcome measurement | Unique |
| `action_id` | STRING | No | FK | Action being evaluated | Must exist in action outcomes |
| `site_id` | STRING | No | FK | Evaluated destination | Valid site |
| `measure_name` | STRING | No |  | `wait_minutes`, `charger_uptime`, `completed_journeys`, `revenue`, `margin_proxy` | Controlled vocabulary |
| `baseline_value` | DOUBLE | No |  | Expected value without action | Not null |
| `predicted_value` | DOUBLE | Yes |  | ML/forecast expected value | Optional by measure |
| `realized_value` | DOUBLE | Yes |  | Observed synthetic value | Optional until outcome arrives |
| `delta_value` | DOUBLE | Yes |  | Realized minus baseline | Derived |
| `measurement_window_start` | TIMESTAMP | No |  | Comparison window start | Before end |
| `measurement_window_end` | TIMESTAMP | No |  | Comparison window end | After start |
| `outcome_status` | STRING | No |  | `pending`, `measured`, `insufficient_data` | Controlled state |

### `mobility_ops_action_state` (Lakebase)

| Column | Type | Null | Key | Definition / derivation | Quality rule |
|---|---|---:|---|---|---|
| `action_id` | UUID/TEXT | No | PK | Idempotent workflow identifier | Unique |
| `run_id` | TEXT | No |  | Workshop replay identifier | Required |
| `site_id` | TEXT | No |  | Affected site | Valid site |
| `recommendation_json` | JSONB | No |  | Governed agent recommendation and evidence references | Schema-validated |
| `approval_status` | TEXT | No |  | `pending`, `approved`, `rejected`, `modified` | State machine |
| `approved_by` | TEXT | Yes |  | Authenticated App actor | Captured from App identity |
| `approved_at` | TIMESTAMPTZ | Yes |  | Approval timestamp | Required for approved state |
| `version` | INT | No |  | Optimistic-concurrency version | Monotonic |
| `created_at` | TIMESTAMPTZ | No |  | Record creation time | Default current time |
| `updated_at` | TIMESTAMPTZ | No |  | Last update time | ≥ created_at |

## Expanded conformed Silver and Gold column contract

The domain-level products below are the required balance between descriptive
Bronze sources and business-facing outputs. Every implemented column is listed
so Catalog inspection and lineage remain credible.

| Table | Columns |
|---|---|
| `mobility_silver_sites_and_facilities` | `site_id` (STRING, FK), `site_name` (STRING), `market` (STRING), `latitude` (DOUBLE), `longitude` (DOUBLE), `fuel_types` (ARRAY<STRING>), `ev_charger_count` (INT), `max_charger_kw` (INT), `has_stop_cafe` (BOOLEAN), `has_vitay` (BOOLEAN), `has_tir_facility` (BOOLEAN), `inventory_capacity_units` (INT), `active_from` (DATE), `facility_type` (STRING), `is_available` (BOOLEAN), `capacity_units` (INT). |
| `mobility_silver_charging_operations` | `event_id` (STRING, PK), `run_id` (STRING), `site_id` (STRING, FK), `charger_id` (STRING, FK), `event_ts` (TIMESTAMP), `ingestion_ts` (TIMESTAMP), `status` (STRING), `telemetry_temperature_c` (DOUBLE), `telemetry_error_rate` (DOUBLE, 0–1), `demand_index` (DOUBLE), `charger_type` (STRING), `max_kw` (INT), `charger_status` (STRING). |
| `mobility_silver_energy_transactions` | `record_id` (STRING, PK), `run_id` (STRING), `site_id` (STRING, FK), `event_ts` (TIMESTAMP), `energy_type` (STRING: EV/petrol/diesel/LPG/hydrogen), `litres` (DOUBLE, nullable for EV), `amount_eur` (DECIMAL), `energy_kwh` (DOUBLE, nullable for fuel), `service_type` (STRING: fuel/ev_charging), `wait_seconds` (INT), `status` (STRING). |
| `mobility_silver_convenience_and_inventory` | `record_id` (STRING, PK), `run_id` (STRING), `site_id` (STRING, FK), `event_ts` (TIMESTAMP), `record_type` (STRING: convenience_transaction/inventory_snapshot), `channel` (STRING), `basket_type` (STRING), `quantity` (DOUBLE), `amount_eur` (DECIMAL), `on_hand_units` (INT), `reorder_point_units` (INT), `stockout_risk_score` (DOUBLE, 0–1). |
| `mobility_silver_demand_context` | `traffic_observation_id` (STRING, PK), `run_id` (STRING), `site_id` (STRING, FK), `event_ts` (TIMESTAMP), `demand_index` (DOUBLE), `wait_seconds` (INT), `traffic_condition` (STRING), `weather_condition` (STRING), `temperature_c` (DOUBLE), `precipitation_mm` (DOUBLE), `event_name` (STRING), `is_peak_travel_day` (BOOLEAN), `expected_demand_multiplier` (DOUBLE). |
| `mobility_silver_customer_journeys` | `journey_id` (STRING, PK), `run_id` (STRING), `site_id` (STRING, FK), `event_ts` (TIMESTAMP), `customer_segment` (STRING), `journey_status` (STRING), `wait_seconds` (INT), `completed` (BOOLEAN), `journey_date` (DATE), `vitay_interaction_count` (BIGINT). |
| `mobility_silver_maintenance` | `work_order_id` (STRING, PK), `run_id` (STRING), `site_id` (STRING, FK), `charger_id` (STRING), `event_ts` (TIMESTAMP), `work_order_type` (STRING), `work_order_status` (STRING). |
| `mobility_gold_energy_and_retail_performance` | `site_id` (STRING), `metric_interval_start` (TIMESTAMP), `energy_type` (STRING), `service_type` (STRING), `litres` (DOUBLE), `energy_kwh` (DOUBLE), `energy_revenue_eur` (DECIMAL/DOUBLE), `avg_wait_seconds` (DOUBLE), `convenience_revenue_eur` (DECIMAL/DOUBLE), `total_revenue_eur` (DECIMAL/DOUBLE), `margin_proxy_eur` (DECIMAL/DOUBLE). |
| `mobility_gold_network_capacity_and_demand` | `site_id` (STRING), `metric_interval_start` (TIMESTAMP), `demand_index` (DOUBLE), `weather_condition` (STRING), `temperature_c` (DOUBLE), `is_peak_travel_day` (BOOLEAN), `expected_demand_multiplier` (DOUBLE), `stockout_risk_score` (DOUBLE), `expected_wait_minutes` (DOUBLE). |

## Relationships and processing rules

```text
mobility_bronze_sites
  ← mobility_bronze_station_events
  → mobility_silver_station_events
  → mobility_gold_site_operating_state
  → mobility_gold_customer_journey_metrics
  → mobility_ml_charger_failure_predictions
  → mobility_ml_supporting_forecasts
  → mobility_gold_action_outcomes
  → mobility_gold_outcome_measurements
```

- All event and prediction tables carry `run_id` for deterministic reset.
- `event_ts` is business time; `ingestion_ts` is pipeline arrival time.
- Silver processing deduplicates by `event_id`, validates foreign keys, and
  quarantines invalid records.
- Gold tables contain only accepted records and preserve the latest valid state.
- No table contains real customer names, payment details, or live ORLEN data.

## Metric View contract

Metric Views are governed semantic products, not replacement tables. Their
source grain, measure definitions, synonyms, owner, and validated proof are
documented here so Catalog, Genie Ontology, Genie, AI/BI, and the App use the
same business meaning.

| Metric View | Source and grain | Governed measures | Dimensions / synonyms | Owner | Verified proof |
|---|---|---|---|---|---|
| `mobility_mv_site_performance` | `mobility_gold_site_operating_state`; one site/snapshot row | `AVG(available_chargers)`, `AVG(charger_utilization_pct)`, `AVG(expected_wait_minutes)`, `AVG(traffic_demand_index)`, `AVG(stop_cafe_demand_index)`, `AVG(inventory_risk_score)`, `COUNT(1) FILTER (WHERE site_operating_status IN ('at_risk','degraded'))` | site, snapshot time, operating status, hero trigger; site = destination/location/hub | European Retail Network Director | `SITE-00007`: 16.76-minute wait; 1 at-risk site |
| `mobility_mv_customer_journey_value` | `mobility_gold_customer_journey_metrics`; one site/interval/segment row | `SUM(journey_count)`, `SUM(completed_journey_count)`, `SUM(affected_journey_count)`, `AVG(avg_wait_minutes)`, `AVG(stop_cafe_conversion_pct)`, `SUM(revenue_eur)`, `SUM(margin_proxy_eur)`, `SUM(completed_journey_count) / NULLIF(SUM(journey_count),0)` | site, metric interval, customer segment; segment = journey type/traveler segment | Convenience and VITAY Lead | Query validated by customer segment |
| `mobility_mv_energy_retail_performance` | `mobility_gold_energy_and_retail_performance`; one site/interval/energy/service row | `SUM(litres)`, `SUM(energy_kwh)`, `SUM(energy_revenue_eur)`, `SUM(convenience_revenue_eur)`, `SUM(total_revenue_eur)`, `SUM(margin_proxy_eur)`, `AVG(avg_wait_seconds)` | site, metric interval, energy type, service type; energy type = fuel type/energy product | Mobility Commercial Lead | EV, petrol, diesel, LPG, and hydrogen rows query successfully |
| `mobility_mv_charger_risk` | `mobility_ml_charger_failure_predictions`; one score row per observed event | `COUNT(1)`, `AVG(failure_probability)`, `COUNT(1) FILTER (WHERE risk_band = 'high')`, `AVG(baseline_probability)` | site, charger, risk band, scored time; risk band = risk level/severity; site = destination/location/hub | Mobility Operations Manager | `SITE-00007`: 447 score records across 10 chargers, 24 historical high records, one latest-high charger; legacy measure names require explicit semantics |

Validated queries use the Databricks metric-view form:

```sql
SELECT `Site`, MEASURE(`Expected Wait Minutes`), MEASURE(`At Risk Sites`)
FROM <catalog>.<schema>.mobility_mv_site_performance
WHERE `Site` = 'SITE-00007'
GROUP BY ALL;
```

The full benchmark set, including energy-retail, customer-journey, and ML-risk
queries with expected results, is maintained in `GENIE-ONTOLOGY.md`.

## ML feature contract

### `mobility_ml_charger_failure_features`

| Column | Type | Nullable | Definition / quality rule |
|---|---|---:|---|
| `event_id` | STRING | No | Source telemetry event key; unique in the feature snapshot. |
| `run_id` | STRING | No | Deterministic replay identifier. |
| `site_id` | STRING | No | Destination FK. |
| `charger_id` | STRING | No | Charger FK. |
| `feature_snapshot_ts` | TIMESTAMP | No | Point-in-time cutoff for all features. |
| `telemetry_temperature_c` | DOUBLE | No | Charger temperature feature. |
| `telemetry_error_rate` | DOUBLE | No | Charger error-rate feature, 0–1. |
| `demand_index` | DOUBLE | No | Relative demand pressure feature. |
| `max_kw` | INT | No | Charger rated power. |
| `charger_type` | STRING | No | Standard, fast, or ultra-fast. |
| `charger_status` | STRING | No | Current charger status. |
| `failure_label` | DOUBLE | No | Synthetic training label: 1 when source status is degraded, otherwise 0. |

### `mobility_ml_charger_failure_predictions`

| Column | Type | Nullable | Definition / quality rule |
|---|---|---:|---|
| `prediction_id` | STRING | No | SHA-256 of run, source event, charger, and feature timestamp; unique. |
| `run_id` | STRING | No | Deterministic replay identifier. |
| `site_id` | STRING | No | Destination FK. |
| `charger_id` | STRING | No | Charger FK. |
| `scored_at` | TIMESTAMP | No | Batch scoring time. |
| `prediction_horizon_minutes` | INT | No | Legacy field; 0 for the deployed observed-state classifier version 3. |
| `failure_probability` | DOUBLE | No | Observed-degradation classification score between 0 and 1; legacy field name. |
| `risk_band` | STRING | No | Low, medium, or high. |
| `model_name` | STRING | No | Three-part UC registered model name. |
| `model_version` | STRING | No | Registered UC model version. |
| `feature_snapshot_ts` | TIMESTAMP | No | Point-in-time feature cutoff. |
| `baseline_probability` | DOUBLE | No | Fixed threshold comparator: 0.75 when error rate ≥ 0.10, otherwise 0.10. |
| `recommended_intervention` | STRING | No | Bounded `inspect` or `monitor` recommendation. |

| Feature | Source | Point-in-time safe | Definition |
|---|---|---|---|
| `charger_error_rate_15m` | Silver telemetry | Yes | Error events divided by charger events in prior 15 minutes |
| `charger_temperature_delta_15m` | Silver telemetry | Yes | Current versus prior-window temperature change |
| `charger_utilization_15m` | Site state | Yes | Charger utilization over prior 15 minutes |
| `traffic_demand_index_30m` | Customer journey metrics | Yes | Recent demand relative to site baseline |
| `expected_wait_minutes` | Site state | Yes | Current expected EV wait |
| `stop_cafe_demand_index` | Customer journey metrics | Yes | Recent cafe demand relative to baseline |

The feature snapshot must be at or before `scored_at`; future events cannot be
used for training or scoring.

## Investigate reconciliation contract

- Source events rotate independently through each site's installed charger count. `SITE-00007` has 10 charger assets and `SITE-00015` has one. A charger score count is a count of observations; distinct latest-scored chargers must be shown separately. `SITE-00007-CHG-06` becomes degraded after the scenario ramp, while its earlier observations remain normal.
- Gold available chargers and degraded site status use each charger's latest telemetry observation, never any healthy row in the historical window. Last-hour charger utilization is a modelled session-energy/rated-power proxy and is disclosed as such.
- Site event time increases by five minutes per site observation from the configured replay start. The deployed source job uses a historical July 2026 start; the November 2026 ML run is 132 days later, so the App shows the gap and cannot call the two live simultaneous signals.
- Elmshorn fuel transactions rotate through petrol, diesel, and LPG; EV charging is a separate service. Hydrogen appears only at scenario sites whose profiles include it.
- Gold energy/retail has one row for each energy service at a site/hour plus a distinct `energy_type = convenience`, `service_type = retail` row. Sum convenience revenue once per site/hour and reconcile total revenue to energy POS plus Stop Cafe POS before using it in a decision KPI.
- Gold journey revenue allocates site/hour Stop Cafe sales across customer segments in proportion to journey count, preventing each segment from inheriting the entire hour's sales. This allocation is a scenario proxy, not observed per-customer basket attribution.
- The current ML label is the same observation's degraded status. Its score is a classification of observed condition, and the legacy `failure_probability`/`prediction_horizon_minutes` field names do not establish future failure. A genuine future-outcome target, chronological holdout and calibrated metric are required before presenting a forecast.

## Lakebase operational decision schema

The long-lived ORLEN workshop branch stores workflow state in PostgreSQL schema `orlen_mobility_ops`. These objects are operational records, separate from the Unity Catalog Bronze/Silver/Gold products. The App service principal owns this schema. All four tables are created by the local App route setup; the current seed is the single Elmshorn case and four available actions.

### `mobility_ops_response_cases` — one row per decision case

| Column | Type | Meaning |
|---|---|---|
| `case_id` | TEXT, primary key | Stable workflow identifier, currently `CASE-SITE-00007` |
| `site_id` | TEXT | Governed destination key; Elmshorn is `SITE-00007` |
| `status` | TEXT | `needs_review` → `pending_approval` → `approved` → `measured`; `measured` means **simulated impact recorded**, not observed ORLEN results |
| `title` | TEXT | Human-readable case purpose |
| `evidence_json` | JSONB | Frozen scenario context: trigger, modelled wait, nine ready chargers, 24 historical high-score rows, one latest-high charger, and zero forecast horizon |
| `created_by` | TEXT | Seed/source label, not an independently verified operator identity |
| `created_at` | TIMESTAMPTZ | Case creation time |
| `updated_at` | TIMESTAMPTZ | Last case state change |

### `mobility_ops_response_actions` — one row per available action

| Column | Type | Meaning |
|---|---|---|
| `action_id` | TEXT, primary key | Stable action identifier |
| `case_id` | TEXT, foreign key | Owning decision case |
| `action_type` | TEXT | `maintenance_inspection`, `customer_routing`, `inventory_preparation`, or `vitay_communication` |
| `target_id` | TEXT | Charger, destination, or VITAY target; inspection targets `SITE-00007-CHG-06` |
| `parameters_json` | JSONB | Bounded action inputs; routing references scenario candidate `SITE-00015` with `route_verified: false` |
| `status` | TEXT | `proposed`, `excluded`, or `executed`; selection is persisted at proposal submission |
| `expected_impact_json` | JSONB | Conditional scenario target: inspection 5.0-minute wait reduction, routing 4.4 minutes and 38 journeys, VITAY €4.8k protection; inventory readiness is unquantified |
| `realized_impact_json` | JSONB, nullable | Legacy field name; deterministic **simulated** impact is written only after approved scenario execution, never actual observed impact |
| `idempotency_key` | TEXT, unique | Stable deduplication key for the seeded action |
| `created_at` | TIMESTAMPTZ | Action creation time |

### `mobility_ops_approvals` — one row per recorded decision

| Column | Type | Meaning |
|---|---|---|
| `approval_id` | TEXT, primary key | Stable approval identifier for the case |
| `case_id` | TEXT, foreign key | Case receiving approval |
| `decision` | TEXT | Currently `approved`; rejection and expiry are future workflow states |
| `approved_by` | TEXT | Forwarded user header when present or explicit local-demo fallback; the App does not independently verify this identity |
| `policy_decision` | TEXT | `demo_bounded_action`, an App workflow decision rather than Unity Gateway enforcement |
| `trace_id` | TEXT | Approval trace identifier created on transition |
| `approved_at` | TIMESTAMPTZ | Recorded approval time; current-cycle audit filters older approvals |

### `mobility_ops_action_events` — append-only case audit

| Column | Type | Meaning |
|---|---|---|
| `event_id` | BIGSERIAL, primary key | Stable event order |
| `case_id` | TEXT | Owning case |
| `action_id` | TEXT, nullable | Required on each new `action_executed` row; case-level events leave it null |
| `event_type` | TEXT | `proposal_submitted`, `response_approved`, `action_executed`, `response_executed`, or `case_reset` |
| `payload_json` | JSONB | Selected action types, approver/trace, or execution context; per-action execution includes `executionId`, `approvalId`, `approvalTraceId`, `actionType`, `targetId`, and `effectBasis: deterministic_scenario` |
| `occurred_at` | TIMESTAMPTZ | Database event time shown in the App; one timestamp is recorded for each selected execution action, and the current-cycle view starts at the latest reset |
