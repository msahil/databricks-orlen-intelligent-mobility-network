# ORLEN | The Intelligent Mobility Network

This folder contains the complete handoff for the ORLEN Mobility customer demo.
It explains what was built, why it matters to ORLEN, how to deliver the session,
and where to find the implementation and recovery details.

## Workshop at a glance

**Audience:** ORLEN C-level leaders and business heads across mobility, retail
network operations, convenience/VITAY, and data and AI.

**Format:** an executive business-case presentation followed by an instructor-led
Databricks demonstration. The presentation duration is flexible; the demo flow is
approximately 60 minutes.

**Business question:** how can ORLEN make each multi-energy destination more
reliable for customers and more valuable for the Group?

**Hero scenario:** ORLEN Charge Hub Elmshorn has an observed charger-degradation
signal during a synthetic historical replay. The facilitator investigates the
condition, screens a scenario-defined nearby destination, creates a bounded
response plan, obtains human approval, records simulated execution in Lakebase,
and reviews the evidence required to measure customer and ORLEN outcomes.

The scenario models a location as more than a fuel station: it combines charging,
petrol, diesel, LPG, hydrogen, convenience retail, Stop Cafe, facilities, traffic,
and VITAY/customer-journey context.

## What was built

The workshop demonstrates one connected decision loop:

```text
Synthetic signals
  → Lakeflow ingestion and transformation
  → Unity Catalog governed Bronze / Silver / Gold data
  → ML charger-degradation classification
  → Metric Views and Genie investigation
  → Unity Gateway-governed recommendation
  → Databricks App decision workspace
  → Lakebase proposal, approval and execution state
  → modelled outcome evidence and measurement boundary
```

| Capability | What the audience sees | Workshop asset |
|---|---|---|
| Lakeflow | Synthetic operational events become governed destination state | `resources/` pipelines and `src/pipelines/` |
| Unity Catalog | Customer-prefixed tables, views, metadata and governance boundary | `DATA-DICTIONARY.md`, `LAYER-MAP.md` |
| ML / MLflow | Observed charger-degradation classification compared with a fixed rule | `src/notebooks/train_mobility_charger_failure.py` |
| Metric Views | Shared, governed measures used by the App, dashboard and Genie | `src/app/orlen-mobility-ops/config/metric-views/` |
| Genie Ontology and Agent | Natural-language questions over the business meaning of Mobility data | `GENIE-ONTOLOGY.md`, `integrations/genie/` |
| AI/BI dashboard | `ORLEN Mobility Control Tower` view of network, destination, retail and journey measures | `src/dashboards/` |
| Unity Gateway | Bounded recommendation plus an actual unsafe-request policy denial | `integrations/unity_gateway/` |
| Databricks App / AppKit | Control-tower UI with Overview, Network, Investigate, Response plan, Approval & execution, and Outcomes | `src/app/orlen-mobility-ops/` |
| Lakebase | Low-latency operational case, approval and action audit state | `integrations/lakebase/` and App server routes |

All operational measures are synthetic or modelled for demonstration. Public ORLEN
location context is kept distinct from synthetic operational evidence.

## Delivery sequence

### 1. Before the session

1. Read [STORYLINE.md](STORYLINE.md) and [PRESENTATION-FLOW.md](PRESENTATION-FLOW.md).
2. Confirm the ORLEN logo is visible on presentation slide 1.
3. Open the private [Google Slides presentation](https://docs.google.com/presentation/d/1G_ak1ZeC8A-O-Nbw5U9s_5gNZGyo2kfAiBa6ZjD6VbQ/edit), or use the local source deck at [`decks/slides/orlen-intelligent-mobility-network`](../../../../decks/slides/orlen-intelligent-mobility-network).
4. Start the local App using [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md). The default delivery mode is local UI with data and governed services accessed from Databricks.
5. Check that the App, Genie space, AI/BI dashboard, Unity Gateway recommendation service, and Lakebase branch are available.
6. For a fresh rehearsal, reset `CASE-SITE-00007` only with the workshop owner's approval. The current stored case may contain the completed four-action simulated execution.

### 2. Presentation

Use the presentation as a business conversation, not a product catalogue:

1. Establish ORLEN's Strategy 2035 direction and the multi-energy destination opportunity.
2. Frame the customer and ORLEN value: reliability, shorter waits, completed journeys, better convenience attachment, VITAY engagement, utilisation, and reduced lost revenue.
3. Introduce Elmshorn as the concrete decision that makes the opportunity real.
4. Explain the closed-loop operating model and the distinction between demonstrated proof and future rollout requirements.
5. Hand off to the App with the question: **which response should ORLEN approve, and how will ORLEN prove that it worked?**

The slide-by-slide choreography and demo handoff are in
[PRESENTATION-FLOW.md](PRESENTATION-FLOW.md).

### 3. Databricks demonstration

Follow [DATABRICKS-DEMO-FLOW.md](DATABRICKS-DEMO-FLOW.md) and keep the same
Elmshorn case selected throughout:

| Approx. time | Tab / asset | Delivery focus |
|---:|---|---|
| 0–15 min | Network | Show the MapLibre network view, risk/demand/capacity/wait layers, multi-energy destination profile, Elmshorn priority, and the scenario-defined Elmshorn East screening result. Briefly open the `ORLEN Mobility Control Tower` AI/BI dashboard. |
| 15–25 min | Investigate | Show timestamped synthetic telemetry, ingestion/replay context, observed-degradation ML evidence, fixed-rule comparison, governed measures, and Genie questions. |
| 25–35 min | Response plan | Select bounded maintenance, routing, Stop Cafe, and VITAY actions. Generate the safe Unity Gateway recommendation and show the actual unsafe-request denial. Submit the proposal. |
| 35–45 min | Approval & execution | Show Lakebase state, the human approval boundary, the denied direct-commit path, and the action-level execution ledger. |
| 45–55 min | Outcomes | Separate simulated/modelled effects from observed outcomes. Show audit links and the data that would be needed to measure real customer and ORLEN impact. |
| 55–60 min | Close and reset | Reconnect the loop to the pilot decision and reset only with explicit owner approval. |

The hero scenario is not a separate tab. It persists across the App journey from
Network through Outcomes.

## Language and proof boundaries

Use these distinctions explicitly during delivery:

- **Observed:** historical synthetic telemetry and the current observed-state ML classification.
- **Synthetic:** generated events, journeys, destination measures and retail context.
- **Modelled / scenario estimate:** wait reduction, protected journeys and revenue protection.
- **Target:** a proposed pilot objective, not an achieved ORLEN result.
- **Unmeasured:** real route diversion, charger recovery, attributable revenue/profit, and post-action customer impact.

Do not describe the current model as a validated 60-minute future-failure forecast.
Do not describe Elmshorn East as a verified live ORLEN station or claim a live
customer diversion. Its route, station identity and current capacity require
real-world verification.

Unity Gateway governs the demonstrated recommendation boundary. The App/Lakebase
approval and execution path is a separate workflow guard; ORLEN-specific Gateway
tool enforcement for the operational commit is not claimed as implemented.

## Current environment

The current workspace configuration is documented in
[LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md) and [CLI-FLOW.md](CLI-FLOW.md):

```text
profile: fevm-msahil-demo-workspace
catalog: msahil_demo_workspace_catalog
schema: orlen_intelligent_mobility
Genie space: 01f1df7010f21e1da6ac146cddb7d8e6
Lakebase branch: projects/demo-hub/branches/orlen-mobility-ops
```

The local App is the preferred iteration and delivery path. Routine UI, copy,
styling and interaction changes do not require a Databricks App deployment.
Deploy only after local acceptance or when the hosted handoff explicitly requires
an update. Use the explicit CLI profile for every Databricks command.

## Reset and recovery

The approved reset endpoint is documented in
[FACILITATOR-RUNBOOK.md](FACILITATOR-RUNBOOK.md). After reset, verify:

- case `CASE-SITE-00007` is `needs_review`;
- all four actions are `proposed`;
- the current-cycle approval is absent;
- scenario impact fields are null.

If Genie, Gateway or the dashboard is unavailable, use the documented fallback
evidence in [FACILITATOR-RUNBOOK.md](FACILITATOR-RUNBOOK.md). Never replace a
missing live proof point with an unlabelled claim.

## File guide

### Narrative and delivery

- [STORYLINE.md](STORYLINE.md) — canonical business storyline and hero scenario.
- [PRESENTATION-FLOW.md](PRESENTATION-FLOW.md) — presentation sequence, visuals and handoff.
- [DATABRICKS-DEMO-FLOW.md](DATABRICKS-DEMO-FLOW.md) — executable 60-minute demo.
- [FACILITATOR-RUNBOOK.md](FACILITATOR-RUNBOOK.md) — facilitator cues, fallbacks, reset and warnings.
- [PARTICIPANT-GUIDE.md](PARTICIPANT-GUIDE.md) — audience learning objectives and prompts.

### Data, products and governance

- [PRODUCT-MAP.md](PRODUCT-MAP.md) — story beat to Databricks product mapping.
- [DATA-DICTIONARY.md](DATA-DICTIONARY.md) — table and column-level data contract.
- [LAYER-MAP.md](LAYER-MAP.md) — Bronze, Silver and Gold products.
- [GENIE-ONTOLOGY.md](GENIE-ONTOLOGY.md) — ORLEN Mobility Domain, subdomains, Pages and semantic foundation.
- [ORLEN-MOBILITY-DOMAIN-STRUCTURE.md](ORLEN-MOBILITY-DOMAIN-STRUCTURE.md) — domain creation structure.
- [STRATEGY-ALIGNMENT.md](STRATEGY-ALIGNMENT.md) — connection to ORLEN Strategy 2035.

### Build, deployment and review

- [EXECUTION-PLAN.md](EXECUTION-PLAN.md) — ordered creation, deployment, rehearsal and teardown sequence.
- [CLI-FLOW.md](CLI-FLOW.md) — CLI fallback and deployment context.
- [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md) — local App setup and deployment policy.
- [APP-SPECIFICATION.md](APP-SPECIFICATION.md) — product and UI specification.
- [APP-UI-CONTRACT.md](APP-UI-CONTRACT.md) — customer-facing capability labels and interaction contract.
- [APP-BUILD-PLAN.md](APP-BUILD-PLAN.md) — incremental App implementation plan.
- [ALIGNMENT-REVIEW.md](ALIGNMENT-REVIEW.md) — storyline-to-presentation and presentation-to-demo review record.

### Databricks assets

- `resources/` — DAB resource definitions for pipelines and jobs.
- `src/notebooks/` — synthetic data, ML training and Metric View creation notebooks.
- `src/pipelines/` — Lakeflow transformations.
- `src/dashboards/` — AI/BI dashboard definition.
- `src/app/orlen-mobility-ops/` — React/Tailwind AppKit App and server routes.
- `integrations/genie/` — Genie configuration.
- `integrations/unity_gateway/` — Gateway service and policy specifications.
- `integrations/lakebase/` — Lakebase resource metadata.
- `resource-manifest.json` — deployed asset inventory and verification references.

## Handoff status

The local demo flow, presentation, App, governed measures, Genie foundation,
AI/BI dashboard, Unity Gateway recommendation boundary and Lakebase execution
ledger are prepared for delivery. The demo remains a synthetic historical
decision replay. Real production latency, future-failure model lift, live route
and capacity verification, Gateway tool enforcement, and attributable post-action
ORLEN outcomes are intentionally outside the current proof boundary.

### Current deployment

- Local App: `http://localhost:8000` — health and home-page smoke checks passed.
- Hosted Databricks App: [ORLEN Mobility Operations](https://orlen-mobility-ops-7474647896699216.aws.databricksapps.com)
- Hosted status: `RUNNING`; deployment status: `SUCCEEDED`.
- Hosted source path: `/Workspace/Users/mohammad.sahil@databricks.com/orlen-consumers-products-intelligence/apps/orlen-mobility-ops`
- The App service principal has the minimum additional table-level `SELECT` grants required by the Network and Investigate queries.
