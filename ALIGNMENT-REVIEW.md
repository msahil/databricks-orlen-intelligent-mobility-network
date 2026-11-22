# Storyline alignment review

## 2026-11-22 backlog disposition

The user dropped the broader workshop proof-gap tasks from the active backlog. The documented gaps remain historical context for this workshop and do not block the published presentation.

## 2026-11-22 closing-slide visual review

Slides 13–15 were rendered and inspected at full-slide size. The modelled KPI row, outcome evidence frame, six pilot cards, and four demo-proof cards have consistent edges, spacing, and footer clearance. No additional deck edits were required.

## 2026-11-22 visual layout review

The individual slide layout pass corrected peer sizing, content baselines, panel edges, evidence framing, and caption clearance in the local deck.

| Area | Slides | Result |
|---|---:|---|
| Strategy target tiles | 2 | Equal number and label spacing across all four tiles. |
| Destination comparison | 3 | Energy, ORLEN destination, and Journey & retail panels now align vertically. |
| Value cards | 5–6 | Oversized cards were reduced and customer/ORLEN panels share their edges. |
| Contribution model | 7 | Formula rows use a consistent grid and align with the Finance validation panel. |
| Scale gates | 8 | All four gates use fixed internal rows for number, title, test, and evidence. |
| Elmshorn evidence | 9 | Map and KPI group share height. The source line has clear space below the evidence group. |
| Product proof | 10–12 | Product cards, recommendation evidence, and action ledger use consistent framing and readable image sizing. |
| Pilot and close | 14–15 | Pilot cards are vertically balanced and the four proof cards use shared internal rows. |

`node scripts/check-layout.mjs orlen-intelligent-mobility-network` passed all 15 pages. Rendered pages 2, 5, 6, 7, 8, 9, 10, 11, and 12 were inspected at full-slide size. The renamed deck was later updated in the existing private Google Slides presentation on 2026-11-22.

## 2026-11-21 comprehensive presentation review (current)

Reviewed the 15-page Git deck, its speaker notes, `STORYLINE.md`, `PRESENTATION-FLOW.md`, `DATABRICKS-DEMO-FLOW.md`, and `FACILITATOR-RUNBOOK.md` for message, completeness, and handoff. The deck remains an executive business case with a flexible presentation duration followed by the existing 60-minute demo.

| Slide | Message and content check | Result |
|---:|---|---|
| 1 | ORLEN logo and destination decision establish the executive question without implying measured benefits. | PASS |
| 2 | Four Strategy 2035 figures are visibly labelled targets and sourced to ORLEN. | PASS |
| 3 | The public, format-dependent service mix now names HVO100 on the visual alongside petrol, diesel, LPG, EV, and hydrogen. | PASS after correction |
| 4 | Elmshorn's demand → charger condition → customer → retail chain is an explicit hypothesis with four bounded actions. | PASS |
| 5 | Four value-leakage mechanisms lead into the customer and ORLEN value model without counting a visit twice. | PASS |
| 6 | Customer reliability and ORLEN contribution are presented as outcome categories requiring validation. | PASS |
| 7 | Energy, convenience, and attributable retention contribution are separated from response and platform costs; the €4.8k scenario is excluded from ROI. | PASS |
| 8 | Site → cohort → region → network shows an evidence gate before scale. Its placement before the detailed Elmshorn case works as an investment test, though the presenter must use slide 9 to make it concrete. | PASS |
| 9 | Elmshorn KPIs now distinguish one of ten latest high-condition chargers. The synthetic Elmshorn East candidate, unverified address, route, and current capacity are explicit. Notes separate 446 affected scenario journeys from 38 modelled protected journeys later. | PASS after correction |
| 10 | Lakeflow, Unity Catalog/Genie Ontology, Metric Views, and AI/BI have distinct business roles; production streaming latency is not claimed. | PASS |
| 11 | MLflow observed-condition classification, Genie, and Unity Gateway recommendation policy are separated. The App evidence crop is larger and readable in the local render. | PASS after correction |
| 12 | One human approval and four simulated action audit links are visible; Gateway recommendation policy is separate from App/Lakebase execution control. | PASS |
| 13 | The headline now says simulated actions are traced and impact is unmeasured; all three scenario values are labelled modelled. | PASS after correction |
| 14 | Six pilot-contract elements give Finance, Mobility, and Retail a bounded decision without inventing duration, threshold, or return. | PASS |
| 15 | Four proof questions hand off to Overview → Network → a brief AI/BI Control Tower view → Investigate → Response plan → Approval & execution → Outcomes. | PASS after demo-flow correction |

**Step 1 — storyline → presentation: PASS.** The promise, audience, hero decision, two-sided value, business case, governance boundary, and pilot ask are consistent. The deck uses sourced strategy targets and clearly marks the operational data as synthetic or modelled.

**Step 2 — presentation → demo: PASS WITH PROOF GAPS.** The timed Network beat and runbook now explicitly include the brief AI/BI dashboard stop promised by slides 10 and 15. The App route, Gateway recommendation allow/deny, separate human approval, Lakebase action trace, and outcome evidence boundary match the slides. This review did not execute a live dashboard handoff. Real route/capacity verification, production latency, future-failure prediction, Gateway tool enforcement, action-linked post-event observations, and attributable ORLEN outcomes remain outside the demonstrated proof.

**Local verification:** `node scripts/check-layout.mjs orlen-intelligent-mobility-network` passed all 15 pages after the final deck edit. Revised slides 3, 11, and 15 were rendered and inspected locally. The existing private Google Slides presentation was updated after this review.

- **Deck refinement, 2026-11-21:** Step 1, storyline → presentation: **PASS** after expanding the Elmshorn decision window, contribution model, scale ladder and pilot charter without adding realized-benefit claims. Step 2, presentation → demo: **PASS WITH PROOF GAPS** after specifying the Databricks product-to-business spine and the four proof questions along the actual App route. Titles and subtitles are left-aligned. All 15 pages passed the layout check and production build; the existing private Google Slides presentation was updated in place. The missing post-action observation and attribution proof remains explicit.

- **Deck build review, 2026-11-21:** The existing ORLEN deck now has 15 pages aligned one-for-one with `PRESENTATION-FLOW.md`. Step 1, storyline → presentation: **PASS** for Strategy 2035 targets, the multi-energy destination hypothesis, customer and ORLEN value, contribution drivers, Elmshorn hero decision, governed decision loop, and the pilot scale gate. Step 2, presentation → demo: **PASS WITH PROOF GAPS** for Network, Investigate, Gateway recommendation, App/Lakebase approval, and Outcomes. The slides use fresh current App captures for the map, Investigate evidence, four-action ledger, and action-to-outcome evidence. They label the historical replay and deterministic effects as synthetic/modelled, and identify missing post-action observations. The deck makes no future-failure, production latency, Gateway action-enforcement, or realized ORLEN-benefit claim. `check-layout.mjs` passed all 15 pages. Local preview is available; publication awaits user review.

- Review date: 2026-11-21 (executive business-case presentation flow added)
- Alignment status: PASS WITH WARNINGS
- Technical readiness: The local four-action proposal, approval, simulated execution, and current-cycle audit passed; `CASE-SITE-00007` currently remains `measured` for review. The local Response plan calls the ORLEN Unity Gateway service, with a safe response and a named `pre_call` denial. The fixed App 403 commit guard remains separate from Gateway. Future-failure prediction, production real-time latency, a verified customer diversion, observed post-action impact, Gateway tool enforcement, and hosted App parity remain unproven. The Gateway boundary is documented in `integrations/unity_gateway/ORLEN-RECOMMENDATION-GATEWAY-SPEC.md`.
- Canonical storyline: [STORYLINE.md](STORYLINE.md)
- Presentation flow: [PRESENTATION-FLOW.md](PRESENTATION-FLOW.md)
- Demo flow: [DATABRICKS-DEMO-FLOW.md](DATABRICKS-DEMO-FLOW.md)
- Supporting files: [PRODUCT-MAP.md](PRODUCT-MAP.md), [FACILITATOR-RUNBOOK.md](FACILITATOR-RUNBOOK.md)

## 2026-11-21 executive business-case flow

1. **Storyline → presentation: PASS.** The storyline now states the executive business problem, contribution drivers, pilot decision, and flexible presentation duration. The 15-slide flow leads with sourced Strategy 2035 targets, customer and ORLEN economics, and the Elmshorn decision; it places Databricks products in the final act. Strategy targets are labelled as targets, and demo figures as synthetic scenario estimates.
2. **Presentation → demo: PASS WITH PROOF GAPS.** The presentation's four proof questions map to the existing 60-minute demo: governed network context, observed-condition diagnosis, Gateway recommendation with separate App/Lakebase approval, and an action audit with an explicit outcome-measurement gap. The deck source has not yet been rewritten; its older live prediction and measured-outcome claims must be corrected before customer use. The old 0–60 presentation and 60–120 demo timing rows below are historical reviews, superseded by the flexible executive presentation and demo-relative 0–60 runbook.

### Visual mapping check

1. **Storyline → presentation: PASS.** Strategy targets, the multi-energy destination, customer and ORLEN value drivers, contribution equation, Elmshorn decision, and evidence ladder each have a distinct visual in the presentation flow. Labels keep sourced targets, synthetic replay, modelled scenario values, and missing observations separate.
2. **Presentation → demo: PASS FOR THE PLAN.** Slides 9–13 specify fresh, legible crops from Network, Investigate, Response plan, Approval & execution, and Outcomes. Historical validation screenshots with a 60-minute failure forecast or three-action plan are explicitly excluded. Fresh captures and deck rendering remain to be done; no claim of completed slide visuals is made.

The 2026-11-21 live demo cycle completed after the ledger implementation: the local App API approved the four-action proposal, returned four action audit rows and one case summary row, and linked each action to the same approval and execution IDs. The case remains `measured` for user review. This strengthens the local execution proof; post-action observation and hosted App parity remain open.

The 2026-11-21 outcome review confirms that the demo's post-action values are projections. Both Gold outcome tables and action-linked post-execution source events are absent. The storyline, presentation, and demo flow already label the values as modelled; observed ORLEN benefit remains a blocking future proof point.

## 2026-11-21 outcome evidence display

1. **Storyline → presentation: PASS.** The storyline calls the value figures modelled and the Lakeflow return future work; the presentation now previews both the action audit proof and the missing measurement evidence.
2. **Presentation → demo: PASS for the local implementation.** Outcomes now reads current-cycle Lakebase action audit rows and names the later charger, journey, inventory, and VITAY sources needed to evaluate each action. The demo flow and runbook show this evidence panel before the scenario scorecard. TypeScript and changed-file lint passed. No post-action source table or real ORLEN result was added; user-directed visual review remains open.

## 2026-11-21 per-action execution increment

1. **Storyline → presentation: PASS.** Both describe manager approval, a distinct App/Lakebase execution boundary, and an audit record per selected action without implying that scenario effects are observed outcomes.
2. **Presentation → demo: PASS for the local implementation.** The Approval & execution tab now leads with a full-width action ledger. A rollback-only Lakebase transaction first verified four action-linked rows plus one case summary row; `EXPLAIN`, TypeScript, and changed-file lint passed. A subsequent approved live demo cycle returned four action-linked rows plus one case summary row. The post-execution App rendering remains for user review; no observed business outcome is available.

## 2026-11-21 Gateway recommendation increment

1. **Storyline → presentation: PASS.** Both place Unity Gateway on the recommendation beat, keep the tool-using agent future-facing, and retain manager approval plus the unverified Elmshorn East route boundary.
2. **Presentation → demo: PASS for local App.** The Response plan shows a live Gateway response ID and a named `pre_call` denial; the App/Lakebase approval and commit remain separate. The local safe and denied API requests passed. Hosted App parity and measured post-action value are still open.

## Original review before Investigate remediation

## Step 1 — Storyline to presentation

| Storyline element | Storyline source | Presentation section/time | Status | Finding or correction |
|---|---|---|---|---|
| Promise and audience | Workshop promise and session contract | Welcome, 0–5 | PASS | Same two-sided customer and ORLEN value promise and mixed audience. |
| Slide-1 customer branding | D167 presentation branding requirement | Welcome, 0–5 | PASS | Presentation flow visibly embeds the verified ORLEN-hosted logo and records its official asset URL and access date. |
| Personas and decision owner | Personas | Shared value and audience prompts, 20–28 | PASS | Decision ownership is discussed; named personas remain canonical in the storyline. |
| Multi-energy situation | Narrative and Situation | ORLEN footprint and destination model, 5–20 | PASS | Energy products, facilities, formats, and customer missions are consistent. |
| Business friction | Friction | Real-time decision gap, 28–36 | PASS | Presentation explains why lagging reporting cannot resolve a live journey. |
| Trigger | Trigger | Real-time decision gap, 28–36 | PASS | Holiday surge and charger anomaly match exactly. |
| Real-time role | Real-time state | Real-time decision gap and architecture, 28–36 and 51–56 | PASS | Current state is positioned as the first operational proof. |
| ML role | Prediction | Predictive intelligence, 36–44 | PASS | Review clarified charger failure as the hero ML prediction and other forecasts as supporting evidence. |
| Agent and governance | Agentic recommendation and Governed AI | Governed agentic operations, 44–51 | PASS | Approved tools, denial, approval, and trace are consistent. |
| Human and operational action | Human action and Lakebase transaction | Architecture and demo contract, 51–60 | PASS | App approval and operational persistence are promised without implying autonomous high-value action. |
| Synthetic nearby option | Investigation and bounded routing | Demo contract, 56–60 | PASS | Presentation explicitly identifies Elmshorn East as a scenario candidate, about 7 km straight-line away, and leaves drive-route verification open. |
| Customer value | Value hypothesis | Shared value outcomes, 20–28 | PASS | Reliability, wait, relevance, and journey completion are represented. |
| ORLEN value | Value hypothesis | Shared value outcomes, 20–28 | PASS | Utilisation, attachment, downtime, revenue, margin, and retention are represented. |
| Closed-loop outcomes | Closed-loop outcome and synthetic targets | Demo contract, 56–60 | PASS | Outcome scorecard is explicitly promised and figures remain labelled synthetic. |
| Duration | Session contract | Timed presentation, 0–60 | PASS | Sections are contiguous and total exactly 60 minutes. |

### Step 1 result

PASS. The presentation adds context but does not change the canonical use case, trigger, decision, action, or outcome.

## Step 2 — Presentation to executable demo

| Presentation promise | Demo beat/time | Product-map row | Runbook slot | Observable proof and fallback | Status |
|---|---|---|---|---|---|
| Network and multi-energy destination context | Network, 0–15 | Frame decision | 60–75 | App opens on Overview; facilitator selects Network. Network KPIs, capability labels, map, and persistent Elmshorn case prove the context. | PASS |
| Configurable network, destination choice and route qualification | Network, 0–15 | Explore network | 60–75 | MapLibre clusters, four analytical layers, seven filters, explainable risk/customer/margin index, and accessible table fallback. The Elmshorn East scenario candidate passes scenario screening at about 7 km straight-line; real address and route remain unverified. | PASS WITH WARNING |
| Live operational state plus predictive evidence | Investigate, 15–25 | Process trigger / Predict risk | 75–85 | The tab shows a 126-day telemetry/score gap and 447 historical prediction records. The model label is same-row degradation while the UI claims a 60-minute forecast; no future outcome proof is present. Exact-measure Genie/SQL works. | BLOCKED |
| Governed coordinated recommendation | Response plan, 25–35 | Build plan | 85–95 | Bounded actions, expected impact, Lakebase `pending_approval`; seeded proposal fallback. | PASS |
| Denied or approved consequential action | Approval & execution, 35–45 | Enforce boundary and Approve action | 95–105 | Policy scope, identity, approval ID, trace, audit, and measured transition; persisted approval fallback. | PASS |
| Operational action, not chat only | Approval & execution, 35–45 | Persist workflow | 95–105 | Three action rows execute only after approval; direct commit remains denied. | PASS |
| Measured shared value | Outcomes, 45–55 | Measure result | 105–115 | 38 journeys, 7.4-minute wait, €4.8k realized value; action-level snapshot fallback. | PASS |
| End-to-end conclusion and repeatability | Close/reset, 55–60 | Critical path | 115–120 | Real-time → ML → agent → action → value; reset returns `needs_review` with proposed actions. | PASS |
| Exact timing | Full demo, 0–60 | All rows | 60–120 | Demo and runbook intervals match one for one and total 60 minutes. | PASS |

### Step 2 result

BLOCKED for customer demonstration of the predictive Investigate beat. The timed action and product mapping exist, but the current model does not prove the promised 60-minute future outcome. The Elmshorn East candidate remains scenario-defined and route verification remains open. A non-Elmshorn Network selection also opens the fixed Elmshorn response plan.

The navigation and visual review passed: Overview loads first without the former action buttons;
the facilitator selects Network for the 0–15 beat. The selected Network card renders `#D1181D`
for its border and badge and `#FDE5E3` for its background, matching the reference in
[APP-UI-CONTRACT.md](APP-UI-CONTRACT.md). The other decision tabs retain readable semantic
status colors and no browser console errors were observed.

## Corrections made during this review

1. The App opens on Overview, without its former opening-action buttons. The facilitator selects Network and follows Network → Investigate → Response plan → Approval & execution → Outcomes for the timed demo.
2. Verified the complete Lakebase transition `needs_review` → `pending_approval` → `approved` → `measured`, including approval and execution traces.
3. Corrected action-level realized impact attribution so Outcomes aggregates to 38 journeys, 9.4 minutes of wait reduction, and €4.8k rather than double-counting an aggregate value on every action.
4. Added the mandatory verified ORLEN logo to slide 1 of the presentation flow and recorded the official-source/placeholder fallback requirement.

## Remaining warnings

- Named real-world Databricks retail or energy customer proof points have not yet been selected for the presentation. This is a content-evidence warning, not a storyline alignment blocker.
- The Databricks App, Lakebase branch/schema, governed Metric Views, Genie Space, dashboard, ML model, and Lakeflow products are deployed and verified. Local participant-style review and reset verification passed; hosted handoff remains open.
- Unity Gateway capability is verified, but no ORLEN-specific live MCP/provider backend exists in the workspace; the App demonstrates the bounded policy boundary and denied-commit fallback.
- The named Nowy Dwór and Warsaw comparison sites are hundreds of kilometres from Elmshorn and remain network benchmarks. The synthetic Elmshorn East waypoint is about 7 km straight-line away and passes modelled screening, but no real station address, drive route or current capacity is verified. The Response plan labels routing and its measured value as simulated; a live routing claim still requires those proofs.

## Final decision

At this earlier checkpoint, narrative alignment was `PASS WITH WARNINGS` and technical readiness was blocked by a false 60-minute failure claim and unsafe comparison-site handoff. The current result is the re-run below.

## Re-run after remediation — 2026-11-20

### Step 1: storyline → presentation

| Contract | Current presentation proof | Result |
|---|---|---|
| Elmshorn hero and two-sided value | Slide-1 logo, multi-energy destination framing, customer/ORLEN value, bounded response | PASS |
| ML claim | Both files now call the deployed model an observed-degradation classifier and treat future failure as an unvalidated design path | PASS |
| Data timing | Both files identify synthetic historical replay; the presentation avoids claiming live production latency | PASS |
| Scenario candidate | Both files retain Elmshorn East as a modelled nearby candidate requiring real address, drive route and capacity checks | PASS WITH WARNING |

### Step 2: presentation → executable demo

| Promise | Executable proof | Result |
|---|---|---|
| Network → Investigate handoff | Browser selected Szczecin, Investigate showed `SITE-00010`, and Elmshorn action tabs were disabled. Returning to Elmshorn reopened its plan. | PASS |
| Observed ML evidence | Model version 3, 10 distinct Elmshorn chargers, one latest-high charger, 24 historical high-score records, zero future horizon; the App shows 132-day replay gap. | PASS FOR CLASSIFICATION |
| Multi-energy and convenience economics | Elmshorn petrol, diesel, LPG, EV and separate convenience rows; Gold €51,543 equals energy and Stop Cafe POS totals exactly. | PASS |
| Governed natural-language follow-up | Genie returned 16.76 minutes and 24 records from the intended Metric Views and declined an ambiguous distinct-current-chargers question. | PASS WITH WARNING: execution identity remains in the full Genie view |
| Operational action and outcome | Existing Lakebase approval/denial path is scoped to Elmshorn; routing and outcome values remain simulated. | PASS WITH WARNING |

**Current decision:** the local walkthrough is ready to present as a **synthetic historical decision replay**. A live, future-failure or actual customer-diversion claim remains blocked. The hosted App has not been redeployed with the local UI changes; hosted parity and the real route/capacity checks remain open.

## Re-run after decision-tab completion — 2026-11-20

### Step 1: storyline → presentation

| Contract | Current presentation proof | Result |
|---|---|---|
| Historic replay and observed-state classification | Storyline and presentation explicitly distinguish current classification from future-failure prediction. | PASS |
| Recommendation and governance | Presentation identifies Genie investigation, the seeded scenario playbook, App API/Lakebase approval guard, and planned agent/Gateway integration. | PASS |
| Outcome claim | Presentation and storyline describe modelled value and a future measured-return path. | PASS |

### Step 2: presentation → executable demo

| Promise | Local proof | Result |
|---|---|---|
| Investigate evidence and layout | Browser shows Elmshorn's 9 ready chargers, 24 historical high-score rows, one latest-high charger among 10, a 132-day replay gap, and a compact full-width charger grid without the earlier empty column. | PASS |
| Cross-site guard | Szczecin remains selected in Investigate while all Elmshorn action tabs are disabled. | PASS |
| Proposal selection and persistence | Four selected actions advanced Elmshorn from `needs_review` to `pending_approval`; reset restored all four to `proposed`. | PASS FOR LAKEBASE SCENARIO |
| Approval boundary | Earlier negative tests returned 409/400/403. The narrow run created one approval and trace, then executed and reset. The 403 comes from the App API, not Unity Gateway; local approval identity used the workshop fallback. | PASS FOR APP WORKFLOW; GATEWAY UNPROVEN |
| Scenario outcome | Four executed actions recorded 9.4 modelled minutes of wait reduction, 38 modelled protected journeys, and €4,800 modelled protected revenue. Reset cleared effect fields. No post-action ORLEN measurements or attribution were observed. | PASS FOR SIMULATION; REAL IMPACT UNPROVEN |

**Current decision:** narrative alignment and the narrow Lakebase scenario path pass. Unity Gateway enforcement and real-world impact remain critical proof gaps; the hosted App has not been updated with these local changes. Review the remaining work with the user one item at a time.
