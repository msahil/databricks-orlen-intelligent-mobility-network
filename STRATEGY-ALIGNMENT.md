# ORLEN Strategy 2035 alignment

Comprehensive reusable strategy capture: [ORLEN-STRATEGY-2035.md](../../ORLEN-STRATEGY-2035.md).
This file remains the mobility-workshop-specific alignment assessment; the root document is
the source for the full Group strategy, future Upstream, Downstream, Energy, and Genie One demos.

- Source: [ORLEN Group Strategy 2035](https://www.orlen.pl/content/dam/internet/orlen/pl/en/about-company/strategy-2035/documents/ORLEN%20Group%20Strategy%202035.pdf), 69 pages, dated Warsaw, 9 January 2025. Page numbers below are the strategy's own.
- Reviewed: 2026-10-30, whole document read; key figures (p.33, 34, 40, 48) checked against page images.
- Status: Strategy anchors are incorporated into the executive [storyline](STORYLINE.md) and [presentation flow](PRESENTATION-FLOW.md). The demo flow remains the Mobility proof path; broader Group use cases are for later workshops.
- Evidence labels: **Evidence** = stated in the strategy. **Inferred** = reasoned, must be validated with ORLEN. **Unknown** = needed.

> The strategy does not mention Databricks, AI platforms or a data stack. Its digital content is thin (p.59). Every Databricks link below is inferred.

## Design rule

The Intelligent Mobility Network demo must be traceable to ORLEN's own Strategy 2035. Each demo beat should point to a strategy page and the ambition it serves.

The opening presentation is **business-case-led**, with selective sourced strategy targets:

- Tell the overall ORLEN vision and locate the Mobility use case inside Consumers & Products; Upstream and Downstream remain future business-unit demos.
- Show only a few clearly labelled 2035 targets on slide faces. Keep financial tables and unvalidated ROI figures off slides; put fuller sources and assumptions in notes.
- Introduce Databricks after the operating problem, contribution logic, and Elmshorn decision are clear. Name products in the final act where they map to observable demo proof.

## Executive pulse

1. **Pressure:** PLN ~350–380bn capex and M&A while average annual EBITDA grows from ~34–36bn (2025) to ~53–58bn (2035) (p.47–48). About 77% of capex is flexible (p.48), hurdle rates vary by emission impact (p.50), net debt/EBITDA is held below 2.0 in 2030 (p.48), and EUA prices rise from ~€108 to ~€172/t (p.64). Every asset and capital decision must earn its return.
2. **Revenue:** Consumers & Products targets 10M active VITAY users, 33% of Polish public EV charging, ~6,000 ultrafast DC chargers and a non-fuel margin share of 40% (p.33, 40).
3. **Cost and assets:** Downstream operational availability 95.9% → 97%, maintenance prudency, capex excellence and "single source of truth" data (p.22, 37, 57, 59).

## Diagnosis

| # | Observation | Evidence level | Source |
|---|---|---|---|
| 1 | Post-merger integration: simplify structure, break silos, unify the IT landscape, "single source of truth" data, data governance and security as one of five digital pillars. | Evidence | p.54, 55, 59 |
| 2 | C&P is the smallest capex segment (~PLN 1–2bn a year) yet targets PLN 7.3bn EBITDA in 2035; its growth is capital-light and depends on customer and site intelligence. | Evidence | p.34, 48 |
| 3 | VITAY "Super App" uses "AI/ML algorithms to increase the value derived from each customer"; combining fuel and energy retail customer databases adds PLN 220m (2030) and PLN 380m (2035) annual EBITDA. | Evidence | p.33, 40 |
| 4 | Capex excellence: post-mortem analysis, cost benchmarking, "structured data governance policy for capital projects", "integrated system for capital project management". | Evidence | p.57 |
| 5 | Energy: Virtual Power Plant, digitised power segment, PLN >40bn for distribution networks "and digital tools supporting investment planning". | Evidence | p.28, 31 |
| 6 | Decarbonisation: −25% absolute Scope 1+2 (Upstream and Downstream), −55% Energy intensity, −15% net carbon intensity by 2035; net zero by 2050. | Evidence | p.15, 42–45 |

## C&P targets the demo must trace to

| Target | 2024/25 | 2030 | 2035 | Source |
|---|---:|---:|---:|---|
| Active VITAY app customers (1 transaction a month), mn | 5 | 8 | 10 | p.40 |
| Share of public EV charging in Poland, % | 11 | 30 | 33 | p.33, 40 |
| Ultrafast DC charging points in Poland, thousand | 0.2 | 2.7 | 6.0 | p.33 |
| Non-fuel share of retail margin, % | 31 | 35 | 40 | p.40 |
| Additional annual EBITDA from segment integration, PLN mn | — | 220 | 380 | p.40 |
| C&P EBITDA target 2035, PLN bn | — | — | 7.3 | p.34 |

## Value map

| Lever | Strategy anchor | Business capability | Databricks enabler | Metric | Evidence level |
|---|---|---|---|---|---|
| Revenue | VITAY users 5→10M, cross-sell 2+/3+ (p.33, 40) | One customer view across fuel, power, gas and partners | Unity Catalog, lakehouse, ML, Genie | Active users, products per customer | Target: evidence. Fix: inferred |
| Revenue | Non-fuel margin 31→40%, Stop Cafe 3.0 (p.34, 40) | Site-level demand, assortment and offers | Forecasting, Metric Views, AI/BI | Non-fuel share, attach rate | Target: evidence. Fix: inferred |
| Revenue and asset | 0.2k→6.0k chargers, 33% share (p.33) | Charger uptime, utilisation and siting | Streaming, predictive ML | Availability, utilisation, TWh delivered | Target: evidence. Fix: inferred |
| Revenue | Energy-as-a-Service, B2B/B2G (p.33, 40) | Multi-energy data products | Governed data sharing, agents | Multi-product customers | Inferred |
| Cost | Availability 95.9→97%, maintenance prudency (p.22, 37) | Predictive maintenance | Streaming, ML, MLflow | Unplanned downtime days | Target: evidence. Fix: inferred |
| Cost and capital | Capex excellence, hurdle rates (p.50, 57) | Governed project and cost data, return tracking | AI/BI, agents on governed data | Delivered return vs hurdle rate | Need: evidence. Fix: inferred |
| Asset | 12.8 GW RES, BESS, Virtual Power Plant (p.28, 38) | Generation and storage forecasting and dispatch | Time series, ML, Lakebase | RES yield, BESS value | Inferred |
| Risk | Emission targets, ETS costs (p.15, 65) | Lineage-backed emissions data, carbon-aware planning | Unity Catalog lineage, AI/BI | Reporting cycle time, ETS exposure | Need: evidence. Fix: inferred |
| Platform | Single source of truth, governance (p.59) | One governed foundation across the Group's clouds | Open lakehouse, Unity Catalog | Time to data product, reuse | Need: evidence. Cloud fit: inferred from the Google, Microsoft and AWS announcements in [brief.md](../../brief.md) |

## Current demo beats traced to the strategy

| Demo beat | Strategy target served | Page |
|---|---|---|
| Hero charger-failure prediction, charger availability | ~6,000 ultrafast chargers, 33% EV charging share | p.33, 40 |
| Congestion forecast and customer routing across destinations | EV leadership through transit and in-city hubs | p.33 |
| Stop Cafe demand forecast and preparation | Non-fuel margin 31→40%, Stop Cafe 3.0 | p.34, 40 |
| Bounded VITAY offer to affected journeys | 10M active VITAY users, AI/ML value per customer | p.33, 40 |
| Governed agent with human approval and denied action | Governance, data security, capex-style stage-gating | p.57, 59 |
| Lakebase workflow and closed-loop outcome scorecard | Return tracking and post-mortem discipline | p.57 |
| Unity Catalog and Metric Views as one trusted definition | "Single source of truth" | p.59 |

## Superseded 60-minute vision-led proposal

Storyline for the room: ORLEN has a clear vision; it is delivered by four lines of business that must work as one system; the hard part is bringing them together; Databricks is the enabler that does so; the mobility destination is where it becomes visible.

| Min | Section | Message | Strategy anchor | Interaction |
|---:|---|---|---|---|
| 0-5 | Welcome | One story: from ORLEN's vision to a working destination. Verified logo on slide 1. | - | Ask what "bringing it together" means in the room's daily work. |
| 5-15 | The ORLEN vision | "The energy of tomorrow starts today": a pragmatic, responsible transition that powers Central Europe. Four pillars and the idea of an integrated, coherent, digital organisation. | p.3, 11, 13 | Does this match how the room hears the strategy? |
| 15-30 | Four lines of business, one ecosystem | Each line has its own vision: Upstream & Supply secures energy, Downstream transforms into low-carbon fuels and products, Energy builds new zero- and low-emission supply, Consumers & Products serves changing customer needs. Then the seams: molecules and electrons flow from supply and production to the customer; own clean energy reaches transport; storage and flexibility link generation to demand; the customer sits at the centre of the ecosystem. | p.14, 17, 33-34 | Where do the lines of business depend on each other most today? |
| 30-40 | What it takes to bring it together | The vision is integration: shared understanding, trusted data, speed of decision, safe use of AI, with partners and people. This is the strategy's own enabler list, not a technology pitch. | p.54, 55, 58, 59 | Which seam between lines of business is hardest? |
| 40-50 | Databricks as enabler | Three capabilities that help ORLEN deliver its own vision: **connect** (one governed foundation across lines of business and clouds), **anticipate** (insight and prediction where decisions are made), **act** (governed agents and apps with people in control). One line on what each means per line of business. | p.57, 59 (enabler framing inferred) | Which capability would your teams use first? |
| 50-57 | Where the vision becomes visible | The multi-energy destination is where the lines of business converge for one customer: fuels, power, charging, convenience, digital. This is the stage for the demo. | p.33, 34, 40 | What must the destination get right for a customer? |
| 57-60 | Bridge to demo | One destination, one disruption, one closed loop; judge the demo against the vision, not against features. | - | Agree the four proof points. |

### Enabler lens per line of business (inferred, to validate)

| Line of business | Vision in ORLEN's words | Connect | Anticipate | Act |
|---|---|---|---|---|
| Upstream & Supply | Secure supplies enabling long-term development of the economy (p.17) | Supply, trading and demand data on one foundation | Supply and price outlook | Governed trading and planning support |
| Downstream | Transition of the fuel mix toward more renewable energy (p.17) | Plant, maintenance and feedstock data together | Asset condition and availability | Maintenance and planning actions with approval |
| Energy | New zero- and low-emission energy; supporting decarbonisation (p.17) | Generation, storage, grid and market data | Generation and demand forecasts | Dispatch and investment-planning support |
| Consumers & Products | Integration and digitisation of consumer services (p.17) | One customer and site view across fuel, power, charging, convenience | Demand, congestion, failure risk | Offers, routing and work orders, human-approved |

### Historical rules for that proposal

- The older proposal kept all target figures in speaker notes. The current executive presentation allows a few sourced 2035 targets on slide faces and keeps financial tables and unvalidated ROI claims out.
- One idea per slide; use the strategy's own phrases and structure (p.14 ecosystem, p.17 four lines) as the visual spine.
- Name Databricks capabilities, not products, until the bridge to the demo.
- The existing technical sections (real-time decision gap, predictive intelligence, governed agentic operations, architecture) move into the demo. The shared-value discussion and the demo contract are kept.

## Open items

- **Audience:** a Group-wide room versus a C&P-only room changes the 25–37 block. Unknown.
- **Non-fuel margin basis:** p.34 says ">30% on each market"; p.40 says 40% of total margin. Confirm before quoting either.
- **Document age:** January 2025. Check for newer results or target changes before numbers go on slides.
- **Data stack:** ORLEN's actual data platforms, VITAY data landscape and any Databricks presence are unknown.
- **Proof points:** real Databricks retail and energy references are still unselected.
- **Extraction caveat:** some chart values in the PDF text were ambiguous; only figures checked against page images or consistent with the brief are used above.

## Current presentation

Use the 15-slide [executive business-case flow](PRESENTATION-FLOW.md). Its business problem and value equations are hypotheses for ORLEN validation; the 2035 targets above are sourced ambitions. The live demo remains scoped to Mobility, and its current measured-outcome gap stays explicit.
