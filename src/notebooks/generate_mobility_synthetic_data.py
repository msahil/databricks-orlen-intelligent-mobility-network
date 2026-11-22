"""Create deterministic ORLEN Mobility source data for the workshop.

This script creates descriptive, story-aligned Bronze source tables. Lakeflow
will validate and transform them into silver/gold assets in the next increment.

Usage from a Databricks job or notebook:
    python generate_mobility_synthetic_data.py \
      --catalog <catalog> --schema <schema> --run-id mobility-baseline
"""

from __future__ import annotations

import argparse

from databricks.connect import DatabricksSession
from pyspark.sql import DataFrame
from pyspark.sql import functions as F


SITE_COUNT = 80
DEFAULT_EVENT_COUNT = 250_000
DEFAULT_START_TS = "2026-07-01 00:00:00"


def identifier(catalog: str, schema: str, table: str) -> str:
    """Return a safely quoted three-part Unity Catalog identifier."""

    return ".".join(f"`{part.replace('`', '``')}`" for part in (catalog, schema, table))


def build_sites(spark) -> DataFrame:
    sites = spark.range(SITE_COUNT).withColumnRenamed("id", "site_num")
    market = (
        F.when(F.col("site_num") % 7 == 0, F.lit("Poland"))
        .when(F.col("site_num") % 7 == 1, F.lit("Germany"))
        .when(F.col("site_num") % 7 == 2, F.lit("Czechia"))
        .when(F.col("site_num") % 7 == 3, F.lit("Lithuania"))
        .when(F.col("site_num") % 7 == 4, F.lit("Austria"))
        .when(F.col("site_num") % 7 == 5, F.lit("Hungary"))
        .otherwise(F.lit("Slovakia"))
    )
    public_locations = {
        0: ("ORLEN Charge Olsztynek Południe", "Olsztynek", "Poland", "motorway_service_area", "S7 expressway", "publicly_named"),
        1: ("ORLEN Bratislava HVO100 pilot", "Bratislava", "Slovakia", "urban_service_station", "urban mobility corridor", "publicly_named"),
        2: ("ORLEN Hydrogen Gdynia", "Gdynia", "Poland", "hydrogen_station", "ul. Wielkopolska 239", "publicly_named"),
        3: ("ORLEN Hydrogen Piła", "Piła", "Poland", "hydrogen_station", "regional transport corridor", "publicly_named"),
        4: ("ORLEN Hydrogen Katowice", "Katowice", "Poland", "hydrogen_station", "Silesian urban region", "publicly_named"),
        5: ("ORLEN Hydrogen Poznań", "Poznań", "Poland", "hydrogen_station", "Wielkopolska region", "publicly_named"),
        6: ("ORLEN Charge Hub Elmshorn", "Elmshorn", "Germany", "multi_bay_fast_charge_hub", "A23 motorway near Hamburg", "publicly_named"),
        7: ("ORLEN Hydrogen Prague", "Prague", "Czechia", "hydrogen_station", "Prague urban network", "publicly_named"),
        8: ("ORLEN Hydrogen Litvínov", "Litvínov", "Czechia", "hydrogen_station", "regional transport corridor", "publicly_named"),
        9: ("ORLEN Charge Szczecin corridor", "Szczecin", "Poland", "motorway_fast_charge_hub", "Polish expressway network", "publicly_named"),
        10: ("ORLEN Charge Gorzów Wielkopolski corridor", "Gorzów Wielkopolski", "Poland", "motorway_fast_charge_hub", "Polish expressway network", "publicly_named"),
        11: ("ORLEN Charge Nowy Dwór Gdański corridor", "Nowy Dwór Gdański", "Poland", "motorway_fast_charge_hub", "Polish expressway network", "publicly_named"),
        12: ("ORLEN Hydrogen Włocławek hub", "Włocławek", "Poland", "hydrogen_hub", "regional transport corridor", "publicly_named"),
        13: ("ORLEN Warsaw Mobility destination", "Warsaw", "Poland", "urban_multi_energy_station", "Warsaw metropolitan area", "publicly_named"),
        14: ("ORLEN Charge Elmshorn East", "Elmshorn area", "Germany", "multi_bay_fast_charge_hub", "Elmshorn East scenario waypoint; address verification pending", "synthetic_scenario_location"),
    }
    location_case = F.create_map(
        *[
            item
            for site_num, values in public_locations.items()
            for item in (F.lit(site_num), F.struct(*[F.lit(value).alias(field) for field, value in zip(("site_name", "city", "country", "station_format", "road_context", "location_data_status"), values)]))
        ]
    )
    location = F.element_at(location_case, F.col("site_num"))
    return (
        sites.select(
            F.format_string("SITE-%05d", F.col("site_num") + 1).alias("site_id"),
            F.coalesce(location["site_name"], F.concat(F.lit("ORLEN Mobility Hub "), F.lpad((F.col("site_num") + 1).cast("string"), 3, "0"))).alias("site_name"),
            F.coalesce(location["city"], F.lit("Regional location")).alias("city"),
            F.coalesce(location["country"], market).alias("country"),
            F.coalesce(location["station_format"], F.lit("multi_energy_service_station")).alias("station_format"),
            F.coalesce(location["road_context"], F.lit("regional ORLEN network")).alias("road_context"),
            F.coalesce(location["location_data_status"], F.lit("synthetic_reference_location")).alias("location_data_status"),
            # Named public locations use their country; synthetic reference sites
            # use the deterministic seven-market ORLEN retail mix.
            F.coalesce(location["country"], market).alias("market"),
            F.when(F.col("site_num") == 14, F.lit(53.75))
            .otherwise(F.lit(49.5) + (F.col("site_num") % 20) * F.lit(0.35))
            .cast("double").alias("latitude"),
            F.when(F.col("site_num") == 14, F.lit(9.75))
            .otherwise(F.lit(14.0) + (F.col("site_num") % 30) * F.lit(0.55))
            .cast("double").alias("longitude"),
            F.when(
                F.col("site_num") % 10 == 0,
                F.array(F.lit("petrol"), F.lit("diesel"), F.lit("lpg"), F.lit("hydrogen")),
            )
            .when(
                F.col("site_num") % 3 == 0,
                F.array(F.lit("petrol"), F.lit("diesel"), F.lit("lpg")),
            )
            .otherwise(F.array(F.lit("petrol"), F.lit("diesel")))
            .alias("fuel_types"),
            F.when(F.col("site_num") == 14, F.lit(1))
            .otherwise(F.lit(4) + (F.col("site_num") % 8))
            .cast("int").alias("ev_charger_count"),
            (F.lit(150) + (F.col("site_num") % 4) * 75).cast("int").alias("max_charger_kw"),
            (F.col("site_num") % 5 != 0).alias("has_stop_cafe"),
            F.lit(True).alias("has_vitay"),
            (F.col("site_num") % 4 == 0).alias("has_tir_facility"),
            (F.lit(500) + (F.col("site_num") % 10) * 100).cast("int").alias("inventory_capacity_units"),
            F.to_date(F.lit("2024-01-01")).alias("active_from"),
            F.when(
                F.col("site_num") == 14,
                F.lit(None).cast("string"),
            ).otherwise(F.lit("https://www.orlen.pl/en/about-the-company/media/press-releases-categories/retail?page=1")).alias("public_source_url"),
            F.when(
                F.col("site_num") == 14,
                F.lit("scenario-defined location, services and operational measures; real site unverified"),
            ).otherwise(F.lit("public location identity; synthetic operational measures")).alias("data_provenance"),
        )
        .orderBy("site_id")
    )


def build_events(spark, event_count: int, run_id: str, start_ts: str) -> DataFrame:
    events = (
        spark.range(event_count)
        .withColumnRenamed("id", "event_num")
        .withColumn("site_num", F.pmod(F.col("event_num"), F.lit(SITE_COUNT)))
        .withColumn("site_id", F.format_string("SITE-%05d", F.col("site_num") + 1))
        # The site and charger cycles must be independent. A site receives one
        # event each 80 rows, then rotates across its actual installed assets.
        .withColumn("site_event_num", F.floor(F.col("event_num") / F.lit(SITE_COUNT)))
        .withColumn(
            "charger_count",
            F.when(F.col("site_num") == 14, F.lit(1))
            .otherwise(F.lit(4) + F.pmod(F.col("site_num"), F.lit(8))),
        )
        .withColumn("charger_num", F.pmod(F.col("site_event_num"), F.col("charger_count")))
        # Site 00007 is the deterministic holiday-surge / charger-degradation hub.
        .withColumn("is_hero_scenario", F.col("site_id") == F.lit("SITE-00007"))
        .withColumn("event_id", F.concat(F.lit(run_id), F.lit("-EVT-"), F.lpad(F.col("event_num").cast("string"), 9, "0")))
        .withColumn("run_id", F.lit(run_id))
        .withColumn(
            "event_ts",
            F.from_unixtime(
                F.unix_timestamp(F.to_timestamp(F.lit(start_ts))) + F.col("site_event_num") * 300
            ).cast("timestamp"),
        )
        .withColumn("ingestion_ts", F.col("event_ts") + F.expr("INTERVAL 5 SECONDS"))
        .withColumn(
            "event_type",
            F.when(F.pmod(F.col("event_num"), 7) == 0, "traffic")
            .when(F.pmod(F.col("event_num"), 7) == 1, "charge_session")
            .when(F.pmod(F.col("event_num"), 7) == 2, "charger_telemetry")
            .when(F.pmod(F.col("event_num"), 7) == 3, "fuel_sale")
            .when(F.pmod(F.col("event_num"), 7) == 4, "cafe_sale")
            .when(F.pmod(F.col("event_num"), 7) == 5, "inventory")
            .otherwise("maintenance"),
        )
        .withColumn(
            "status",
            F.when(
                F.col("is_hero_scenario") & (F.col("charger_num") == 6) & (F.col("site_event_num") >= 1500),
                "degraded",
            )
            .when(F.pmod(F.col("event_num"), 11) == 0, "completed")
            .otherwise("normal"),
        )
        .withColumn(
            "charger_id",
            F.when(
                F.col("event_type").isin("charge_session", "charger_telemetry"),
                F.concat(F.col("site_id"), F.lit("-CHG-"), F.lpad(F.col("charger_num").cast("string"), 2, "0")),
            ),
        )
        .withColumn(
            "energy_type",
            F.when(
                F.col("event_type") == "fuel_sale",
                F.when((F.col("site_num") % 10 == 0) & (F.pmod(F.col("site_event_num"), 4) == 0), "hydrogen")
                .when((F.col("site_num") % 3 == 0) & (F.pmod(F.col("site_event_num"), 4) == 1), "lpg")
                .when(F.pmod(F.col("site_event_num"), 2) == 0, "petrol")
                .otherwise("diesel"),
            )
            .when(F.col("event_type") == "charge_session", "ev")
            .when(F.col("event_type") == "inventory", "convenience")
            .otherwise(F.lit(None).cast("string")),
        )
        .withColumn("quantity", F.round(F.lit(1.0) + F.pmod(F.col("event_num"), 60) * F.lit(0.25), 2))
        .withColumn("amount_eur", F.round(F.lit(4.0) + F.pmod(F.col("event_num"), 120) * F.lit(0.75), 2).cast("decimal(12,2)"))
        .withColumn(
            "wait_seconds",
            F.round(
                F.lit(180) + F.pmod(F.col("event_num"), 600)
                + F.when(F.col("is_hero_scenario"), F.lit(540)).otherwise(F.lit(0))
            ).cast("int"),
        )
        .withColumn(
            "demand_index",
            F.round(F.lit(0.8) + F.pmod(F.col("event_num"), 30) * F.lit(0.03) + F.when(F.col("is_hero_scenario"), F.lit(1.2)).otherwise(F.lit(0)), 3),
        )
        .withColumn(
            "telemetry_temperature_c",
            F.round(
                F.lit(42.0) + F.pmod(F.col("site_event_num"), 15)
                + F.when(F.col("status") == "degraded", F.lit(38.0)).otherwise(F.lit(0.0)),
                2,
            ),
        )
        .withColumn(
            "telemetry_error_rate",
            F.round(F.lit(0.02) + F.when(F.col("status") == "degraded", F.lit(0.17)).otherwise(F.lit(0.0)), 3),
        )
        .withColumn(
            "source_system",
            F.when(F.col("event_type").isin("charge_session", "charger_telemetry"), "charger_simulator")
            .when(F.col("event_type").isin("fuel_sale", "cafe_sale"), "pos_simulator")
            .when(F.col("event_type") == "inventory", "inventory_simulator")
            .otherwise("traffic_simulator"),
        )
    )
    return events.select(
        "event_id", "run_id", "site_id", "charger_id", "event_ts", "ingestion_ts", "event_type", "status",
        "energy_type", "quantity", "amount_eur", "wait_seconds", "demand_index", "telemetry_temperature_c",
        "telemetry_error_rate", "source_system", "is_hero_scenario",
    )


def build_site_facilities(spark) -> DataFrame:
    facility_types = F.array(
        F.lit("stop_cafe"), F.lit("vitay"), F.lit("accessible"),
        F.lit("family"), F.lit("wash"), F.lit("tir"),
    )
    return (
        spark.range(SITE_COUNT * 6)
        .withColumn("site_num", F.pmod(F.col("id"), F.lit(SITE_COUNT)))
        .withColumn("facility_num", F.pmod(F.col("id"), F.lit(6)))
        .select(
            F.format_string("SITE-%05d", F.col("site_num") + 1).alias("site_id"),
            F.element_at(facility_types, (F.col("facility_num") + 1).cast("int")).alias("facility_type"),
            F.when(F.col("facility_num") == 0, F.col("site_num") % 5 != 0)
            .when(F.col("facility_num") == 1, F.lit(True))
            .otherwise(F.col("site_num") % 3 != 0).alias("is_available"),
            (F.lit(1) + F.pmod(F.col("site_num"), F.lit(4))).cast("int").alias("capacity_units"),
        )
    )


def build_chargers(spark) -> DataFrame:
    return (
        build_sites(spark)
        .select("site_id", F.explode(F.sequence(F.lit(0), F.col("ev_charger_count") - 1)).alias("charger_num"))
        .withColumn("site_num", F.substring("site_id", 6, 5).cast("int") - 1)
        .select(
            F.concat(
                F.col("site_id"),
                F.lit("-CHG-"), F.lpad(F.col("charger_num").cast("string"), 2, "0"),
            ).alias("charger_id"),
            "site_id",
            F.when(F.col("charger_num") % 3 == 0, "ultra_fast")
            .when(F.col("charger_num") % 3 == 1, "fast")
            .otherwise("standard").alias("charger_type"),
            F.when(F.col("charger_num") % 3 == 0, 350)
            .when(F.col("charger_num") % 3 == 1, 150)
            .otherwise(50).cast("int").alias("max_kw"),
            F.to_date(F.lit("2024-01-01")).alias("installed_date"),
            F.when((F.col("site_num") == 6) & (F.col("charger_num") == 6), "degraded")
            .otherwise("active").alias("charger_status"),
        )
    )


def build_descriptive_sources(events: DataFrame, start_ts: str) -> dict[str, DataFrame]:
    telemetry = events.filter(F.col("event_type") == "charger_telemetry").select(
        "event_id", "run_id", "site_id", "charger_id", "event_ts", "ingestion_ts",
        "status", "telemetry_temperature_c", "telemetry_error_rate", "demand_index",
    )
    charging = events.filter(F.col("event_type") == "charge_session").select(
        F.concat(F.col("event_id"), F.lit("-SESSION")).alias("session_id"),
        "run_id", "site_id", "charger_id", "event_ts", "energy_type",
        F.round(F.col("quantity") * F.lit(8.5), 2).alias("energy_kwh"),
        "amount_eur", "wait_seconds", "status",
    )
    fuel = events.filter(F.col("event_type") == "fuel_sale").select(
        F.concat(F.col("event_id"), F.lit("-FUEL")).alias("transaction_id"),
        "run_id", "site_id", "event_ts", "energy_type",
        F.round(F.col("quantity") * F.lit(10.0), 2).alias("litres"), "amount_eur",
    )
    convenience = events.filter(F.col("event_type") == "cafe_sale").select(
        F.concat(F.col("event_id"), F.lit("-CAFE")).alias("transaction_id"),
        "run_id", "site_id", "event_ts", F.lit("stop_cafe").alias("channel"),
        F.when(F.col("is_hero_scenario"), "travel_meal").otherwise("beverage").alias("basket_type"),
        "quantity", "amount_eur",
    )
    inventory = events.filter(F.col("event_type") == "inventory").select(
        F.concat(F.col("event_id"), F.lit("-INV")).alias("snapshot_id"),
        "run_id", "site_id", "event_ts", F.lit("travel_convenience").alias("product_category"),
        F.greatest(F.lit(0), F.lit(120) - F.col("quantity").cast("int")).alias("on_hand_units"),
        F.lit(120).cast("int").alias("reorder_point_units"),
        F.when(F.col("is_hero_scenario"), F.lit(0.85)).otherwise(F.lit(0.15)).alias("stockout_risk_score"),
    )
    traffic = events.filter(F.col("event_type") == "traffic").select(
        F.concat(F.col("event_id"), F.lit("-TRAFFIC")).alias("traffic_observation_id"),
        "run_id", "site_id", "event_ts", "demand_index", "wait_seconds",
        F.when(F.col("is_hero_scenario"), "holiday_surge").otherwise("normal").alias("traffic_condition"),
    )
    weather = events.filter(F.col("event_type") == "traffic").select(
        F.concat(F.col("event_id"), F.lit("-WEATHER")).alias("weather_observation_id"),
        "run_id", "site_id", "event_ts",
        F.when(F.col("is_hero_scenario"), "warm_and_busy").otherwise("clear").alias("weather_condition"),
        F.when(F.col("is_hero_scenario"), F.lit(29.0)).otherwise(F.lit(22.0)).alias("temperature_c"),
        F.when(F.col("is_hero_scenario"), F.lit(0.0)).otherwise(F.lit(0.2)).alias("precipitation_mm"),
    )
    journeys = events.filter(F.col("event_type") == "charge_session").select(
        F.concat(F.col("event_id"), F.lit("-JOURNEY")).alias("journey_id"),
        "run_id", "site_id", "event_ts",
        F.when(F.pmod(F.xxhash64("event_id"), 5) == 0, "family")
        .when(F.pmod(F.xxhash64("event_id"), 5) == 1, "fleet")
        .when(F.pmod(F.xxhash64("event_id"), 5) == 2, "truck")
        .otherwise("long_distance").alias("customer_segment"),
        F.when(F.col("is_hero_scenario"), "at_risk").otherwise("normal").alias("journey_status"),
        "wait_seconds", F.when(F.col("is_hero_scenario"), F.lit(False)).otherwise(F.lit(True)).alias("completed"),
    )
    maintenance = events.filter(F.col("event_type") == "maintenance").select(
        F.concat(F.col("event_id"), F.lit("-WO")).alias("work_order_id"),
        "run_id", "site_id", "charger_id", "event_ts",
        F.when(F.col("is_hero_scenario"), "inspect_degraded_charger").otherwise("routine_check").alias("work_order_type"),
        F.when(F.col("is_hero_scenario"), "open").otherwise("completed").alias("work_order_status"),
    )
    vitay = events.filter(F.col("event_type").isin("charge_session", "fuel_sale", "cafe_sale")).select(
        F.concat(F.col("event_id"), F.lit("-VITAY")).alias("interaction_id"),
        "run_id", "site_id", "event_ts",
        F.concat(F.lit("SYNTH-CUSTOMER-"), F.lpad(F.pmod(F.xxhash64("event_id"), 10000).cast("string"), 5, "0")).alias("synthetic_customer_id"),
        F.when(F.col("is_hero_scenario"), "affected_journey").otherwise("standard_journey").alias("interaction_type"),
        F.when(F.col("is_hero_scenario"), "eligible_for_bounded_benefit").otherwise("no_offer").alias("eligibility_status"),
    )
    holiday = (
        events.select(F.to_date(F.lit(start_ts)).alias("holiday_start")).limit(1)
        .crossJoin(spark_range_days(events.sparkSession, 14))
        .select(
            F.date_add(
                F.col("holiday_start"),
                F.col("day_num").cast("int")
            ).alias("calendar_date"),
            F.lit("summer_travel_surge").alias("event_name"),
            F.lit(True).alias("is_peak_travel_day"),
            (F.lit(1.5) + F.col("day_num") * F.lit(0.05)).alias("expected_demand_multiplier"),
        )
    )
    return {
        "mobility_bronze_charger_telemetry": telemetry,
        "mobility_bronze_charging_sessions": charging,
        "mobility_bronze_fuel_transactions": fuel,
        "mobility_bronze_convenience_transactions": convenience,
        "mobility_bronze_inventory_snapshots": inventory,
        "mobility_bronze_traffic_demand": traffic,
        "mobility_bronze_weather_observations": weather,
        "mobility_bronze_customer_journeys": journeys,
        "mobility_bronze_maintenance_history": maintenance,
        "mobility_bronze_vitay_interactions": vitay,
        "mobility_bronze_holiday_calendar": holiday,
    }


def spark_range_days(spark, days: int) -> DataFrame:
    return spark.range(days).withColumnRenamed("id", "day_num")


def write_table(df: DataFrame, table_name: str, mode: str) -> None:
    df.write.mode(mode).format("delta").option("overwriteSchema", "true").saveAsTable(table_name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    parser.add_argument("--schema", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--event-count", type=int, default=DEFAULT_EVENT_COUNT)
    parser.add_argument("--start-ts", default=DEFAULT_START_TS)
    parser.add_argument("--mode", choices=("overwrite", "append"), default="overwrite")
    args = parser.parse_args()

    spark = DatabricksSession.builder.serverless(True).getOrCreate()
    spark.sql(f"CREATE SCHEMA IF NOT EXISTS `{args.catalog}`.`{args.schema}`")

    sites_table = identifier(args.catalog, args.schema, "mobility_bronze_sites")
    events_table = identifier(args.catalog, args.schema, "mobility_bronze_station_events")

    sites = build_sites(spark)
    events = build_events(spark, args.event_count, args.run_id, args.start_ts)
    write_table(sites, sites_table, args.mode)
    write_table(events, events_table, args.mode)
    write_table(build_site_facilities(spark), identifier(args.catalog, args.schema, "mobility_bronze_site_facilities"), args.mode)
    write_table(build_chargers(spark), identifier(args.catalog, args.schema, "mobility_bronze_chargers"), args.mode)
    for table, frame in build_descriptive_sources(events, args.start_ts).items():
        write_table(frame, identifier(args.catalog, args.schema, table), args.mode)

    print(f"Generated descriptive Mobility Bronze sources for run_id={args.run_id}")


if __name__ == "__main__":
    main()
