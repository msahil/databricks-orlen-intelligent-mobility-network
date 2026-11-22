export type NetworkRow = {
  site_id: string;
  site_name: string;
  city: string;
  country: string;
  station_format: string;
  road_context: string;
  location_data_status: string;
  operating_status: string;
  snapshot_time: string;
  available_chargers: number;
  expected_wait_minutes: number;
  traffic_demand_index: number;
  stop_cafe_demand_index: number;
  inventory_risk_score: number;
  at_risk_sites: number;
};

export type DestinationProfile = {
  site_id: string;
  fuel_types_csv: string;
  facilities_csv: string;
  installed_chargers: number;
  max_charger_kw: number;
};

export type JourneyExposure = {
  site_id: string;
  customer_segment: string;
  journey_count: number;
  affected_journeys: number;
  margin_proxy_eur: number;
};

export type NetworkSite = NetworkRow & {
  profile?: DestinationProfile;
  exposure?: {
    journeyCount: number;
    affectedJourneys: number;
    marginProxyEur: number;
    segments: string[];
  };
};

export type MapLayer = 'Risk' | 'Demand' | 'Capacity' | 'Wait';

export const publicCityCoordinates: Record<string, [number, number]> = {
  olsztynek: [20.28, 53.58],
  bratislava: [17.11, 48.15],
  gdynia: [18.53, 54.52],
  piła: [16.74, 53.15],
  katowice: [19.02, 50.26],
  poznań: [16.93, 52.41],
  elmshorn: [9.65, 53.75],
  prague: [14.44, 50.08],
  litvínov: [13.62, 50.6],
  szczecin: [14.55, 53.43],
  'gorzów wielkopolski': [15.23, 52.74],
  'nowy dwór gdański': [19.12, 54.21],
  włocławek: [19.07, 52.65],
  warsaw: [21.01, 52.23],
};

// Scenario waypoint for the Elmshorn comparison. No real ORLEN station address is verified.
export const elmshornScenarioCoordinates: [number, number] = [9.75, 53.75];

export function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function services(site: NetworkSite) {
  const fuel = site.profile?.fuel_types_csv.split(',').filter(Boolean) ?? [];
  return site.profile && numeric(site.profile.installed_chargers) > 0 ? ['ev', ...fuel] : fuel;
}

export function facilities(site: NetworkSite) {
  return site.profile?.facilities_csv.split(',').filter(Boolean) ?? [];
}

export function marginExposure(site: NetworkSite) {
  if (!site.exposure?.journeyCount) return 0;
  return (site.exposure.marginProxyEur * site.exposure.affectedJourneys) / site.exposure.journeyCount;
}

export function decisionComponents(site: NetworkSite) {
  const service = Math.min(
    35,
    numeric(site.at_risk_sites) * 25 + Math.max(0, numeric(site.expected_wait_minutes) - 8) * 2
  );
  const customers = Math.min(30, numeric(site.exposure?.affectedJourneys) / 15);
  const commercial = Math.min(25, marginExposure(site) / 300);
  const demand = Math.min(10, Math.max(0, numeric(site.traffic_demand_index) - 1) * 10);
  return { service, customers, commercial, demand };
}

export function networkRiskScore(site: NetworkSite) {
  const parts = decisionComponents(site);
  return Math.round(parts.service + parts.customers + parts.commercial + parts.demand);
}

export function networkRiskBand(site: NetworkSite) {
  const score = networkRiskScore(site);
  return score >= 65 ? 'Critical' : score >= 25 ? 'Watch' : 'Stable';
}

export function publicCoordinates(site: NetworkSite): [number, number] | undefined {
  if (site.site_id === 'SITE-00015' && site.location_data_status === 'synthetic_scenario_location') {
    return elmshornScenarioCoordinates;
  }
  if (site.location_data_status !== 'publicly_named') return undefined;
  return publicCityCoordinates[site.city.trim().toLowerCase()];
}

export function distanceKm(left: [number, number], right: [number, number]) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLatitude = radians(right[1] - left[1]);
  const dLongitude = radians(right[0] - left[0]);
  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(radians(left[1])) * Math.cos(radians(right[1])) * Math.sin(dLongitude / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function snapshotAgeHours(snapshot: string) {
  const value = new Date(snapshot).getTime();
  return Number.isFinite(value) ? (Date.now() - value) / 3_600_000 : null;
}

export function enrichNetwork(rows: NetworkRow[], profiles: DestinationProfile[], exposureRows: JourneyExposure[]) {
  const profileBySite = new Map(profiles.map((profile) => [profile.site_id, profile]));
  const exposureBySite = new Map<string, NonNullable<NetworkSite['exposure']>>();
  for (const row of exposureRows) {
    const current = exposureBySite.get(row.site_id) ?? {
      journeyCount: 0,
      affectedJourneys: 0,
      marginProxyEur: 0,
      segments: [],
    };
    current.journeyCount += numeric(row.journey_count);
    current.affectedJourneys += numeric(row.affected_journeys);
    current.marginProxyEur += numeric(row.margin_proxy_eur);
    if (numeric(row.affected_journeys) > 0 && !current.segments.includes(row.customer_segment)) {
      current.segments.push(row.customer_segment);
    }
    exposureBySite.set(row.site_id, current);
  }
  return rows.map((row) => ({
    ...row,
    profile: profileBySite.get(row.site_id),
    exposure: exposureBySite.get(row.site_id),
  }));
}
