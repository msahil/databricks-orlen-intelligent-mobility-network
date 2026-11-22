# ORLEN Mobility Bronze → Silver → Gold layer map

Canonical narrative: [STORYLINE.md](STORYLINE.md)  
Data contract: [DATA-DICTIONARY.md](DATA-DICTIONARY.md)  
Product choreography: [PRODUCT-MAP.md](PRODUCT-MAP.md)

## Review status

| Check | Status | Evidence |
|---|---|---|
| Every storyline-critical Bronze domain is listed | PASS | 15 deployed `mobility_bronze_*` source tables |
| Critical domains have conformed Silver products | PASS | 8 deployed Silver products cover events, sites/facilities, charging, energy, retail/inventory, demand context, journeys, and maintenance |
| Gold products answer the hero decision | PASS | 4 deployed Gold products cover operating state, journeys, energy/retail value, and network demand |
| Gold products feed semantic, ML, agent, App, or outcome consumers | IN PROGRESS | Current site state feeds Ontology planning; ML and operational consumers are not deployed yet |
| Reference-only domains have an explicit rationale | PASS | Site dimensions and holiday/weather context are documented as enrichment inputs |

## Domain map

| Storyline domain | Bronze tables | Silver conformed product | Gold business product | Downstream consumer and proof |
|---|---|---|---|---|
| Hero charger trigger | `mobility_bronze_station_events`, `mobility_bronze_charger_telemetry`, `mobility_bronze_chargers` | `mobility_silver_station_events`, `mobility_silver_charging_operations` | `mobility_gold_site_operating_state` | Streaming freshness, duplicate count, degraded status, `hero_trigger_active`, and `mobility_ml_charger_failure_predictions` at `SITE-00007` |
| Site and facilities | `mobility_bronze_sites`, `mobility_bronze_site_facilities` | `mobility_silver_sites_and_facilities` | `mobility_gold_site_operating_state` | Genie/AI/BI site discovery, facility-aware alternatives |
| Energy services | `mobility_bronze_fuel_transactions`, `mobility_bronze_charging_sessions` | `mobility_silver_energy_transactions` | `mobility_gold_energy_and_retail_performance` | Petrol, diesel, LPG, hydrogen and EV value by site |
| Convenience and inventory | `mobility_bronze_convenience_transactions`, `mobility_bronze_inventory_snapshots` | `mobility_silver_convenience_and_inventory` | `mobility_gold_energy_and_retail_performance` | Stop Cafe conversion, stockout risk and margin proxy |
| Demand context | `mobility_bronze_traffic_demand`, `mobility_bronze_weather_observations`, `mobility_bronze_holiday_calendar` | `mobility_silver_demand_context` | `mobility_gold_network_capacity_and_demand` | Holiday/traffic/weather explanation and forecast features |
| Customer journey | `mobility_bronze_customer_journeys`, `mobility_bronze_vitay_interactions` | `mobility_silver_customer_journeys` | `mobility_gold_customer_journey_metrics` | Journey completion, wait, VITAY engagement and satisfaction proxy |
| Maintenance and action | `mobility_bronze_maintenance_history` | `mobility_silver_maintenance` | `mobility_gold_action_outcomes` | ML recommendation, approved action and realized value |

## Balance gate

The current ORLEN pipeline passes the source and initial-state gates but does
not yet pass the final layer-balance gate. Before building ML, Genie Agent,
Lakebase, or the App, the domain Silver and Gold products listed above must be
implemented, documented column-by-column, and visible in Unity Catalog lineage.
Table count is not the objective; complete domain coverage is.
