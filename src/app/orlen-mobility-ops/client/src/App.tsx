import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { sql } from '@databricks/appkit-ui/js';
import { useAnalyticsQuery } from '@databricks/appkit-ui/react';
import { NetworkDecisionMap } from './NetworkDecisionMap';
import type { DestinationProfile, JourneyExposure, MapLayer, NetworkRow, NetworkSite } from './network-model';
import {
  distanceKm,
  enrichNetwork,
  facilities,
  marginExposure,
  networkRiskBand,
  networkRiskScore,
  numeric,
  publicCoordinates,
  services,
  snapshotAgeHours,
} from './network-model';

const InvestigateView = lazy(() => import('./InvestigateView').then((module) => ({ default: module.InvestigateView })));
const appTabs = ['Overview', 'Network', 'Investigate', 'Response plan', 'Approval & execution', 'Outcomes'] as const;
type WorkshopConfig = { catalog: string; schema: string; genieUrl: string | null };

function destinationLabel(siteId: string) {
  return siteId === 'SITE-00007' ? 'ORLEN Charge Hub Elmshorn' : siteId;
}

type NetworkFilters = {
  country: string;
  stationFormat: string;
  operatingStatus: string;
  riskBand: string;
  energy: string;
  facility: string;
  freshness: string;
};

const emptyNetworkFilters: NetworkFilters = {
  country: 'All markets',
  stationFormat: 'All formats',
  operatingStatus: 'All operating states',
  riskBand: 'All risk bands',
  energy: 'All energy services',
  facility: 'All facilities',
  freshness: 'All snapshots',
};

const mapLayerGuides: Record<
  MapLayer,
  {
    title: string;
    meaning: string;
    bins: [string, string, string];
    cluster: string;
  }
> = {
  Risk: {
    title: 'Decision priority',
    meaning:
      'A scenario index combines service state, affected journeys, margin exposure and demand. It is not an ML score.',
    bins: ['Stable: 0–24', 'Watch: 25–64', 'Critical: 65–100'],
    cluster: 'Cluster color shows the highest risk present; the number is the destination count.',
  },
  Demand: {
    title: 'Traffic demand pressure',
    meaning:
      'A synthetic traffic demand index relative to the scenario baseline. The heat layer shows where higher demand is concentrated.',
    bins: ['Below 1.4×', '1.4–<2.0×', '2.0× or higher'],
    cluster: 'Cluster color and number show the average demand index.',
  },
  Capacity: {
    title: 'EV chargers ready',
    meaning:
      'Available chargers in the modelled operating snapshot. This is service capacity, not installed charger count or live utilization.',
    bins: ['0 ready', '1–2 ready', '3+ ready'],
    cluster: 'Cluster color uses the average ready chargers per destination; the number is the total ready.',
  },
  Wait: {
    title: 'Expected charging wait',
    meaning:
      'Modelled minutes before an EV journey can begin charging. This is an estimate, not an observed live queue.',
    bins: ['Under 12 min', '12–<16 min', '16 min or more'],
    cluster: 'Cluster color and number show the average expected wait in minutes.',
  },
};

function assessAlternative(candidate: NetworkSite, selected: NetworkSite, energy: string, facility: string) {
  const start = publicCoordinates(selected);
  const end = publicCoordinates(candidate);
  const distance = start && end ? distanceKm(start, end) : null;
  const serviceFit = services(candidate).includes(energy);
  const facilityFit = facility === 'Any facility' || facilities(candidate).includes(facility);
  const powerFit = energy !== 'ev' || numeric(candidate.profile?.max_charger_kw) >= 300;
  const capacityFit =
    (energy !== 'ev' || numeric(candidate.available_chargers) >= 1) && numeric(candidate.expected_wait_minutes) <= 12;
  const demandFit = numeric(candidate.traffic_demand_index) <= 1.8;
  const localFit = distance !== null && distance <= 120 && selected.country === candidate.country;
  const operationalFit = serviceFit && facilityFit && powerFit && capacityFit && demandFit;
  const status =
    operationalFit && localFit ? 'Nearby screen pass' : operationalFit ? 'Network benchmark' : 'Service mismatch';
  const issues = [
    !serviceFit && `${energy.toUpperCase()} unavailable`,
    !facilityFit && `${facility.replaceAll('_', ' ')} unavailable`,
    !powerFit && 'below 300 kW',
    !capacityFit && 'capacity or wait threshold',
    !demandFit && 'high demand',
    !localFit && 'outside local screening area',
  ].filter((issue): issue is string => Boolean(issue));
  return { site: candidate, distance, status, issues };
}

function NetworkView({
  selectedSiteId,
  onSelect,
  onInvestigate,
  config,
}: {
  selectedSiteId: string;
  onSelect: (siteId: string) => void;
  onInvestigate: () => void;
  config: WorkshopConfig;
}) {
  const { data, loading, error, warehouseStatus } = useAnalyticsQuery('network_overview', {
    catalog_name: sql.string(config.catalog),
    schema_name: sql.string(config.schema),
  });
  const profiles = useAnalyticsQuery('network_destination_profiles', {
    catalog_name: sql.string(config.catalog),
    schema_name: sql.string(config.schema),
  });
  const exposure = useAnalyticsQuery('network_journey_exposure', {
    catalog_name: sql.string(config.catalog),
    schema_name: sql.string(config.schema),
  });
  const rows = enrichNetwork(
    (data ?? []) as NetworkRow[],
    (profiles.data ?? []) as DestinationProfile[],
    (exposure.data ?? []) as JourneyExposure[]
  );
  const [filters, setFilters] = useState<NetworkFilters>(emptyNetworkFilters);
  const [mapLayer, setMapLayer] = useState<MapLayer>('Risk');
  const [showLinks, setShowLinks] = useState(false);
  const [requiredEnergy, setRequiredEnergy] = useState('ev');
  const [requiredFacility, setRequiredFacility] = useState('Any facility');
  const filteredRows = rows.filter((row) => {
    const matchesCountry = filters.country === 'All markets' || row.country === filters.country;
    const matchesFormat = filters.stationFormat === 'All formats' || row.station_format === filters.stationFormat;
    const matchesStatus =
      filters.operatingStatus === 'All operating states' || row.operating_status === filters.operatingStatus;
    const matchesRisk = filters.riskBand === 'All risk bands' || networkRiskBand(row) === filters.riskBand;
    const matchesEnergy = filters.energy === 'All energy services' || services(row).includes(filters.energy);
    const matchesFacility = filters.facility === 'All facilities' || facilities(row).includes(filters.facility);
    const age = snapshotAgeHours(row.snapshot_time);
    const matchesFreshness =
      filters.freshness === 'All snapshots' ||
      (filters.freshness === 'Within 24 hours' && age !== null && age >= 0 && age <= 24) ||
      (filters.freshness === 'Within 7 days' && age !== null && age >= 0 && age <= 168) ||
      (filters.freshness === 'Older than 7 days' && age !== null && age > 168);
    return (
      matchesCountry &&
      matchesFormat &&
      matchesStatus &&
      matchesRisk &&
      matchesEnergy &&
      matchesFacility &&
      matchesFreshness
    );
  });
  const atRiskSites = filteredRows.reduce((total, row) => total + numeric(row.at_risk_sites), 0);
  const availableChargers = filteredRows.reduce((total, row) => total + numeric(row.available_chargers), 0);
  const averageWait = filteredRows.length
    ? filteredRows.reduce((total, row) => total + numeric(row.expected_wait_minutes), 0) / filteredRows.length
    : 0;
  const selectedSite = rows.find((row) => row.site_id === selectedSiteId) ?? rows[0];
  const priorityRows = [...filteredRows]
    .sort(
      (left, right) => networkRiskScore(right) - networkRiskScore(left) || left.site_id.localeCompare(right.site_id)
    )
    .slice(0, 5);
  const averageDemand = filteredRows.length
    ? filteredRows.reduce((total, row) => total + numeric(row.traffic_demand_index), 0) / filteredRows.length
    : 0;
  const averageInventoryRisk = filteredRows.length
    ? filteredRows.reduce((total, row) => total + numeric(row.inventory_risk_score), 0) / filteredRows.length
    : 0;
  const countries = [...new Set(rows.map((row) => row.country))].sort();
  const formats = [...new Set(rows.map((row) => row.station_format))].sort();
  const statuses = [...new Set(rows.map((row) => row.operating_status))].sort();
  const energyTypes = [...new Set(rows.flatMap(services))].sort();
  const facilityTypes = [...new Set(rows.flatMap(facilities))].sort();
  const currentSnapshot = rows.length
    ? rows
        .map((row) => row.snapshot_time)
        .sort()
        .at(-1)
    : undefined;
  const oldestAge = rows.length ? Math.max(...rows.map((row) => snapshotAgeHours(row.snapshot_time) ?? 0)) : 0;
  const exposureTotal = filteredRows.reduce((total, row) => total + marginExposure(row), 0);
  const energyMix = [...new Set(filteredRows.flatMap(services))];
  const riskDistribution = ['Critical', 'Watch', 'Stable'].map((band) => ({
    band,
    count: filteredRows.filter((row) => networkRiskBand(row) === band).length,
  }));
  const mapLayerSummary: Record<MapLayer, string> = {
    Risk: `${atRiskSites} destination${atRiskSites === 1 ? '' : 's'} at risk`,
    Demand: `${averageDemand.toFixed(2)}× average demand`,
    Capacity: `${Math.round(availableChargers)} chargers ready`,
    Wait: `${averageWait.toFixed(1)} min average wait`,
  };
  const screenedAlternatives =
    selectedSite && profiles.data
      ? rows
          .filter(
            (row) =>
              row.site_id !== selectedSite.site_id &&
              (row.location_data_status === 'publicly_named' ||
                row.location_data_status === 'synthetic_scenario_location') &&
              (requiredEnergy !== 'ev' || !row.station_format.startsWith('hydrogen_'))
          )
          .map((row) => assessAlternative(row, selectedSite, requiredEnergy, requiredFacility))
          .sort((left, right) => {
            // The local scenario option leads; named cross-market examples remain visible afterward.
            const aNearby = left.status === 'Nearby screen pass' ? 0 : 1;
            const bNearby = right.status === 'Nearby screen pass' ? 0 : 1;
            if (aNearby !== bNearby) return aNearby - bNearby;
            // Keep the named hero comparisons visible, including a failed screening result.
            if (selectedSite.site_id === 'SITE-00007') {
              const heroOrder = ['SITE-00012', 'SITE-00014'];
              const a = heroOrder.indexOf(left.site.site_id);
              const b = heroOrder.indexOf(right.site.site_id);
              if (a !== b) return (a < 0 ? 99 : a) - (b < 0 ? 99 : b);
            }
            const tier: Record<string, number> = {
              'Nearby screen pass': 0,
              'Network benchmark': 1,
              'Service mismatch': 2,
            };
            const fitOrder = tier[left.status] - tier[right.status];
            if (fitOrder) return fitOrder;
            return (left.distance ?? Infinity) - (right.distance ?? Infinity);
          })
      : [];
  const alternatives = screenedAlternatives.slice(0, 5);
  const localAlternatives = screenedAlternatives.filter(
    (candidate) => candidate.status === 'Nearby screen pass'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orlen-red">ORLEN Mobility · Network</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
            Where should ORLEN act now?
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            See destination health across the European network, identify emerging service risk, and select the next
            location to investigate.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-border bg-white px-3 py-2 text-xs text-slate-600 lg:self-auto">
          <span
            className={`h-2 w-2 rounded-full ${oldestAge > 168 ? 'bg-amber-500' : 'bg-emerald-600'}`}
            aria-hidden="true"
          />
          {loading
            ? 'Refreshing network signals'
            : currentSnapshot
              ? `Modelled snapshot ${new Date(currentSnapshot).toLocaleDateString()}`
              : warehouseStatus
                ? 'Warehouse status updating'
                : 'Governed view'}
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">Lakeflow</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-orlen-red bg-orlen-red-soft p-5 text-sm text-orlen-red">
          <p className="font-semibold">Network signals are unavailable</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {profiles.error || exposure.error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          Destination services or customer exposure could not be loaded. The map and governed operating measures remain
          available; affected filters and value ranking are partial.
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">Command the network view</p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                Unity Catalog
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Narrow the decision surface before you choose the next destination.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilters(emptyNetworkFilters)}
            className="self-start rounded-lg border border-border px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orlen-red hover:text-orlen-red lg:self-auto"
          >
            Reset filters
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          {(
            [
              {
                key: 'country',
                label: 'Market / country',
                value: filters.country,
                options: ['All markets', ...countries],
              },
              {
                key: 'stationFormat',
                label: 'Destination format',
                value: filters.stationFormat,
                options: ['All formats', ...formats],
              },
              {
                key: 'operatingStatus',
                label: 'Operating state',
                value: filters.operatingStatus,
                options: ['All operating states', ...statuses],
              },
              {
                key: 'riskBand',
                label: 'Risk band',
                value: filters.riskBand,
                options: ['All risk bands', 'Critical', 'Watch', 'Stable'],
              },
              {
                key: 'energy',
                label: 'Energy service',
                value: filters.energy,
                options: ['All energy services', ...energyTypes],
              },
              {
                key: 'facility',
                label: 'Facility',
                value: filters.facility,
                options: ['All facilities', ...facilityTypes],
              },
              {
                key: 'freshness',
                label: 'Snapshot age',
                value: filters.freshness,
                options: ['All snapshots', 'Within 24 hours', 'Within 7 days', 'Older than 7 days'],
              },
            ] as Array<{ key: keyof NetworkFilters; label: string; value: string; options: string[] }>
          ).map(({ key, label, value, options }) => (
            <label key={key} className="text-xs font-semibold text-slate-600">
              {label}
              <select
                value={value}
                disabled={(key === 'energy' || key === 'facility') && !profiles.data}
                onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-orlen-red focus:ring-2 focus:ring-orlen-red disabled:opacity-50"
              >
                {options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            'Destinations in view',
            loading ? '—' : filteredRows.length.toString(),
            `${rows.length} total · filtered decision surface`,
            'Unity Catalog',
          ],
          [
            'Destinations at risk',
            loading ? '—' : atRiskSites.toString(),
            'Scenario state · at-risk or degraded',
            'Metric Views',
          ],
          [
            'Available chargers',
            loading ? '—' : Math.round(availableChargers).toString(),
            'Scenario snapshot · filtered destinations',
            'Metric Views',
          ],
          [
            'Average expected wait',
            loading ? '—' : `${averageWait.toFixed(1)} min`,
            'Minutes · scenario snapshot · selected destinations',
            'AI/BI',
          ],
        ].map(([label, value, detail, capability]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">{label}</p>
              <span className="rounded-full bg-orlen-red-soft px-2 py-1 text-[10px] font-semibold text-orlen-red">
                {capability}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">European decision map</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  Metric Views
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Public city context plus one synthetic Elmshorn-area waypoint · modelled operations
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Map signal layer">
              {(['Risk', 'Demand', 'Capacity', 'Wait'] as MapLayer[]).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  aria-pressed={mapLayer === layer}
                  onClick={() => setMapLayer(layer)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${mapLayer === layer ? 'bg-orlen-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-orlen-red-soft'}`}
                >
                  {layer}
                </button>
              ))}
            </div>
          </div>
          <div className="border-b border-border bg-slate-50 px-5 py-3 sm:px-6">
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showLinks}
                onChange={(event) => setShowLinks(event.target.checked)}
                className="accent-orlen-red"
              />
              Show candidate comparison links
            </label>
          </div>
          <div className="border-b border-border bg-white px-5 py-4 sm:px-6" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold text-slate-950">{mapLayerGuides[mapLayer].title}</p>
              <p className="text-sm font-semibold text-orlen-red">
                {filteredRows.length ? mapLayerSummary[mapLayer] : 'No destinations in view'}
              </p>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">{mapLayerGuides[mapLayer].meaning}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-slate-700">
              {mapLayerGuides[mapLayer].bins.map((bin, index) => (
                <span key={bin} className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-emerald-600' : index === 1 ? 'bg-amber-600' : 'bg-orlen-red'}`}
                    aria-hidden="true"
                  />
                  {bin}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-500">{mapLayerGuides[mapLayer].cluster}</p>
          </div>
          <NetworkDecisionMap
            rows={filteredRows}
            selectedSiteId={selectedSiteId}
            alternatives={alternatives.map((candidate) => candidate.site)}
            layer={mapLayer}
            showLinks={showLinks}
            onSelect={onSelect}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-slate-500 sm:px-6">
            <span>MapLibre vector map · approximate city centres</span>
            <span>Governed scenario measures · selected layer: {mapLayerGuides[mapLayer].title}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">Priority destinations</h3>
                <span className="rounded-full bg-orlen-red-soft px-2 py-1 text-[10px] font-semibold text-orlen-red">
                  Metric Views
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {exposure.data
                  ? 'Scenario service risk + affected journeys + modelled margin exposure + demand'
                  : 'Service and demand ranking while journey exposure loads'}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {loading
              ? [1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)
              : priorityRows.map((row, index) => {
                  const isPriority = networkRiskBand(row) === 'Critical';
                  return (
                    <button
                      key={row.site_id}
                      type="button"
                      onClick={() => onSelect(row.site_id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        row.site_id === selectedSite?.site_id
                          ? 'border-orlen-red bg-orlen-red-soft'
                          : 'border-border bg-slate-50 hover:border-orlen-red hover:bg-white'
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${isPriority ? 'bg-orlen-red text-white' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-950">{row.site_name}</span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {row.city}, {row.country} · {row.station_format}
                        </span>
                      </span>
                      <span className="text-right">
                        <span
                          className={`block text-sm font-semibold ${isPriority ? 'text-orlen-red' : 'text-emerald-700'}`}
                        >
                          {Math.round(Number(row.expected_wait_minutes ?? 0))} min
                        </span>
                        <span className="block text-[10px] text-slate-500">expected wait</span>
                      </span>
                      <span className="hidden w-16 text-right sm:block">
                        <span className="block text-sm font-semibold text-slate-950">{networkRiskScore(row)}</span>
                        <span className="block text-[10px] text-slate-500">decision index</span>
                      </span>
                    </button>
                  );
                })}
            {!loading && priorityRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-slate-50 p-5 text-center text-sm text-slate-600">
                No destinations match these filters. Reset the view to restore the network queue.
              </div>
            ) : null}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Index / 100: service 35, affected journeys 30, margin exposure 25, demand 10. It ranks this synthetic
            scenario; it is not an ML model score.
          </p>
          {selectedSite ? (
            <div className="mt-5 border-t border-border pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">Selected destination</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  Unity Catalog
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-orlen-red">{selectedSite.site_name}</p>
              {selectedSite.site_id !== 'SITE-00007' ? (
                <button
                  type="button"
                  onClick={() => onSelect('SITE-00007')}
                  className="mt-2 text-xs font-semibold text-orlen-red underline-offset-2 hover:underline"
                >
                  Return to Elmshorn hero case
                </button>
              ) : null}
              <p className="mt-1 text-sm text-slate-600">
                {selectedSite.city}, {selectedSite.country} · {selectedSite.road_context}
              </p>
              {!filteredRows.some((row) => row.site_id === selectedSite.site_id) ? (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  Selected destination is outside the current filters.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {services(selectedSite).map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {facilities(selectedSite).length
                  ? facilities(selectedSite)
                      .map((facility) => facility.replaceAll('_', ' '))
                      .join(' · ')
                  : 'Facility profile unavailable'}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ['State', selectedSite.operating_status],
                  ['Risk band', networkRiskBand(selectedSite)],
                  ['Chargers ready', `${Math.round(numeric(selectedSite.available_chargers))}`],
                  [
                    'Profile units / max power',
                    selectedSite.profile
                      ? `${numeric(selectedSite.profile.installed_chargers)} / ${numeric(selectedSite.profile.max_charger_kw)} kW`
                      : 'Unavailable',
                  ],
                  ['Expected wait', `${numeric(selectedSite.expected_wait_minutes).toFixed(1)} min`],
                  ['Traffic demand index', `${numeric(selectedSite.traffic_demand_index).toFixed(2)}`],
                  [
                    'Affected journeys',
                    selectedSite.exposure ? `${selectedSite.exposure.affectedJourneys}` : 'Unavailable',
                  ],
                  [
                    'Margin exposure proxy',
                    selectedSite.exposure
                      ? `€${Math.round(marginExposure(selectedSite)).toLocaleString()}`
                      : 'Unavailable',
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Affected segments:{' '}
                {exposure.loading
                  ? 'loading journey evidence'
                  : exposure.error
                    ? 'journey evidence unavailable'
                    : selectedSite.exposure?.segments.length
                      ? selectedSite.exposure.segments.map((segment) => segment.replaceAll('_', ' ')).join(', ')
                      : 'none in this scenario window'}{' '}
                · Snapshot {new Date(selectedSite.snapshot_time).toLocaleString()}
              </p>
              <div className="mt-4 rounded-xl border border-border bg-orlen-red-soft p-3">
                <p className="text-xs font-semibold text-orlen-red">
                  Next decision ·{' '}
                  {selectedSite.site_id === 'SITE-00007' ? 'Elmshorn hero case' : 'Selected destination'}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-700">
                  Inspect the evidence, customer segments and service alternatives before proposing an action.
                </p>
                <button
                  type="button"
                  onClick={onInvestigate}
                  className="mt-3 rounded-lg bg-orlen-red px-3 py-2 text-xs font-semibold text-white hover:bg-orlen-red"
                >
                  Investigate this destination →
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-950">Alternative screening · modelled</h3>
              <span className="rounded-full bg-orlen-red-soft px-2 py-1 text-[10px] font-semibold text-orlen-red">
                Unity Catalog + Metric Views
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Compare network sites on service, charger power, wait, demand and proximity. A customer diversion also
              needs a verified drive route and current capacity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Required energy
              <select
                value={requiredEnergy}
                onChange={(event) => setRequiredEnergy(event.target.value)}
                className="mt-1 block rounded-lg border border-border bg-slate-50 px-2 py-2 text-sm text-slate-900"
              >
                {['ev', 'petrol', 'diesel', 'lpg', 'hydrogen'].map((value) => (
                  <option key={value} value={value}>
                    {value.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Required facility
              <select
                value={requiredFacility}
                onChange={(event) => setRequiredFacility(event.target.value)}
                className="mt-1 block rounded-lg border border-border bg-slate-50 px-2 py-2 text-sm text-slate-900"
              >
                {['Any facility', 'stop_cafe', 'accessible', 'family', 'tir', 'vitay'].map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {selectedSite && profiles.data && localAlternatives === 0 ? (
          <div
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
            role="status"
          >
            No nearby site passes scenario screening for {selectedSite.city}. The locations below are network
            benchmarks, not customer diversion options. Verify a nearby destination, drive route and current capacity
            before recommending a reroute.
          </div>
        ) : null}
        {selectedSite && profiles.data && localAlternatives > 0 ? (
          <div
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"
            role="status"
          >
            {localAlternatives} nearby scenario candidate{localAlternatives === 1 ? '' : 's'}{' '}
            {localAlternatives === 1 ? 'passes' : 'pass'} service, capacity and proximity screening for{' '}
            {selectedSite.city}. This is a candidate for the demo response plan; its station address, drive route and
            current capacity are not verified.
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-5">
          {alternatives.map(({ site, distance, status, issues }) => (
            <button
              key={site.site_id}
              type="button"
              onClick={() => onSelect(site.site_id)}
              className="rounded-xl border border-border bg-slate-50 p-4 text-left transition hover:border-orlen-red hover:bg-orlen-red-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-950">{site.site_name}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${status === 'Nearby screen pass' ? 'bg-emerald-100 text-emerald-800' : status === 'Network benchmark' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}
                >
                  {status}
                </span>
              </div>
              {site.location_data_status === 'synthetic_scenario_location' ? (
                <p className="mt-1 text-[11px] font-semibold text-orlen-red">
                  Scenario candidate · route check pending
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-600">
                {site.city}, {site.country} ·{' '}
                {distance === null ? 'Distance unverified' : `${distance} km straight-line`}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-y border-border py-2 text-center text-xs">
                <span>
                  <strong className="block text-sm text-slate-950">
                    {Math.round(numeric(site.available_chargers))}
                  </strong>
                  {Math.round(numeric(site.available_chargers)) === 1 ? 'charger' : 'chargers'} ready
                </span>
                <span>
                  <strong className="block text-sm text-slate-950">
                    {numeric(site.expected_wait_minutes).toFixed(1)}
                  </strong>
                  min wait
                </span>
                <span>
                  <strong className="block text-sm text-slate-950">
                    {site.profile ? numeric(site.profile.max_charger_kw) : '—'}
                  </strong>
                  max kW
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {issues.length
                  ? issues.join(' · ')
                  : 'Passes scenario screening; verify drive route and current capacity.'}
              </p>
            </button>
          ))}
          {profiles.loading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Loading service and facility profiles…</p>
          ) : null}
          {profiles.error ? (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Alternative screening is unavailable until destination profiles can be read.
            </p>
          ) : null}
          {!loading && profiles.data && alternatives.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No named comparison destinations are available.
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Screening rules: matching service and facility, EV ≥300 kW and ≥1 available charger, ≤12-minute wait, demand
          index ≤1.8, same country and city-centre distance ≤120 km. Distances, charger availability and wait are
          scenario values; straight-line distance is not travel time. Hydrogen-first formats are excluded from EV
          comparisons until their EV service is verified.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            'Demand pressure',
            `${averageDemand.toFixed(2)}×`,
            'Traffic demand index across filtered destinations',
            'Lakeflow',
          ],
          [
            'Inventory exposure',
            averageInventoryRisk.toFixed(2),
            'Inventory risk index across filtered destinations',
            'Metric Views',
          ],
          [
            'Customer / margin exposure',
            exposure.loading
              ? '—'
              : `${filteredRows.reduce((sum, row) => sum + numeric(row.exposure?.affectedJourneys), 0)} / €${Math.round(exposureTotal).toLocaleString()}`,
            'Affected journeys / modelled margin proxy · scenario window',
            'Metric Views',
          ],
          [
            'Decision queue',
            `${priorityRows.length}`,
            'Destinations ranked by explainable decision index',
            'Metric Views',
          ],
        ].map(([label, value, detail, capability]) => (
          <div key={label} className="rounded-2xl border border-border bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-orlen-red">
                {capability}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-950">Multi-energy mix</h3>
            <ProductBadge>Unity Catalog</ProductBadge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {energyMix.map((service) => (
              <span
                key={service}
                className="rounded-lg bg-orlen-red-soft px-3 py-2 text-sm font-semibold uppercase text-orlen-red"
              >
                {service}
              </span>
            ))}
            {!energyMix.length ? (
              <span className="text-sm text-slate-500">No services in the filtered view</span>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Services present in destination profiles; they do not imply current product availability.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-950">Risk distribution</h3>
            <ProductBadge>Metric Views</ProductBadge>
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            {riskDistribution.map(({ band, count }) => (
              <span
                key={band}
                style={{ width: `${filteredRows.length ? (count / filteredRows.length) * 100 : 0}%` }}
                className={band === 'Critical' ? 'bg-orlen-red' : band === 'Watch' ? 'bg-amber-500' : 'bg-emerald-600'}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            {riskDistribution.map(({ band, count }) => (
              <span key={band}>
                {band}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      <details className="rounded-2xl border border-border bg-white p-5">
        <summary className="cursor-pointer text-base font-semibold text-slate-950">
          Browse all {filteredRows.length} destinations · accessible map fallback
        </summary>
        <div className="mt-4 max-h-[430px] overflow-auto">
          <table className="w-full min-w-[750px] border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="p-3">Destination</th>
                <th className="p-3">Market</th>
                <th className="p-3">Energy</th>
                <th className="p-3">Risk</th>
                <th className="p-3">Wait</th>
                <th className="p-3">Chargers</th>
                <th className="p-3">Decision</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.site_id} className="border-t border-border">
                  <td className="p-3 font-semibold text-slate-900">
                    {row.site_name}
                    <span className="block text-xs font-normal text-slate-500">
                      {row.location_data_status === 'publicly_named'
                        ? 'Public city context'
                        : row.location_data_status === 'synthetic_scenario_location'
                          ? 'Scenario location · verification pending'
                          : 'Synthetic reference'}
                    </span>
                  </td>
                  <td className="p-3">{row.country}</td>
                  <td className="p-3 uppercase">{services(row).join(', ') || '—'}</td>
                  <td className="p-3">{networkRiskBand(row)}</td>
                  <td className="p-3">{numeric(row.expected_wait_minutes).toFixed(1)} min</td>
                  <td className="p-3">{Math.round(numeric(row.available_chargers))}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onSelect(row.site_id)}
                      className="font-semibold text-orlen-red underline-offset-2 hover:underline"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function ProductBadge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-orlen-red-soft px-2 py-1 text-[10px] font-semibold text-orlen-red">
      {children}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  capability,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  capability?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
            {capability ? <ProductBadge>{capability}</ProductBadge> : null}
          </div>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Kpi({
  label,
  value,
  detail,
  capability,
}: {
  label: string;
  value: string;
  detail: string;
  capability: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <ProductBadge>{capability}</ProductBadge>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function ResponsePlanView({ siteId: _siteId, onApproval }: { siteId: string; onApproval: () => void }) {
  const [actions, setActions] = useState([
    'maintenance_inspection',
    'customer_routing',
    'inventory_preparation',
    'vitay_communication',
  ]);
  const [proposalStatus, setProposalStatus] = useState('loading');
  const [proposalBusy, setProposalBusy] = useState(false);
  const [proposalError, setProposalError] = useState('');
  const [recommendationBusy, setRecommendationBusy] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    state: 'allowed' | 'denied' | 'unavailable';
    text?: string;
    service?: string;
    responseId?: string;
    evidenceBasis?: string;
    policy?: { name: string; action: string; phase: string; reason: string } | string;
    error?: string;
  } | null>(null);
  const caseId = `CASE-${_siteId}`;
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ops/cases')
      .then((response) => response.json())
      .then((cases: Array<{ case_id: string; status: string }>) => {
        if (!cancelled) setProposalStatus(cases.find((item) => item.case_id === caseId)?.status ?? 'unavailable');
      })
      .catch(() => {
        if (!cancelled) setProposalStatus('unavailable');
      });
    fetch(`/api/ops/cases/${caseId}/actions`)
      .then((response) => response.json())
      .then((rows: Array<{ action_type: string; status: string }>) => {
        if (!cancelled && rows.some((row) => row.status === 'excluded')) {
          setActions(rows.filter((row) => row.status !== 'excluded').map((row) => row.action_type));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [caseId]);
  const submitProposal = async () => {
    setProposalBusy(true);
    try {
      setProposalError('');
      const response = await fetch('/api/ops/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: _siteId,
          actionTypes: actions,
          notes: `${actions.length} actions selected in the local decision workspace`,
        }),
      });
      const result = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Proposal could not be submitted');
      setProposalStatus(result.status ?? 'pending_approval');
    } catch (error) {
      setProposalError((error as Error).message);
    } finally {
      setProposalBusy(false);
    }
  };
  const requestRecommendation = async (proofMode: 'recommend' | 'boundary_check') => {
    setRecommendationBusy(true);
    setRecommendation(null);
    try {
      const response = await fetch('/api/ops/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: _siteId, actionTypes: actions, proofMode }),
      });
      const result = (await response.json()) as NonNullable<typeof recommendation>;
      setRecommendation(
        result.state ? result : { state: 'unavailable', error: result.error ?? 'Recommendation unavailable' }
      );
    } catch {
      setRecommendation({ state: 'unavailable', error: 'Governed recommendation is temporarily unavailable.' });
    } finally {
      setRecommendationBusy(false);
    }
  };
  const toggle = (action: string) =>
    setActions((current) =>
      current.includes(action) ? current.filter((item) => item !== action) : [...current, action]
    );
  const items = [
    [
      'maintenance_inspection',
      'Prioritize charger inspection',
      'Inspect the highest-risk charging assets before the next demand peak.',
      'Operations',
      'MLflow + ML',
    ],
    [
      'customer_routing',
      'Offer alternative destinations',
      'Shortlist alternatives; verify a local route, service fit and capacity before any customer diversion.',
      'Customer experience',
      'Metric Views',
    ],
    [
      'inventory_preparation',
      'Prepare Stop Café and inventory',
      'Align convenience stock and service capacity with expected demand.',
      'Commercial',
      'Lakebase',
    ],
    [
      'vitay_communication',
      'Issue targeted customer communication',
      'Notify impacted VITAY and fleet segments with a bounded message.',
      'Customer experience',
      'Lakebase',
    ],
  ];
  const waitReduction =
    (actions.includes('maintenance_inspection') ? 5 : 0) + (actions.includes('customer_routing') ? 4.4 : 0);
  const protectedJourneys = actions.includes('customer_routing') ? 38 : 0;
  const protectedRevenue = actions.includes('vitay_communication') ? 4800 : 0;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orlen-red">ORLEN Mobility · Response plan</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
          What should ORLEN propose?
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Assemble a bounded response for{' '}
          <span className="font-semibold text-slate-950">{destinationLabel(_siteId)}</span> across operations, customer
          experience, and convenience retail. Every action remains reviewable before execution.
        </p>
        <p className="mt-4 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Elmshorn East passes modelled nearby screening. Its station address, drive route and current capacity are
          unverified, so the routing action and impact below remain simulated workshop outcomes.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Expected wait reduction"
          value={waitReduction ? `−${waitReduction.toFixed(1)} min` : '—'}
          detail="Scenario projection from selected inspection and routing actions"
          capability="Lakebase"
        />
        <Kpi
          label="Journeys protected"
          value={protectedJourneys ? String(protectedJourneys) : '—'}
          detail="Scenario projection from selected routing action"
          capability="Lakebase"
        />
        <Kpi
          label="Value protected"
          value={protectedRevenue ? `€${(protectedRevenue / 1000).toFixed(1)}k` : '—'}
          detail="Scenario projection from selected VITAY action"
          capability="Lakebase"
        />
      </div>
      <Panel
        title="Governed response recommendation"
        subtitle="An AI recommendation grounded in the Elmshorn case and your selected actions; a manager still decides what to approve"
        capability="Unity Gateway"
      >
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void requestRecommendation('recommend')}
            disabled={recommendationBusy || actions.length === 0}
            className="rounded-xl bg-orlen-red px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {recommendationBusy ? 'Checking policy…' : 'Generate governed recommendation'}
          </button>
          <button
            type="button"
            onClick={() => void requestRecommendation('boundary_check')}
            disabled={recommendationBusy || actions.length === 0}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Verify safety boundary
          </button>
        </div>
        {!recommendation && !recommendationBusy ? (
          <p className="mt-4 text-sm text-slate-600">
            Generate a recommendation or show how the policy blocks an unsafe instruction.
          </p>
        ) : null}
        {recommendation?.state === 'allowed' ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
              Recommendation delivered through Unity Gateway
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{recommendation.text}</p>
            <p className="mt-3 text-xs text-slate-600">
              AI-generated; verify before acting. Synthetic historical evidence · Manager approval required.
            </p>
            <p className="mt-2 break-all text-xs text-slate-500">
              Service: {recommendation.service} · Policy:{' '}
              {typeof recommendation.policy === 'string' ? recommendation.policy : '—'} · Response:{' '}
              {recommendation.responseId}
            </p>
          </div>
        ) : null}
        {recommendation?.state === 'denied' && typeof recommendation.policy === 'object' ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
            <p className="text-sm font-bold text-amber-900">Unsafe recommendation blocked before model inference</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{recommendation.policy.reason}</p>
            <p className="mt-2 break-all text-xs text-amber-800">
              Unity Gateway policy: {recommendation.policy.name} · {recommendation.policy.phase} ·{' '}
              {recommendation.policy.action}
            </p>
          </div>
        ) : null}
        {recommendation?.state === 'unavailable' ? (
          <p className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700" role="alert">
            {recommendation.error} The scenario playbook below remains a manual, modelled fallback.
          </p>
        ) : null}
      </Panel>
      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Scenario playbook"
          subtitle="Choose the bounded actions to submit for approval"
          capability="Lakebase"
        >
          <div className="space-y-3">
            {items.map(([id, title, description, owner, capability]) => (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                disabled={proposalStatus !== 'needs_review' && proposalStatus !== 'draft'}
                className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed ${actions.includes(id) ? 'border-orlen-red bg-orlen-red-soft' : 'border-border bg-slate-50 hover:border-orlen-red'}`}
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs font-bold ${actions.includes(id) ? 'border-orlen-red bg-orlen-red text-white' : 'border-slate-300 bg-white text-transparent'}`}
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-950">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
                  <span className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                      Owner: {owner}
                    </span>
                    <ProductBadge>{capability}</ProductBadge>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Response preview" subtitle="Expected impact of the current proposal" capability="Lakebase">
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Proposal status</p>
              <p className="mt-2 text-2xl font-semibold">
                {proposalStatus === 'pending_approval'
                  ? 'Pending approval'
                  : proposalStatus === 'needs_review'
                    ? 'Ready for proposal'
                    : proposalStatus === 'measured'
                      ? 'Scenario recorded'
                      : proposalStatus.replaceAll('_', ' ')}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {actions.length} selected actions · {destinationLabel(_siteId)} · synthetic scenario
              </p>
            </div>
            {[
              ['Operational owner', 'Mobility network operations'],
              ['Customer segments', 'VITAY, fleet, long-distance'],
              ['Policy boundary', 'Human approval required'],
              [
                'Audit state',
                ['pending_approval', 'approved', 'measured'].includes(proposalStatus)
                  ? 'Proposal stored in Lakebase'
                  : 'Selection not yet submitted',
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-right text-sm font-semibold text-slate-950">{value}</span>
              </div>
            ))}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Alternative screening · SITE-00015
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">ORLEN Charge Elmshorn East</p>
              <p className="mt-1 text-sm text-slate-700">
                About 7 km straight-line · 1 modelled ready charger · 300 kW. Actual station identity, drive route and
                available capacity require verification.
              </p>
            </div>
            <div className="space-y-2 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Selected action effects · scenario only
              </p>
              <p className="text-sm text-slate-700">
                Inspection:{' '}
                {actions.includes('maintenance_inspection') ? '5.0 min modelled wait reduction' : 'not selected'}
              </p>
              <p className="text-sm text-slate-700">
                Routing: {actions.includes('customer_routing') ? '4.4 min and 38 journeys modelled' : 'not selected'}
              </p>
              <p className="text-sm text-slate-700">
                Stop Café:{' '}
                {actions.includes('inventory_preparation') ? 'readiness task, value unquantified' : 'not selected'}
              </p>
              <p className="text-sm text-slate-700">
                VITAY: {actions.includes('vitay_communication') ? '€4.8k modelled protection' : 'not selected'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void submitProposal()}
              disabled={proposalBusy || actions.length === 0 || !['needs_review', 'draft'].includes(proposalStatus)}
              className="w-full rounded-xl bg-orlen-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-orlen-red disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {proposalBusy
                ? 'Submitting proposal…'
                : proposalStatus === 'pending_approval'
                  ? 'Proposal submitted for approval'
                  : 'Submit proposal for approval'}
            </button>
            {proposalError ? (
              <p role="alert" className="text-sm font-medium text-orlen-red">
                {proposalError}
              </p>
            ) : null}
            {proposalStatus === 'pending_approval' || proposalStatus === 'approved' || proposalStatus === 'measured' ? (
              <button
                type="button"
                onClick={onApproval}
                className="w-full rounded-xl border border-orlen-red px-4 py-3 text-sm font-semibold text-orlen-red hover:bg-orlen-red-soft"
              >
                Review approval boundary →
              </button>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ApprovalView({
  siteId: _siteId,
  onResponsePlan,
  onOutcomes,
}: {
  siteId: string;
  onResponsePlan: () => void;
  onOutcomes: () => void;
}) {
  const [caseStatus, setCaseStatus] = useState('loading');
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [executionBusy, setExecutionBusy] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [denialMessage, setDenialMessage] = useState('');
  const [audit, setAudit] = useState<{
    events: Array<{
      event_id: number | string;
      action_id: string | null;
      event_type: string;
      occurred_at: string;
      payload_json?: Record<string, unknown>;
    }>;
    approvals: Array<{ approved_by: string; trace_id: string; approved_at: string; policy_decision: string }>;
  }>({ events: [], approvals: [] });
  const [actionRows, setActionRows] = useState<
    Array<{ action_id: string; action_type: string; target_id: string; status: string }>
  >([]);
  const caseId = `CASE-${_siteId}`;
  const approved = caseStatus === 'approved' || caseStatus === 'measured';
  const executed = caseStatus === 'measured';
  const selectedActions = actionRows.filter((action) => action.status !== 'excluded');
  const actionEvents = audit.events.filter((event) => event.event_type === 'action_executed' && event.action_id);
  const caseEvents = audit.events.filter((event) => event.event_type !== 'action_executed');
  const actionNames: Record<string, { title: string; detail: string }> = {
    maintenance_inspection: { title: 'Inspect charger 6', detail: 'Operations · SITE-00007-CHG-06' },
    customer_routing: { title: 'Review customer routing', detail: 'Elmshorn East remains an unverified candidate' },
    inventory_preparation: { title: 'Prepare Stop Café', detail: 'Convenience retail readiness at Elmshorn' },
    vitay_communication: { title: 'Prepare VITAY message', detail: 'Customer communication requires approval' },
  };
  const loadAudit = useCallback(async (): Promise<typeof audit> => {
    const response = await fetch(`/api/ops/cases/${caseId}/audit`);
    return (await response.json()) as typeof audit;
  }, [caseId]);
  const loadActions = useCallback(async (): Promise<typeof actionRows> => {
    const response = await fetch(`/api/ops/cases/${caseId}/actions`);
    return (await response.json()) as typeof actionRows;
  }, [caseId]);
  const reloadAudit = async () => {
    const [history, actions] = await Promise.all([loadAudit(), loadActions()]);
    setAudit(history);
    setActionRows(actions);
  };
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch('/api/ops/cases').then((response) => response.json()), loadAudit(), loadActions()])
      .then(
        ([cases, history, actions]: [Array<{ case_id: string; status: string }>, typeof audit, typeof actionRows]) => {
          if (!cancelled) {
            setCaseStatus(cases.find((item) => item.case_id === caseId)?.status ?? 'unavailable');
            setAudit(history);
            setActionRows(actions);
          }
        }
      )
      .catch(() => {
        if (!cancelled) setCaseStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, loadAudit, loadActions]);
  const approveResponse = async () => {
    setApprovalBusy(true);
    try {
      setOperationError('');
      const response = await fetch(`/api/ops/cases/${caseId}/approve`, { method: 'POST' });
      const result = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Approval failed');
      setCaseStatus(result.status ?? 'approved');
      await reloadAudit();
    } catch (error) {
      setOperationError((error as Error).message);
    } finally {
      setApprovalBusy(false);
    }
  };
  const executeResponse = async () => {
    setExecutionBusy(true);
    try {
      setOperationError('');
      const response = await fetch(`/api/ops/cases/${caseId}/execute`, { method: 'POST' });
      const result = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Execution failed');
      setCaseStatus(result.status ?? 'measured');
      await reloadAudit();
    } catch (error) {
      setOperationError((error as Error).message);
    } finally {
      setExecutionBusy(false);
    }
  };
  const testDeniedCommit = async () => {
    const response = await fetch(`/api/ops/cases/${caseId}/commit-without-approval`, { method: 'POST' });
    const result = (await response.json()) as { reason?: string };
    setDenialMessage(
      response.status === 403
        ? (result.reason ?? 'Commit denied')
        : 'Denial test did not return the expected policy boundary.'
    );
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orlen-red">
          ORLEN Mobility · Approval & execution
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
          Is the response safe and authorized?
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Make the policy boundary visible for{' '}
          <span className="font-semibold text-slate-950">{destinationLabel(_siteId)}</span>: the recommendation is
          governed by Unity Gateway in Response plan, while the App records a separate human decision and audit trail.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Action authorization"
          value="Approval required"
          detail="App/Lakebase approval and execution guard"
          capability="Apps + Lakebase"
        />
        <Kpi
          label="Approval state"
          value={caseStatus === 'measured' ? 'Scenario recorded' : caseStatus.replaceAll('_', ' ')}
          detail="Current case state from Lakebase"
          capability="Lakebase"
        />
        <Kpi
          label="Recorded events"
          value={String(audit.events.length)}
          detail="Case-specific audit entries in Lakebase"
          capability="Lakebase"
        />
        <Kpi
          label="Approval trace"
          value={audit.approvals[0]?.trace_id ?? 'Pending'}
          detail="Created when an approver records a decision"
          capability="Lakebase"
        />
      </div>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-950 px-6 py-5 text-white sm:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">ORLEN Mobility · Lakebase</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Execution ledger</h3>
            <p className="mt-1 text-sm text-slate-300">
              A separate audit record for every selected action, tied to manager approval.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-right">
            <p className="text-2xl font-semibold leading-none">
              {actionEvents.length} / {selectedActions.length || 4}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-300">actions recorded</p>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4 sm:p-6">
          {selectedActions.length ? (
            selectedActions.map((action, index) => {
              const event = actionEvents.find((item) => item.action_id === action.action_id);
              const name = actionNames[action.action_type] ?? {
                title: action.action_type.replaceAll('_', ' '),
                detail: action.target_id,
              };
              return (
                <div
                  key={action.action_id}
                  className={`flex min-h-56 flex-col rounded-2xl border p-5 ${event ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/60'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-orlen-red">
                      Action {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${event ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-600'}`}
                    >
                      {event ? 'Recorded' : approved ? 'Authorized' : 'Awaiting approval'}
                    </span>
                  </div>
                  <h4 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">{name.title}</h4>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{name.detail}</p>
                  <div className="mt-auto pt-5">
                    <p className="break-all border-t border-slate-200 pt-3 font-mono text-[11px] text-slate-500">
                      {action.action_id}
                    </p>
                    {event ? (
                      <>
                        <p className="mt-2 text-xs font-semibold text-slate-800">
                          {new Date(event.occurred_at).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Audit #{event.event_id} ·{' '}
                          {typeof event.payload_json?.approvalId === 'string'
                            ? event.payload_json.approvalId
                            : 'Approval recorded'}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Execution time appears after the approved scenario run.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-full py-6 text-sm text-slate-500">
              Loading the selected action records from Lakebase…
            </p>
          )}
        </div>
        <p className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600 sm:px-8">
          These records prove which simulated actions ran and when. Post-action customer and commercial observations are
          still pending.
        </p>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="Decision boundary"
          subtitle="Verified operational state and a demonstrable denied-commit path"
          capability="Lakebase"
        >
          <div className="space-y-3">
            {[
              ['Case scope', `ORLEN Mobility / ${destinationLabel(_siteId)}`, 'Scoped'],
              [
                'Proposal',
                caseStatus === 'pending_approval' ? 'Submitted for human review' : caseStatus.replaceAll('_', ' '),
                caseStatus === 'pending_approval' ? 'Ready' : 'State',
              ],
              [
                'Approver recorded',
                audit.approvals[0]?.approved_by ?? 'No approver recorded',
                audit.approvals.length ? 'Recorded' : 'Pending',
              ],
              [
                'App approval rule',
                audit.approvals[0]?.policy_decision ?? 'No approval decision yet',
                audit.approvals.length ? 'Demo' : 'Pending',
              ],
              [
                'Trace ID',
                audit.approvals[0]?.trace_id ?? 'Not yet issued',
                audit.approvals.length ? 'Recorded' : 'Pending',
              ],
            ].map(([label, value, status]) => (
              <div key={label} className="flex items-start gap-4 rounded-xl border border-border bg-slate-50 p-4">
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${status === 'Pending' ? 'bg-amber-500' : 'bg-emerald-600'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
                </div>
                <span
                  className={`text-xs font-semibold ${status === 'Pending' ? 'text-amber-700' : 'text-emerald-700'}`}
                >
                  {status}
                </span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => void testDeniedCommit()}
              className="w-full rounded-xl border border-orlen-red px-4 py-3 text-sm font-semibold text-orlen-red hover:bg-orlen-red-soft"
            >
              Test denied commit without approval
            </button>
            {denialMessage ? (
              <p role="status" className="rounded-xl bg-orlen-red-soft p-3 text-sm text-orlen-red">
                {denialMessage}
              </p>
            ) : null}
            <p className="text-xs leading-5 text-slate-500">
              Unity Gateway governs the recommendation shown in Response plan. This action guard runs in the App API and
              Lakebase workflow; Gateway tool enforcement is a future integration.
            </p>
          </div>
        </Panel>
        <Panel
          title="Execution timeline"
          subtitle="Recorded case events, with no invented event timestamps"
          capability="Lakebase"
        >
          <div className="space-y-5">
            {caseEvents.length ? (
              caseEvents.map((event, index) => (
                <div key={`${event.event_type}-${event.occurred_at}`} className="flex gap-4">
                  <div className="flex w-12 shrink-0 flex-col items-center">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    {index < caseEvents.length - 1 ? <span className="mt-1 h-7 w-px bg-border" /> : null}
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-950">
                      {event.event_type.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {event.event_type === 'response_executed'
                        ? 'Scenario impact recorded in Lakebase'
                        : event.event_type === 'response_approved'
                          ? 'Human approval and demo policy decision recorded'
                          : event.event_type === 'proposal_submitted'
                            ? 'Selected actions submitted for review'
                            : 'Case returned to review state'}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {new Date(event.occurred_at).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No proposal or approval event recorded yet. Start in Response plan.
              </p>
            )}
          </div>
          {caseStatus === 'needs_review' ? (
            <button
              type="button"
              onClick={onResponsePlan}
              className="mt-6 w-full rounded-xl border border-orlen-red px-4 py-3 text-sm font-semibold text-orlen-red"
            >
              Open response plan →
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void approveResponse()}
            disabled={caseStatus !== 'pending_approval' || approvalBusy}
            className="mt-6 w-full rounded-xl bg-orlen-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-orlen-red disabled:cursor-not-allowed disabled:bg-emerald-600"
          >
            {approvalBusy
              ? 'Recording approval…'
              : approved
                ? 'Approved — execution is authorized'
                : 'Approve proposed response'}
          </button>
          {approved ? (
            <button
              type="button"
              onClick={() => void executeResponse()}
              disabled={executed || executionBusy}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-orlen-red hover:text-orlen-red disabled:cursor-not-allowed disabled:bg-emerald-50 disabled:text-emerald-700"
            >
              {executionBusy
                ? 'Recording execution…'
                : executed
                  ? 'Scenario execution recorded'
                  : 'Record simulated execution'}
            </button>
          ) : null}
          {executed ? (
            <button
              type="button"
              onClick={onOutcomes}
              className="mt-3 w-full rounded-xl border border-orlen-red px-4 py-3 text-sm font-semibold text-orlen-red"
            >
              Review scenario outcomes →
            </button>
          ) : null}
          {operationError ? (
            <p role="alert" className="mt-3 text-sm font-medium text-orlen-red">
              {operationError}
            </p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function OutcomesView({ siteId: _siteId }: { siteId: string }) {
  const [caseStatus, setCaseStatus] = useState('loading');
  const [caseEvidence, setCaseEvidence] = useState<{ expected_wait_minutes?: number; available_chargers?: number }>({});
  const [executionEvents, setExecutionEvents] = useState<
    Array<{
      event_id: string;
      action_id: string | null;
      event_type: string;
      occurred_at: string;
      payload_json?: Record<string, unknown>;
    }>
  >([]);
  const [auditState, setAuditState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [auditCaseId, setAuditCaseId] = useState<string | null>(null);
  const [actionRows, setActionRows] = useState<
    Array<{
      action_id: string;
      action_type: string;
      status: string;
      expected_impact_json?: Record<string, number> | null;
      realized_impact_json?: Record<string, number> | null;
    }>
  >([]);
  const caseId = `CASE-${_siteId}`;
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ops/cases')
      .then((response) => response.json())
      .then(
        (
          cases: Array<{
            case_id: string;
            status: string;
            evidence_json?: { expected_wait_minutes?: number; available_chargers?: number };
          }>
        ) => {
          if (!cancelled) {
            const current = cases.find((item) => item.case_id === caseId);
            setCaseStatus(current?.status ?? 'unavailable');
            setCaseEvidence(current?.evidence_json ?? {});
          }
        }
      )
      .catch(() => {
        if (!cancelled) setCaseStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ops/cases/${caseId}/actions`)
      .then((response) => response.json())
      .then(
        (
          rows: Array<{
            action_id: string;
            action_type: string;
            status: string;
            expected_impact_json?: Record<string, number> | null;
            realized_impact_json?: Record<string, number> | null;
          }>
        ) => {
          if (!cancelled) setActionRows(Array.isArray(rows) ? rows : []);
        }
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [caseId]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ops/cases/${caseId}/audit`)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load action audit');
        return response.json();
      })
      .then((audit: { events: typeof executionEvents }) => {
        if (!cancelled) {
          const events = Array.isArray(audit?.events) ? audit.events : [];
          setExecutionEvents(events.filter((event) => event.event_type === 'action_executed'));
          setAuditCaseId(caseId);
          setAuditState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuditCaseId(caseId);
          setAuditState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);
  const currentAuditState = auditCaseId === caseId ? auditState : 'loading';
  const proposedActions = actionRows.filter((action) => action.status !== 'excluded');
  const executedActions = actionRows.filter((action) => action.status === 'executed').length;
  const linkedActions = proposedActions.filter((action) =>
    executionEvents.some((event) => event.action_id === action.action_id)
  ).length;
  const outcomeEvidence: Record<string, { title: string; needed: string }> = {
    maintenance_inspection: { title: 'Charger inspection', needed: 'Completed work order and later charger telemetry' },
    customer_routing: { title: 'Customer routing', needed: 'Verified route and later customer journey events' },
    inventory_preparation: { title: 'Stop Café readiness', needed: 'Later stock and convenience transactions' },
    vitay_communication: {
      title: 'VITAY communication',
      needed: 'Message delivery, uptake and attributable transactions',
    },
  };
  const targetImpact = proposedActions.reduce(
    (totals, action) => {
      const impact = action.expected_impact_json ?? {};
      return {
        journeysProtected: totals.journeysProtected + (impact.journeys_protected ?? 0),
        revenueProtected: totals.revenueProtected + (impact.revenue_protected_eur ?? 0),
        waitReduction: totals.waitReduction + (impact.wait_minutes_reduction ?? 0),
      };
    },
    { journeysProtected: 0, revenueProtected: 0, waitReduction: 0 }
  );
  const scenarioImpact = actionRows
    .filter((action) => action.status === 'executed')
    .reduce(
      (totals, action) => {
        const impact = action.realized_impact_json ?? {};
        return {
          journeysProtected: totals.journeysProtected + (impact.journeys_protected ?? 0),
          revenueProtected: totals.revenueProtected + (impact.revenue_protected_eur ?? 0),
          waitReduction: totals.waitReduction + (impact.wait_minutes_reduction ?? 0),
        };
      },
      { journeysProtected: 0, revenueProtected: 0, waitReduction: 0 }
    );
  const outcomesMeasured = caseStatus === 'measured' && executedActions > 0;
  const displayImpact = outcomesMeasured ? scenarioImpact : targetImpact;
  const impactMode = outcomesMeasured
    ? 'Recorded simulation'
    : caseStatus === 'needs_review'
      ? 'Illustrative all-actions scenario'
      : 'Submitted scenario target';
  const caseStatusLabel =
    caseStatus === 'loading'
      ? 'Loading'
      : caseStatus === 'error'
        ? 'Unavailable'
        : caseStatus === 'measured'
          ? 'scenario recorded'
          : caseStatus.replaceAll('_', ' ');
  const baselineWait = caseEvidence.expected_wait_minutes;
  const projectedWait =
    baselineWait != null && displayImpact.waitReduction > 0
      ? `${Math.max(0, baselineWait - displayImpact.waitReduction).toFixed(1)} min`
      : '—';
  const scenarioJourneys = displayImpact.journeysProtected > 0 ? String(displayImpact.journeysProtected) : '—';
  const scenarioRevenue =
    displayImpact.revenueProtected > 0 ? `€${(displayImpact.revenueProtected / 1000).toFixed(1)}k` : '—';
  const measures = [
    [
      'Customer wait',
      baselineWait == null ? '—' : `${baselineWait.toFixed(1)} min`,
      projectedWait,
      displayImpact.waitReduction > 0
        ? `−${displayImpact.waitReduction.toFixed(1)} min · ${impactMode.toLowerCase()}`
        : 'No scenario result',
    ],
    [
      'Chargers ready',
      caseEvidence.available_chargers == null ? '—' : String(caseEvidence.available_chargers),
      'Not measured',
      'Operational follow-up needed',
    ],
    ['Journeys protected', '—', scenarioJourneys, scenarioJourneys !== '—' ? impactMode : 'No scenario result'],
    ['Revenue protected', '—', scenarioRevenue, scenarioRevenue !== '—' ? impactMode : 'No scenario result'],
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orlen-red">ORLEN Mobility · Outcomes</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
          What value could the response create?
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Close the loop for <span className="font-semibold text-slate-950">{destinationLabel(_siteId)}</span> from
          operational action to a recorded scenario estimate. Actual customer and commercial impact still needs measured
          post-action data.
        </p>
      </div>
      <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
        <strong>{impactMode}:</strong>{' '}
        {outcomesMeasured
          ? 'Lakebase holds simulated effects for the executed action set.'
          : 'These values are a conditional target, not achieved results.'}{' '}
        Actual customer diversion, charger recovery, and revenue attribution remain unverified.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Journeys protected · scenario"
          value={scenarioJourneys}
          detail={`${impactMode} · not observed diversion`}
          capability="Lakebase"
        />
        <Kpi
          label="Customer wait"
          value={projectedWait}
          detail={`${impactMode} · not measured wait`}
          capability="Lakebase"
        />
        <Kpi
          label="Value protected"
          value={scenarioRevenue}
          detail={`${impactMode} · not attributed revenue`}
          capability="Lakebase"
        />
        <Kpi
          label="Operational state"
          value={caseStatus === 'measured' ? 'Scenario recorded' : caseStatusLabel}
          detail="Persisted in the ORLEN Lakebase branch · scenario"
          capability="Lakebase"
        />
      </div>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-950 px-6 py-5 text-white sm:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
              Lakebase action trace · outcome evidence
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">What can we prove after execution?</h3>
            <p className="mt-1 text-sm text-slate-300">
              Action records are linked. Customer and commercial results await later observations.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-right">
            <p className="text-2xl font-semibold leading-none">
              {currentAuditState === 'ready' ? `${linkedActions} / ${proposedActions.length}` : '—'}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-300">
              actions with audit links
            </p>
          </div>
        </div>
        {currentAuditState === 'error' ? (
          <p className="px-6 py-5 text-sm text-amber-900">
            Action audit is unavailable. Outcome evidence cannot be assessed.
          </p>
        ) : currentAuditState === 'loading' ? (
          <p className="px-6 py-5 text-sm text-slate-600">Loading action audit from Lakebase…</p>
        ) : proposedActions.length ? (
          <div className="grid gap-3 p-5 md:grid-cols-2 sm:p-6">
            {proposedActions.map((action) => {
              const event = executionEvents.find((item) => item.action_id === action.action_id);
              const evidence = outcomeEvidence[action.action_type] ?? {
                title: action.action_type.replaceAll('_', ' '),
                needed: 'Linked post-action source observation',
              };
              return (
                <div key={action.action_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-semibold text-slate-950">{evidence.title}</h4>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${event ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}
                    >
                      {event ? 'Action recorded' : 'Action pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    {event
                      ? `Audit #${event.event_id} · ${new Date(event.occurred_at).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC`
                      : 'No execution audit yet'}
                  </p>
                  <p className="mt-4 border-t border-slate-200 pt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Evidence needed to measure impact
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-800">{evidence.needed}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-6 py-5 text-sm text-slate-600">Submit a response plan to create action-level evidence.</p>
        )}
        <p className="border-t border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950 sm:px-8">
          <strong>Impact evidence pending.</strong>{' '}
          {outcomesMeasured
            ? 'The July historical replay has no action-linked observations after this execution.'
            : 'Post-action observations can be evaluated only after an approved execution.'}{' '}
          Scenario estimates above are not measured ORLEN outcomes.
        </p>
      </section>
      <Panel
        title="Persisted operational response"
        subtitle="The decision state carried by Lakebase across the hero journey"
        capability="Lakebase"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Actions in plan</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {caseStatus === 'needs_review' ? '—' : proposedActions.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Actions executed</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{executedActions}</p>
          </div>
          <div className="rounded-xl border border-border bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current case state</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-slate-950">{caseStatusLabel}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {caseStatus !== 'needs_review' && proposedActions.length > 0 ? (
            proposedActions.map((action) => (
              <span
                key={action.action_id}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  action.status === 'executed'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {action.action_type.replaceAll('_', ' ')} · {action.status}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">
              No submitted action plan yet. Select actions in Response plan.
            </span>
          )}
        </div>
      </Panel>
      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Baseline and scenario scorecard"
          subtitle="Historical starting point versus recorded modelled response"
          capability="Lakebase"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 font-semibold">Measure</th>
                  <th className="pb-3 font-semibold">Baseline</th>
                  <th className="pb-3 font-semibold">Scenario</th>
                  <th className="pb-3 text-right font-semibold">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {measures.map(([measure, before, after, change]) => (
                  <tr key={measure} className="border-b border-border last:border-0">
                    <td className="py-4 text-sm font-semibold text-slate-950">{measure}</td>
                    <td className="py-4 text-sm text-slate-600">{before}</td>
                    <td className="py-4 text-sm font-semibold text-slate-950">{after}</td>
                    <td className="py-4 text-right text-sm font-semibold text-slate-600">{change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel
          title="Closed-loop handoff"
          subtitle="What is recorded, and what must still be measured"
          capability="Lakebase"
        >
          <div className="space-y-3">
            {[
              [
                'Operational state',
                outcomesMeasured ? 'Simulated execution recorded in Lakebase' : 'Awaiting approved scenario execution',
              ],
              [
                'Customer outcome',
                outcomesMeasured
                  ? `${scenarioJourneys} journeys protected in the scenario; actual diversion unverified`
                  : scenarioJourneys === '—'
                    ? 'No routing impact in this action set'
                    : `${scenarioJourneys} conditional journeys protected; no execution recorded`,
              ],
              [
                'Commercial outcome',
                outcomesMeasured
                  ? `${scenarioRevenue} modelled revenue protection; attribution unverified`
                  : scenarioRevenue === '—'
                    ? 'No VITAY value estimate in this action set'
                    : `${scenarioRevenue} conditional revenue protection; no execution recorded`,
              ],
              [
                'Model feedback',
                'Observed-state classification can be compared with post-action outcomes after a measured feed is connected',
              ],
              [
                'Next decision',
                'Verify Elmshorn East route and capacity, then connect post-action measures through Lakeflow',
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

const overviewStory = [
  {
    step: '01',
    phase: 'Sense',
    label: 'Detect',
    question: 'What changed across the network?',
    proof: 'A historical event replay shows how destination state can surface a warning.',
    capability: 'Lakeflow',
  },
  {
    step: '02',
    phase: 'Sense',
    label: 'Diagnose',
    question: 'Why is this destination at risk?',
    proof: 'Governed measures connect chargers, journeys, demand, and retail value.',
    capability: 'Unity Catalog · Metric Views',
  },
  {
    step: '03',
    phase: 'Decide',
    label: 'Classify',
    question: 'Which observed charger condition needs inspection?',
    proof: 'Observed-degradation ML scores are compared with a fixed rule; future failure is not yet forecast.',
    capability: 'MLflow + ML',
  },
  {
    step: '04',
    phase: 'Decide',
    label: 'Recommend',
    question: 'Which response protects the most value?',
    proof: 'Genie and the operations agent coordinate bounded actions across teams.',
    capability: 'Genie · Agent',
  },
  {
    step: '05',
    phase: 'Act and learn',
    label: 'Govern',
    question: 'Is the response safe to execute?',
    proof: 'Policy, identity, approval, and trace stay visible before commitment.',
    capability: 'Unity Gateway · Lakebase',
  },
  {
    step: '06',
    phase: 'Act and learn',
    label: 'Measure',
    question: 'Did the response improve value?',
    proof: 'Modelled customer and ORLEN outcomes show the measurement path; realized impact needs a live action feed.',
    capability: 'AI/BI · Lakeflow',
  },
] as const;

function OverviewView({ selectedSiteId, config }: { selectedSiteId: string; config: WorkshopConfig }) {
  const { data, loading, warehouseStatus } = useAnalyticsQuery('network_overview', {
    catalog_name: sql.string(config.catalog),
    schema_name: sql.string(config.schema),
  });
  const risk = useAnalyticsQuery('charger_risk', {
    catalog_name: sql.string(config.catalog),
    schema_name: sql.string(config.schema),
    site_id: sql.string(selectedSiteId),
  });
  const journeys = useAnalyticsQuery('journey_outcomes', {
    catalog_name: sql.string(config.catalog),
    schema_name: sql.string(config.schema),
    site_id: sql.string(selectedSiteId),
  });
  const rows = (data ?? []) as NetworkRow[];
  const hero = rows.find((row) => row.site_id === selectedSiteId);
  const highRiskScoreRecords = risk.data?.reduce((total, row) => total + Number(row.high_risk_predictions ?? 0), 0);
  const affectedJourneys = journeys.data?.reduce((total, row) => total + Number(row.affected_journeys ?? 0), 0);
  const atRiskSites = rows.reduce((total, row) => total + Number(row.at_risk_sites ?? 0), 0);
  const availableChargers = rows.reduce((total, row) => total + Number(row.available_chargers ?? 0), 0);
  const averageWait = rows.length
    ? rows.reduce((total, row) => total + Number(row.expected_wait_minutes ?? 0), 0) / rows.length
    : 0;
  const [caseStatus, setCaseStatus] = useState('loading');
  const caseId = `CASE-${selectedSiteId}`;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ops/cases')
      .then((response) => response.json())
      .then((cases: Array<{ case_id: string; status: string }>) => {
        if (!cancelled) setCaseStatus(cases.find((item) => item.case_id === caseId)?.status ?? 'needs_review');
      })
      .catch(() => {
        if (!cancelled) setCaseStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const statusLabel = caseStatus === 'loading' ? 'Loading' : caseStatus.replaceAll('_', ' ');
  const heroSite = rows.find((row) => row.site_id === selectedSiteId);

  return (
    <div className="space-y-7">
      <section className="grid gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-white p-7 shadow-[0_22px_60px_rgba(15,23,42,0.1)] sm:p-10 lg:grid lg:grid-cols-[minmax(0,1fr)_210px] lg:gap-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orlen-red-soft blur-3xl" />
          <div className="relative z-10">
            <p className="relative mb-4 text-xs font-bold uppercase tracking-[0.24em] text-orlen-red">
              ORLEN Mobility · Decision control tower
            </p>
            <h2 className="hero-title relative max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl">
              Turn every destination into a decision.
            </h2>
            <p className="relative mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              This is the story of how ORLEN can connect multi-energy supply, convenience retail, customer journeys, and
              operational intelligence—then move from signal to governed action and measurable value.
            </p>
            <div className="relative mt-8 flex flex-wrap gap-2">
              {['Historical signal replay', 'Machine learning', 'Agentic decisions', 'Modelled outcomes'].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </div>
          <aside className="relative z-10 mt-8 hidden flex-col justify-between border-l border-border pl-6 lg:flex">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orlen-red">Decision spine</p>
              <p className="mt-3 text-lg font-semibold leading-6 text-slate-950">
                One connected thread across five decision tabs.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  ['01', 'Sense', 'Network + Investigate'],
                  ['02', 'Decide', 'Response plan'],
                  ['03', 'Act & learn', 'Approval + Outcomes'],
                ].map(([step, label, tabs]) => (
                  <div key={step} className="relative pl-9">
                    <span className="absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-full bg-orlen-red-soft text-[10px] font-bold text-orlen-red">
                      {step}
                    </span>
                    <p className="text-sm font-semibold text-slate-950">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{tabs}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-8 border-t border-border pt-4 text-xs leading-5 text-slate-500">
              The selected Elmshorn case carries context from signal to measured value.
            </p>
          </aside>
        </div>

        <div className="accent-card relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-orlen-red p-6 text-white sm:p-7">
          <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Hero scenario</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">Protect the Elmshorn journey</h3>
            </div>
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold capitalize">
              {statusLabel}
            </span>
          </div>
          <p className="relative mt-5 text-sm leading-6 text-white/80">
            A high-value charging destination is heading into a demand peak. ORLEN needs to protect customers without
            treating the whole destination as unavailable.
          </p>
          <div className="relative mt-7 grid grid-cols-2 gap-3">
            {[
              [hero ? `${numeric(hero.expected_wait_minutes).toFixed(1)} min` : '—', 'expected wait · modelled'],
              [risk.data?.length ? String(highRiskScoreRecords ?? 0) : '—', 'historical high-risk score records'],
              ['5 energy types', 'network mix'],
              [journeys.data?.length ? String(affectedJourneys ?? 0) : '—', 'affected journeys · modelled'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-white/15 bg-black/10 p-3">
                <p className="text-lg font-semibold">{value}</p>
                <p className="mt-1 text-[11px] text-white/65">{label}</p>
              </div>
            ))}
          </div>
          <div className="relative mt-7 border-t border-white/20 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Response path</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85">
              {['Detect', 'Classify', 'Recommend', 'Measure'].map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1.5">{step}</span>
                  {index < 3 ? <span className="text-white/45">→</span> : null}
                </span>
              ))}
            </div>
          </div>
          <div className="relative mt-7 border-t border-white/20 pt-5 text-sm text-white/80">
            <span className="font-semibold text-white">{heroSite?.site_name ?? destinationLabel(selectedSiteId)}</span>
            <span className="mx-2 text-white/40">·</span>
            {heroSite?.city ?? 'Elmshorn'}, {heroSite?.country ?? 'Germany'}
            <p className="mt-2 text-[11px] text-white/60">Public location context · synthetic operational measures</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Destinations in view', loading ? '—' : `${rows.length}`, 'Unity Catalog', '80 destinations · 7 markets'],
          ['At-risk destinations', loading ? '—' : `${atRiskSites}`, 'MLflow + ML', 'intervention queue'],
          ['Available chargers', loading ? '—' : `${Math.round(availableChargers)}`, 'Metric Views', 'network now'],
          [
            'Average expected wait',
            loading ? '—' : `${averageWait.toFixed(1)} min`,
            'AI/BI',
            warehouseStatus ? 'governed query · scenario snapshot' : 'scenario network average',
          ],
        ].map(([label, value, capability, detail]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">{label}</p>
              <ProductBadge>{capability}</ProductBadge>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orlen-red">The storyline</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              From replayed signal to modelled value
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Each step earns its place in the demo and hands context to the next tab.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {(['Sense', 'Decide', 'Act and learn'] as const).map((phase) => (
            <section
              key={phase}
              className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-950">{phase}</h4>
                <span className="text-xs font-semibold text-orlen-red">
                  {phase === 'Sense'
                    ? 'See the signal'
                    : phase === 'Decide'
                      ? 'Choose the response'
                      : 'Prove the value'}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {overviewStory
                  .filter((story) => story.phase === phase)
                  .map(({ step, label, question, proof, capability }) => (
                    <div
                      key={step}
                      className="group rounded-xl border border-border bg-slate-50 p-4 transition hover:border-orlen-red hover:bg-orlen-red-soft"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-orlen-red-soft text-xs font-bold text-orlen-red">
                          {step}
                        </span>
                        <ProductBadge>{capability}</ProductBadge>
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-950">{label}</p>
                      <p className="mt-1 text-sm font-medium text-orlen-red">{question}</p>
                      <p className="mt-2 text-sm leading-5 text-slate-600">{proof}</p>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          [
            'For the customer',
            'More reliable stops, less waiting, clearer alternatives, and relevant benefits across the journey.',
            'Journey reliability',
          ],
          [
            'For ORLEN',
            'Higher destination availability, protected charging throughput, stronger convenience attachment, and measurable revenue.',
            'Network and commercial value',
          ],
          [
            'For the operating model',
            'A governed learning loop connecting observed-state classification, recommendations, approvals, and modelled outcomes.',
            'Reusable intelligence',
          ],
        ].map(([title, description, label]) => (
          <div key={title} className="rounded-2xl border border-border bg-orlen-red-soft p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orlen-red">{label}</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<(typeof appTabs)[number]>('Overview');
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-00007');
  const [config, setConfig] = useState<WorkshopConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/workshop-config')
      .then((response) => {
        if (!response.ok) throw new Error('Workshop configuration unavailable');
        return response.json() as Promise<WorkshopConfig>;
      })
      .then((value) => {
        if (!cancelled) setConfig(value);
      })
      .catch(() => {
        if (!cancelled) setConfigError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const comparisonSelected = selectedSiteId !== 'SITE-00007';
  const selectSite = (siteId: string) => {
    if (siteId !== selectedSiteId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('conversationId');
      window.history.replaceState(null, '', url);
    }
    setSelectedSiteId(siteId);
  };

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <header className="app-header border-b border-border">
        <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex min-h-20 items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="brand-orb flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm sm:h-12 sm:w-12">
                <img src="/orlen-logo.png" alt="ORLEN" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.24em] text-orlen-red sm:text-[11px]">
                  Intelligent destination operations
                </p>
                <h1 className="header-title truncate text-lg font-bold tracking-[-0.025em] sm:text-2xl">
                  ORLEN Mobility Control Tower
                </h1>
                <p className="hidden truncate text-[11px] font-medium tracking-wide text-slate-500 sm:block">
                  Multi-energy network · customer journeys · measurable value
                </p>
              </div>
            </div>
            <div className="header-status hidden items-center gap-3 rounded-2xl px-4 py-2.5 text-xs sm:flex">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                  aria-hidden="true"
                />
                Modelled network
              </span>
              <span className="h-4 w-px bg-orlen-red-soft" aria-hidden="true" />
              <span className="font-medium text-slate-500">Elmshorn hero case</span>
            </div>
          </div>

          <nav aria-label="Application sections" className="-mx-1 flex gap-1 overflow-x-auto pb-3">
            {appTabs.map((tab) => {
              const heroActionTab = tab === 'Response plan' || tab === 'Approval & execution' || tab === 'Outcomes';
              const disabled = comparisonSelected && heroActionTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    if (tab === 'Overview' && comparisonSelected) selectSite('SITE-00007');
                    setActiveTab(tab);
                  }}
                  disabled={disabled}
                  title={disabled ? 'Return to the Elmshorn hero case to open its action workflow' : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                    activeTab === tab
                      ? 'nav-active text-white'
                      : disabled
                        ? 'cursor-not-allowed text-slate-400'
                        : 'text-slate-500 hover:bg-orlen-red-soft hover:text-orlen-red'
                  }`}
                  aria-current={activeTab === tab ? 'page' : undefined}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
          {comparisonSelected ? (
            <p className="pb-3 text-xs text-slate-600">
              Comparing {selectedSiteId}. Actions and outcomes are scoped to the Elmshorn hero case; return to Elmshorn
              from Investigate to continue.
            </p>
          ) : null}
        </div>
      </header>

      <main className="w-full px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14 xl:px-16">
        {configError ? <p role="alert">Workshop configuration unavailable. Check the App environment.</p> : null}
        {!config && !configError ? <p>Loading workshop configuration…</p> : null}
        {config && activeTab === 'Network' ? (
          <NetworkView
            config={config}
            selectedSiteId={selectedSiteId}
            onSelect={selectSite}
            onInvestigate={() => setActiveTab('Investigate')}
          />
        ) : null}
        {config && activeTab === 'Investigate' ? (
          <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading investigation…</p>}>
            <InvestigateView
              config={config}
              siteId={selectedSiteId}
              onResponsePlan={() => setActiveTab('Response plan')}
              onReturnToHero={() => selectSite('SITE-00007')}
            />
          </Suspense>
        ) : null}
        {activeTab === 'Response plan' ? (
          <ResponsePlanView siteId="SITE-00007" onApproval={() => setActiveTab('Approval & execution')} />
        ) : null}
        {activeTab === 'Approval & execution' ? (
          <ApprovalView
            siteId="SITE-00007"
            onResponsePlan={() => setActiveTab('Response plan')}
            onOutcomes={() => setActiveTab('Outcomes')}
          />
        ) : null}
        {activeTab === 'Outcomes' ? <OutcomesView siteId="SITE-00007" /> : null}
        {config && activeTab === 'Overview' ? <OverviewView config={config} selectedSiteId="SITE-00007" /> : null}
      </main>
    </div>
  );
}

export default App;
