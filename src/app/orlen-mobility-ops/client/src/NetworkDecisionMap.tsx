import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { FeatureCollection, LineString, Point } from 'geojson';
import type { MapLayer, NetworkSite } from './network-model';
import { networkRiskBand, networkRiskScore, numeric, publicCoordinates } from './network-model';
import 'maplibre-gl/dist/maplibre-gl.css';

const mapStyleUrl = 'https://tiles.openfreemap.org/styles/positron';

type SiteProperties = {
  site_id: string;
  site_name: string;
  country: string;
  risk_band: string;
  wait: number;
  demand: number;
  available_chargers: number;
  risk_critical: number;
  risk_watch: number;
  risk_score: number;
};

function siteFeatures(rows: NetworkSite[]): FeatureCollection<Point, SiteProperties> {
  return {
    type: 'FeatureCollection',
    features: rows.flatMap((site) => {
      const coordinates = publicCoordinates(site);
      return coordinates
        ? [
            {
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates },
              properties: {
                site_id: site.site_id,
                site_name: site.site_name,
                country: site.country,
                risk_band: networkRiskBand(site),
                wait: numeric(site.expected_wait_minutes),
                demand: numeric(site.traffic_demand_index),
                available_chargers: numeric(site.available_chargers),
                risk_critical: networkRiskBand(site) === 'Critical' ? 1 : 0,
                risk_watch: networkRiskBand(site) === 'Watch' ? 1 : 0,
                risk_score: networkRiskScore(site),
              },
            },
          ]
        : [];
    }),
  };
}

function comparisonLinks(
  selected: NetworkSite | undefined,
  alternatives: NetworkSite[]
): FeatureCollection<LineString> {
  const start = selected && publicCoordinates(selected);
  return {
    type: 'FeatureCollection',
    features: start
      ? alternatives.flatMap((site) => {
          const end = publicCoordinates(site);
          return end
            ? [
                {
                  type: 'Feature' as const,
                  geometry: { type: 'LineString' as const, coordinates: [start, end] },
                  properties: {},
                },
              ]
            : [];
        })
      : [],
  };
}

export function NetworkDecisionMap({
  rows,
  selectedSiteId,
  alternatives,
  layer,
  showLinks,
  onSelect,
}: {
  rows: NetworkSite[];
  selectedSiteId: string;
  alternatives: NetworkSite[];
  layer: MapLayer;
  showLinks: boolean;
  onSelect: (siteId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const layerRef = useRef(layer);
  const lastSelectionRef = useRef(selectedSiteId);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    layerRef.current = layer;
  }, [layer]);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        center: [17, 53],
        zoom: 3.6,
        minZoom: 3,
        maxZoom: 12,
        style: mapStyleUrl,
        attributionControl: { compact: true },
      });
    } catch {
      queueMicrotask(() => setMapError(true));
      return;
    }
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    let activePopup: maplibregl.Popup | null = null;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('error', () => setMapError(true));
    map.on('load', () => {
      map.addSource('network-sites', {
        type: 'geojson',
        data: siteFeatures([]),
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 7,
        clusterProperties: {
          critical_count: ['+', ['get', 'risk_critical']],
          watch_count: ['+', ['get', 'risk_watch']],
          demand_total: ['+', ['get', 'demand']],
          capacity_total: ['+', ['get', 'available_chargers']],
          wait_total: ['+', ['get', 'wait']],
        },
      });
      map.addSource('network-demand', { type: 'geojson', data: siteFeatures([]) });
      map.addSource('comparison-links', { type: 'geojson', data: comparisonLinks(undefined, []) });
      map.addLayer({
        id: 'network-links',
        type: 'line',
        source: 'comparison-links',
        paint: { 'line-color': '#d1181d', 'line-width': 2, 'line-opacity': 0.55, 'line-dasharray': [2, 3] },
      });
      map.addLayer({
        id: 'network-heat',
        type: 'heatmap',
        source: 'network-demand',
        paint: {
          'heatmap-weight': ['min', 1, ['/', ['get', 'demand'], 2]],
          'heatmap-intensity': 1.5,
          'heatmap-radius': 42,
          'heatmap-opacity': 0,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(209,24,29,0)',
            0.35,
            '#fde5e3',
            0.7,
            '#d1181d',
            1,
            '#d1181d',
          ],
        },
      });
      map.addLayer({
        id: 'network-clusters',
        type: 'circle',
        source: 'network-sites',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#087f5b',
          'circle-radius': ['step', ['get', 'point_count'], 22, 10, 26],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
        },
      });
      map.addLayer({
        id: 'network-cluster-count',
        type: 'symbol',
        source: 'network-sites',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 11,
          'text-font': ['Noto Sans Regular'],
        },
        paint: { 'text-color': '#fff' },
      });
      map.addLayer({
        id: 'network-selected',
        type: 'circle',
        source: 'network-sites',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'site_id'], '']],
        paint: {
          'circle-radius': 19,
          'circle-color': '#d1181d',
          'circle-opacity': 0.18,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#d1181d',
        },
      });
      map.addLayer({
        id: 'network-points',
        type: 'circle',
        source: 'network-sites',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 8,
          'circle-color': '#087f5b',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2.5,
        },
      });
      map.on('click', 'network-clusters', (event) => {
        const point = map.queryRenderedFeatures(event.point, { layers: ['network-clusters'] })[0];
        if (point?.geometry.type === 'Point')
          map.easeTo({ center: point.geometry.coordinates as [number, number], zoom: Math.min(map.getZoom() + 2, 10) });
      });
      map.on('click', 'network-points', (event) => {
        const point = map.queryRenderedFeatures(event.point, { layers: ['network-points'] })[0];
        const siteId: unknown = point?.properties?.site_id;
        if (typeof siteId === 'string') onSelectRef.current(siteId);
      });
      map.on('mouseenter', 'network-points', (event) => {
        map.getCanvas().style.cursor = 'pointer';
        const point = map.queryRenderedFeatures(event.point, { layers: ['network-points'] })[0];
        if (point?.geometry.type !== 'Point') return;
        const detail = document.createElement('div');
        detail.className = 'text-sm';
        const siteName: unknown = point.properties?.site_name;
        const country: unknown = point.properties?.country;
        const wait: unknown = point.properties?.wait;
        const demand: unknown = point.properties?.demand;
        const available: unknown = point.properties?.available_chargers;
        const riskScore: unknown = point.properties?.risk_score;
        const metric = {
          Risk: `${Math.round(numeric(typeof riskScore === 'number' ? riskScore : 0))}/100 decision index`,
          Demand: `${numeric(typeof demand === 'number' ? demand : 0).toFixed(2)}× traffic demand`,
          Capacity: `${Math.round(numeric(typeof available === 'number' ? available : 0))} chargers ready`,
          Wait: `${numeric(typeof wait === 'number' ? wait : 0).toFixed(1)} min expected wait`,
        }[layerRef.current];
        detail.textContent = `${typeof siteName === 'string' ? siteName : 'Destination'} · ${typeof country === 'string' ? country : ''} · ${metric}`;
        activePopup?.remove();
        activePopup = new maplibregl.Popup({ closeButton: false, offset: 16 })
          .setLngLat(point.geometry.coordinates as [number, number])
          .setDOMContent(detail)
          .addTo(map);
      });
      map.on('mouseleave', 'network-points', () => {
        map.getCanvas().style.cursor = '';
        activePopup?.remove();
        activePopup = null;
      });
    });
    return () => {
      resizeObserver.disconnect();
      activePopup?.remove();
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const data = siteFeatures(rows);
      const sitesSource = map.getSource('network-sites');
      const demandSource = map.getSource('network-demand');
      const linksSource = map.getSource('comparison-links');
      if (
        !(sitesSource instanceof maplibregl.GeoJSONSource) ||
        !(demandSource instanceof maplibregl.GeoJSONSource) ||
        !(linksSource instanceof maplibregl.GeoJSONSource)
      )
        return;
      sitesSource.setData(data);
      demandSource.setData(data);
      const selected = rows.find((site) => site.site_id === selectedSiteId);
      linksSource.setData(comparisonLinks(selected, alternatives));
      map.setFilter('network-selected', [
        'all',
        ['!', ['has', 'point_count']],
        ['==', ['get', 'site_id'], selectedSiteId],
      ]);
      map.setLayoutProperty('network-links', 'visibility', showLinks ? 'visible' : 'none');
      map.setPaintProperty('network-heat', 'heatmap-opacity', layer === 'Demand' ? 0.58 : 0);
      const colors: Record<MapLayer, unknown[]> = {
        Risk: ['match', ['get', 'risk_band'], 'Critical', '#d1181d', 'Watch', '#b86908', '#087f5b'],
        Demand: ['step', ['get', 'demand'], '#087f5b', 1.4, '#b86908', 2, '#d1181d'],
        Capacity: ['step', ['get', 'available_chargers'], '#d1181d', 1, '#b86908', 3, '#087f5b'],
        Wait: ['step', ['get', 'wait'], '#087f5b', 12, '#b86908', 16, '#d1181d'],
      };
      const clusterColors: Record<MapLayer, unknown[]> = {
        Risk: [
          'case',
          ['>', ['get', 'critical_count'], 0],
          '#d1181d',
          ['>', ['get', 'watch_count'], 0],
          '#b86908',
          '#087f5b',
        ],
        Demand: [
          'step',
          ['/', ['get', 'demand_total'], ['get', 'point_count']],
          '#087f5b',
          1.4,
          '#b86908',
          2,
          '#d1181d',
        ],
        Capacity: [
          'step',
          ['/', ['get', 'capacity_total'], ['get', 'point_count']],
          '#d1181d',
          1,
          '#b86908',
          3,
          '#087f5b',
        ],
        Wait: ['step', ['/', ['get', 'wait_total'], ['get', 'point_count']], '#087f5b', 12, '#b86908', 16, '#d1181d'],
      };
      const clusterLabels: Record<MapLayer, unknown[]> = {
        Risk: ['to-string', ['get', 'point_count_abbreviated']],
        Demand: [
          'concat',
          [
            'number-format',
            ['/', ['get', 'demand_total'], ['get', 'point_count']],
            { 'min-fraction-digits': 1, 'max-fraction-digits': 1 },
          ],
          '×',
        ],
        Capacity: ['to-string', ['get', 'capacity_total']],
        Wait: ['concat', ['to-string', ['round', ['/', ['get', 'wait_total'], ['get', 'point_count']]]], 'm'],
      };
      map.setPaintProperty('network-points', 'circle-color', colors[layer]);
      map.setPaintProperty('network-clusters', 'circle-color', clusterColors[layer]);
      map.setLayoutProperty('network-cluster-count', 'text-field', clusterLabels[layer]);
    };
    if (map.isStyleLoaded()) update();
    else void map.once('load', update);
    return () => {
      map.off('load', update);
    };
  }, [rows, selectedSiteId, alternatives, layer, showLinks]);

  useEffect(() => {
    const map = mapRef.current;
    if (lastSelectionRef.current === selectedSiteId) return;
    lastSelectionRef.current = selectedSiteId;
    const selected = rows.find((site) => site.site_id === selectedSiteId);
    const coordinates = selected && publicCoordinates(selected);
    if (map && coordinates)
      map.easeTo({
        center: coordinates,
        zoom: Math.max(map.getZoom(), selectedSiteId === 'SITE-00015' ? 9 : 5),
        duration: 550,
      });
  }, [rows, selectedSiteId]);

  const mappedPublic = rows.filter(
    (row) => row.location_data_status === 'publicly_named' && publicCoordinates(row)
  ).length;
  const mappedScenario = rows.filter(
    (row) => row.location_data_status === 'synthetic_scenario_location' && publicCoordinates(row)
  ).length;
  const mapped = mappedPublic + mappedScenario;
  return (
    <div className="relative min-h-[500px] flex-1">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full bg-[#edf3f2]"
        role="img"
        aria-label="Interactive European map of publicly named ORLEN destinations and an Elmshorn-area scenario waypoint"
      />
      <div className="pointer-events-none absolute bottom-3 left-3 max-w-[300px] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-[11px] leading-5 text-slate-700 shadow-sm">
        {mappedPublic} public city locations · {mappedScenario} scenario waypoint
        {mappedScenario === 1 ? '' : 's'} mapped · {rows.length - mapped} reference locations in the table below
        {showLinks ? <span className="block">Dashed lines compare locations; they are not drive routes.</span> : null}
      </div>
      {mapError ? (
        <div
          className="absolute inset-x-3 top-3 rounded-xl border border-amber-300 bg-white p-3 text-sm text-slate-700 shadow-sm"
          role="status"
        >
          Map tiles are unavailable. The destination table and decision panels remain usable below.
        </div>
      ) : null}
    </div>
  );
}
