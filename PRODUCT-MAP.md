# Product map

## Shared-schema naming convention

All ORLEN business units will use the same deployment schema, with a business-
unit prefix on every table, view, and model-supporting asset. This workshop
implements Mobility only; Upstream and Downstream assets will be added later.

```text
<catalog>.<schema>.mobility_...
<catalog>.<schema>.upstream_...    # future
<catalog>.<schema>.downstream_...  # future
```

Mobility assets planned for this workshop:

| Layer | Name | Purpose |
|---|---|---|
| Bronze | `mobility_bronze_sites` | Synthetic ORLEN destinations, facilities, energy types, and capacity |
| Bronze | `mobility_bronze_site_facilities` | Journey-specific facilities and capacities |
| Bronze | `mobility_bronze_chargers` | Charger master data, power, and state |
| Bronze | `mobility_bronze_station_events` | Raw traffic, charging, POS, inventory, and site events |
| Bronze | `mobility_bronze_charger_telemetry` | Charger health and degradation signals |
| Bronze | `mobility_bronze_charging_sessions` | EV energy service, wait, and value |
| Bronze | `mobility_bronze_fuel_transactions` | Fuel-type transactions and value |
| Bronze | `mobility_bronze_convenience_transactions` | Stop Cafe and convenience demand |
| Bronze | `mobility_bronze_inventory_snapshots` | Stock and stockout-risk context |
| Bronze | `mobility_bronze_traffic_demand` | Traffic and holiday demand pressure |
| Bronze | `mobility_bronze_customer_journeys` | Customer segments, wait, and journey completion |
| Bronze | `mobility_bronze_maintenance_history` | Maintenance history and intervention context |
| Bronze | `mobility_bronze_vitay_interactions` | Synthetic VITAY engagement and bounded-benefit eligibility |
| Bronze | `mobility_bronze_holiday_calendar` | Explicit travel-surge calendar context |
| Silver | `mobility_silver_station_events` | Validated, deduplicated, late-data-aware events |
| Gold | `mobility_gold_site_operating_state` | Current site, charger, facility, and capacity state |
| Gold | `mobility_gold_customer_journey_metrics` | Wait, availability, journey, convenience, and value measures |
| Gold | `mobility_gold_action_outcomes` | Contract only; action-linked analytical return has not been deployed |
| Gold | `mobility_gold_outcome_measurements` | Contract only; no post-action observation source or attributed measurement is deployed |
| ML | `mobility_ml_charger_failure_predictions` | Observed-degradation classification scores; legacy asset name |
| ML | `mobility_ml_supporting_forecasts` | Congestion, demand, inventory, and value forecasts |
| Metric View | `mobility_mv_site_performance` | Governed destination operating-state, wait, demand, and at-risk measures |
| Metric View | `mobility_mv_customer_journey_value` | Governed journey completion, wait, convenience conversion, revenue, and margin-proxy measures |
| Metric View | `mobility_mv_energy_retail_performance` | Governed EV, petrol, diesel, LPG, hydrogen, and convenience-retail revenue/margin measures |
| Metric View | `mobility_mv_charger_risk` | Governed observed-degradation score, risk band, and intervention measures; legacy probability name |
| Dashboard | `ORLEN Mobility Control Tower` | Business-facing governed network and value context; App scenario outcomes are not yet returned to this dashboard |

The implementation must not create generic names such as `bronze_station_events`
or `gold_outcomes` in the shared schema.

| Beat | Persona action | Product | Asset | Exact demo action | Evidence shown | Prerequisite | Fallback | Reset |
|---|---|---|---|---|---|---|---|---|
| Explore network | Director filters destinations and KPIs. | Genie Ontology, AI/BI, Metric Views | `ORLEN Mobility Control Tower`; `mobility_gold_site_operating_state`, `mobility_gold_customer_journey_metrics`, `mobility_mv_site_performance`, `mobility_mv_energy_retail_performance` | Open the `ORLEN Mobility / Destinations` subdomain and Control Tower, then filter market, energy, facility, and status. | Discoverable semantic context, governed KPI definitions, location detail, and multi-energy value. | Published dashboard, ontology/page, and warehouse. | Static dashboard export plus validated SQL. | Restore default filters. |
| Process trigger | Operator observes changing conditions. | Structured Streaming, Lakeflow | `mobility_bronze_station_events` → `mobility_silver_station_events` → `mobility_gold_site_operating_state` | Replay traffic, charger, POS, and inventory events. | Freshness, lag, quality, and state change. | Stream source, checkpoint, schema. | Append deterministic event batch. | Restore checkpoint/data to run boundary. |
| Classify condition | Operator reviews observed charger condition. | Feature Engineering, MLflow, UC Models | `mobility_ml_charger_failure_predictions` (legacy name) | Compare the latest per-charger classification with a fixed rule; show the historical replay gap and state that future failure is unvalidated. | Model version, chronological holdout metrics, score-record versus charger counts, and rule baseline. | Registered classifier and historical feature snapshots. | Read the validated classification snapshot. | Delete run-scoped scores. |
| Investigate | Manager asks business questions. | Genie, Metric Views | ORLEN retail Genie space over `mobility_*` assets | Ask four benchmark questions. | SQL, governed result, and expected range. | Curated instructions and benchmark set. | Run validated SQL/show stored answers. | Start a new conversation. |
| Build plan | Manager selects a coordinated response. | Databricks Apps, Lakebase, Unity Gateway recommendation service and input policy; tool-using agent planned | Four-action scenario playbook and `orlen_mobility_recommendations` | Select inspection, routing, Stop Café, and VITAY actions; generate bounded advice, show the Gateway policy denial with **Verify safety boundary**, then submit. | Safe response ID, named `pre_call` deny, selected actions, and conditional scenario projections. | Seeded case, local App, Gateway service and enforcing policy. | Manual scenario playbook labelled as fallback. | Approved case reset. |
| Enforce boundary | Manager tests direct commit. | Databricks Apps API, Lakebase; Unity Gateway tool enforcement planned | ORLEN App workflow guard | Attempt direct commit and observe 403. | Denial response and separate approval path. | Local App API. | Show 403 response and explain scope. | None. |
| Approve action | Manager reviews and approves. | Databricks Apps, Lakebase | Operations decision App | Approve only after proposal, then record simulated execution. | Recorded approver header/fallback, trace, current-cycle audit timestamps, and case state. | App identity and Lakebase connection. | Read-only audit view. | Approved case reset. |
| Persist workflow | Operations reviews scenario tasks. | Lakebase | Long-lived ORLEN branch and operational schema | Persist selected action status, approval, and modelled impact. | Transaction and audit state. | Dedicated branch. | Read-only seeded state. | Approved case reset. |
| Measure result | Director evaluates the scenario. | Databricks Apps, Lakebase; Lakeflow outcome return planned | App action-to-outcome evidence panel and baseline/scenario scorecard | Verify action audit links, then compare modelled wait, journeys, and revenue with historic baseline. | Scenario value with actual route, capacity, and attribution explicitly unmeasured. | Executed scenario records. | Pre-execution scorecard. | Approved case reset. |

## Products intentionally excluded from the golden path

| Product or use case | Reason |
|---|---|
| Fuel-price optimisation | Commercially sensitive and distracts from the agreed operational journey. |
| Parcel logistics | Relevant extension but not central to energy retail. |
| Hydrogen-demand forecasting | Strategic extension; insufficient time for a second energy storyline. |
| Long-range site investment optimisation | Different persona and planning horizon. |
| Autonomous high-value promotion or pricing | Kept behind explicit human approval. |

## Critical path

1. `ORLEN Mobility Control Tower` establishes the location and baseline.
2. Synthetic replay and Lakeflow refresh govern the operational state; live latency is unproven.
3. ML classifies observed charger degradation; future failure prediction remains a validated upgrade path.
4. Genie supports investigation; the local App obtains a governed recommendation from Unity Gateway and offers a seeded playbook. A tool-using agent remains planned.
5. The Gateway input policy blocks unsafe recommendation requests. The separate App API and Lakebase workflow require approval for actions; Gateway tool enforcement remains planned.
6. The App and Lakebase operationalise the action.
7. Lakebase records modelled scenario impact; measured outcome telemetry and dashboard return remain planned.
