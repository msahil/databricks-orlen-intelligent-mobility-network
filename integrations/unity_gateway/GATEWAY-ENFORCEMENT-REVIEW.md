# ORLEN Mobility — live Unity Gateway enforcement review

Reviewed 2026-11-21. Scope: the Elmshorn hero case and the current local App/Lakebase action path. No Gateway resource or grant was created or changed in this review.

**Subsequent result, 2026-11-21:** Path B was implemented and tested. The enforcing input policy on `orlen_mobility_recommendations` allowed the cautious request and returned a named `pre_call` deny for the unsafe request. The full prompts and Gateway response evidence are in [ORLEN-RECOMMENDATION-GATEWAY-SPEC.md](ORLEN-RECOMMENDATION-GATEWAY-SPEC.md). App integration and observed impact remain open; the action commit is still App-controlled. The review below is the pre-implementation assessment.

## Current proof

- The four-action Lakebase rehearsal passed, including an App route that returns HTTP 403 for direct commit. That route does **not** call Unity Gateway.
- The current App API approves using a forwarded identity header or the `workshop-local-user` fallback and writes `demo_bounded_action` as its policy label. That label is not a Gateway policy decision.
- The execution route writes predefined scenario effects to Lakebase. It has no Gateway call, expiring approval check, or observed outcome feed.
- The workspace CLI is v1.20.0 and exposes `databricks ai-gateway` MCP service operations. The installed pinned Databricks skills lack `databricks-unity-gateway`; the upstream `main` skill is version 0.1.0 and was used for this review.

## Feasible live enforcement paths

| Path | Genuine Gateway proof | Relationship to the hero case | Dependency |
|---|---|---|---|
| **A. Govern an ORLEN external MCP tool** | Unity Catalog `EXECUTE`, exact tool selectors, and a Gateway service policy can allow, deny, or ask before an MCP tool call. An approved commit would also require backend validation of a real, current approval. | Direct proof on the operations action. | A separate Streamable HTTP MCP server reachable from the workspace, an HTTP Unity Catalog connection with suitable authentication, a named MCP service, and the Unity Gateway Service Policies Beta preview for content/approval policy. |
| **B. Govern an ORLEN recommendation model service** | A model service and attached Gateway input/output policy can allow or deny a recommendation request. | Genuine enforcement on the recommendation beat; the subsequent Lakebase commit remains App-controlled and must be described separately. | An approved model destination, model service, policy function/preview, and App or agent call through the service. |

**Selected 2026-11-21:** The user chose path B, Gateway enforcement on the recommendation. The concrete service, policy, App boundary, and proof are in [ORLEN-RECOMMENDATION-GATEWAY-SPEC.md](ORLEN-RECOMMENDATION-GATEWAY-SPEC.md). This selection does not change the App-controlled commit or turn simulated effects into observed impact.

## Constraint found in current documentation

An external MCP service is backed by a Unity Catalog HTTP connection to a Streamable HTTP MCP server. The current Databricks registration guide explicitly says registering a **Databricks App** as one's own MCP service is unsupported. The existing ORLEN App cannot simply be pointed at `create-mcp-service` to govern its `/api/ops/...` routes. A separate supported backend is required for path A. Gateway service policies are Beta and require the workspace preview to be enabled by an admin. Unity Catalog grants and tool selectors can govern access even without that preview; a content-based `DENY`/`ASK` demonstration requires it.

## Minimum proof for path A

1. Expose only `orlen_mobility_read_case` and `orlen_mobility_commit_response` from a supported external MCP server. The commit backend validates the site, action type, authenticated caller, approval ID, approver, expiry, and idempotency key against Lakebase before writing.
2. Register an HTTP connection and ORLEN-prefixed MCP service in the workshop catalog/schema, with exact tool selectors. Give the agent `EXECUTE` on the service and only the necessary parent `USE` privileges; do not grant it direct access to the source connection or Lakebase write credentials.
3. If the preview is enabled, attach a service policy that denies an out-of-scope call and asks for approval before the commit tool. Keep the backend approval check because a Gateway prompt is not a substitute for durable business authorization.
4. Call the tool through the Gateway service URL. Capture one allowed read, one denied/unapproved commit, one approved commit, and the actual policy/identity/trace evidence. Reset the dedicated Lakebase case after the run.

The exact MCP source connection, service ID, host/auth method, tool selectors, caller principal, and preview state are not yet established. The upstream Gateway skill requires these inputs before creating an MCP service and forbids omitting tool selectors without explicit approval.

## Sources

- [Databricks Unity Gateway skill, `main`](https://github.com/databricks/databricks-agent-skills/blob/main/skills/databricks-unity-gateway/SKILL.md) and its [MCP service](https://github.com/databricks/databricks-agent-skills/blob/main/skills/databricks-unity-gateway/references/mcp-services.md) and [permission](https://github.com/databricks/databricks-agent-skills/blob/main/skills/databricks-unity-gateway/references/permissions.md) references.
- [Register an external MCP server](https://docs.databricks.com/aws/en/ai-gateway/register-mcp-service) (App registration limitation, server and connection requirements).
- [Service policies for AI securables](https://docs.databricks.com/data-governance/unity-catalog/service-policies/) (Beta preview, `ALLOW`/`DENY`/`ASK` behavior).
