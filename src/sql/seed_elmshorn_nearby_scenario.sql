-- Targeted, idempotent Bronze patch for the existing 80-site workshop baseline.
-- SITE-00015 is a scenario-defined destination. Its point is approximately 7 km
-- straight-line from the Elmshorn city-centre reference used in the App.
-- This does not establish a real ORLEN site or a drive route.
UPDATE IDENTIFIER(CONCAT(:catalog_name, '.', :schema_name, '.mobility_bronze_sites'))
SET
  site_name = 'ORLEN Charge Elmshorn East',
  city = 'Elmshorn area',
  country = 'Germany',
  market = 'Germany',
  station_format = 'multi_bay_fast_charge_hub',
  road_context = 'Elmshorn East scenario waypoint; address verification pending',
  location_data_status = 'synthetic_scenario_location',
  latitude = 53.75,
  longitude = 9.75,
  public_source_url = CAST(NULL AS STRING),
  data_provenance = 'scenario-defined location, services and operational measures; real site unverified'
WHERE site_id = 'SITE-00015'
  AND location_data_status IN ('synthetic_reference_location', 'synthetic_scenario_location')
