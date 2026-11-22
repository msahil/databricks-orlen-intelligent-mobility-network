# Databricks demo flow — 60 minutes

Canonical storyline: [STORYLINE.md](STORYLINE.md)

This flow is the executable proof of the canonical storyline. Every demo beat must map to a storyline beat, and changes to the trigger, decision, action, or outcomes must be synchronized with `STORYLINE.md` first.

## Golden path

One affected charging hub (**ORLEN Charge Hub Elmshorn**), one scenario-defined nearby candidate (**ORLEN Charge Elmshorn East**, `SITE-00015`, about 7 km straight-line away), two named cross-market benchmarks (**ORLEN Charge Nowy Dwór Gdański** and **ORLEN Warsaw Mobility destination**), one observed-degradation ML classification, modelled congestion and Stop Cafe context, and one approved simulated response plan. Elmshorn East passes modelled service, capacity, wait and proximity screening. Its station identity, address and drive route are unverified, so the demo does not claim a live customer diversion.

The primary action surface is the local-first [ORLEN Mobility Operations](http://localhost:8000) AppKit app, connected to the approved workspace and dedicated long-lived Lakebase branch. If port 8000 is occupied, use the displayed local port. Its reads use the four governed Metric Views; Lakebase state is isolated in `orlen_mobility_ops` on `projects/demo-hub/branches/orlen-mobility-ops`. Hosted deployment is reserved for an accepted handoff. The local Response plan calls the ORLEN Unity Gateway service for recommendations and can show its actual policy denial. The App's separate 403 denied-commit path is an App/Lakebase workflow guard, not Gateway action enforcement.

### App navigation model

The App opens on **Overview** by default. The facilitator selects **Network** to start the timed
decision journey, briefly opens the **ORLEN Mobility Control Tower** AI/BI dashboard to verify the shared governed measures, then returns to **Investigate**, **Response plan**, **Approval and execution**, and
**Outcomes**. The two former Overview action buttons are absent. The hero case is not a
separate tab. `CASE-SITE-00007` remains selected while the facilitator moves across tabs,
so the audience sees one continuous decision from detection through measurement.

All assets below use the shared workshop schema with the `mobility_` prefix.
Future Upstream and Downstream assets will use `upstream_` and `downstream_`
prefixes in the same schema.

| Time | Beat | Facilitator action | Databricks capability | Observable proof | Customer value | ORLEN value |
|---:|---|---|---|---|---|---|
| 0–15 | Network: frame and locate the decision | From the default Overview tab, select Network. On the MapLibre Europe map, state the Elmshorn hero condition: protect the customer journey while preserving energy and convenience value. Switch risk, demand, capacity and wait layers; filter market, energy, facility and snapshot age; inspect the 0–100 decision index, select Elmshorn, then open the Elmshorn East scenario candidate before comparing distant Nowy Dwór and Warsaw benchmarks. Briefly open the ORLEN Mobility Control Tower AI/BI dashboard to show the same governed Elmshorn wait and destination measures, then return to the App. | Databricks Apps/AppKit, Lakeflow, Unity Catalog, Metric Views, AI/BI Dashboards, MapLibre App surface | 80 modelled destinations, 14 public city references plus one scenario waypoint, capability labels, 446 affected synthetic journeys, about €7.1k modelled margin exposure, a 7 km straight-line nearby screen pass with route verification still open, and the dashboard's shared Metric View definitions. | See a credible conditional alternative and understand the service decision. | Align network, operations, and commercial teams on one prioritized response. |
| 15–25 | Investigate: explain observed condition | Review time-stamped Silver charger signals and ingestion lag, then compare each charger's latest observed-degradation classification with the fixed-rule baseline. Distinguish historical high-risk score records from distinct chargers. Inspect affected journeys and energy/convenience revenue context; total revenue and journey margin are not attributable incident loss. Ask Genie and inspect its SQL. Explain the historical replay gap and missing future-outcome validation. Comparison sites remain read-only and cannot enter Elmshorn actions. | Lakeflow, MLflow + ML, Genie, Metric Views, Unity Catalog | Modelled wait, historical high-risk score records, distinct scored chargers, synthetic telemetry, and modelled journey/commercial context. | Understand observed service degradation and what alternatives need verification. | Prioritize investigation with evidence while keeping future-failure claims out of the current demo. |
| 25–35 | Response plan: choose bounded action | Review four scenario actions: charger inspection, candidate routing, Stop Café readiness, and VITAY communication. Select actions, generate a governed recommendation, then use **Verify safety boundary** to show the actual policy denial. Submit the chosen proposal for approval. | Lakebase, Databricks Apps, Unity Gateway model service and input policy; Genie evidence was shown in Investigate | The safe request returns a Gateway response ID and bounded advice; the unsafe request returns a named `pre_call` policy denial. Selected actions are then persisted and the case moves from `needs_review` to `pending_approval`. Wait, journey, and value figures remain scenario projections; route and capacity remain unverified. | Understand the proposed service response before commitment. | Coordinate operations, customer experience, and convenience retail with a governed recommendation. |
| 35–45 | Approval & execution: govern the action | Show the full-width Execution ledger, Lakebase case state, and audit events. Test the App API's denied direct-commit path, then record human approval and simulated execution. | Lakebase, Databricks Apps; Unity Gateway tool enforcement remains planned for this action | Approval is available only after a proposal. Execution requires an approved case and approval record. The App API denial returns 403. Each selected action then gets its own `action_executed` event, action ID, audit row, timestamp, and approval reference; the case also gets a summary event. A four-action local demo cycle passed on 2026-11-21. `measured` means scenario impact was recorded, not that ORLEN outcomes were observed. | Keep a human decision in the loop. | Show exactly which actions ran, when, and under which approval while distinguishing Gateway recommendation enforcement from App-controlled execution. |
| 45–55 | Outcomes: evaluate the scenario | Show the action-to-outcome evidence panel: four action audit links and the later source each action needs. Then compare the historical baseline with modelled effects recorded on selected executed actions. | Lakebase, Databricks Apps; Lakeflow outcome return remains a follow-on integration | If all four actions are selected, the scenario records four executed actions, 38 modelled journeys protected, a 9.4-minute modelled wait reduction, and €4.8k modelled revenue protection. The audit links prove the simulated execution, while later charger, journey, inventory and VITAY observations remain absent. | See the hypothesized customer benefit and the evidence needed to test it. | See the modelled commercial upside and the measurement work required. |
| 55–60 | Close and reset | Summarize the decision path and outstanding proof. Reset the dedicated Lakebase case only with the owner's explicit approval. | Lakebase, workshop runbook | After an approved reset, `needs_review`, four available actions, and no scenario impacts are ready for the next run. | Leave with a repeatable decision pattern. | Extend the foundation to other destinations and business units. |

In the Network beat, explain the four map layers before switching them: **Risk** is the disclosed
0–100 scenario decision index; **Demand** is synthetic traffic pressure relative to baseline;
**Capacity** is the number of EV chargers ready in the modelled snapshot; **Wait** is modelled
minutes before charging begins. The legend gives each threshold. Cluster colors follow the
active measure; Capacity cluster numbers are ready-charger totals, while Wait cluster numbers
are average minutes. Elmshorn should read nine ready chargers and 16.8 minutes modelled expected wait.
The alternative panel shows `SITE-00015` first: a clearly labelled scenario candidate
about 7 km straight-line from Elmshorn, with one modelled charger ready, 300 kW maximum power,
7.9-minute expected wait and 1.52× demand index. It passes the screening rules. The Lakebase
routing action references this ID with `route_verified: false`. Nowy Dwór and other distant
destinations remain cross-market benchmarks; Warsaw is below the 300 kW EV power requirement.
Do not present the synthetic site as a real ORLEN station or the response as a live diversion.
An actual customer route requires a verified station address, drive route and current capacity.

## Control Tower page talking points

Use the dashboard pages as a guided business conversation, not as a gallery of charts. Each page contains its short facilitator guide beneath the page title; use the following sequence when demonstrating the dashboard.

| Page | What to say and show | Business decision |
|---|---|---|
| Control Tower | Start at `SITE-00007`: read the current modelled wait, at-risk destination count, and historical high-risk score-record count from the governed screen. Distinguish score records from distinct chargers; values change when the synthetic replay is regenerated. Use the destination table to connect the alert to the network response. | Where should ORLEN act to protect the journey and commercial value in this replay? |
| Destination Operations | Explain that the synthetic historical state was refreshed and the model classifies observed degradation. Compare the hero site with risk bands and maintenance candidates without claiming a future failure forecast. | Which charger or destination should operations inspect? |
| Energy and Convenience Retail | Compare EV, petrol, diesel, LPG, and hydrogen revenue and margin proxy, then show convenience revenue and EV energy usage. | How can ORLEN grow destination economics while offering customers a better stop? |
| Customer Journeys and Outcomes | Compare completion, wait time, and margin proxy across family, fleet, truck, and long-distance segments. | Did the response improve both customer experience and ORLEN value? |

## Demo questions

### Genie

- For `SITE-00007`, show `Expected Wait Minutes` and `High Risk Predictions`; explain that the latter counts historical score rows.
- Which German destinations have modelled chargers ready and an expected wait under 12 minutes? Then use the App's destination profile and map to check the Elmshorn East scenario candidate's 300 kW power, Stop Cafe, accessibility, and approximate 7 km straight-line distance; Genie and the Metric View do not verify a drive route or current capacity.
- Which candidates have the lowest modelled expected wait? Treat available chargers as a snapshot, not a proven demand-absorption limit.
- How many affected journeys are recorded for the selected destination in the modelled scenario window?

### Operations agent

> Build a response plan that keeps expected charging waits below 12 minutes, protects customer journeys, and avoids negative incremental margin. Use only approved tools. Explain the evidence, request approval for consequential actions, and show how success will be measured.

## Planned actions

- Put charger 6 into inspection workflow without falsely reporting the entire location unavailable.
- Shortlist the Elmshorn East scenario candidate; require real address, drive route and current capacity verification before diversion.
- Offer a bounded VITAY benefit only to affected journeys.
- Increase Stop Cafe preparation for the forecast interval.
- Raise an inventory task for the at-risk product.

## Required fallback artifacts

- Recorded or replayable event batch with original timestamps
- Precomputed `mobility_gold_site_operating_state`, `mobility_ml_charger_failure_predictions`, and `mobility_ml_supporting_forecasts` tables
- Screenshots or exported dashboard state
- Stored Genie answers with validated SQL
- Stored agent trace and recommendation
- App and Lakebase seed state with `CASE-SITE-00007` in `needs_review`
- Expected post-approval rows plus the action-level realized impact contract
- Final `mobility_gold_outcome_measurements` table and dashboard bookmark
