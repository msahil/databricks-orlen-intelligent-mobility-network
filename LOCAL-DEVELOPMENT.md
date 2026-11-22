# ORLEN Mobility App — local development

Local AppKit development is the default way to build and review the ORLEN
Mobility App. The React/Node process runs locally with hot reload while the
data remains in the approved Databricks workspace.

## Workspace connection

```text
profile: fevm-msahil-demo-workspace
host: https://fevm-msahil-demo-workspace.cloud.databricks.com
catalog: msahil_demo_workspace_catalog
schema: orlen_intelligent_mobility
warehouse: 3fcc040816112500
Genie space: 01f1df7010f21e1da6ac146cddb7d8e6
Lakebase branch: projects/demo-hub/branches/orlen-mobility-ops
```

The permanent `orlen-mobility-ops` branch is `READY` with no expiry. Its active
read-write endpoint is `projects/demo-hub/branches/orlen-mobility-ops/endpoints/primary`.
The local App has verified the `orlen_mobility_ops` schema and seeded case state.

The App uses the user’s Databricks profile for local Analytics and Genie
access. The `.env` file contains the local Lakebase endpoint/database values
for the permanent ORLEN branch and is ignored by Git. No token or secret
belongs in this document or in source control.

Set `ORLEN_CATALOG`, `ORLEN_SCHEMA`, and `ORLEN_WORKSPACE_HOST` in the local
`.env` to match deployment parameters. The React client reads
`/api/workshop-config` instead of embedding the catalog, schema, or Genie URL.
`ORLEN_WORKSPACE_HOST` supplies the full Genie link; AppKit chat uses
`DATABRICKS_GENIE_SPACE_ID`.

## Start the local App

From this directory:

```bash
databricks current-user me --profile fevm-msahil-demo-workspace
ORLEN_CATALOG=msahil_demo_workspace_catalog \
ORLEN_SCHEMA=orlen_intelligent_mobility \
DATABRICKS_CONFIG_PROFILE=fevm-msahil-demo-workspace npm run dev
```

Open the local URL printed by AppKit, normally:

```text
http://localhost:8000
```

The Response plan's governed recommendation route uses those catalog/schema values
to call `orlen_mobility_recommendations` through Unity Gateway. It reads the
current Elmshorn case from Lakebase and does not mutate proposal or approval state.
The explicit **Verify safety boundary** button sends a fixed unsafe proof request
and displays the Gateway's actual policy denial. The local signed-in profile needs
`USE CATALOG`, `USE SCHEMA`, and `EXECUTE` on the model service. Before a future
hosted App deployment, grant the App service principal the same least-privilege
service access and validate the hosted route.

If another AppKit process owns the default Vite WebSocket port, this App uses
`24679` for hot reload. Set `ORLEN_HMR_PORT` before starting if that port is busy.

The UI is local, but governed Metric View queries, Genie interactions, and
Lakebase operational state continue to use Databricks resources. This is the
normal workflow for styling, copy, page layout, query presentation, and
interaction work.

## Local review gate

```bash
npm run typecheck
npm run lint
npm run build
```

Review the ORLEN business flow locally before requesting a hosted deployment.
Confirm that data freshness, synthetic/public data labelling, governed
capability labels, Genie access, and Lakebase case state behave as expected.

## Deployment policy

Routine App changes must not trigger a Databricks App deployment. Deploy only
after local acceptance, for App resource/permission/environment changes, or
when the hosted customer-demo URL must be updated. Before that deployment:

```bash
databricks apps validate --profile fevm-msahil-demo-workspace
```

Then use the staged Workspace import and Apps deployment flow documented in
the workshop’s execution plan. Update `resource-manifest.json` only for the
intentional hosted deployment.
