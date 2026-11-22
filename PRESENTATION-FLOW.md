# Presentation flow — executive business case

Canonical storyline: [STORYLINE.md](STORYLINE.md)

Demo handoff: [DATABRICKS-DEMO-FLOW.md](DATABRICKS-DEMO-FLOW.md)

Presentation artifact: [ORLEN | The Intelligent Mobility Network in Google Slides](https://docs.google.com/presentation/d/1G_ak1ZeC8a-O-Nbw5U9s_5gNZGyo2kfAiBa6ZjD6VbQ/edit) (private, 15 slides; updated 2026-11-22). Current Git source: [orlen-intelligent-mobility-network](../../../../decks/slides/orlen-intelligent-mobility-network/index.tsx).

Audience: ORLEN C-level leaders and Consumers & Products, retail network, mobility operations, convenience, VITAY, and data/AI business heads. The narrative is paced by the business decision rather than a fixed presentation duration. The Databricks demo retains its separate 60-minute flow until the session schedule is reconfirmed.

## Slide 1 branding

![Official ORLEN logo](assets/orlen-logo.png)

- Show this verified ORLEN logo on slide 1 alongside the business question: **How can ORLEN make each multi-energy destination more reliable for customers and more valuable for the Group?**
- Official source: [ORLEN public brand asset](https://www.orlen.pl/content/dam/internet/orlen/logo/2024/ORLEN-PNG-07.png), accessed 2026-10-23.
- Preserve its proportions, colours, and clear space. The cover is an invitation to the discussion, without meeting logistics or technology inventory.

## Executive thesis

ORLEN's retail expansion, EV ambitions, VITAY growth, and rising non-fuel contribution make the **destination decision** economically important: when demand or service conditions change, which site, customer group, and operational response should ORLEN prioritise? The proposed answer is one governed decision loop across network signals, customer journeys, commercial context, recommendations, human approval, and a path to measured results. The ORLEN Mobility demo is a first proof of that operating model, with Upstream and Downstream left for later business-unit demos.

The business problem is a **working hypothesis for ORLEN to validate**, not a finding about its internal systems or quantified losses. Public strategy targets are sourced; operational data and scenario values in the demo are synthetic. Do not present the demo's modelled savings as realized ORLEN revenue, profit, or customer satisfaction.

## Act I — Why this matters to the business

| # | Slide / takeaway headline | Executive message | Visual and evidence | Business-head lens |
|---:|---|---|---|---|
| 1 | **ORLEN's next retail advantage is the destination decision** | A multi-energy site succeeds when energy, retail, and the customer journey work together. | Verified ORLEN logo, one destination image or map silhouette, one business question. | What decision should a regional manager make faster? |
| 2 | **Strategy 2035 raises the stakes for every customer interaction** | ORLEN has stated ambitions for VITAY, public EV charging, ultrafast charging, and non-fuel margin. Reliable execution at the destination helps pursue them. | Three or four *labelled 2035 targets*, not achieved results: 10 million active VITAY users, 33% share of public EV charging in Poland, 6,000 ultrafast DC charging points in Poland, 40% non-fuel share of retail margin. Source: [Strategy 2035](STRATEGY-ALIGNMENT.md), pp. 33, 40. | Which target most depends on site-level execution? |
| 3 | **One location now serves several customer missions** | Petrol, diesel, LPG, HVO100 where offered, EV, hydrogen, TIR services, Stop Café, convenience, and VITAY produce different visit patterns and service expectations. | Destination anatomy names HVO100 and labels the public service mix as format-dependent. | Which services drive choice, dwell time, and attachment? |
| 4 | **A late decision can cost the whole visit** | At Elmshorn, travel demand, charger 6's observed-condition score, customer wait, and possible energy and Stop Café effects create one decision window. | Four-step demand → service → customer → ORLEN chain, followed by the four candidate actions. Effects are hypotheses, not measured ORLEN losses. | Where are handoffs slow today? |
| 5 | **Value leaks through four connected mechanisms** | Service downtime and waiting can affect completed energy transactions; weak routing can lose the visit; missed convenience demand reduces attachment; generic communication can miss loyalty value. Costs and customer trust matter too. | Value-leakage tree: customer experience → energy volume → non-fuel contribution → repeat visits, plus intervention cost. All relationships are hypotheses to validate. | Which levers have an owner and a trusted baseline? |

## Act II — The investment case and the Elmshorn decision

| # | Slide / takeaway headline | Executive message | Visual and evidence | Business-head lens |
|---:|---|---|---|---|
| 6 | **One operating decision can create value for both sides** | Customer outcomes are reliable availability, shorter and more predictable waits, and relevant alternatives. ORLEN outcomes are higher completed journeys, energy utilisation, convenience contribution, and retention, net of operating cost. | Two-sided value map with one shared intervention in the centre; separate observed, modelled, and unmeasured measures. | Which outcome would justify changing the operating process? |
| 7 | **Judge the response by contribution** | Evaluate incremental contribution across energy, convenience, and repeat visits, then deduct response and platform costs. Attribute benefit only with comparable baseline and control data. | Three driver formulas and a cost deduction alongside Finance's evidence checklist and a net-positive decision test. ORLEN supplies unit margins and frequency; no ROI claim from workshop data. | Finance, Retail, Mobility, Convenience, and VITAY agree on definitions and ownership. |
| 8 | **Scale only when the evidence travels** | Start with a bounded decision and measured pilot; use network replication only when measures, approval, attribution and benefit survive across comparable sites. | Destination → cohort → region → network cards, each with a concrete evidence gate; ORLEN sets wait, journey and net-contribution thresholds. | Which formats and regions make a fair pilot cohort? |
| 9 | **Elmshorn makes the operating problem concrete** | In the synthetic historical replay, holiday demand rises and charger 6 shows observed degradation. The decision is whether to inspect, route, prepare Stop Café, and communicate with affected customers. | Hero-case map and four action cards. The nearby Elmshorn East option is a scenario candidate about 7 km straight-line away; its real address, drive route, and current capacity are unverified. | Who can approve each action, and what evidence is required? |

## Act III — How Databricks supports the decision and how ORLEN judges it

| # | Slide / takeaway headline | Executive message | Visual and evidence | Business-head lens |
|---:|---|---|---|---|
| 10 | **Governed signals give decisions shared meaning** | Lakeflow processes the synthetic historical replay. Unity Catalog and Genie Ontology organize the domain; Metric Views define measures; AI/BI shows network context. | Four product-to-business-proof cards, then a shared-definitions result statement. No claim of proven production streaming latency. | Which definitions must be common across business units? |
| 11 | **Intelligence should sharpen a decision, not invent certainty** | MLflow tracks an observed-degradation classifier and its fixed-rule comparison. Genie answers grounded business questions. Unity Gateway applies a policy to the recommendation and demonstrably denies an unsafe request. | Three evidence cards: model classification, grounded Genie answer, Gateway allow/deny result. A future-failure forecast and a tool-using agent remain future work. | What advice can be automated, and what needs review? |
| 12 | **Human approval turns advice into accountable action** | The Databricks App assembles a four-action response. Lakebase stores the proposal, approval, execution, and an audit row per selected action. Gateway policy governs the recommendation; the separate App/Lakebase workflow governs action execution. | Decision swimlane: recommend → review → approve → execute → audit, with identity and timestamps. | Who owns the approval boundary and exception path? |
| 13 | **Simulated actions are traced; impact is unmeasured** | The local rehearsal produced four linked simulated action records and deterministic scenario effects. It has no action-linked post-execution charger, journey, inventory, or VITAY observations, so realized ORLEN benefit is unproven. | Modelled scenario values and a current App action-to-outcome evidence crop show the trace and missing post-action observations. | Which source and comparison rule would Finance accept as proof? |
| 14 | **A pilot should earn a scale decision** | ORLEN should select a cohort, define the intervention, agree controls, instrument post-action events, and set a scale gate for customer and ORLEN value. | Six-card pilot charter: decision owner, sites, intervention, evidence feed, measures and scale gate. No invented duration or return. | What evidence would justify expansion? |
| 15 | **Judge the live demo against four proofs** | The demo should show governed site context, explainable diagnosis, bounded recommendation with human control, and an audit trail that exposes the measurement gap. | Demo route: Overview → Network → brief AI/BI Control Tower view → Investigate → Response plan → Approval & execution → Outcomes. Give the audience the four proof questions. | At the end, identify the pilot sponsor and the first source system to connect. |

## Visual storyboard and KPI treatment

Every slide needs one dominant visual with a takeaway headline. The first two acts use executive diagrams, maps, and simple value graphics. The final act uses selected, legible crops from the **current ORLEN Mobility App** as proof. Do not paste full-height App pages into the deck: crop a map, KPI strip, evidence card, or ledger at slide-reading scale, and keep its source and data-status label visible. All App captures must be taken fresh from the local build used for the presentation.

| Slide(s) | Primary visual | KPI or value proposition to emphasize | Source and presentation label |
|---|---|---|---|
| 1 | Official ORLEN logo with a restrained destination/network motif | Reliable customer journeys and stronger destination contribution | Official logo; no numerical claim |
| 2 | Four large Strategy 2035 target tiles | 10M active VITAY users; 33% public EV-charging share in Poland; 6,000 ultrafast DC points in Poland; 40% non-fuel share of retail margin | ORLEN Strategy 2035, pp. 33 and 40; each tile visibly says **2035 target** |
| 3–4 | Multi-energy destination anatomy, then an Elmshorn operating chain and action window | Energy choice, charger condition, wait, Stop Café attachment, and the coordinated response | Public services and **operating hypothesis**; no asserted ORLEN loss |
| 5–6 | Four value-leakage mechanisms followed by a two-sided customer/ORLEN value map | Customer: wait, successful journeys, reliability. ORLEN: completed transactions, non-fuel contribution, uptime, repeat visits | **Measures to validate with ORLEN**; do not double-count a visit |
| 7 | Contribution driver formulas with a Finance evidence panel | Recovered energy gross margin + incremental non-fuel margin + retained-customer contribution − response and platform cost | **Business-case method**, not an ROI or forecast; unit margins and event frequency remain ORLEN inputs |
| 8 | Site → cohort → region → network ladder with a proof gate at each step | Comparable post-action evidence and net contribution before scaling | Proposed pilot logic; no invented payback period |
| 9 | Fresh crop of the App **Network** map beside Elmshorn KPI tiles | Modelled expected wait, charger readiness, affected journeys, and latest high condition score | **Synthetic operational replay**; Elmshorn East route and current capacity unverified |
| 10 | Four product-to-business-proof cards and shared-definition statement | Lakeflow → Unity Catalog / Genie Ontology → Metric Views → AI/BI | Product labels are visible; the replay is historical, with no proved production latency |
| 11 | Fresh App **Investigate** evidence crop and a separate recommendation-policy callout | Latest per-charger observed-degradation classification, fixed-rule comparison, governed Genie answer, Unity Gateway allow/deny | **Observed-condition classifier** and **Gateway recommendation policy**; no future-failure or action-enforcement claim |
| 12 | Fresh App **Approval & execution** ledger crop beside a human-decision swimlane | Four selected actions, four action audit links, one approval reference | **Actual local platform workflow** with simulated business actions; App/Lakebase executes after approval |
| 13 | Fresh App **Outcomes** evidence panel beneath three modelled scenario values | 9.4-minute modelled wait reduction, 38 modelled protected journeys, €4.8k modelled protected revenue; post-action observations absent | Every number visibly labelled **modelled**; no realized ORLEN value claim |
| 14–15 | Six-field pilot charter, then four demo proof cards with route and product labels | Customer and ORLEN outcome KPIs, source owners, approval rule, baseline/control and scale gate | Proposed pilot commitments and the exact demo route |

The screenshot source is the App itself. Take captures only from the current implementation after
checking the live widget values and labels; preserve the **synthetic**, **modelled**, **target**,
and **unmeasured** distinctions in both the crop and slide caption.

Capture the current executed case's Approval ledger and Outcomes evidence before any approved reset. Network and Investigate can be captured through read-only navigation. A pre-approval screenshot would require another case cycle and is optional; do not reset or mutate the case solely to obtain artwork. Record the App build/capture date and the widget's data source in slide notes. Put at most one App crop on a slide so its labels remain legible from the back of the room.

## How to present the business case

- Use Strategy 2035 figures as **ORLEN targets**, with source and year visible. Do not treat them as a Databricks benefit or an achieved outcome.
- Use a driver-based value model. Leave contribution margins, response cost, retention value, and intervention frequency as ORLEN inputs. The workshop has no authorized values for them.
- Keep one slide on the customer promise and one on the executive contribution model. Show how reliability, wait, route quality, retail attachment, and loyalty connect without double-counting the same visit.
- Treat the Elmshorn scenario's 9.4 modelled wait-minute reduction, 38 modelled protected journeys, and €4.8k modelled protected revenue as **scenario estimates** only. They are not observed business results.
- Make the proof boundary visible: the App has a current-cycle approval and four action audit links; the post-action measurement feed and outcome Gold tables are absent.
- Put implementation detail and exact product naming in the final act and speaker notes. The audience first needs to agree that the operating decision and its economics matter.

## Deck creation notes

The current [ORLEN open-slide deck](../../../../decks/slides/orlen-intelligent-mobility-network/index.tsx) follows this flow. Reuse the verified logo and Executive theme, then keep one idea per page and move source details and caveats into notes where they do not change the visible claim.

The existing Databricks demo flow remains the live demonstration choreography; this presentation establishes the executive decision and value test that the demo must answer.
