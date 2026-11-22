# ORLEN Mobility Databricks CLI flow

This workshop follows the standard [CLI-FLOW.md](../../../../.claude/skills/setup-databricks-workshop/assets/workshop-template/CLI-FLOW.md)
contract. Use the CLI when a product-specific skill or workspace API does not
cover the required lifecycle operation.

Reference: [Azure Databricks CLI](https://learn.microsoft.com/en-us/azure/databricks/dev-tools/cli/).

## Deployment context

```text
profile: fevm-msahil-demo-workspace
catalog: msahil_demo_workspace_catalog
schema: orlen_intelligent_mobility
workspace_parent_folder: /Workspace/Users/mohammad.sahil@databricks.com
project_name: orlen-consumers-products-intelligence
workspace_project_folder: /Workspace/Users/mohammad.sahil@databricks.com/orlen-consumers-products-intelligence
```

The catalog and schema are deployment inputs and must be verified before any
workspace write. Re-authenticate with `./scripts/login-fevm.sh` when required.

Authentication recovery is a hard gate: retry `./scripts/login-fevm.sh`, then
run `databricks current-user me --profile fevm-msahil-demo-workspace`. Do not
create the `ORLEN Mobility` root Domain or any subdomain until that command
succeeds. The latest retry failed because the OS keyring is unreachable (exit
status 152), so no Domain write was attempted.

## Preflight

```bash
databricks --version
databricks auth profiles
databricks current-user me --profile fevm-msahil-demo-workspace
databricks bundle schema --profile fevm-msahil-demo-workspace
databricks catalogs list --profile fevm-msahil-demo-workspace
databricks schemas list msahil_demo_workspace_catalog --profile fevm-msahil-demo-workspace
```

## Domain hierarchy creation

Create one root Domain for the business unit, then create its subdomains. The
Domains CLI is Beta and requires an existing governed tag key; verify the tag
key and permissions before running these writes. The current creation attempt
is blocked because the profile needs re-authentication and the FEVM keyring is
unavailable.

```bash
databricks domains list-domains --profile fevm-msahil-demo-workspace --output json
databricks domains create-domain <governed-tag-key> \
  --domain-id orlen-mobility-root \
  --subtitle "ORLEN Mobility business-unit asset domain" \
  --description "Root domain for ORLEN Mobility workshop assets" \
  --profile fevm-msahil-demo-workspace

# Use the returned domain ID as the parent for each subdomain.
databricks domains create-domain <governed-tag-key> \
  --domain-id orlen-mobility-destinations \
  --parent-domain-id <orlen-mobility-domain-id> \
  --profile fevm-msahil-demo-workspace
```

Repeat the subdomain command for `Customer Journeys`, `Energy and Convenience
Retail`, `Demand and Travel Context`, `Operations Response`, and `Closed-Loop
Outcomes`. Record returned IDs in `resource-manifest.json`. Pages are then
created or configured through the available Ontology/Genie surface and linked
to these subdomains; no unsupported Pages CLI command is invented.

If the CLI wrapper returns no response, use the documented REST fallback:

```bash
databricks api post "/api/2.0/domains?domain_id=orlen-mobility-root" \
  --json '{"tag_key":"<governed-tag-key>","draft":false,"subtitle":"ORLEN Mobility business-unit asset domain","description":"Root domain for ORLEN Mobility workshop assets"}' \
  --profile fevm-msahil-demo-workspace

databricks api get "/api/2.0/domains/orlen-mobility-root" \
  --profile fevm-msahil-demo-workspace
```

The alternate documented endpoint is `/api/discover/v1/domains`.

## Create and deploy

```bash
databricks bundle validate -t workshop \
  --profile fevm-msahil-demo-workspace \
  --var catalog=msahil_demo_workspace_catalog \
  --var schema=orlen_intelligent_mobility \
  --var workspace_root_path=/Workspace/Users/mohammad.sahil@databricks.com \
  --var project_name=orlen-consumers-products-intelligence

databricks bundle deploy -t workshop \
  --profile fevm-msahil-demo-workspace \
  --var catalog=msahil_demo_workspace_catalog \
  --var schema=orlen_intelligent_mobility \
  --var workspace_root_path=/Workspace/Users/mohammad.sahil@databricks.com \
  --var project_name=orlen-consumers-products-intelligence
```

The CLI is used by the implementation team for asset creation and lifecycle
operations. It is not part of the customer-facing presentation or Databricks
demo flow.

## Unsupported or workspace-dependent operations

Genie Ontology Domains/Pages, Unity Gateway, and Lakebase lifecycle operations
must be capability-checked. If the installed CLI does not expose them, keep
their configuration under `integrations/`, record exact manual/API procedures
in `resource-manifest.json`, and use the documented fallback trace during the
demo.
