# ORLEN Mobility Domain Structure

## Purpose

Use this specification in Genie Code to create and organize the ORLEN Mobility
workshop semantic foundation. Create the root Domain first, verify it, then
create the subdomains beneath it. Do not create subdomains until the root is
confirmed.

## Domain hierarchy

```text
ORLEN Mobility                         # root business-unit Domain
├── Destinations                       # sites, facilities, chargers, operating state
├── Customer Journeys                   # journeys, VITAY, wait, completion, convenience
├── Energy and Convenience Retail       # EV, petrol, diesel, LPG, hydrogen, Stop Cafe, inventory
├── Demand and Travel Context           # traffic, weather, holidays, demand and capacity
├── Operations Response                 # telemetry, maintenance, ML risk, interventions
└── Closed-Loop Outcomes                # approvals, execution, realized customer and ORLEN value
```

Root Domain display name: `ORLEN Mobility`

Verified root Domain ID: `bbd2f516-276f-4754-8082-de884337b18f`

Verified subdomain IDs:

| Subdomain | Domain ID | Governed tag key |
|---|---|---|
| Destinations | `b387ca37-710d-42d5-9796-3c899ec44e71` | `ORLEN Mobility/Destinations` |
| Customer Journeys | `32d6d260-01d0-4e91-8fe0-06b717cd01b9` | `ORLEN Mobility/Customer Journeys` |
| Energy and Convenience Retail | `24b7250c-e45e-4e6d-b9ca-771884aa9d8c` | `ORLEN Mobility/Energy and Convenience Retail` |
| Demand and Travel Context | `357383c8-2218-4901-a167-c3319de127f9` | `ORLEN Mobility/Demand and Travel Context` |
| Operations Response | `93798422-fb87-4c51-a427-17d28b15bdaf` | `ORLEN Mobility/Operations Response` |
| Closed-Loop Outcomes | `baa07c0c-161b-4f72-ac59-2bd1ae39e9cf` | `ORLEN Mobility/Closed-Loop Outcomes` |

Future business units must use separate roots:

```text
ORLEN Upstream
ORLEN Downstream
```

Do not place Upstream or Downstream assets under `ORLEN Mobility`.

## Asset assignment rule

Every Databricks asset must be assigned to exactly one subdomain immediately
after creation and before creating dependent assets. This includes Unity
Catalog tables, views and Metric Views; Lakeflow pipelines and jobs; ML
features, models and predictions; AI/BI dashboards; Genie Agents; Unity
Gateway models, tools, skills and policies; Databricks Apps; and Lakebase
operational objects.

```text
create asset
  → verify asset ID/path
  → assign one ORLEN Mobility subdomain
  → record the assignment in the workshop manifest
  → create the next dependent asset
```

Use the same hierarchy in Catalog, Genie Ontology, AI/BI navigation, Genie
instructions, resource manifests, and facilitator materials.

## ORLEN Mobility subdomain asset map

### Destinations

- `mobility_bronze_sites`
- `mobility_bronze_site_facilities`
- `mobility_bronze_chargers`
- `mobility_silver_sites_and_facilities`
- `mobility_gold_site_operating_state`
- `mobility_mv_site_performance`
- `ORLEN Mobility Control Tower` AI/BI dashboard
- Source-data generation job

### Customer Journeys

- `mobility_bronze_customer_journeys`
- `mobility_bronze_vitay_interactions`
- `mobility_silver_customer_journeys`
- `mobility_gold_customer_journey_metrics`
- `mobility_mv_customer_journey_value`

### Energy and Convenience Retail

- `mobility_bronze_charging_sessions`
- `mobility_bronze_fuel_transactions`
- `mobility_bronze_convenience_transactions`
- `mobility_bronze_inventory_snapshots`
- `mobility_silver_energy_transactions`
- `mobility_silver_convenience_and_inventory`
- `mobility_gold_energy_and_retail_performance`
- `mobility_mv_energy_retail_performance`

### Demand and Travel Context

- `mobility_bronze_traffic_demand`
- `mobility_bronze_weather_observations`
- `mobility_bronze_holiday_calendar`
- `mobility_silver_demand_context`
- `mobility_gold_network_capacity_and_demand`

### Operations Response

- `mobility_bronze_station_events`
- `mobility_bronze_charger_telemetry`
- `mobility_bronze_maintenance_history`
- `mobility_silver_station_events`
- `mobility_silver_charging_operations`
- `mobility_silver_maintenance`
- `mobility_ml_charger_failure_features`
- `mobility_ml_charger_failure_predictions`
- `mobility_mv_charger_risk`
- Lakeflow transformation pipeline
- ML training and scoring job
- `msahil_demo_workspace_catalog.orlen_intelligent_mobility.orlen_mobility_recommendations` Unity Gateway model service (governed tag `ORLEN Mobility/Operations Response`; created 2026-11-21, policy pending)

### Closed-Loop Outcomes

Planned next increment:

- `mobility_gold_action_outcomes`
- `mobility_gold_outcome_measurements`
- `mobility_ops_action_state` in Lakebase
- Bounded operations Agent, Unity Gateway tools/policies, and Databricks App

## Pages

Create these Pages under the appropriate subdomains:

| Page | Subdomain(s) | Business question | Primary assets |
|---|---|---|---|
| Network Control Tower | Destinations | Which ORLEN destinations can serve this journey? | `ORLEN Mobility Control Tower`, `mobility_mv_site_performance` |
| Site Risk and Demand | Customer Journeys; Operations Response | What is changing at the selected hub and why? | `mobility_mv_customer_journey_value`, `mobility_mv_charger_risk` |
| Response Decision | Operations Response | What bounded response should operations approve? | `mobility_mv_charger_risk`, ML predictions, future App/Lakebase state |
| Outcome Scorecard | Closed-Loop Outcomes | Did the response improve the journey and ORLEN economics? | future action/outcome tables, energy-retail and journey Metric Views |

## Validation checklist

- [x] Root Domain `ORLEN Mobility` exists and its ID is recorded.
- [x] All six subdomains exist beneath the root and their parent IDs are verified.
- [x] Every deployed UC table, ML feature/prediction, and Metric View appears in exactly one subdomain through governed tags.
- [ ] `ORLEN Mobility Control Tower` is assigned to `Destinations`.
- [ ] Pages use the subdomains and governed Metric Views above.
- [ ] Future `ORLEN Upstream` and `ORLEN Downstream` roots remain separate.
- [ ] Domain and subdomain IDs are recorded in `resource-manifest.json`.
