# ORLEN: Intelligent Mobility Network

## Workshop promise

Show how ORLEN can operate every location as an intelligent multi-energy and convenience-retail destination by connecting operational signals, governed ML evidence, agentic action, and measurable value for both ORLEN and its customers. This workshop replays synthetic historical signals; future-failure prediction and live production latency remain design goals rather than proven results.

## Session contract

- Format: executive business-case presentation followed by an instructor-led Databricks demo
- Presentation: business-led, duration flexible; the prior 60-minute allocation is superseded
- Databricks demo: existing 60-minute flow; total session schedule to be reconfirmed
- Data: synthetic, shaped around ORLEN's public European retail footprint and station services
- Location identities: public ORLEN locations and facilities where a named source is available; the remaining network is explicitly labelled as synthetic reference locations
- Operational measures: synthetic/modelled for demonstration; they are not ORLEN production data or performance claims
- Delivery mode: demo-only with audience discussion; no participant writes

## Personas

- Primary decision owner: European Retail Network Director
- Operational decision maker: Regional Mobility Operations Manager
- Commercial stakeholder: Convenience Retail and VITAY Lead
- Supporting builder: Data and AI Product Team
- Governance owner: Enterprise Data and AI Governance Lead
- Customer persona: family or business traveller requiring fast charging and appropriate station facilities

## Executive business case

The C-level question is how ORLEN can turn its Strategy 2035 Consumers & Products ambitions into better destination-level decisions and measurable contribution. The strategy sets targets for VITAY participation, public EV-charging share, ultrafast charging points, and the non-fuel share of retail margin; these are ORLEN targets, not benefits attributed to Databricks. [Strategy alignment and source pages](STRATEGY-ALIGNMENT.md).

The working problem hypothesis is that a disruption or demand surge can span energy service, customer routing, convenience demand, loyalty, and maintenance while the response crosses teams. ORLEN must validate the present handoffs, delays, and economic exposure with its own operators and data. The value case joins customer reliability and wait outcomes to ORLEN's completed energy transactions, non-fuel gross margin, retention, and intervention cost. A defensible investment case needs ORLEN-provided unit margins, event frequency, comparable baselines, action-linked post-event observations, and a control or declared uncertainty. The synthetic workshop values cannot establish ROI or realized ORLEN impact.

The executive decision sought after the demo is a bounded pilot: a sponsor, destination cohort, source owners, shared KPI definitions, approval boundary, and scale gate that tests both customer and ORLEN value. Mobility is the first business-unit proof; Upstream and Downstream can later reuse the governed foundation with their own domains and decisions.

## Narrative

ORLEN's locations offer combinations of conventional fuels, premium fuels, EV charging, hydrogen, TIR services, AdBlue, Stop Cafe, convenience retail, washing, payment, accessibility, and family facilities. During a holiday travel period, demand rises on a major corridor. A charging hub becomes congested, one charger emits abnormal telemetry, Stop Cafe demand grows faster than expected, and a nearby product approaches a stockout. Other ORLEN destinations have spare capacity.

The hero location is `SITE-00007`, modelled as **ORLEN Charge Hub Elmshorn, Elmshorn, Germany**, associated with the public ORLEN retail announcement trail and the A23 corridor near Hamburg. `SITE-00015`, **ORLEN Charge Elmshorn East**, is a scenario-defined nearby candidate placed about 7 km straight-line from the Elmshorn city-centre map reference. Its station identity, waypoint, charger availability, wait and power are workshop data; there is no verified real station address or drive route. It passes the scenario's EV service, ≥300 kW power, available-charger, ≤12-minute wait, demand, same-market and ≤120 km proximity screening, making it a candidate for a simulated bounded response. The comparison network also includes named locations such as ORLEN Charge Olsztynek Południe, ORLEN Bratislava HVO100 pilot, ORLEN Hydrogen Gdynia/Piła/Katowice/Poznań, ORLEN Hydrogen Prague/Litvínov, ORLEN Hydrogen Włocławek hub, ORLEN Charge Szczecin/Gorzów Wielkopolski/Nowy Dwór Gdański corridors, and ORLEN Warsaw Mobility destination. These identities make the business story concrete; event volumes, transactions, forecasts, model scores, revenue, margin, and satisfaction measures remain deterministic synthetic values. The Polish destinations are cross-market benchmarks for Elmshorn, not local diversion routes. The Network tab tests service, facility, power, wait, demand, and approximate city-centre distance while keeping route verification explicit.

Databricks processes synthetic historical events. The current hero ML model classifies observed charger degradation and compares its score with a fixed rule. A future-failure forecast remains a planned upgrade requiring a future-outcome label and temporal validation. Modelled congestion, Stop Cafe demand, and customer and commercial impact provide scenario context. Genie supports governed investigation. In the local App, a customer-scoped Unity Gateway model service now produces a bounded recommendation from the current Lakebase case and selected actions; its input policy demonstrably blocks an unsafe recommendation request. The App also presents a seeded, editable four-action scenario playbook; an ORLEN-specific tool-using agent remains a future integration. A manager submits and approves maintenance, customer-routing, VITAY, and Stop Cafe actions through the separate App/Lakebase workflow. Lakebase stores simulated action impact. The customer-prefixed `ORLEN Mobility Control Tower` AI/BI dashboard shows governed network and business context. A Lakeflow return of measured post-action outcomes remains a future integration; the App's current scorecard labels scenario estimates explicitly.

## Story beats

| Beat | What happens | Evidence | Decision |
|---|---|---|---|
| Situation | ORLEN locations are modelled as multi-energy retail destinations across Europe. | Map with energy products, facilities, formats, and KPIs. | Treat destination configuration as part of network optimisation. |
| Friction | Data and decisions span chargers, pumps, POS, inventory, loyalty, traffic, weather, and maintenance. | Disconnected signals and lagging metrics. | Use one governed data and AI foundation. |
| Trigger | Holiday traffic rises, charging sessions accelerate, and charger 6 becomes abnormal. | Event timestamps, stream lag, utilisation, temperature, and power curves. | Escalate the affected hub for investigation. |
| Historical signal replay | Lakeflow refreshes station state and service KPIs from synthetic events. | Event and ingestion timestamps, refreshed governed state, and the replay gap. | Determine which site merits investigation; live production latency is not proven. |
| ML evidence | The hero model classifies observed charger degradation in a historical replay; it does not prove a 60-minute failure forecast. Modelled demand and commercial measures provide context, not attributable loss. | MLflow run, UC model version, latest per-charger classification score, fixed-rule comparison, and replay time gap. | Prioritize inspection and a bounded response; reserve future-failure claims for a validated future-outcome model. |
| Investigation | The manager asks why the hub is at risk and whether any alternatives can absorb demand. | Genie response grounded in governed Metric Views plus visible Network qualification checks; the Elmshorn East scenario candidate passes nearby screening. | Shortlist the synthetic candidate while retaining drive-route and current-capacity verification as conditions. |
| Recommendation | Genie answers governed questions; the local App calls the ORLEN Unity Gateway model service for a bounded response grounded in the current case and selected actions. A tool-using agent is still planned. | Gateway response ID for the safe request; named `pre_call` policy denial and reason for the unsafe request; four-action playbook and conditional scenario impact. | Propose maintenance, routing, preparation, and offer actions while retaining manager approval and route verification. |
| Governed action | A consequential action requires approval; a direct commit is denied. | Lakebase approval and one action-linked execution audit row per selected action, shown in the App's Execution ledger; separate App API 403 denial. Unity Gateway governs the preceding recommendation, while tool/commit enforcement remains planned. | Approve only bounded actions and retain an auditable execution link for future outcome data. |
| Human action | The manager reviews and adjusts the response plan in an App. | Evidence, approval record, identity, and timestamp. | Approve work order and customer/commercial actions. |
| Lakebase transaction | Work order, campaign state, routing instruction, and task status are persisted. | Immediate operational-state update. | Begin execution and track progress. |
| Scenario outcome | Selected actions record modelled impact in Lakebase. Measured return to Lakeflow and dashboard refresh are future work. | Baseline versus scenario wait, modelled journeys and revenue, unmeasured charger readiness and route/capacity caveat. | Decide which real-world outcomes must be instrumented before operational rollout. |

## Storyline dashboard

### Public-location references and synthetic nearby option

| Location family | Examples in the demo | Business role in the story |
|---|---|---|
| EV charging | Elmshorn, Olsztynek, Szczecin, Gorzów Wielkopolski, Nowy Dwór Gdański | Protect charging availability, route demand, and reduce waiting |
| Synthetic nearby EV option | Elmshorn East (`SITE-00015`), about 7 km straight-line from Elmshorn's map reference | Demonstrate a screened local alternative and a conditional response; no real station or drive route is claimed |
| Hydrogen | Gdynia, Piła, Katowice, Poznań, Prague, Litvínov, Włocławek | Demonstrate alternative-energy network visibility and corridor planning |
| Alternative fuels | Bratislava HVO100 pilot; petrol, diesel, LPG and hydrogen attributes across the network | Compare energy mix, revenue, margin proxy and customer choice |
| Multi-service destinations | Warsaw and motorway/service-area formats | Combine energy, Stop Cafe, VITAY, facilities and convenience value |

The source tables carry `location_data_status`, `public_source_url`, and `data_provenance` so a presenter can distinguish public location context from synthetic operational evidence while inspecting Unity Catalog.

| Dashboard | Audience and decision | Governed sources | Hero proof | Fallback |
|---|---|---|---|---|
| `ORLEN Mobility Control Tower` | Retail Network Director decides which destination response to approve | `mobility_mv_site_performance`, `mobility_mv_customer_journey_value`, `mobility_mv_energy_retail_performance`, `mobility_mv_charger_risk` | `SITE-00007` shows 16.76-minute expected wait, one at-risk site, charger risk, multi-energy value, and the post-action comparison | Static dashboard screenshot plus validated Metric View queries |

## Value hypothesis

### Customer value

- More reliable availability information
- Shorter queues and fewer unsuccessful station visits
- Appropriate facilities for the journey
- Relevant benefits instead of generic promotions
- Faster, safer, and more predictable travel

### ORLEN value

- More completed charging and fuel transactions
- Higher Stop Cafe and convenience attachment
- Better utilisation across the network
- Less equipment downtime and lost revenue
- Lower stockout, waste, and operational-response cost
- Greater VITAY engagement and repeat visits

## Synthetic outcome targets

These are demo hypotheses, not claims about ORLEN performance.

| Metric | Baseline | Demonstrated intervention |
|---|---:|---:|
| Average charging wait | 24 minutes | 9 minutes |
| Charger availability | 91% | 98% |
| Stop Cafe conversion among charging customers | 18% | 27% |
| Successful affected journeys | 82% | 95% |
| Revenue at risk recovered | 0% | 65% |
