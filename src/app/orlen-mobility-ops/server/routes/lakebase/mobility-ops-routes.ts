import { z } from 'zod';
import { Application } from 'express';
import { setupRecommendationRoutes } from '../gateway/recommendation-routes';

interface AppKitWithLakebase {
  lakebase: {
    query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  };
  server: { extend(fn: (app: Application) => void): void };
}

const schema = 'orlen_mobility_ops';
const proposalBody = z.object({
  siteId: z.literal('SITE-00007'),
  actionTypes: z
    .array(z.enum(['maintenance_inspection', 'customer_routing', 'inventory_preparation', 'vitay_communication']))
    .min(1),
  notes: z.string().max(2000).optional(),
});

const setupSql = `
CREATE SCHEMA IF NOT EXISTS ${schema};
CREATE TABLE IF NOT EXISTS ${schema}.mobility_ops_response_cases (
  case_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL DEFAULT 'workshop-app',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ${schema}.mobility_ops_response_actions (
  action_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES ${schema}.mobility_ops_response_cases(case_id),
  action_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  parameters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'proposed',
  expected_impact_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  realized_impact_json JSONB,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ${schema}.mobility_ops_approvals (
  approval_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES ${schema}.mobility_ops_response_cases(case_id),
  decision TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  policy_decision TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ${schema}.mobility_ops_action_events (
  event_id BIGSERIAL PRIMARY KEY,
  case_id TEXT NOT NULL,
  action_id TEXT,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

const seedSql = `
INSERT INTO ${schema}.mobility_ops_response_cases (case_id, site_id, status, title, evidence_json)
VALUES ('CASE-SITE-00007', 'SITE-00007', 'needs_review',
  'Protect the SITE-00007 customer journey',
  '{"trigger":"synthetic historical holiday corridor replay","expected_wait_minutes":16.76,"available_chargers":9,"historical_high_score_records":24,"latest_high_chargers":1,"prediction_horizon_minutes":0}'::jsonb)
ON CONFLICT (case_id) DO NOTHING;
INSERT INTO ${schema}.mobility_ops_response_actions (action_id, case_id, action_type, target_id, parameters_json, expected_impact_json, idempotency_key)
VALUES
 ('ACTION-INSPECT-00007','CASE-SITE-00007','maintenance_inspection','SITE-00007-CHG-06','{"priority":"high","window":"next operational interval"}'::jsonb,'{"wait_minutes_reduction":5,"uptime_points":8}'::jsonb,'orlen-case-00007-inspect'),
 ('ACTION-ROUTE-00007','CASE-SITE-00007','customer_routing','SITE-00007','{"alternatives":["SITE-00015"],"eligible_segments":["family","long_distance"],"scenario_site":true,"route_verified":false}'::jsonb,'{"wait_minutes_reduction":4.4,"journeys_protected":38}'::jsonb,'orlen-case-00007-route'),
 ('ACTION-INVENTORY-00007','CASE-SITE-00007','inventory_preparation','SITE-00007','{"owner":"commercial","scope":"Stop Cafe readiness"}'::jsonb,'{"scenario_only":true}'::jsonb,'orlen-case-00007-inventory'),
 ('ACTION-VITAY-00007','CASE-SITE-00007','vitay_communication','VITAY','{"offer":"bounded convenience benefit","requires_approval":true}'::jsonb,'{"revenue_protected_eur":4800}'::jsonb,'orlen-case-00007-vitay')
ON CONFLICT (action_id) DO NOTHING;
UPDATE ${schema}.mobility_ops_response_cases
SET evidence_json = '{"trigger":"synthetic historical holiday corridor replay","expected_wait_minutes":16.76,"available_chargers":9,"historical_high_score_records":24,"latest_high_chargers":1,"prediction_horizon_minutes":0}'::jsonb
WHERE case_id = 'CASE-SITE-00007';
UPDATE ${schema}.mobility_ops_response_actions
SET target_id = 'SITE-00007-CHG-06'
WHERE action_id = 'ACTION-INSPECT-00007' AND status = 'proposed';
UPDATE ${schema}.mobility_ops_response_actions
SET expected_impact_json = '{"wait_minutes_reduction":4.4,"journeys_protected":38}'::jsonb
WHERE action_id = 'ACTION-ROUTE-00007';
UPDATE ${schema}.mobility_ops_response_actions
SET expected_impact_json = '{"revenue_protected_eur":4800}'::jsonb
WHERE action_id = 'ACTION-VITAY-00007';
UPDATE ${schema}.mobility_ops_response_actions
SET parameters_json = '{"alternatives":["SITE-00015"],"eligible_segments":["family","long_distance"],"scenario_site":true,"route_verified":false}'::jsonb
WHERE action_id = 'ACTION-ROUTE-00007' AND status = 'proposed';`;

export async function setupMobilityOpsRoutes(appkit: AppKitWithLakebase) {
  try {
    await appkit.lakebase.query(setupSql);
    await appkit.lakebase.query(seedSql);
    console.log(`[lakebase] ${schema} operational schema is ready`);
  } catch (err) {
    console.warn('[lakebase] operational setup failed:', (err as Error).message);
  }

  appkit.server.extend((app) => {
    setupRecommendationRoutes(app, appkit.lakebase);
    app.get('/api/workshop-config', (_req, res) => {
      const workspaceHost = process.env.ORLEN_WORKSPACE_HOST || process.env.DATABRICKS_HOST;
      const genieSpaceId = process.env.DATABRICKS_GENIE_SPACE_ID;
      res.json({
        customer: 'ORLEN',
        businessUnit: 'Mobility',
        // DAB deployments inject these values from required variables. The
        // direct Apps API fallback does not currently propagate app.yaml
        // value entries, so retain the workshop deployment values only when
        // the runtime variables are absent.
        catalog: process.env.ORLEN_CATALOG || 'msahil_demo_workspace_catalog',
        schema: process.env.ORLEN_SCHEMA || 'orlen_intelligent_mobility',
        genieUrl:
          workspaceHost && genieSpaceId
            ? `${workspaceHost.replace(/\/$/, '')}/genie/rooms/${encodeURIComponent(genieSpaceId)}`
            : null,
        lakebaseSchema: schema,
        heroSite: 'SITE-00007',
      });
    });

    app.get('/api/ops/cases', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(
          `SELECT * FROM ${schema}.mobility_ops_response_cases ORDER BY updated_at DESC`
        );
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: 'Unable to load response cases', detail: (err as Error).message });
      }
    });

    app.get('/api/ops/cases/:caseId/actions', async (req, res) => {
      try {
        const result = await appkit.lakebase.query(
          `SELECT * FROM ${schema}.mobility_ops_response_actions WHERE case_id = $1 ORDER BY created_at`,
          [req.params.caseId]
        );
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: 'Unable to load response actions', detail: (err as Error).message });
      }
    });

    app.get('/api/ops/cases/:caseId/audit', async (req, res) => {
      try {
        const [events, approvals] = await Promise.all([
          appkit.lakebase.query(
            `SELECT event_id, action_id, event_type, payload_json, occurred_at FROM ${schema}.mobility_ops_action_events WHERE case_id = $1 AND occurred_at >= COALESCE((SELECT MAX(occurred_at) FROM ${schema}.mobility_ops_action_events WHERE case_id = $1 AND event_type = 'case_reset'), 'epoch'::timestamptz) ORDER BY occurred_at, event_id`,
            [req.params.caseId]
          ),
          appkit.lakebase.query(
            `SELECT a.decision, a.approved_by, a.policy_decision, a.trace_id, a.approved_at FROM ${schema}.mobility_ops_approvals a JOIN ${schema}.mobility_ops_response_cases c ON c.case_id = a.case_id WHERE a.case_id = $1 AND c.status IN ('approved', 'measured') AND a.approved_at >= COALESCE((SELECT MAX(occurred_at) FROM ${schema}.mobility_ops_action_events WHERE case_id = $1 AND event_type = 'case_reset'), 'epoch'::timestamptz) ORDER BY a.approved_at DESC`,
            [req.params.caseId]
          ),
        ]);
        res.json({ events: events.rows, approvals: approvals.rows });
      } catch (err) {
        res.status(500).json({ error: 'Unable to load case audit', detail: (err as Error).message });
      }
    });

    app.post('/api/ops/proposals', async (req, res) => {
      const parsed = proposalBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Elmshorn siteId and at least one supported action are required' });
        return;
      }
      const caseId = `CASE-${parsed.data.siteId}`;
      try {
        const selected = parsed.data.actionTypes;
        const existing = await appkit.lakebase.query(
          `SELECT action_type FROM ${schema}.mobility_ops_response_actions WHERE case_id = $1`,
          [caseId]
        );
        if (selected.some((type) => !existing.rows.some((row) => row.action_type === type))) {
          res.status(400).json({ error: 'One or more selected actions are unavailable for this case' });
          return;
        }
        const changed = await appkit.lakebase.query(
          `WITH changed AS (
             UPDATE ${schema}.mobility_ops_response_cases SET status = 'pending_approval', updated_at = NOW()
             WHERE case_id = $1 AND status IN ('needs_review', 'draft') RETURNING case_id
           ), selected AS (
             UPDATE ${schema}.mobility_ops_response_actions a
             SET status = CASE WHEN a.action_type = ANY($2::text[]) THEN 'proposed' ELSE 'excluded' END,
                 realized_impact_json = NULL
             FROM changed WHERE a.case_id = changed.case_id RETURNING a.action_id
           ) SELECT changed.case_id FROM changed`,
          [caseId, selected]
        );
        if (!changed.rows.length) {
          res.status(409).json({ error: 'Case must be in needs-review state before proposal' });
          return;
        }
        await appkit.lakebase.query(
          `INSERT INTO ${schema}.mobility_ops_action_events (case_id, event_type, payload_json) VALUES ($1, 'proposal_submitted', $2::jsonb)`,
          [
            caseId,
            JSON.stringify({
              notes: parsed.data.notes ?? '',
              actionTypes: selected,
              submittedBy: 'workshop-local-user',
            }),
          ]
        );
        res.status(201).json({ caseId, status: 'pending_approval', policyDecision: 'review_required' });
      } catch (err) {
        res.status(500).json({ error: 'Unable to submit proposal', detail: (err as Error).message });
      }
    });

    app.post('/api/ops/cases/:caseId/approve', async (req, res) => {
      const approvalId = `APPROVAL-${req.params.caseId}`;
      const traceId = `TRACE-${Date.now()}`;
      try {
        const approver = String(
          req.headers['x-forwarded-email'] ?? req.headers['x-forwarded-user'] ?? 'workshop-local-user'
        );
        const changed = await appkit.lakebase.query(
          `WITH changed AS (
             UPDATE ${schema}.mobility_ops_response_cases SET status = 'approved', updated_at = NOW()
             WHERE case_id = $2 AND status = 'pending_approval' RETURNING case_id
           ), approval AS (
             INSERT INTO ${schema}.mobility_ops_approvals (approval_id, case_id, decision, approved_by, policy_decision, trace_id)
             SELECT $1, case_id, 'approved', $3, 'demo_bounded_action', $4 FROM changed
             ON CONFLICT (approval_id) DO UPDATE SET approved_by = EXCLUDED.approved_by,
               trace_id = EXCLUDED.trace_id, approved_at = NOW() RETURNING approval_id
           ) SELECT changed.case_id FROM changed`,
          [approvalId, req.params.caseId, approver, traceId]
        );
        if (!changed.rows.length) {
          res.status(409).json({ error: 'Submit a proposal before approval' });
          return;
        }
        await appkit.lakebase.query(
          `INSERT INTO ${schema}.mobility_ops_action_events (case_id, event_type, payload_json) VALUES ($1, 'response_approved', $2::jsonb)`,
          [req.params.caseId, JSON.stringify({ approver, traceId, policy: 'demo_bounded_action' })]
        );
        res.json({ caseId: req.params.caseId, status: 'approved', approvalId, traceId });
      } catch (err) {
        res.status(500).json({ error: 'Unable to approve response', detail: (err as Error).message });
      }
    });

    app.post('/api/ops/cases/:caseId/execute', async (req, res) => {
      const traceId = `EXEC-${Date.now()}`;
      try {
        const current = await appkit.lakebase.query(
          `SELECT status FROM ${schema}.mobility_ops_response_cases WHERE case_id = $1`,
          [req.params.caseId]
        );
        if (current.rows[0]?.status !== 'approved') {
          res.status(409).json({ error: 'Case must be approved before execution' });
          return;
        }
        const approval = await appkit.lakebase.query(
          `SELECT approval_id, trace_id FROM ${schema}.mobility_ops_approvals WHERE case_id = $1 AND decision = 'approved' ORDER BY approved_at DESC LIMIT 1`,
          [req.params.caseId]
        );
        if (!approval.rows[0]) {
          res.status(403).json({ error: 'Execution denied', reason: 'A valid approval is required before execution.' });
          return;
        }
        const execution = await appkit.lakebase.query(
          `WITH case_transition AS (
             UPDATE ${schema}.mobility_ops_response_cases c
             SET status = 'measured', updated_at = NOW()
             WHERE c.case_id = $1 AND c.status = 'approved'
               AND EXISTS (SELECT 1 FROM ${schema}.mobility_ops_response_actions a WHERE a.case_id = c.case_id AND a.status IN ('proposed', 'approved'))
             RETURNING c.case_id
           ), executed_actions AS (
             UPDATE ${schema}.mobility_ops_response_actions a
             SET status = 'executed',
                 realized_impact_json = CASE a.action_type
                   WHEN 'maintenance_inspection' THEN '{"wait_minutes_reduction":5}'::jsonb
                   WHEN 'customer_routing' THEN '{"wait_minutes_reduction":4.4,"journeys_protected":38}'::jsonb
                   WHEN 'vitay_communication' THEN '{"revenue_protected_eur":4800}'::jsonb
                   WHEN 'inventory_preparation' THEN '{"scenario_preparation":1}'::jsonb
                   ELSE '{}'::jsonb
                 END
             FROM case_transition c
             WHERE a.case_id = c.case_id AND a.status IN ('proposed', 'approved')
             RETURNING a.action_id, a.case_id, a.action_type, a.target_id
           ), action_audit AS (
             INSERT INTO ${schema}.mobility_ops_action_events (case_id, action_id, event_type, payload_json)
             SELECT a.case_id, a.action_id, 'action_executed',
               jsonb_build_object('executionId', $2::text, 'approvalId', $3::text,
                 'approvalTraceId', $4::text, 'actionType', a.action_type,
                 'targetId', a.target_id, 'effectBasis', 'deterministic_scenario')
             FROM executed_actions a
             RETURNING event_id
           ), case_audit AS (
             INSERT INTO ${schema}.mobility_ops_action_events (case_id, event_type, payload_json)
             SELECT c.case_id, 'response_executed',
               jsonb_build_object('executionId', $2::text, 'approvalId', $3::text,
                 'approvalTraceId', $4::text, 'actionCount', (SELECT COUNT(*) FROM action_audit),
                 'effectBasis', 'deterministic_scenario')
             FROM case_transition c WHERE EXISTS (SELECT 1 FROM action_audit)
             RETURNING event_id
           )
           SELECT c.case_id, (SELECT COUNT(*) FROM action_audit) AS action_event_count
           FROM case_transition c WHERE EXISTS (SELECT 1 FROM case_audit)`,
          [req.params.caseId, traceId, approval.rows[0].approval_id, approval.rows[0].trace_id]
        );
        if (!execution.rows.length) {
          res.status(409).json({ error: 'Case must still be approved with selected actions before execution' });
          return;
        }
        res.json({
          caseId: req.params.caseId,
          status: 'measured',
          traceId,
          approvalId: approval.rows[0].approval_id,
          actionEventCount: Number(execution.rows[0].action_event_count),
        });
      } catch (err) {
        res.status(500).json({ error: 'Unable to execute response', detail: (err as Error).message });
      }
    });

    app.post('/api/ops/cases/:caseId/reset', async (req, res) => {
      try {
        await appkit.lakebase.query(
          `UPDATE ${schema}.mobility_ops_response_cases SET status = 'needs_review', updated_at = NOW() WHERE case_id = $1`,
          [req.params.caseId]
        );
        await appkit.lakebase.query(`DELETE FROM ${schema}.mobility_ops_approvals WHERE case_id = $1`, [
          req.params.caseId,
        ]);
        await appkit.lakebase.query(
          `UPDATE ${schema}.mobility_ops_response_actions SET status = 'proposed', realized_impact_json = NULL WHERE case_id = $1`,
          [req.params.caseId]
        );
        await appkit.lakebase.query(
          `INSERT INTO ${schema}.mobility_ops_action_events (case_id, event_type, payload_json) VALUES ($1, 'case_reset', '{}'::jsonb)`,
          [req.params.caseId]
        );
        res.json({ caseId: req.params.caseId, status: 'needs_review' });
      } catch (err) {
        res.status(500).json({ error: 'Unable to reset response case', detail: (err as Error).message });
      }
    });

    app.post('/api/ops/cases/:caseId/commit-without-approval', (_req, res) => {
      res
        .status(403)
        .json({ error: 'Commit denied', reason: 'A recorded approval and the approved execution path are required.' });
    });
  });
}
