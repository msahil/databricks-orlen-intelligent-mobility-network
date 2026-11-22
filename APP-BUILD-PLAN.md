# ORLEN Mobility App — Incremental Build Plan

Canonical specification: [APP-SPECIFICATION.md](APP-SPECIFICATION.md)

UI contract: [APP-UI-CONTRACT.md](APP-UI-CONTRACT.md)

Demo flow: [DATABRICKS-DEMO-FLOW.md](DATABRICKS-DEMO-FLOW.md)

## Objective

Build the ORLEN Mobility App as a sequence of small, demonstrable vertical slices.
Each slice must run independently, preserve the hero-case thread, and be validated before
the next slice is started. The local control-tower experience is implemented; the hosted App
awaits an accepted deployment.

## Product contract

The App is one operational workspace that opens on Overview and then follows a five-tab decision journey:

1. Overview (default; no opening-action buttons)
2. Network (first timed demo tab)
3. Investigate
4. Response plan
5. Approval and execution
6. Outcomes

The hero case remains persistent across all tabs:

`CASE-SITE-00007 — ORLEN Charge Hub Elmshorn`

Its progress state is:

**Detect → Diagnose → Predict → Recommend → Approve → Act → Measure**

## Build sequence

### Slice 0 — Foundation and visual system

Purpose: establish the stable React/Tailwind base before adding business behavior.

Build:

- the selected Network card palette: `#D1181D` red accent, `#FDE5E3` pale red surface, neutral white/slate, and semantic status colors;
- responsive App shell and page container;
- ORLEN logo, typography, spacing, borders, focus states, and responsive breakpoints;
- shared Card, Badge, Button, Alert, Skeleton, Empty, and status components;
- audience-visible Databricks capability rail/legend with honest Active, Connected, Planned,
  Fallback, or Unavailable status labels;
- error boundary and global loading/error conventions;
- explicit synthetic-data and freshness labels.

Databricks scope: retain AppKit plugin wiring, deployment configuration, Analytics, Genie,
and Lakebase integration points without exposing unfinished capabilities.

Acceptance criteria:

- foundation renders in the deployed App;
- no dark-mode dependency remains;
- keyboard focus and narrow-screen layout work;
- loading, empty, error, and stale states have one consistent visual treatment;
- no business-specific control-tower logic is required to render the shell.

Demo proof: introduce the application as the ORLEN decision workspace.

### Slice 1 — Persistent hero-case context

Purpose: make the hero scenario the thread connecting every future tab.

Build:

- persistent case header or case rail;
- case ID, site, state, severity, freshness, and synthetic-data boundary;
- compact hero metrics: expected wait, charger-risk count, affected journeys, and value at risk;
- Detect → Measure progress indicator;
- selected-case state shared across tabs and browser refreshes where appropriate.

Databricks scope: read the seeded Lakebase case state and governed Metric View evidence.

Acceptance criteria:

- `CASE-SITE-00007` is visible on every tab;
- case state can advance without losing the selected site;
- every metric has a unit, source, period/freshness, and synthetic/observed label;
- a missing case produces a useful Empty state rather than a blank screen.

Demo proof: establish one affected Elmshorn case that the audience will follow end to end.

### Slice 2 — Network tab and interactive map

Purpose: provide the network landing experience and the geographic starting point.

Build:

- MapLibre GL JS map integrated into React;
- vector basemap with ORLEN-styled layers;
- ORLEN location markers and clustering;
- selected-site state synchronized with the hero context;
- status, fuel type, facility, and risk filters;
- hover/selected-site detail panel;
- alternative-destination queue beside the map;
- map/table accessible fallback;
- explicit city-level public-location provenance.

Optional analytical layers for the first map increment:

- charger-risk markers;
- demand/traffic heatmap;
- route or corridor overlay;
- capacity and expected-wait coloring.

Recommended map stack: MapLibre GL JS, `react-map-gl/maplibre`, deck.gl for analytical
overlays, Turf.js for geospatial calculations, and Supercluster for high-volume points.
Basemap source must be selected and tested for Databricks App network access before build.

Databricks scope: governed site-performance and network-overview queries through Analytics
and Metric Views.

Acceptance criteria:

- pan, zoom, hover, select, filter, and reset all work;
- selecting Elmshorn updates the persistent hero case;
- selecting an alternative from the queue focuses it on the map;
- map markers distinguish public location context from synthetic measures;
- the app remains usable if map tiles or location data fail;
- no unverified station GPS is presented as operational truth.

Demo proof: show where ORLEN should act and which alternative destinations can absorb demand.

Implementation review (2026-11-20): the local App now provides seven filters, a clean vector
basemap, city-level clusters, risk/demand/capacity/wait layers, comparison links, a disclosed
0–100 decision index, destination intelligence, screened named alternatives, and a complete
table fallback. A clearly scenario-defined Elmshorn East waypoint now passes nearby scenario screening
at about 7 km straight-line, while a real station address and drive route remain unverified.
Hosted handoff still needs least-privilege App service-principal access
to the Silver destination profile and an approved basemap provider.

### Slice 3 — Investigate tab and evidence

Purpose: explain why the selected site is at risk using governed evidence.

Build:

- observed versus predicted evidence cards;
- charger-risk and site-performance sections;
- journey, customer-segment, energy, and convenience impact;
- alternative-destination comparison table;
- source, freshness, and metric-definition references;
- links back to the AI/BI dashboard where appropriate.

Databricks scope: Unity Catalog, governed Metric Views, Analytics, MLflow model metadata,
and the four approved App query surfaces.

Acceptance criteria:

- evidence is traceable to a governed source;
- observed and predicted values cannot be confused;
- all data surfaces support loading, empty, error, and stale states;
- large comparisons use server-side query/filter behavior;
- the hero case remains selected while evidence changes.

Demo proof: explain the Elmshorn trigger and compare qualified alternatives.

Implementation review (2026-11-20): the local Investigate tab reads the eight most recent
hourly Silver telemetry buckets, latest ML score per charger, four governed Metric View
queries, and a customer-segment/energy-retail breakdown. It distinguishes historical
prediction records from distinct chargers, and visibly flags the 126-day gap between the
latest displayed event and latest model score in the current replay. The Network tab owns
alternative screening. A contemporaneous event/score replay and feature attribution remain
open before claiming live causal diagnosis.

### Slice 4 — Genie investigation surface

Purpose: make the evidence queryable in natural language without hiding how answers were produced.

Build:

- question suggestions tied to the hero case;
- streaming response state;
- answer, generated SQL, source attachments, and execution identity;
- persistent `AI-generated — verify` notice;
- empty, ambiguous, denied, and error responses;
- link from an answer to the relevant evidence or response-plan field.

Databricks scope: `ORLEN Mobility Decision Intelligence` Genie Agent, governed Metric Views,
Unity Catalog permissions, and AppKit Genie integration.

Acceptance criteria:

- five benchmark questions work against the approved sources;
- no answer is shown without source/execution context;
- the App discloses whether execution is user-scoped or service-principal-scoped;
- ambiguous questions prompt for clarification;
- Genie cannot directly mutate analytical tables.

Demo proof: ask why the site is at risk and which alternatives qualify.

Implementation review (2026-11-20): embedded AppKit Genie chat streamed a response for the
exact-measure prompt `Expected Wait Minutes` plus `High Risk Predictions` and exposed generated
SQL. An ambiguous test question about “at-risk chargers” incorrectly used the `At Risk Sites`
measure; the UI now states the measure distinction and suggests the tested exact-measure
prompt. Full source and execution-identity inspection remains linked to the Genie space.

### Slice 5 — Response plan

Purpose: convert evidence into a bounded, editable operational proposal.

Build:

- maintenance action editor;
- customer-routing editor;
- VITAY/customer communication editor;
- Stop Cafe preparation and inventory task editors;
- expected-impact summary;
- assumptions/change history;
- submit-for-approval action.

Databricks scope: AppKit form state, governed reads, optional model/impact calculation,
and Lakebase proposal persistence.

Acceptance criteria:

- proposals require a known site, bounded action type, and valid scope;
- changing one assumption visibly updates expected impact or marks it stale;
- no proposal writes to Bronze, Silver, Gold, or Metric View objects;
- proposal creation is idempotent;
- draft, submitted, and invalid states are clear.

Demo proof: coordinate one response across maintenance, routing, VITAY, Stop Cafe, and inventory.

### Slice 6 — Approval and execution

Purpose: demonstrate human accountability and governed agentic action.

Build:

- proposal summary and evidence references;
- Unity Gateway policy-check panel;
- tool scope and policy result;
- approver identity and approval/rejection controls;
- visible denied commit without approval;
- Lakebase action timeline and status transitions;
- idempotency and trace identifiers.

Databricks scope: Unity Gateway boundary, Databricks App server routes, Lakebase,
authenticated user identity, and policy/trace metadata.

Acceptance criteria:

- an unapproved commit is denied with a safe explanation;
- approval requires an authenticated accountable user;
- approval is non-expired and idempotent;
- repeated commit requests do not duplicate actions;
- direct analytical writes are impossible from the action path;
- unavailable Gateway backend has a clearly labelled governed fallback.

Demo proof: show bounded agentic automation with a human approval gate.

### Slice 7 — Outcomes and closed loop

Purpose: measure whether the action improved the customer journey and ORLEN value.

Build:

- action status and realized outcome timeline;
- before/after wait and charger availability;
- completed journeys and customer-impact measures;
- Stop Cafe, convenience, revenue, and margin proxy measures;
- predicted-versus-realized comparison;
- retain, tune, or rollback recommendation;
- link to refreshed AI/BI outcome monitoring.

Databricks scope: Lakebase action state, Lakeflow return path, Gold outcome products,
Metric Views, and AI/BI dashboard.

Acceptance criteria:

- modeled/synthetic outcome values are labelled honestly;
- missing realized outcomes are shown as pending, not zero;
- outcome freshness and source are visible;
- outcome state is traceable to the approved action;
- the App can return to the same hero case after measurement.

Demo proof: close the loop from action to measurable journey and commercial outcome.

### Slice 8 — Demo hardening and rehearsal

Purpose: make the complete experience reliable in a live workshop.

Build:

- deterministic seed/reset action;
- empty, degraded, denied, and offline fallback paths;
- participant access and execution-identity verification;
- map tile/data fallback;
- seeded pending-approval hero case;
- facilitator-visible timing and recovery cues;
- end-to-end runbook and screenshots.

Acceptance criteria:

- the 15-minute App segment can be completed without manual database edits;
- the full 60-minute workshop flow remains aligned with the presentation;
- reset restores the hero case and removes prior operational state;
- every capability has a visible proof and a recovery path;
- no synthetic measure is presented as ORLEN production performance.

## Working rules for each slice

1. Implement one slice at a time and keep the previous slice working.
2. Validate with `databricks apps validate --profile fevm-msahil-demo-workspace` before deployment.
3. Deploy before live verification; do not run the deployed App locally first.
4. Capture the slice’s demo proof and limitations in the facilitator runbook.
5. Update `APP-SPECIFICATION.md`, `DATABRICKS-DEMO-FLOW.md`, and the resource manifest when a product boundary or demo beat changes.
6. Do not add a new tab unless it answers a distinct business decision question.

## Recommended implementation order

Build in this order:

**0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8**

The first practical build increment should be **Slice 0 plus Slice 1**. This gives us a
credible ORLEN-branded shell and a persistent hero-case context before introducing the
interactive map or any complex workflow behavior.
