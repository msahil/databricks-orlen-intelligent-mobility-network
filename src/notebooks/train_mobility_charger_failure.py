"""Train and score the ORLEN Mobility charger failure model on Databricks."""

from __future__ import annotations

import argparse
import json

import mlflow
import mlflow.sklearn
import pandas as pd
from databricks.connect import DatabricksSession
from mlflow import MlflowClient
from pyspark.sql import functions as F
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score


FEATURE_COLUMNS = [
    "telemetry_temperature_c",
    "telemetry_error_rate",
    "demand_index",
    "max_kw",
]


def table_name(catalog: str, schema: str, name: str) -> str:
    return f"`{catalog}`.`{schema}`.`{name}`"


def build_features(spark, catalog: str, schema: str):
    source = spark.read.table(table_name(catalog, schema, "mobility_silver_charging_operations"))
    return (
        source.select(
            "event_id", "run_id", "site_id", "charger_id",
            F.col("event_ts").alias("feature_snapshot_ts"),
            *FEATURE_COLUMNS, "charger_type", "charger_status",
            F.when(F.col("status") == "degraded", 1).otherwise(0).alias("failure_label"),
        )
        .dropna(subset=FEATURE_COLUMNS + ["charger_id", "site_id"])
        .withColumn("failure_label", F.col("failure_label").cast("double"))
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    parser.add_argument("--schema", required=True)
    parser.add_argument("--model-name", required=True)
    parser.add_argument("--experiment-path", required=True)
    args = parser.parse_args()

    spark = DatabricksSession.builder.serverless(True).getOrCreate()
    features = build_features(spark, args.catalog, args.schema)
    features_table = table_name(args.catalog, args.schema, "mobility_ml_charger_failure_features")
    predictions_table = table_name(args.catalog, args.schema, "mobility_ml_charger_failure_predictions")
    features.write.mode("overwrite").format("delta").option("overwriteSchema", "true").saveAsTable(features_table)

    # This is a bounded workshop feature snapshot; training remains on Databricks
    # while pandas/sklearn avoids Spark Connect ML summary-cache limitations.
    feature_pdf = features.toPandas()
    # This label describes the observed row. A chronological holdout limits
    # random-row leakage, but it does not turn the score into a future forecast.
    feature_pdf = feature_pdf.sort_values(["feature_snapshot_ts", "event_id"]).reset_index(drop=True)
    split_at = int(len(feature_pdf) * 0.8)
    train_rows, validation_rows = feature_pdf.iloc[:split_at], feature_pdf.iloc[split_at:]
    x_train, y_train = train_rows[FEATURE_COLUMNS], train_rows["failure_label"].astype(int)
    x_validation, y_validation = validation_rows[FEATURE_COLUMNS], validation_rows["failure_label"].astype(int)
    model = LogisticRegression(max_iter=200, class_weight="balanced", random_state=42)

    mlflow.set_registry_uri("databricks-uc")
    mlflow.set_experiment(args.experiment_path)
    with mlflow.start_run(run_name="mobility-charger-degradation-classification") as run:
        model.fit(x_train, y_train)
        validation_labels = model.predict(x_validation)
        validation_accuracy = accuracy_score(y_validation, validation_labels)
        mlflow.log_params({"feature_count": len(FEATURE_COLUMNS), "split": "chronological_80_20", "label": "observed_status_degraded", "prediction_horizon_minutes": 0})
        mlflow.log_metric("validation_accuracy", float(validation_accuracy))
        mlflow.log_metric("validation_precision", float(precision_score(y_validation, validation_labels, zero_division=0)))
        mlflow.log_metric("validation_recall", float(recall_score(y_validation, validation_labels, zero_division=0)))
        mlflow.log_metric("training_rows", float(len(x_train)))
        mlflow.log_metric("validation_rows", float(len(x_validation)))
        mlflow.sklearn.log_model(model, "model", input_example=x_train.head(2))
        model_uri = f"runs:/{run.info.run_id}/model"
        registered = mlflow.register_model(model_uri, args.model_name)
        client = MlflowClient(registry_uri="databricks-uc")
        client.set_registered_model_alias(args.model_name, "prod", registered.version)

        probabilities = model.predict_proba(feature_pdf[FEATURE_COLUMNS])[:, 1]
        prediction_pdf = feature_pdf[["event_id", "run_id", "site_id", "charger_id", "feature_snapshot_ts"]].copy()
        prediction_pdf["scored_at"] = pd.Timestamp.utcnow()
        prediction_pdf["prediction_horizon_minutes"] = 0
        prediction_pdf["failure_probability"] = probabilities.round(6)
        prediction_pdf["risk_band"] = prediction_pdf["failure_probability"].map(
            lambda value: "high" if value >= 0.70 else ("medium" if value >= 0.40 else "low")
        )
        prediction_pdf["model_name"] = args.model_name
        prediction_pdf["model_version"] = str(registered.version)
        prediction_pdf["baseline_probability"] = feature_pdf["telemetry_error_rate"].map(
            lambda value: 0.75 if value >= 0.10 else 0.10
        )
        prediction_pdf["recommended_intervention"] = prediction_pdf["risk_band"].map(
            lambda value: "inspect" if value == "high" else "monitor"
        )
        prediction_df = spark.createDataFrame(prediction_pdf)
        prediction_df = prediction_df.withColumn(
            "prediction_id",
            F.sha2(F.concat_ws("|", "run_id", "event_id", "charger_id", "feature_snapshot_ts"), 256),
        ).select(
            "prediction_id", "run_id", "site_id", "charger_id", "scored_at",
            "prediction_horizon_minutes", "failure_probability", "risk_band",
            "model_name", "model_version", "feature_snapshot_ts",
            "baseline_probability", "recommended_intervention",
        )
        prediction_df.write.mode("overwrite").format("delta").option("overwriteSchema", "true").saveAsTable(predictions_table)
        print(json.dumps({
            "model_name": args.model_name,
            "model_version": str(registered.version),
            "validation_accuracy": float(validation_accuracy),
            "feature_rows": len(feature_pdf),
            "prediction_rows": len(prediction_pdf),
        }))


if __name__ == "__main__":
    main()
