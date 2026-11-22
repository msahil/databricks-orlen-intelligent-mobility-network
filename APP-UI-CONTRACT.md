# ORLEN Mobility App — UI contract

Canonical storyline: [STORYLINE.md](STORYLINE.md)

Build plan: [APP-BUILD-PLAN.md](APP-BUILD-PLAN.md)

Demo flow: [DATABRICKS-DEMO-FLOW.md](DATABRICKS-DEMO-FLOW.md)

## Purpose

The App is an operational decision workspace for the ORLEN Mobility hero scenario. Every
meaningful surface must show the Databricks capability powering it. Capability attribution is
audience-facing UI, not only facilitator documentation.

## Product vision

This App is designed as ORLEN’s future multi-energy destination control tower: an
anticipatory decision workspace that combines live network signals, explainable ML,
natural-language investigation, governed agent assistance, human approval, operational
write-back, and closed-loop commercial outcomes. The current workshop implementation is an
incremental proof of that vision; workspace availability must not reduce the target
experience. Every future surface should distinguish live, modelled, simulated, fallback, and
planned behavior without weakening the customer-facing design.

## Visual direction

Keep the verified ORLEN logo as the identity anchor. The selected Network priority card is the
single reference for red across the App:

Use **`#D1181D` for red accents** and **`#FDE5E3` for pale red surfaces**, with white and neutral
slate for the rest of the interface. The selected card uses the pale surface, red border, red
number badge, and red wait value. Apply those same two red tokens to navigation, buttons,
headings, hero surfaces, alerts, map risk markers, and charts. Do not introduce additional red
hues or tints. Semantic green, amber, and blue remain reserved for
operational meaning rather than decoration. Use neutral shadows.

## Navigation

The App opens on Overview and follows five decision tabs with persistent hero context:

| Tab | Decision question |
|---|---|
| Overview | What is happening across the network, and where is value or risk emerging? |
| Network | Where should ORLEN act now? |
| Investigate | Why is the selected destination at risk? |
| Response plan | What bounded response should ORLEN propose? |
| Approval & execution | Is the response safe and authorized? |
| Outcomes | Did the response improve customer and ORLEN value? |

The Approval & execution tab leads with a full-width **Execution ledger**. It shows each selected action before approval and, after a simulated run, its action ID, Lakebase audit row, execution timestamp, and approval reference. The case timeline remains a compact summary. The ledger labels scenario effects separately from missing post-action observations.

The Outcomes tab follows with an action-to-outcome evidence panel backed by the current-cycle Lakebase audit. It shows the number of selected actions with execution links, each action's audit row, and the specific later source needed to measure its effect. Until an action-linked observation feed is connected, the panel states that customer and commercial impact remains unmeasured. The baseline and scenario scorecard remains explicitly modelled.

Overview is the default tab and has no opening-action buttons. The facilitator selects Network
manually to start the timed demo. The hero case is not a separate tab. `CASE-SITE-00007 — ORLEN Charge Hub Elmshorn` remains
selected across the golden path with Detect → Diagnose → Predict → Recommend → Approve → Act →
Measure progress.

The Network tab uses MapLibre GL JS with a replaceable OpenFreeMap Positron vector style, governed
`network_overview` and journey Metric View measures, conformed Silver destination profiles,
filters, clustered public-location markers, four map signal layers, network KPIs and an
explainable decision queue. The public style endpoint is a workshop dependency; production
deployments must substitute an approved customer-owned style and tile provider. Only publicly
named sites have approximate city-centre points; `SITE-00015` is a separate, explicitly labelled
scenario-defined Elmshorn-area waypoint about 7 km from the Elmshorn map reference. Other synthetic
reference sites remain in the table.

The Network decision surface must include:

- market/country, destination format, operating state, risk, energy service, available facility,
  and snapshot-age filters backed by the workshop data;
- KPIs recalculated for the filtered population;
- risk, demand heat, capacity and wait map layers, location clustering, optional comparison links,
  and a usable table fallback if map tiles fail;
- each map layer has an audience-visible definition, threshold legend, filtered-network summary,
  and marker value: Risk is the disclosed scenario decision index; Demand is synthetic traffic
  demand relative to baseline; Capacity is ready EV chargers in the modelled snapshot; Wait is
  modelled minutes before charging. Cluster colors follow the active measure. Risk clusters show
  destination count, Demand clusters average demand, Capacity clusters total ready chargers, and
  Wait clusters average expected minutes;
- the MapLibre map fills the height of its card beside destination intelligence, while retaining a
  500px minimum when the layout stacks; the map resizes with its container;
- a queue ranked by a disclosed 0–100 scenario decision index: service state (35), affected
  journeys (30), modelled margin exposure (25), and demand (10); this is not an ML prediction;
- selected-destination intelligence for operating state, charger availability, wait, demand,
  facilities, energy services, affected segments, margin exposure proxy and the next Investigate decision;
- alternative screening for required service/facility, EV power, capacity, wait, demand, and
  city-centre distance. Nearby screen passes remain unverified until drive route and current
  capacity are checked. Distant sites are labelled network benchmarks, not diversion options;
  service mismatches are explicit, and hydrogen-first formats are excluded from EV comparison
  until their EV service is verified. The synthetic Elmshorn East site leads the EV comparison
  when Elmshorn is selected, and its scenario provenance remains visible;
- a network intelligence strip for demand, inventory, customer/margin exposure, energy mix,
  risk distribution and action queue size.

The Investigate decision surface is an evidence workbench for the selected destination. It
shows the latest site snapshot, eight chronological hourly telemetry buckets with event and ingestion
times, the latest observed-degradation score per charger against its fixed-rule baseline, journey exposure by
customer segment, and energy/convenience revenue context. The charger score card shows the selected
destination name and the shared `site_id` used to link the score to that destination; the ID
suffix is only an asset identifier. Historical high-score records must never be described
as distinct chargers. Revenue and journey margin context must never be
described as incident loss without an explicit attributable-loss calculation. Missing query data
remains missing; never substitute scenario constants. An embedded AppKit Genie chat asks the
configured ORLEN Mobility Decision Intelligence space, with a link to the full Genie view for
source context and execution identity. Response plan, Approval, and Outcomes belong to the
Elmshorn hero case; selecting a comparison destination disables those tabs and offers a return
to Elmshorn. Comparison destinations remain read-only; the action workflow is scoped to the
Elmshorn hero case.
Selecting a different destination clears the prior Genie conversation URL so a new investigation
cannot silently inherit an answer about the previous site.
When observation and scoring timestamps are far apart, show a historical-replay notice rather
than suggesting a live, simultaneous incident.

The local App reads the Silver destination profile using the authenticated workshop user. Before
a hosted App release, grant its service principal least-privilege `SELECT` on
`mobility_silver_sites_and_facilities` or expose the same profile through a governed Metric View.

## Visible Databricks product labels

The home page does not show a standalone capability grid. Instead, each
meaningful business widget carries compact product labels for the Databricks
capabilities that power that decision. A deeper capability legend may be used
on a dedicated product or architecture view, but must not dominate the
customer-facing landing page. Use these statuses honestly wherever status is
shown:

| Capability shown in UI | App proof |
|---|---|
| Databricks Apps / AppKit | The custom React/Tailwind decision workspace and App URL |
| Unity Catalog | Governed catalog/schema/asset boundary and least-privilege access |
| Lakeflow | Workshop ingestion, streaming/state refresh, and outcome return path |
| Metric Views | Governed site, journey, energy/retail, and charger-risk measures |
| AI/BI | ORLEN Mobility Control Tower monitoring and outcome dashboard |
| MLflow + ML | Charger-failure model, version, alias, confidence, and baseline |
| Genie | ORLEN Mobility Decision Intelligence questions and grounded answers |
| Lakebase | Response case, proposal, approval, action status, and audit state |
| Unity Gateway | Bounded recommendation and actual `pre_call` policy denial in the local Response plan; tool/commit enforcement remains future work |

Capability badges in the ORLEN App show product names only, without status suffixes
such as “active” or “planned”. Where a capability's scope matters, explain it in
the surrounding business copy: Gateway governs recommendations, while the App
and Lakebase govern approval and execution. Fallback and unavailable states
remain explicit in the relevant widget when they occur.

## UI trust requirements

- Every KPI shows unit, period, freshness, and source.
- Synthetic/modelled measures are visibly labelled and never presented as ORLEN actuals.
- Historical, classified, planned, simulated, and actually measured values use explicit text labels as well as semantic color; never label the current scenario impact realized.
- Genie answers show generated SQL, source attachments, execution identity, and `AI-generated — verify`.
- Agent actions show tool scope, policy result, approval identity, trace ID, and idempotency key.
- Every data surface handles loading, empty, error, and stale/partial states.
