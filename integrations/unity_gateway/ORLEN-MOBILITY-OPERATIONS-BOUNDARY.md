# ORLEN Mobility Operations — Unity Gateway Boundary

Live enforcement feasibility and dependencies: [GATEWAY-ENFORCEMENT-REVIEW.md](GATEWAY-ENFORCEMENT-REVIEW.md). The 2026-11-21 four-action Lakebase rehearsal proves the App workflow only; its 403 guard and `demo_bounded_action` label are not Gateway decisions.

## Purpose

This boundary lets the ORLEN Mobility Genie Agent and future operations App use governed AI and tool access without giving an agent direct permission to mutate analytical data or operational state.

The boundary is deliberately split into:

1. **Read and investigate** — query governed Mobility Metric Views and explain the evidence.
2. **Propose** — produce a bounded response plan for human review.
3. **Commit** — persist an approved action through the Databricks App and Lakebase; this is not enabled in the current increment.

## Current workspace capability

The target workspace exposes Unity Gateway through the `databricks ai-gateway` CLI. The capability check found:

| Capability | Current result | ORLEN use |
|---|---|---|
| Governed model services | Available; system model services are present | Route the operations agent’s model inference through a governed service when selected |
| Model-provider services | No custom provider service currently registered | Optional future external-model route |
| MCP services | System MCP services are available; no ORLEN action MCP service exists | Create an ORLEN MCP service only after an approved connection/backend exists |
| Unity Gateway skills | Beta API is available, but no ORLEN skill bundle is deployed | Package a reusable operations skill after the App/Lakebase contract is finalized |

The live ORLEN-specific tool boundary is therefore **designed and capability-verified, but not yet enabled for operational writes**.

## Governed assets and tools

### Read tools — enabled conceptually for the Genie Agent

| Tool | Allowed operation | Governed sources | Consumer |
|---|---|---|---|
| `orlen_mobility_site_status` | Read current status, wait, availability, demand, and inventory-risk measures | `mobility_mv_site_performance` | Genie Agent, App |
| `orlen_mobility_charger_risk` | Read charger predictions, failure probability, risk band, and scored time | `mobility_mv_charger_risk` | Genie Agent, App |
| `orlen_mobility_retail_value` | Read revenue, margin proxy, energy usage, and convenience value | `mobility_mv_energy_retail_performance` | Genie Agent, App |
| `orlen_mobility_journey_value` | Read completed journeys, wait, conversion, completion, revenue, and margin proxy | `mobility_mv_customer_journey_value` | Genie Agent, App |

These tools must return governed metric results and source context. They must not expose raw Bronze data, secrets, unrestricted SQL execution, or direct table-write capabilities.

### Proposal tool — future enabled action

`orlen_mobility_propose_response` accepts a site, evidence references, and a requested decision context, then returns a structured proposal:

- charger inspection or maintenance priority;
- customer-routing alternative;
- VITAY or customer communication suggestion;
- Stop Cafe or inventory response suggestion;
- expected customer and ORLEN value impact;
- confidence, assumptions, and expiry time.

It is advisory only. It must not write to Lakebase or call an external operational system.

### Commit tool — approval-gated future action

`orlen_mobility_commit_response` will be exposed only through the Databricks App after a named human approves the proposal. It will write operational state to Lakebase, including:

- proposal ID and decision;
- approver identity and timestamp;
- selected action and override;
- target site/charger;
- status, expiry, and audit trace ID.

The tool must reject calls without an approval ID and must never write directly to Unity Catalog analytical tables.

## Policy boundary

| Control | Rule | Demonstration evidence |
|---|---|---|
| Identity | Agent and App use their governed workspace identity; user approval is preserved | Identity, proposal ID, and trace ID |
| Data access | Read only the four Mobility Metric Views and approved operational state | UC grants and tool input/output scope |
| Analytical writes | Deny `INSERT`, `UPDATE`, `DELETE`, `MERGE`, and DDL through agent tools | Explicit denied-action test |
| Operational writes | Deny commit without a human approval ID | Gateway/App policy response |
| Scope | Require a known ORLEN site and bounded action type | Validation error for unknown site/action |
| Expiry | Proposal and approval expire after the workshop-defined TTL | Expired approval rejection |
| Observability | Capture model, tool, identity, input, output, latency, and policy decision | Gateway/MLflow trace and audit record |

## How the assets are used later

```text
Genie Agent
  └─ investigates governed Metric Views through read tools
       └─ Unity Gateway checks identity, scope, and policy
            └─ proposes a bounded response
                 └─ Databricks App presents evidence and approval controls
                      └─ approved commit tool writes Lakebase operational state
                           └─ Lakeflow/CDC returns outcomes to the lakehouse
                                └─ AI/BI dashboard measures customer and ORLEN value
```

The current workshop can demonstrate governed reads and an App-controlled proposal/approval path. The App and dedicated Lakebase branch now exist, but the commit path is not routed through Unity Gateway. A separate supported external MCP backend and HTTP connection are needed for Gateway enforcement of the commit; current Databricks documentation does not support registering the Databricks App itself as that external MCP service. A Gateway model-service policy could instead govern the recommendation beat, with the commit clearly remaining App-controlled.

## Lifecycle

- Create the ORLEN MCP service or Unity Gateway skill only after its real backend connection and schema are approved.
- Assign every created Gateway model, MCP service, skill, or policy to `ORLEN Mobility / Operations Response` immediately.
- Grant the Genie Agent read access to the governed sources; grant the App only the commit operation it needs.
- Test one approved proposal and one denied direct-write/unauthorised-commit request.
- Capture identifiers, grants, policy results, traces, owner, expiry, reset, and cleanup in `resource-manifest.json`.
