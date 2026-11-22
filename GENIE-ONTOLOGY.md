# ORLEN Mobility Genie Ontology foundation

Canonical narrative: [STORYLINE.md](STORYLINE.md)

This ontology is the semantic foundation for the ORLEN Mobility Genie One
demonstration. `ORLEN Mobility` is the business-unit root Domain. Future
integrated Genie One assets will use separate roots such as `ORLEN Upstream`
and `ORLEN Downstream`.

## Ontology contract

| Element | Definition |
|---|---|
| Business-unit root Domain | `ORLEN Mobility` |
| Primary decision | Which ORLEN destination response should be approved when demand, charger health, and convenience capacity change? |
| Personas | European Retail Network Director; Mobility Operations Manager; Convenience Retail/VITAY Lead |
| Shared schema | `msahil_demo_workspace_catalog.orlen_intelligent_mobility` at deployment time |
| Workspace capability status | To be verified in the target workspace |
| Fallback | Curated Mobility Genie Agent plus governed Metric Views and AI/BI navigation |

## Domains

| Domain | Business purpose | Source assets |
|---|---|---|
| `ORLEN Mobility / Destinations` | Understand site facilities, energy types, capacity, and location suitability | `mobility_bronze_sites`, `mobility_bronze_site_facilities`, `mobility_bronze_chargers`, `mobility_silver_sites_and_facilities`, `mobility_gold_site_operating_state`, `mobility_mv_site_performance`, `ORLEN Mobility Control Tower` |
| `ORLEN Mobility / Customer Journeys` | Measure wait, availability, completed journeys, convenience demand, and customer impact | `mobility_bronze_customer_journeys`, `mobility_bronze_vitay_interactions`, `mobility_silver_customer_journeys`, `mobility_gold_customer_journey_metrics`, `mobility_mv_customer_journey_value`, `ORLEN Mobility Decision Intelligence` |
| `ORLEN Mobility / Energy and Convenience Retail` | Compare EV, petrol, diesel, LPG, hydrogen, Stop Cafe, and inventory value | `mobility_bronze_charging_sessions`, `mobility_bronze_fuel_transactions`, `mobility_bronze_convenience_transactions`, `mobility_bronze_inventory_snapshots`, `mobility_silver_energy_transactions`, `mobility_silver_convenience_and_inventory`, `mobility_gold_energy_and_retail_performance`, `mobility_mv_energy_retail_performance` |
| `ORLEN Mobility / Demand and Travel Context` | Explain demand, wait, weather, holiday, and network-capacity pressure | `mobility_bronze_traffic_demand`, `mobility_bronze_weather_observations`, `mobility_bronze_holiday_calendar`, `mobility_silver_demand_context`, `mobility_gold_network_capacity_and_demand` |
| `ORLEN Mobility / Operations Response` | Investigate charger risk and prepare a bounded maintenance/routing response | `mobility_bronze_station_events`, `mobility_bronze_charger_telemetry`, `mobility_bronze_maintenance_history`, `mobility_silver_station_events`, `mobility_silver_charging_operations`, `mobility_silver_maintenance`, `mobility_ml_charger_failure_features`, `mobility_ml_charger_failure_predictions`, `mobility_mv_charger_risk`, `ORLEN Mobility Operations Unity Gateway Boundary` |
| `ORLEN Mobility / Closed-Loop Outcomes` | Persist and measure approved actions; Lakebase/App/Gateway assets will be added in the next increment | `mobility_gold_action_outcomes` (planned), `mobility_gold_outcome_measurements` (planned), `mobility_ops_action_state` (planned) |

The `ORLEN Mobility` Domain registry is complete for the currently deployed Mobility data,
Lakeflow, ML, and Metric View assets. Supporting implementation assets are
assigned to their owning Domain in the manifest: the source-data job belongs to
`ORLEN Mobility / Destinations`, the Lakeflow pipeline belongs to `ORLEN
Mobility / Operations Response`, the ML training job belongs to `ORLEN Mobility
/ Operations Response`, and the Metric View job belongs to `ORLEN Mobility /
Destinations`. Any new
 dashboard, Genie Agent, Unity Gateway asset, App, Lakebase object, model, job,
pipeline, table, view, or Metric View must be added here immediately after
creation. No asset may be left under a generic or unassigned Domain.

## Pages

Genie Code has created the four Pages below. Their business mapping is
maintained locally in `resource-manifest.json`; the Domains API currently
returns root/subdomain metadata but does not expose a Page identifier field.

| Page | User question | Domain | Primary metrics | Next action |
|---|---|---|---|---|
| Network control tower | Which ORLEN destinations can serve this journey? | `ORLEN Mobility / Destinations` | Availability, facilities, capacity, expected wait | Select affected hub and alternatives |
| Site risk and demand | What is changing at the selected hub and why? | `ORLEN Mobility / Customer Journeys`; `ORLEN Mobility / Operations Response` | Charger health, congestion, Stop Cafe demand, inventory risk | Investigate with Genie |
| Response decision | What should operations approve? | `ORLEN Mobility / Operations Response` | Failure risk, expected wait, customer impact, protected revenue | Approve or modify the bounded plan in the App |
| Outcome scorecard | Did the action improve the journey and ORLEN economics? | `ORLEN Mobility / Closed-Loop Outcomes` | Wait, uptime, completed journeys, revenue/margin proxy | Compare predicted and realized outcomes |

## Metric View contract

| Metric View | Measures | Dimensions | Source |
|---|---|---|---|
| `mobility_mv_site_performance` | Available Chargers; Charger Utilization; Expected Wait Minutes; Traffic Demand Index; Stop Cafe Demand Index; Inventory Risk Score; At Risk Sites | Site, site name, city, country, market, station format, road context, location data status, snapshot time, operating status, hero trigger | `mobility_gold_site_operating_state` | Retail Network Director | destination, location, hub, city, market, station format; wait time; site health | `SITE-00007` / ORLEN Charge Hub Elmshorn: 16.76 expected wait minutes and 1 at-risk site |
| `mobility_mv_customer_journey_value` | Journey Count; Completed Journeys; Affected Journeys; Average Wait Minutes; Stop Cafe Conversion; Journey Revenue EUR; Journey Margin Proxy EUR; Journey Completion Rate | Site, metric interval, customer segment | `mobility_gold_customer_journey_metrics` | VITAY / Convenience Lead | journey type, traveler segment; conversion; completed trips | Query returns journey completion and value by segment |
| `mobility_mv_energy_retail_performance` | Fuel Litres; Energy KWh; Energy Revenue EUR; Convenience Revenue EUR; Total Revenue EUR; Margin Proxy EUR; Average Wait Seconds | Site, metric interval, energy type, service type | `mobility_gold_energy_and_retail_performance` | Mobility Commercial Lead | fuel type, energy product; destination, hub | Query returns LPG and EV revenue/margin measures |
| `mobility_mv_charger_risk` | Charger Predictions; Average Failure Probability; High Risk Predictions; Average Baseline Probability (legacy measure names) | Site, charger, risk band, scored time | `mobility_ml_charger_failure_predictions` | Mobility Operations Manager | destination, location, hub; risk level, severity | `SITE-00007`: 447 historical scores across 10 chargers, 24 high-score records, one latest-high charger; site-wide average observed-degradation score 0.0537 |

Each metric must have a documented grain, definition, owner, synonym, expected
result, and tested query before it is used by Genie One, AI/BI, or the agent.

### Validated benchmark queries

These are the queries used to validate the deployed views. Metric View
measures must be referenced with `MEASURE(...)`; `GROUP BY ALL` preserves the
selected dimensions and avoids accidentally re-aggregating a governed measure.

```sql
-- Site risk and wait at the hero destination
SELECT `Site`,
       MEASURE(`Expected Wait Minutes`) AS expected_wait_minutes,
       MEASURE(`At Risk Sites`) AS at_risk_sites
FROM msahil_demo_workspace_catalog.orlen_intelligent_mobility.mobility_mv_site_performance
WHERE `Site` = 'SITE-00007'
GROUP BY ALL;
-- Expected result: 16.76 minutes and 1 at-risk site.

-- ML evidence for the operations decision
SELECT `Site`,
       MEASURE(`Average Failure Probability`) AS avg_failure_probability,
       MEASURE(`High Risk Predictions`) AS high_risk_predictions
FROM msahil_demo_workspace_catalog.orlen_intelligent_mobility.mobility_mv_charger_risk
WHERE `Site` = 'SITE-00007'
GROUP BY ALL;
-- Expected result: 0.0537 average observed-degradation score and 24 historical high-score records.
-- These legacy measure names do not describe a future-failure horizon or distinct latest-high chargers.

-- Multi-energy and convenience value by energy product
SELECT energy_type,
       MEASURE(`Total Revenue EUR`) AS total_revenue_eur,
       MEASURE(`Margin Proxy EUR`) AS margin_proxy_eur
FROM msahil_demo_workspace_catalog.orlen_intelligent_mobility.mobility_mv_energy_retail_performance
GROUP BY ALL;
-- Expected result: successful rows for EV, petrol, diesel, LPG, and hydrogen.

-- Customer journey value by segment
SELECT customer_segment,
       MEASURE(`Completed Journeys`) AS completed_journeys,
       MEASURE(`Journey Completion Rate`) AS completion_rate,
       MEASURE(`Journey Margin Proxy EUR`) AS margin_proxy_eur
FROM msahil_demo_workspace_catalog.orlen_intelligent_mobility.mobility_mv_customer_journey_value
GROUP BY ALL;
```

## Genie benchmark questions

- For `SITE-00007`, show `Expected Wait Minutes` and `High Risk Predictions`; the latter counts historical score rows, not distinct current chargers.
- Which destinations meet the journey's charging and facility needs? The App's map and destination profile can screen the scenario-defined Elmshorn East waypoint for approximate proximity; the governed Metric View does not contain coordinates or verify a drive route.
- What customer journeys and revenue/margin proxy are at risk?
- Which observed-state and journey measures establish the historical baseline before a simulated response?

## Validation and fallback

Verify that the target workspace supports the intended Ontology Domains and
Pages surface. If unavailable, demonstrate the same semantic contract through
the four governed Metric Views, the curated Genie Agent, and the AI/BI pages.
The deployed workspace currently has the four Metric Views; a live curated
Genie Agent and native Ontology Domains/Pages remain gated on audience,
workspace-surface, and benchmark approval. Record the actual workspace
identifiers, benchmark results, ownership, grants, and reset/cleanup operations
in `resource-manifest.json`.
