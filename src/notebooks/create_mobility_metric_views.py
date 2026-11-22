"""Create governed ORLEN Mobility Metric Views."""

from __future__ import annotations

import argparse

from databricks.connect import DatabricksSession


def ident(catalog: str, schema: str, name: str) -> str:
    return ".".join(f"`{part.replace('`', '``')}`" for part in (catalog, schema, name))


DEFINITIONS = {
    "mobility_mv_site_performance": (
        "mobility_gold_site_operating_state",
        [
            "version: 1.1",
            "source: {source}",
            'comment: "Governed operating state and capacity metrics for ORLEN Mobility destinations."',
            "dimensions:",
            "  - name: Site",
            "    expr: site_id",
            "    synonyms: [destination, location, hub]",
            "  - name: Site Name",
            "    expr: site_name",
            "  - name: City",
            "    expr: city",
            "  - name: Country",
            "    expr: country",
            "  - name: Station Format",
            "    expr: station_format",
            "  - name: Road Context",
            "    expr: road_context",
            "  - name: Location Data Status",
            "    expr: location_data_status",
            "  - name: Snapshot Time",
            "    expr: snapshot_ts",
            "  - name: Operating Status",
            "    expr: site_operating_status",
            "    synonyms: [health, condition, site status]",
            "  - name: Hero Trigger Active",
            "    expr: hero_trigger_active",
            "measures:",
            "  - name: Available Chargers",
            "    expr: AVG(available_chargers)",
            "  - name: Charger Utilization",
            "    expr: AVG(charger_utilization_pct)",
            "  - name: Expected Wait Minutes",
            "    expr: AVG(expected_wait_minutes)",
            "  - name: Traffic Demand Index",
            "    expr: AVG(traffic_demand_index)",
            "  - name: Stop Cafe Demand Index",
            "    expr: AVG(stop_cafe_demand_index)",
            "  - name: Inventory Risk Score",
            "    expr: AVG(inventory_risk_score)",
            "  - name: At Risk Sites",
            "    expr: COUNT(1) FILTER (WHERE site_operating_status IN ('at_risk', 'degraded'))",
        ],
    ),
    "mobility_mv_customer_journey_value": (
        "mobility_gold_customer_journey_metrics",
        [
            "version: 1.1",
            "source: {source}",
            'comment: "Governed customer journey and convenience value metrics for ORLEN Mobility."',
            "dimensions:",
            "  - name: Site",
            "    expr: site_id",
            "    synonyms: [destination, location, hub]",
            "  - name: Metric Interval",
            "    expr: metric_interval_start",
            "  - name: Customer Segment",
            "    expr: customer_segment",
            "    synonyms: [journey type, traveler segment]",
            "measures:",
            "  - name: Journey Count",
            "    expr: SUM(journey_count)",
            "  - name: Completed Journeys",
            "    expr: SUM(completed_journey_count)",
            "  - name: Affected Journeys",
            "    expr: SUM(affected_journey_count)",
            "  - name: Average Wait Minutes",
            "    expr: AVG(avg_wait_minutes)",
            "  - name: Stop Cafe Conversion",
            "    expr: AVG(stop_cafe_conversion_pct)",
            "  - name: Journey Revenue EUR",
            "    expr: SUM(revenue_eur)",
            "  - name: Journey Margin Proxy EUR",
            "    expr: SUM(margin_proxy_eur)",
            "  - name: Journey Completion Rate",
            "    expr: SUM(completed_journey_count) * 1.0 / NULLIF(SUM(journey_count), 0)",
        ],
    ),
    "mobility_mv_energy_retail_performance": (
        "mobility_gold_energy_and_retail_performance",
        [
            "version: 1.1",
            "source: {source}",
            'comment: "Governed multi-energy and convenience-retail performance metrics."',
            "dimensions:",
            "  - name: Site",
            "    expr: site_id",
            "    synonyms: [destination, location, hub]",
            "  - name: Metric Interval",
            "    expr: metric_interval_start",
            "  - name: Energy Type",
            "    expr: energy_type",
            "    synonyms: [fuel type, energy product]",
            "  - name: Service Type",
            "    expr: service_type",
            "measures:",
            "  - name: Fuel Litres",
            "    expr: SUM(litres)",
            "  - name: Energy KWh",
            "    expr: SUM(energy_kwh)",
            "  - name: Energy Revenue EUR",
            "    expr: SUM(energy_revenue_eur)",
            "  - name: Convenience Revenue EUR",
            "    expr: SUM(convenience_revenue_eur)",
            "  - name: Total Revenue EUR",
            "    expr: SUM(total_revenue_eur)",
            "  - name: Margin Proxy EUR",
            "    expr: SUM(margin_proxy_eur)",
            "  - name: Average Wait Seconds",
            "    expr: AVG(avg_wait_seconds)",
        ],
    ),
    "mobility_mv_charger_risk": (
        "mobility_ml_charger_failure_predictions",
        [
            "version: 1.1",
            "source: {source}",
            'comment: "Governed charger-failure risk and intervention metrics."',
            "dimensions:",
            "  - name: Site",
            "    expr: site_id",
            "    synonyms: [destination, location, hub]",
            "  - name: Charger",
            "    expr: charger_id",
            "  - name: Risk Band",
            "    expr: risk_band",
            "    synonyms: [risk level, severity]",
            "  - name: Scored Time",
            "    expr: scored_at",
            "measures:",
            "  - name: Charger Predictions",
            "    expr: COUNT(1)",
            "  - name: Average Failure Probability",
            "    expr: AVG(failure_probability)",
            "  - name: High Risk Predictions",
            "    expr: COUNT(1) FILTER (WHERE risk_band = 'high')",
            "  - name: Average Baseline Probability",
            "    expr: AVG(baseline_probability)",
        ],
    ),
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    parser.add_argument("--schema", required=True)
    args = parser.parse_args()
    spark = DatabricksSession.builder.serverless(True).getOrCreate()
    for name, (source_name, lines) in DEFINITIONS.items():
        source = f"{args.catalog}.{args.schema}.{source_name}"
        target = ident(args.catalog, args.schema, name)
        body = "\n".join(line.format(source=source) for line in lines)
        spark.sql(f"CREATE OR REPLACE VIEW {target} WITH METRICS LANGUAGE YAML AS $$\n{body}\n$$")
    print(f"Created {len(DEFINITIONS)} ORLEN Mobility Metric Views")


if __name__ == "__main__":
    main()
