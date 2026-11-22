# ORLEN Mobility Operations App — Specification

## Status

The React/Tailwind control tower is implemented and reviewed locally against refreshed workshop data. The hosted App remains on an earlier deployment until the customer-facing handoff.

Proposed Databricks App name: `orlen-mobility-ops`

Live App: [ORLEN Mobility Operations](https://orlen-mobility-ops-7474647896699216.aws.databricksapps.com) (authentication required).

Deployment record: App ID `71d32375-1af3-475c-ae56-d7119dbe1f12`; successful reset deployment `01f1e19b31a71e5bb8cde0fc56e38d85`; source path `/Workspace/Users/mohammad.sahil@databricks.com/orlen-consumers-products-intelligence/apps/orlen-mobility-ops`.

The local App implements the React/Tailwind control tower. Its selected Network priority card defines the current light-theme palette: red accent `#D1181D`, pale red surface `#FDE5E3`, white and neutral slate elsewhere. This supersedes the earlier ORLEN website color reference. The hosted App remains on its earlier deployment until a customer-facing handoff.

The incremental implementation sequence is documented in [APP-BUILD-PLAN.md](APP-BUILD-PLAN.md). Build the slices in order and keep the hero case persistent across every tab.

## 1. App purpose

The App is the human decision surface for the ORLEN Mobility hero scenario. It turns governed analytics and agent recommendations into an explainable, approval-controlled operational response.

It is not a replacement for the `ORLEN Mobility Control Tower` AI/BI dashboard:

- AI/BI provides broad network insight and business monitoring.
- Genie provides natural-language investigation.
- The App provides evidence review, response planning, human approval, and operational state.
- Lakebase stores the approved workflow state.
- Unity Gateway governs the boundary between investigation, recommendation, and commit.

The active local control tower uses the two red tokens in [APP-UI-CONTRACT.md](APP-UI-CONTRACT.md)
across all tabs. Semantic green, amber, and blue identify operational states. Public location
identity remains distinct from synthetic operational state.

## 2. Hero scenario

During a synthetic historical holiday-travel replay, demand rises on a major corridor. `SITE-00007` is classified as degraded: its modelled expected wait reaches 16.76 minutes, nine of ten chargers are ready in the latest telemetry, and one of ten latest-scored chargers has a high observed-degradation score. The 24 high-score rows are historical observations, not 24 distinct chargers or a future-failure forecast. ORLEN must decide how to protect the customer journey while preserving charging, convenience, and margin value.

The App lets an Operations Manager review the evidence and approve a bounded response:

1. inspect the affected charger;
2. route eligible customers to qualified alternative destinations;
3. prepare Stop Cafe and inventory capacity;
4. issue a bounded VITAY/customer communication action;
5. track the action and its measured outcome.

The scenario is synthetic and demonstrates platform behavior, not ORLEN performance claims.

The location context is intentionally concrete: `SITE-00007` is ORLEN Charge Hub
Elmshorn in Germany. `SITE-00015` is an Elmshorn East scenario candidate
about 7 km straight-line away, included to demonstrate a nearby screen pass without
claiming a real station or verified drive route. Nowy Dwór Gdański and Warsaw remain
cross-market benchmarks. The App reads location metadata from the governed
site-performance Metric View; event telemetry, transactions, forecasts, scores,
revenue and margin are deterministic workshop data.

## 3. Users and decisions

| User | Primary question | App responsibility |
|---|---|---|
| Regional Mobility Operations Manager | What should we do at the affected destination now? | Review evidence, adjust the response, approve or reject |
| European Retail Network Director | Is the proposed response worth the operational and commercial trade-off? | Review impact, alternatives, and approval history |
| Convenience Retail / VITAY Lead | How will the response affect customer and convenience value? | Review offer, Stop Cafe, inventory, and customer-impact elements |
| Data and AI Product Team | Can the decision be traced to governed data and model evidence? | Inspect source metrics, model signal, tool trace, and outcome |
| Governance Lead | Was the action within policy and approved by an accountable person? | Inspect identity, policy decision, approval, and audit state |

## 4. Demo promise

At the end of the App segment, the audience should see:

> A manager can move from a governed explanation of risk to a controlled operational decision, with evidence, human accountability, transactional state, and a path to measure the result.

## 5. Main UI feature and tab model

The App is one operational workspace, not five disconnected pages. The selected hero case
remains visible in a persistent case rail/header while the user moves through focused tabs.
Each tab answers one decision question and advances the same case from detection to outcome.

### Persistent case context — always visible

This is the connective tissue across the App:

- selected case: `CASE-SITE-00007` at ORLEN Charge Hub Elmshorn;
- current state: detected, diagnosed, classified, proposed, pending approval, approved, executed, or measured;
- severity, freshness, synthetic-data boundary, and execution identity;
- compact hero metrics: expected wait, charger-risk count, affected journeys, and value at risk;
- progress indicator: **Detect → Diagnose → Classify → Recommend → Approve → Act → Measure**.

The hero case is therefore not a separate tab. It is the persistent thread connecting every
tab and the story the facilitator follows throughout the demo.

### Tab 1 — Overview (default)

Decision question: **What is happening across the network, and where is value or risk emerging?**

The App opens on Overview. It summarizes the ORLEN Mobility value proposition, the three
business outcomes, and Databricks product labels on relevant widgets. It has no action buttons;
the facilitator selects the Network tab to begin the timed demo.

### Tab 2 — Network

Decision question: **Where should ORLEN act now?**

- light-themed Europe network map with named public ORLEN location context, rendered with MapLibre;
- filter bar for market/country, destination format, operating state, risk band, energy service,
  available facility and snapshot age;
- network KPIs for destinations, risk, charger availability, wait, demand, and inventory that
  recalculate for the selected decision surface;
- priority-destination queue ranked by a disclosed service/customer/margin/demand decision index;
- named alternative candidates screened for service, facility, charger power, available capacity,
  wait, demand and approximate distance, with missing local route proof shown honestly;
- clustered public-location map with risk, demand heat, capacity and wait layers, comparison
  links labelled as straight lines, and an accessible destination-table fallback;
- selected-destination intelligence for operations, demand pressure, inventory exposure, and the
  next Investigate decision;
- explicit city-level coordinate provenance and synthetic operational-data label.

This is the first decision tab and the entry point for the timed hero case.

### Tab 3 — Investigate

Decision question: **Why is the selected destination at risk, and what alternatives qualify?**

- governed site and charger-risk evidence;
- observed charger telemetry versus contemporaneous degradation classification, with no validated future horizon;
- customer segments, journey impact, energy mix, and convenience value at risk;
- Genie investigation with an `AI-generated — verify` notice and a link to the full space for source context, generated SQL, and execution identity;

Current local implementation: eight time-stamped hourly buckets from Silver charging operations,
latest classification per charger from the legacy ML prediction table, fixed-rule baseline comparison,
customer-segment and energy/retail Metric View tables, explicit modelled-data language, embedded
AppKit Genie chat, and a handoff to Response plan. The page links to the full Genie space for
source context and execution identity. Feature-attribution explanations remain a future increment.
Historical prediction counts are labelled as records,
not distinct chargers; revenue and margin are contextual measures, not attributed incident loss.

### Tab 4 — Response plan

Decision question: **What bounded response should ORLEN propose?**

- maintenance target and priority;
- eligible customer routing and alternative destinations;
- bounded VITAY/customer communication;
- Stop Cafe preparation and inventory task;
- conditional scenario projections for wait, protected journeys, and revenue; readiness tasks may remain unquantified.

The four scenario actions are selectable. The chosen action types are persisted in Lakebase when the proposal is submitted; the App cannot directly mutate analytical tables. Candidate routing still requires real address, drive route, and current-capacity verification.

### Tab 5 — Approval and execution

Decision question: **Is the response safe, authorized, and accountable to execute?**

- proposal and evidence summary;
- App API approval guard and denied direct-commit path; ORLEN-specific Unity Gateway tool enforcement is planned;
- recorded approver identity from a forwarded user header or explicit local-demo fallback, without claiming independent identity verification;
- submitted, approved, and scenario-executed states;
- Lakebase status, audit timestamps, approval trace ID, and action idempotency keys;
- a visible denied-commit-without-approval path.

### Tab 6 — Outcomes

Decision question: **What value could the response create, and what still needs measurement?**

- historical baseline wait and ready-charger count;
- recorded scenario wait reduction, protected journeys, and revenue protection from selected executed actions;
- explicit unmeasured charger recovery, actual diversion, convenience conversion, and attribution;
- next measurement steps through a post-action Lakeflow feed.

All current outcome figures are modelled scenario estimates in Lakebase, even when the case status is `measured`. A measured return through Lakeflow and dashboard refresh is a follow-on increment. The current App never presents scenario effects as observed ORLEN performance.

The current action workflow is scoped to `SITE-00007`. A comparison site remains selected in Investigate, while Response plan, Approval, and Outcomes are disabled until the user returns to Elmshorn.

## 6. Databricks product mapping

| App capability | Databricks product | App proof |
|---|---|---|
| Governed evidence | Unity Catalog + four Metric Views | Source name, metric definition, and freshness shown beside each KPI |
| Natural-language investigation | `ORLEN Mobility Decision Intelligence` Genie Agent | The App embeds chat; the full Genie space exposes source context, generated SQL, and execution identity |
| Action boundary | App API + Lakebase | Proposal state, approval trace, audit events, and 403 denied direct commit are visible; Unity Gateway tool enforcement is planned |
| Custom decision workflow | Databricks Apps / AppKit | Evidence review, editable proposal, approval, and status transitions |
| Operational state | Lakebase | Proposal, approval, action status, owner, timestamp, and idempotency key |
| Analytical processing | Lakeflow | Historical event transformation is demonstrated; measured post-action return is planned |
| Observed-degradation classification | MLflow + Unity Catalog model | Model version, alias, latest per-charger score, fixed-rule baseline, and feature lineage; no future horizon |
| Business monitoring | AI/BI dashboard | Network and outcome pages link back to the App decision |

## 7. Data access and storage decision

The App needs both access patterns:

| Need | Pattern | Reason |
|---|---|---|
| KPI, chart, table, and governed Metric View reads | AppKit Analytics / SQL warehouse | The App performs aggregation, filtering, and governed semantic reads |
| Proposal, approval, workflow, and action state | Lakebase through server routes | The App needs transactional writes, low-latency status, and auditability |

Lakebase stores operational state only. It must not become a second analytical warehouse.

## 8. Lakebase operational contract

Proposed tables in a dedicated workshop schema:

- `mobility_ops_response_cases`
- `mobility_ops_response_actions`
- `mobility_ops_approvals`
- `mobility_ops_action_events`

Minimum fields:

- `case_id`, `proposal_id`, `site_id`, `status`;
- `action_type`, `target_id`, `parameters_json`;
- `created_by`, `approved_by`, `created_at`, `approved_at`, `expires_at`;
- `idempotency_key`, `policy_decision`, `trace_id`;
- `expected_impact_json`, `realized_impact_json`.

## 9. Security and approval rules

- The App must identify the signed-in user.
- The App must show whether analytics ran as the user or App service principal.
- No App or agent path may write directly to Bronze, Silver, Gold, or Metric View objects.
- A commit requires a valid, non-expired approval ID.
- A proposal without a known site, action type, or bounded scope is rejected.
- The App must demonstrate one denied direct-write attempt and one denied commit without approval.
- Every commit is idempotent and traceable to a Gateway policy decision.

## 10. App demo choreography — 15 minutes inside the 60-minute demo

| Time | Action | Audience takeaway |
|---:|---|---|
| 0–2 | Open the response case from the Control Tower | The App is the action surface, not another dashboard |
| 2–5 | Review SITE-00007 evidence and ask Genie for explanation | Natural language is grounded in governed metrics |
| 5–8 | Inspect the proposed maintenance, routing, VITAY, Stop Cafe, and inventory actions | One response coordinates multiple business outcomes |
| 8–10 | Change one proposal assumption | A human remains in control of the decision |
| 10–12 | Show Unity Gateway policy check and denied unapproved commit | Agentic automation is bounded and governed |
| 12–14 | Approve the response and show Lakebase state transition | Approval becomes an operational transaction |
| 14–15 | Return to the outcome dashboard | The action can be measured and improved |

## 11. Required App states

Every data surface must support:

- loading state with a skeleton;
- empty state with a useful next action;
- query/API error with recovery guidance;
- stale or partial state with freshness and source warning;
- pending approval;
- approved, rejected, expired, and completed action states;
- denied policy action with a reason that is safe to show.

## 12. UI implementation direction

Genre: **analytic operational workspace** with Overview as the default tab and Network as the first decision tab,
persistent hero-case context, and four additional decision tabs. The App is an action surface, not a replacement for the
AI/BI dashboard.

Use AppKit primitives and confirm exact APIs during implementation:

- `Card` composition for KPI/evidence blocks;
- `Badge` for state, severity, and freshness;
- `Tabs` for Evidence, Response Plan, Approval, and Outcome;
- `Table` for alternative destinations and action history;
- `Button` for inspect, propose, approve, reject, and refresh actions;
- `Alert` for policy denial, stale data, and errors;
- `Skeleton` for loading;
- `Empty` for no case or no outcome;
- `BarChart` / `LineChart` for comparable value and before/after measures;
- custom SVG Europe map inside a `Card`; show city-level public reference positions and do not imply verified station GPS until coordinates are sourced;
- `useAnalyticsQuery` or the governed Metric View hook for reads;
- `useGenieChat` or the AppKit Genie surface for natural-language investigation.

Semantic colors must use AppKit tokens: success for approved/completed, warning for review/stale, destructive for degraded/denied, and primary for active navigation. Never use color without a text or icon label.

In the local App, show a persistent `AI-generated — verify` notice and direct the audience to the full Genie space to inspect generated SQL, source context, and execution identity. In-page answer-level trust details remain an implementation gap.

## 13. Non-goals for the first build

- No direct integration with real ORLEN operational systems;
- no automatic maintenance dispatch;
- no automatic pricing or promotion changes;
- no unrestricted natural-language SQL execution;
- no customer PII;
- no production Lakebase branch;
- no claim that synthetic outcome targets represent ORLEN performance.

## 14. Build gates

Before scaffolding the App, confirm:

1. reuse or creation of the dedicated Lakebase project/branch/database;
2. App service principal ownership of the operational schema;
3. analytics versus Lakebase access configuration;
4. exact AppKit plugin/resource parameters;
5. Genie Agent access and execution identity;
6. Unity Gateway backend/connection for the live proposal or commit boundary;
7. participant access, reset, expiry, and cleanup.
