# Facilitator runbook

## Readiness

- Status: local approval and four-action simulated execution were verified; hosted handoff and observed outcome return remain open
- Owner: Workshop facilitator
- Delivery date: To be confirmed
- Current state: `CASE-SITE-00007` is `measured` after a four-action simulated execution. Preserve its audit for review; reset only before a new rehearsal with owner approval.
- Cleanup date: To be set before deployment

## Session flow

| Phase / demo minute | Story beat | Facilitator action | Proof | Recovery cue |
|---|---|---|---|---|
| Presentation, flexible | Executive business case | Follow `PRESENTATION-FLOW.md`: ORLEN strategy, operating problem, value drivers, Elmshorn decision, and pilot decision. | Audience agrees on the decision and what customer and ORLEN value would count as proof. | Keep business-case and measurement slides; shorten optional product detail if discussion runs long. |
| Demo 0–15 | Network | From default Overview, select Network. Frame the multi-energy destination and Elmshorn hero condition, then switch MapLibre risk/demand/capacity/wait layers, filter energy and facilities, select Elmshorn, unpack its decision index, and screen Elmshorn East about 7 km straight-line away. Compare distant benchmarks and state that a real drive route remains unverified. Briefly open the ORLEN Mobility Control Tower AI/BI dashboard to confirm the shared governed Elmshorn measures, then return to the App. | Governed site/journey measures, conformed destination profile, 14 public city points plus one scenario waypoint, table fallback, 446 affected synthetic journeys, €7.1k margin exposure proxy, and the AI/BI view of the shared Metric Views. | Use the priority queue and accessible destination table if tiles fail; use the validated dashboard screenshot if AI/BI is slow. |
| Demo 15–25 | Investigate | Show synthetic Silver telemetry, ingestion lag and the historical replay gap; compare each latest observed-degradation score with the fixed rule, then inspect journey and energy/convenience context. State that the model does not forecast failure in 60 minutes. Ask Genie using exact `Expected Wait Minutes` and `High Risk Predictions` measure names; the latter counts historical score records. Select a comparison site to show action tabs stay unavailable until returning to Elmshorn. | Time-stamped evidence, observed-state ML classification, Metric Views, Genie answer and inspectable SQL. | If Genie is slow, use the validated measure values and open the full Genie space; do not use “at-risk chargers” as a prompt because Genie may confuse it with `At Risk Sites`. |
| Demo 25–35 | Response plan | Select from four scenario actions. Generate the governed recommendation, then select **Verify safety boundary** to show the actual Unity Gateway `pre_call` denial. Submit the chosen proposal separately. | Gateway response ID and named policy denial; selected action set and `pending_approval` in Lakebase; projections change with selection. | If Gateway is unavailable, label the manual scenario playbook as fallback. If the case is already pending, review the stored selection and continue. |
| Demo 35–45 | Approval & execution | Open the full-width Execution ledger first: each selected action appears before approval and gains its own timestamp, action ID, audit row and approval reference after simulated execution. Show the separate App API 403 denied-commit guard, then record human approval and simulated execution. State that Unity Gateway tool enforcement is future work. | One `action_executed` row per selected action plus a case summary row; approval trace, case status, and modelled effects. | If approval is unavailable, return to Response plan and submit first. Leave a pre-existing proposal untouched during technical checks. |
| Demo 45–55 | Outcomes | Open the action-to-outcome evidence panel first: point to each action's Lakebase audit row and the later source needed to measure impact. Then show baseline versus scenario values. | With all four actions selected: four action audit links, 38 modelled journeys, 9.4-minute modelled wait reduction, €4.8k modelled revenue protection; actual diversion, charger recovery and attribution remain unmeasured. | Use the validated scenario contract and keep actual outcomes separate. |
| Demo 55–60 | Close/reset | Restate the decision loop and executive pilot question. Reset the dedicated case only after owner approval. | `needs_review`, four available actions, no scenario impacts after approved reset. | Use the documented reset endpoint only with approval. |

## Four blocking proof points

1. Synthetic event and ingestion timestamps, refreshed governed state, and replay gap are visible; live latency is unproven.
2. The model classifies observed degradation alongside a fixed rule; future-failure lift is unproven.
3. The App enforces a proposal/approval boundary and records Lakebase audit evidence; ORLEN-specific Unity Gateway tool enforcement is planned.
4. The approved action records scenario estimates; actual customer and ORLEN outcomes need a post-action feed.

## Reset

After the owner explicitly approves reset, return the dedicated Lakebase case to its initial state:

```bash
curl -fsS -X POST \
  http://localhost:8000/api/ops/cases/CASE-SITE-00007/reset
```

If the local server selected another port, use that port. Verify `/api/ops/cases`, `/api/ops/cases/CASE-SITE-00007/actions`, and `/api/ops/cases/CASE-SITE-00007/audit`: the case must be `needs_review`, all four actions `proposed`, approval records absent from the current cycle, and all scenario impacts null. Future workshops must implement the same idempotent reset boundary for stream replay, prediction/outcome rows, agent conversation, and operational transactions.

## Known warnings

- All outcome figures are synthetic hypotheses until validated with ORLEN data.
- ORLEN-specific Unity Gateway tool enforcement is not wired. The App API's denied-commit response proves only the demo workflow guard.
- Named ORLEN locations provide public context; operational outcome figures are deterministic synthetic workshop measures.
