import { sql } from '@databricks/appkit-ui/js';
import { GenieChat, useAnalyticsQuery } from '@databricks/appkit-ui/react';

type WorkshopConfig = { catalog: string; schema: string; genieUrl: string | null };

const badge = 'rounded-full bg-orlen-red-soft px-2.5 py-1 text-[11px] font-semibold text-orlen-red';
const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6';
const format = (value: number | null | undefined, digits = 0) =>
  value == null || !Number.isFinite(Number(value))
    ? '—'
    : Number(value).toLocaleString('en-GB', { maximumFractionDigits: digits });
const percent = (value: number | null | undefined) =>
  value == null || !Number.isFinite(Number(value)) ? '—' : `${Math.round(Number(value) * 100)}%`;
const time = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'
    : '—';

function State({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (loading) return <p className="animate-pulse text-sm text-slate-500">Loading governed evidence…</p>;
  if (error)
    return (
      <p role="alert" className="text-sm font-medium text-orlen-red">
        Evidence unavailable. Check query access and refresh.
      </p>
    );
  if (empty) return <p className="text-sm text-slate-500">No evidence returned for this destination.</p>;
  return <>{children}</>;
}

export function InvestigateView({
  siteId,
  onResponsePlan,
  onReturnToHero,
  config,
}: {
  siteId: string;
  onResponsePlan: () => void;
  onReturnToHero: () => void;
  config: WorkshopConfig;
}) {
  const isHeroCase = siteId === 'SITE-00007';
  const params = {
    catalog_name: sql.string(config.catalog),
    schema_name: sql.string(config.schema),
    site_id: sql.string(siteId),
  };
  const site = useAnalyticsQuery('site_overview', params);
  const risk = useAnalyticsQuery('charger_risk', params);
  const journeys = useAnalyticsQuery('journey_outcomes', params);
  const energy = useAnalyticsQuery('energy_retail_value', params);
  const signalQuery = useAnalyticsQuery('investigation_signals', params);
  const chargerQuery = useAnalyticsQuery('investigation_chargers', params);
  const signals = signalQuery.data ?? [];
  const chargers = chargerQuery.data ?? [];
  const selected = site.data?.[0];
  const riskRows = risk.data ?? [];
  const riskPredictions = riskRows.reduce((sum, row) => sum + Number(row.high_risk_predictions ?? 0), 0);
  const predictionRecords = riskRows.reduce((sum, row) => sum + Number(row.charger_predictions ?? 0), 0);
  const latestHighRiskChargers = chargers.filter((row) => row.risk_band === 'high').length;
  const journeyRows = journeys.data ?? [];
  const affected = journeyRows.reduce((sum, row) => sum + Number(row.affected_journeys ?? 0), 0);
  const margin = journeyRows.reduce((sum, row) => sum + Number(row.journey_margin_proxy_eur ?? 0), 0);
  const energyRows = energy.data ?? [];
  const revenue = energyRows.reduce((sum, row) => sum + Number(row.total_revenue_eur ?? 0), 0);
  const newestSignal = signals[0];
  const newestCharger = chargers.reduce<(typeof chargers)[number] | undefined>(
    (latest, row) =>
      !latest || new Date(row.feature_snapshot_ts).getTime() > new Date(latest.feature_snapshot_ts).getTime()
        ? row
        : latest,
    undefined
  );
  const allLoading = site.loading || risk.loading || journeys.loading || energy.loading;
  const allError = site.error || risk.error || journeys.error || energy.error;
  const scoreGapDays =
    newestSignal && newestCharger
      ? Math.round(
          (new Date(newestCharger.scored_at).getTime() - new Date(newestSignal.latest_event_ts).getTime()) / 86400000
        )
      : null;
  const ingestionLagSeconds =
    newestSignal?.latest_event_ts && newestSignal?.latest_ingestion_ts
      ? Math.round(
          (new Date(newestSignal.latest_ingestion_ts).getTime() - new Date(newestSignal.latest_event_ts).getTime()) /
            1000
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orlen-red">ORLEN Mobility · Investigate</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {isHeroCase ? 'Why is Elmshorn at risk?' : 'How does this destination compare?'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Follow the signals from charger condition to customer journeys and destination value. All operating measures
            are synthetic workshop data.
          </p>
        </div>
        <button
          type="button"
          onClick={isHeroCase ? onResponsePlan : onReturnToHero}
          className="rounded-xl bg-orlen-red px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          {isHeroCase ? 'Build response plan →' : 'Return to Elmshorn case →'}
        </button>
      </div>

      <section className="rounded-2xl border border-orlen-red bg-orlen-red-soft p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orlen-red">Selected destination · {siteId}</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">
              {selected?.site_name ?? (site.loading ? 'Loading destination…' : siteId)}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {selected?.city ?? '—'}, {selected?.country ?? '—'} ·{' '}
              {selected?.road_context ?? 'Road context unavailable'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={badge}>Unity Catalog</span>
            <span className={badge}>Metric Views</span>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              'Expected charging wait',
              selected ? `${format(selected.expected_wait_minutes, 1)} min` : '—',
              'Modelled snapshot · site performance',
            ],
            [
              'Chargers ready',
              selected ? format(selected.available_chargers) : '—',
              'Modelled snapshot · site performance',
            ],
            [
              'High-risk score records',
              riskRows.length ? format(riskPredictions) : '—',
              `${riskRows.length ? format(predictionRecords) : '—'} historical scores · ${latestHighRiskChargers} ${latestHighRiskChargers === 1 ? 'charger' : 'chargers'} high on latest historical score`,
            ],
            [
              'Affected journeys',
              journeyRows.length ? format(affected) : '—',
              'Modelled scenario window · journey value',
            ],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-xl border border-orlen-red/20 bg-white p-4">
              <p className="text-xs font-semibold text-slate-600">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
        {allLoading ? <p className="mt-3 text-xs text-slate-600">Loading destination measures…</p> : null}
        {allError ? (
          <p role="alert" className="mt-3 text-xs font-semibold text-orlen-red">
            Some destination measures are unavailable. Missing values are shown as —.
          </p>
        ) : null}
      </section>

      {scoreGapDays !== null && scoreGapDays > 1 ? (
        <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          <strong>Historical replay:</strong> the latest displayed telemetry is {time(newestSignal?.latest_event_ts)},
          while the latest model score is {time(newestCharger?.scored_at)}. They are {scoreGapDays} days apart and
          should not be read as a live, simultaneous incident.
        </div>
      ) : null}

      <section className={`${card} border-l-4 border-l-orlen-red`} aria-label="Decision summary">
        <p className="text-xs font-bold uppercase tracking-wide text-orlen-red">
          Decision finding · historical synthetic replay
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          {isHeroCase
            ? 'Investigate charger condition before routing Elmshorn journeys'
            : 'Compare this destination with the Elmshorn incident'}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {chargers.length
            ? `${latestHighRiskChargers} of ${chargers.length} scored ${chargers.length === 1 ? 'charger' : 'chargers'} ${latestHighRiskChargers === 1 ? 'has' : 'have'} a high latest historical classification score. `
            : 'Charger-level scores are loading or unavailable. '}
          {journeyRows.length
            ? `${format(affected)} journeys are marked affected in the modelled scenario window. `
            : 'Journey exposure is unavailable. '}
          {isHeroCase
            ? 'A manager can review the bounded response after verifying the destination and route.'
            : 'Actions are scoped to the Elmshorn case; this site is comparison evidence only.'}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          This classification and the modelled journey count do not quantify incident-attributable loss or prove a
          future failure.
        </p>
      </section>

      <div className="space-y-6">
        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">Signal history</h3>
              <p className="mt-1 text-sm text-slate-500">
                Site-wide hourly charger signals · oldest to newest · 10% fixed-rule error threshold
              </p>
            </div>
            <span className={badge}>Lakeflow</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Latest event: {time(newestSignal?.latest_event_ts)} · pipeline arrival:{' '}
            {time(newestSignal?.latest_ingestion_ts)} · event-to-ingestion lag:{' '}
            {ingestionLagSeconds == null ? '—' : `${ingestionLagSeconds} s`}
          </p>
          <div className="mt-5">
            <State loading={signalQuery.loading} error={signalQuery.error} empty={!signals.length}>
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {[...signals].reverse().map((row) => (
                  <div
                    key={row.signal_hour}
                    className="grid grid-cols-[112px_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{time(row.signal_hour)}</p>
                      <p className="text-xs text-slate-500">
                        {format(row.observations)} observations · {format(row.observed_chargers)} chargers
                      </p>
                    </div>
                    <div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-orlen-red"
                          style={{
                            width: `${Math.max(2, Math.min(100, Number(row.highest_temperature_c ?? 0)))}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">Peak temperature · 0–100 °C scale</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orlen-red">{format(row.highest_temperature_c, 1)} °C</p>
                      <p className="text-xs text-slate-500">{percent(row.highest_error_rate)} peak error</p>
                    </div>
                  </div>
                ))}
              </div>
            </State>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Observed synthetic telemetry. Bars show each hour&apos;s peak temperature on a 0–100 °C scale, not failure
            probability. Peak error above 10% can trigger the fixed-rule comparator; the model score is shown
            separately.
          </p>
        </section>

        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">Observed degradation classification</h3>
              <p className="mt-1 text-sm text-slate-500">
                Latest score per charger, separate from historical score-record counts
              </p>
            </div>
            <span className={badge}>MLflow + ML</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Latest scoring: {time(newestCharger?.scored_at)} · observed-state label · model version:{' '}
            {newestCharger?.model_version ?? '—'}
          </p>
          <div className="mt-5">
            <State loading={chargerQuery.loading} error={chargerQuery.error} empty={!chargers.length}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                {chargers.map((row) => (
                  <div
                    key={row.charger_id}
                    className={`rounded-xl border p-3 ${row.risk_band === 'high' ? 'border-orlen-red bg-orlen-red-soft' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-950">{row.charger_id}</p>
                      <span className="text-xs font-semibold uppercase text-slate-500">{row.risk_band}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      At {selected?.site_name ?? siteId} · score linked by destination ID {siteId}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Observed: {time(row.feature_snapshot_ts)}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-semibold text-orlen-red">{percent(row.failure_probability)}</p>
                        <p className="text-xs text-slate-500">Model classification score</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-700">{percent(row.baseline_probability)}</p>
                        <p className="text-xs text-slate-500">Fixed-rule baseline</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </State>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {chargers.length} distinct chargers have a latest historical score; {latestHighRiskChargers} score high on
            that basis.{' '}
            {riskRows.length
              ? `${format(riskPredictions)} high-risk score records`
              : 'The historical score count is unavailable'}{' '}
            for this destination do not count distinct chargers.
          </p>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Evidence chain</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Observed charger condition → degradation classification → modelled customer-journey exposure.{' '}
              {isHeroCase
                ? 'The response plan uses this historical evidence to target maintenance and test a customer alternative.'
                : 'This comparison provides context for the Elmshorn decision; it has no action plan.'}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              The model classifies the same observation&apos;s degraded status. It does not forecast failure in the next
              60 minutes or establish a causal explanation. A future-outcome label and aligned replay are needed before
              making that claim.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">Customer journeys exposed</h3>
              <p className="mt-1 text-sm text-slate-500">Which customer groups carry the disruption?</p>
            </div>
            <span className={badge}>Metric Views</span>
          </div>
          <div className="mt-5">
            <State loading={journeys.loading} error={journeys.error} empty={!journeyRows.length}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs text-slate-500">
                    <tr>
                      <th className="pb-3">Segment</th>
                      <th className="pb-3 text-right">Affected</th>
                      <th className="pb-3 text-right">Avg wait</th>
                      <th className="pb-3 text-right">Margin proxy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journeyRows.map((row) => (
                      <tr key={row.customer_segment} className="border-b border-slate-100">
                        <td className="py-3 font-medium capitalize text-slate-900">
                          {row.customer_segment.replaceAll('_', ' ')}
                        </td>
                        <td className="py-3 text-right font-semibold text-orlen-red">
                          {format(row.affected_journeys)}
                        </td>
                        <td className="py-3 text-right">{format(row.average_wait_minutes, 1)} min</td>
                        <td className="py-3 text-right">€{format(row.journey_margin_proxy_eur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </State>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Margin proxy across all journeys shown: €{journeyRows.length ? format(margin) : '—'}. This is context, not
            incident loss.
          </p>
        </section>
        <section className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">Destination economics</h3>
              <p className="mt-1 text-sm text-slate-500">Energy and convenience activity in the modelled window</p>
            </div>
            <span className={badge}>Metric Views</span>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Total revenue context:{' '}
            <strong className="text-slate-950">€{energyRows.length ? format(revenue) : '—'}</strong>. It is not the
            amount at risk from this case.
          </p>
          <div className="mt-4">
            <State loading={energy.loading} error={energy.error} empty={!energyRows.length}>
              <div className="space-y-2">
                {energyRows.map((row) => (
                  <div
                    key={`${row.energy_type}-${row.service_type}`}
                    className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium capitalize text-slate-800">
                      {row.energy_type} · {row.service_type.replaceAll('_', ' ')}
                    </span>
                    <span className="text-right text-slate-700">
                      €{format(row.total_revenue_eur)} <span className="text-xs text-slate-500">revenue</span>
                    </span>
                  </div>
                ))}
              </div>
            </State>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">Ask a follow-up in Genie</h3>
              <p className="mt-1 text-sm text-slate-500">
                Open the governed ORLEN Mobility Decision Intelligence space
              </p>
            </div>
            <span className={badge}>Genie</span>
          </div>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            “For {siteId}, show Expected Wait Minutes and High Risk Predictions.”
          </p>
          <div className="mt-4 h-[240px] overflow-hidden rounded-xl border border-slate-200">
            <GenieChat
              alias="default"
              placeholder={`Ask about ${siteId} using governed ORLEN Mobility data…`}
              className="h-full"
            />
          </div>
          {config.genieUrl ? (
            <a
              href={config.genieUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-xl border border-orlen-red px-4 py-2 text-sm font-semibold text-orlen-red hover:bg-orlen-red-soft"
            >
              Open full Genie space ↗
            </a>
          ) : null}
          <p className="mt-3 text-xs text-slate-500">
            AI-generated — verify. At Risk Sites counts destinations; High Risk Predictions counts score records.
            Inspect generated SQL and measures in the answer. The full Genie space shows source context and execution
            identity; local development uses the configured user-scoped Genie permission.
          </p>
        </section>
        <section className="rounded-2xl border border-orlen-red bg-orlen-red-soft p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-slate-950">What the evidence supports</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li>
              <strong>Service:</strong>{' '}
              {selected
                ? `${format(selected.available_chargers)} ${Number(selected.available_chargers) === 1 ? 'charger' : 'chargers'} ready and ${format(selected.expected_wait_minutes, 1)} min modelled wait.`
                : 'Awaiting site evidence.'}
            </li>
            <li>
              <strong>Risk:</strong>{' '}
              {riskRows.length
                ? `${format(riskPredictions)} high-risk score records; inspect the latest per-charger scores above.`
                : 'Awaiting model evidence.'}
            </li>
            <li>
              <strong>Customers:</strong>{' '}
              {journeyRows.length
                ? `${format(affected)} journeys affected in the modelled scenario window.`
                : 'Awaiting journey evidence.'}
            </li>
          </ul>
          {isHeroCase ? (
            <p className="mt-4 text-xs leading-5 text-slate-600">
              Before routing customers to ORLEN Charge Elmshorn East, verify its real address, drive route, and current
              charger capacity. It is a scenario candidate.
            </p>
          ) : (
            <p className="mt-4 text-xs leading-5 text-slate-600">
              This destination is a network comparison. The action workflow currently belongs to the Elmshorn hero case.
            </p>
          )}
          <button
            type="button"
            onClick={isHeroCase ? onResponsePlan : onReturnToHero}
            className="mt-5 rounded-xl bg-orlen-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {isHeroCase ? 'Continue to response plan →' : 'Return to Elmshorn hero case →'}
          </button>
        </section>
      </div>
    </div>
  );
}
