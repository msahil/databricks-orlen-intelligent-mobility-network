# ORLEN Mobility workshop execution plan

Canonical storyline: [STORYLINE.md](STORYLINE.md)

This is the repeatable ordered sequence used to create, deploy, validate, rehearse, reset, and hand off the workshop. Environment-specific catalog, schema, Workspace folder, warehouse, profile, and Lakebase branch are deployment inputs—not reusable code defaults.

## Current implementation state

The Bronze → Silver → Gold data products, ML model, Metric Views, Genie Agent, AI/BI dashboard, Unity Gateway boundary specification, and Databricks App are deployed. The App is running at [ORLEN Mobility Operations](https://orlen-mobility-ops-7474647896699216.aws.databricksapps.com), and its dedicated `orlen-mobility-ops` Lakebase branch is permanent (`no_expiry: true`).

## Ordered sequence

### Local-first App development

The App is developed and reviewed locally by default. Run the local AppKit
server with `DATABRICKS_CONFIG_PROFILE=fevm-msahil-demo-workspace npm run dev`
from the App directory. Analytics, Genie, governed Unity Catalog queries, and
Lakebase use the approved Databricks resources while the UI and backend remain
local. Routine UI, copy, styling, query, and interaction changes do not require
an App deployment. Deploy only after local acceptance, for resource or
permission changes, or for the hosted customer-demo handoff. See
[LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md).

1. Resolve the existing customer project and workshop folder; confirm the approved storyline and hero scenario.
2. Supply deployment parameters: `--profile`, `catalog`, `schema`, `workspace_root_path`, `project_name`, `warehouse_id`, `participant_group`, and `mlflow_experiment_path`.
3. Create the customer business-unit root Domain and categorized subdomains; assign each asset immediately after creation.
4. Deploy deterministic Bronze sources enriched with public ORLEN location identities; verify row counts, event-time behavior, all five energy types, named-location metadata, provenance fields, hero records, and referential integrity. Keep public identity separate from synthetic operational measures.
5. Run the Lakeflow pipeline to produce conformed Silver and business-facing Gold products; verify quality expectations and hero-site state.
6. Train/register the charger-failure model in MLflow and Unity Catalog; verify model version, `prod` alias, baseline comparison, and prediction rows.
7. Create governed Metric Views; verify `MEASURE(...)` benchmark queries and attach each view to its ontology subdomain.
8. Create and publish the customer-prefixed AI/BI dashboard; verify dataset parameters, page descriptions, and widget bindings.
9. Create/configure the Genie Ontology Pages and Genie Agent; run the benchmark questions and record results in `resource-manifest.json`.
10. Discover Unity Gateway capabilities. Create live ORLEN tools only when a real approved backend exists; otherwise keep the source-controlled read/propose/commit boundary and explicit denial fallback.
11. Create the dedicated long-lived ORLEN Lakebase branch and database. Scaffold the App with `analytics`, `genie`, and `lakebase`; verify service-principal schema ownership before local development.
12. Grant least privilege: App `USE CATALOG`, `USE SCHEMA`, and `SELECT` only on the governed Metric Views; never grant schema-wide access unless separately approved.
13. Deploy the App, verify `RUNNING`/`SUCCEEDED`, schema initialization, seeded case, proposal transition, approval transition, and denied unapproved commit.
14. Run the two-step alignment review: storyline → presentation, then presentation → executable demo. Update `ALIGNMENT-REVIEW.md` and both flows.
15. Rehearse as the participant identity, verify reset/replay, capture fallbacks, and record open technical warnings before handoff.

## Realism and UI quality gate

- At least one hero location and two alternatives must use named public ORLEN locations.
- The site dimension must expose city, country, market, format, road context, source URL, and provenance.
- Synthetic transactions, telemetry, forecasts, ML scores, revenue, margin, and satisfaction must be labelled in the data dictionary and visible UI.
- App screens must use the shared Tailwind tokens, dark theme, loading/empty/error states, and semantic status colours; never imply that synthetic values are ORLEN actuals.
- The App landing page must pass the control-tower gate: network KPI strip, geographic Europe/public-location map, priority queue, alternative-capacity queue, and persistent hero-flow widget.
- Any new App analytics query must be backed by a governed Metric View or approved source, type-generated, and included in the App service principal's least-privilege grants.

## Deployment fallback used for this workshop

The standalone App bundle validated successfully with deployment-time variables. Its nested deployment correctly blocked a destructive plan that would have deleted the existing Lakeflow pipeline. The safe fallback was to attach resources with the Apps API, stage the validated source under the customer project Workspace folder using the explicit-profile CLI, and deploy the App from that Workspace path. This fallback is repeatable and must not bypass destructive approval guards.

## Reset and cleanup

- Reset synthetic Delta products with the deterministic overwrite run, refresh Lakeflow/ML/Metric Views, restore dashboard filters, and reseed `CASE-SITE-00007`.
- Reset App workflow rows only in the dedicated Lakebase branch; never touch `production` or the shared Demo Hub schema.
- After explicit approval, stop/delete the App, revoke its grants, remove its Domain assignments, and delete the permanent ORLEN Lakebase branch only as an intentional customer-workshop teardown.
