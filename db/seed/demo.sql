-- Controlled fictional seed data. Do not run this file against a production database.

insert into public.plants (id, code, name, timezone)
values ('10000000-0000-0000-0000-000000000001', 'SZ', 'Domel Electric Motors Suzhou', 'Asia/Shanghai')
on conflict (code) do nothing;

insert into public.products (id, plant_id, code, name, family, application, owner_label)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ECM-180', 'EC Ventilation Motor 180', 'EC motors', 'HVAC ventilation', 'HVAC programme'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'VAC-900', 'Vacuum Motor 900', 'Vacuum motors', 'Household vacuum', 'Vacuum programme'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'BLW-240', 'Compact Blower 240', 'Blowers', 'Air handling', 'Blower programme')
on conflict (plant_id, code) do nothing;

insert into public.monthly_production
  (product_id, month, planned_units, produced_units, on_time_rate, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 8500, 8150, 92.7, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 6800, 6500, 95.4, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 4500, 4000, 88.9, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 9000, 8450, 93.9, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 7000, 6720, 96.0, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 4800, 4300, 89.6, 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_quality
  (product_id, month, tested_units, passed_units, field_returns, defect_rate, risk, quality_note, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 8100, 7938, 22, 2.0, 'Medium', 'Connector variation remains under review.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 6460, 6395, 13, 1.0, 'Low', 'Stable outgoing inspection result.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 3960, 3821, 24, 3.5, 'High', 'Bearing noise requires supplier follow-up.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 8400, 8232, 18, 2.0, 'Medium', 'Connector variation remains under review.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 6680, 6613, 11, 1.0, 'Low', 'Stable outgoing inspection result.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 4260, 4132, 21, 3.0, 'High', 'Bearing noise requires supplier follow-up.', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_sales
  (product_id, month, order_count, shipped_units, unit_price, currency, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 31, 7900, 84, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 25, 6300, 71, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 17, 3800, 63, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 34, 8200, 86, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 27, 6500, 72, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 19, 4100, 64, 'EUR', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_costs
  (product_id, month, unit_variable_cost, monthly_fixed_cost, currency, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 53, 116000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 44, 94000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 40, 70000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 54, 118000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 45, 96000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 41, 72000, 'EUR', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.work_items
  (id, product_id, assigned_role, title, action, priority, due_at, status)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'production_planner', 'Confirm November capacity', 'Review the EC motor demand scenario against the current line plan.', 'High', '2026-11-03T09:00:00+08:00', 'open'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'production_planner', 'Resolve blower backlog', 'Coordinate the revised bearing delivery with production sequencing.', 'Medium', '2026-11-05T09:00:00+08:00', 'open')
on conflict (id) do nothing;

-- Public-source research records from the offline prototype. These are UAT
-- fixtures, not Domel operating data. Run only after an Admin or Decision Owner
-- account has been created and assigned.
do $seed$
declare
  v_seed_user uuid;
begin
  select user_id into v_seed_user
  from public.user_roles
  where role in ('admin', 'decision_owner')
  order by (role = 'admin') desc, assigned_at
  limit 1;

  if v_seed_user is null then
    raise notice 'Industry Intelligence seed skipped: assign an Admin or Decision Owner first.';
    return;
  end if;

  insert into public.evidence_records
    (id, title, publisher, source_url, published_on, captured_on, topic, fact,
     interpretation, limitations, verification_status, created_by, review_note,
     reviewed_by, reviewed_at)
  values
    (
      '40000000-0000-0000-0000-000000000001',
      $e$Domel ferrite PMSM platforms target HVAC applications$e$,
      'Domel',
      'https://www.domel.com/solutions/heating-ventilation-and-air-conditioning-19',
      null, '2026-10-13', 'Technology',
      $e$Domel identifies AZ, ZZ, NZ and NZA as permanent-magnet synchronous motor families using ferrite magnets. Listed applications include air-handling units, data-centre cooling, heat pumps and heat-recovery units.$e$,
      $e$Inference: application-specific efficiency and integration evidence could support an HVAC positioning strategy; the product page does not establish customer purchasing intent.$e$,
      $e$Publication date, regional sales, price, order pipeline and independently measured performance for a selected motor/drive combination are not provided.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed for the offline prototype; publisher claims were not independently tested.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000002',
      $e$High-power ventilation drives depend on qualified partners$e$,
      'Domel',
      'https://www.domel.com/products/motor-drives-82',
      null, '2026-10-13', 'Supply chain',
      $e$Domel states that it does not produce its own high-power PMS motor drives primarily intended for ventilation. It collaborates with OJ Electronics and Invertek and also reports testing motors with Danfoss and ABB drives.$e$,
      $e$Inference: a complete-system offer may require partner availability, settings validation and motor/drive compatibility work.$e$,
      $e$No partner lead times, purchasing prices, supply commitments or available production capacity are disclosed. Integrated motor drives and other product lines have different sourcing arrangements.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed for the offline prototype; supplier availability still requires current confirmation.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000003',
      $e$Domel introduces integrated drives for mobile robotics$e$,
      'Domel',
      'https://www.domel.com/domel-today/blog/domel-introduces-bldc-gear-motors-for-mobile-robotics-applications-2026-07-03',
      '2026-07-03', '2026-10-13', 'Technology',
      $e$Domel describes a mobile-robot drive combining a BLDC motor, gearbox, brake and encoder. Its first solution uses EC730; the article identifies EC740 and EC720 versions as still under development and testing.$e$,
      $e$Inference: integrated drive proposals could reduce customer integration work, while portfolio readiness must be checked separately for each platform.$e$,
      $e$The announcement supplies no verified customer order volume, regional demand forecast, price or release date for the platforms under development.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; development status and release readiness require current product-owner confirmation.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000004',
      $e$Automation applications require airflow, vacuum or overpressure$e$,
      'Domel',
      'https://www.domel.com/solutions/automation-in-production-process-26',
      null, '2026-10-13', 'Demand',
      $e$Domel lists handling and sorting, pneumatic transport, wrapping and packaging, and material drying as applications for its brushed vacuum and brushless motors. It highlights frequent start/stop operation and software customisation among blower features.$e$,
      $e$Inference: customer discovery should test duty-cycle reliability and integration requirements in these applications before estimating an addressable sales pipeline.$e$,
      $e$This is manufacturer application evidence, not a survey of customer demand. It gives no Germany/France order data or quantified growth rate; not every listed motor is a servo or robotic drive.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; the record does not validate a numerical demand forecast.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000005',
      $e$ebm-papst positions EC fans for fan coils and air doors$e$,
      'ebm-papst',
      'https://www.ebmpapst.com/us/en/campaigns/product-campaigns/centrifugal-fans/fancoil-ventilation.html',
      null, '2026-10-13', 'Competition',
      $e$ebm-papst presents GreenTech EC fans for fan coils and air doors. The manufacturer discusses installation space, low-noise operation and variable airflow, including hotel and office applications.$e$,
      $e$Inference: HVAC proposals should compare acoustics, controllability and installation compatibility alongside rated motor efficiency.$e$,
      $e$Manufacturer positioning is not independent comparative testing. Publication date, local availability, price, market share and customer purchase commitments are not established by this US-hosted page.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; competitive performance has not been independently benchmarked.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000006',
      $e$ZIEHL-ABEGG ECblue combines an EC motor and controller$e$,
      'ZIEHL-ABEGG',
      'https://www.ziehl-abegg.com/produkte/aussenlaeufermotor-ecblue',
      null, '2026-10-13', 'Competition',
      $e$The German ECblue product page specifies an electronically commutated external-rotor motor with an integrated controller, a 0.10-6 kW power range and IE5 performance under IEC 60034-30-2. Connectivity is available and Bluetooth is optional.$e$,
      $e$Inference: integrated control and connectivity form part of the competitive feature set for selected ventilation applications.$e$,
      $e$Specifications are manufacturer declarations. The page does not establish independent comparison, sales share, quoted price or availability for every configuration. DE identifies the regional page, not measured German demand.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; specifications remain manufacturer declarations.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000007',
      $e$Magnet-free synchronous reluctance is an alternative route$e$,
      'ABB',
      'https://new.abb.com/news/detail/80775/ie5-synchronous-reluctance-motors',
      '2021-07-22', '2026-10-13', 'Competition',
      $e$ABB explains that its synchronous-reluctance rotor has neither magnets nor windings and operates with variable-speed-drive control. The article describes SynRM as an alternative to induction motors and permanent-magnet technology.$e$,
      $e$Inference: a technology comparison should include magnet-free SynRM, induction and PMSM systems, matched to the same application and drive requirements.$e$,
      $e$This 2021 technical article does not verify current prices or product availability. A SynRM is not a drop-in substitute for every small EC fan or robotics motor; system sizing and control compatibility must be checked.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; current availability and equivalent-duty suitability remain open.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000008',
      $e$IEA identifies industrial motor-system efficiency opportunities$e$,
      'IEA',
      'https://www.iea.org/reports/energy-efficiency-2025/industry',
      '2025-11-20', '2026-10-13', 'Demand',
      $e$IEA identifies motor-system upgrades as a key industrial efficiency measure and says variable-speed drives can increase savings in variable-load applications. Its analysis covers industry broadly rather than a specific motor supplier.$e$,
      $e$Inference: efficiency-led sales discussions can focus on customers with variable loads, supported by measured operating profiles and system-level savings calculations.$e$,
      $e$No Domel sales forecast, Germany/France conversion rate or universal energy-saving percentage is supplied. Publication date is the parent report date. IEA report licence: CC BY 4.0.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; broad sector evidence does not validate product-specific demand.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000009',
      $e$Existing-building retrofits remain an efficiency priority$e$,
      'IEA',
      'https://www.iea.org/reports/energy-efficiency-2025/buildings',
      '2025-11-20', '2026-10-13', 'Demand',
      $e$For advanced economies, IEA identifies accelerating retrofits to reduce heating and cooling energy demand and electrifying heating as important drivers of efficiency progress.$e$,
      $e$Inference: retrofit applications merit customer research, but building-efficiency priorities alone do not quantify demand for a particular fan or motor.$e$,
      $e$The analysis is not a Germany/France motor-market forecast and supplies no Domel order data. Publication date is the parent report date. IEA report licence: CC BY 4.0.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; no product-specific demand or pipeline is established.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000010',
      $e$EU motor efficiency rules have a defined product scope$e$,
      'EUR-Lex / European Commission',
      'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R1781-20230124',
      '2023-01-24', '2026-10-13', 'Policy',
      $e$Regulation (EU) 2019/1781 covers specified induction motors and VSDs. Article 2 motor scope requires 2/4/6/8 poles, 50/60 Hz sinusoidal supply, over 50 V up to 1000 V, 0.12-1000 kW, continuous duty and direct-on-line capability. From 1 July 2023, IE4 applies to in-scope 75-200 kW, 2/4/6-pole three-phase motors excluding brake, Ex eb and other explosion-protected motors.$e$,
      $e$Inference: check exact product scope and exemptions before making compliance claims; this is not a blanket IE4 requirement for all EC/PMSM products.$e$,
      $e$The date identifies the reviewed consolidation. Consolidation is documentary; authentic Official Journal acts and individual specifications govern compliance. Product tags indicate research relevance, not confirmed legal applicability.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; legal applicability still requires product-specific assessment.',
      v_seed_user, '2026-10-13T00:00:00Z'
    ),
    (
      '40000000-0000-0000-0000-000000000011',
      $e$Retrofit competition includes controls and building integration$e$,
      'ebm-papst',
      'https://www.ebmpapst.com/us/en/industries/retrofit.html',
      null, '2026-10-13', 'Competition',
      $e$ebm-papst promotes EC fan retrofits with building-management-system integration, sensor connections and demand-based operation. Its page describes compact EC motors as suitable for integration into legacy equipment footprints.$e$,
      $e$Inference: retrofit positioning should assess mechanical fit, controls integration and installation work in addition to motor efficiency.$e$,
      $e$This manufacturer page provides no verified Germany/France pipeline, installation quote or universal savings figure. Feasibility and savings depend on the existing equipment and operating profile.$e$,
      'source_reviewed', v_seed_user,
      'Source text was reviewed; retrofit feasibility remains installation-specific.',
      v_seed_user, '2026-10-13T00:00:00Z'
    )
  on conflict (id) do nothing;

  insert into public.scenarios
    (id, product_id, business_month, owner_id, name, status, version, updated_at)
  values
    ('50000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000001',
     '2026-10-01', v_seed_user, 'Germany HVAC growth case', 'draft', 1,
     '2026-10-30T08:00:00Z')
  on conflict (id) do nothing;

  insert into public.scenario_snapshots
    (id, scenario_id, inputs, calculated_result, formula_version, rationale,
     created_by, created_at)
  values
    ('60000000-0000-0000-0000-000000000001',
     '50000000-0000-0000-0000-000000000001',
     '{"quantity":8200,"price":86,"cost":54,"fixed":118000,"capacity":9000,"capex":120000,"demand":12}'::jsonb,
     '{"formulaVersion":"2.0.0","demandUnits":9184,"units":9000,"revenue":774000,"variableCost":486000,"grossProfit":288000,"operatingProfit":170000,"grossMargin":0.37209302325581395,"capacityUtilization":1,"unservedDemand":184,"capex":120000}'::jsonb,
     '2.0.0',
     'Assume 12% demand growth in 2027, supported by building-efficiency policy. Review if order intake falls below 5% growth.',
     v_seed_user, '2026-10-30T08:00:00Z')
  on conflict (id) do nothing;

  insert into public.scenario_evidence (scenario_id, evidence_id, linked_by)
  values
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', v_seed_user),
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', v_seed_user)
  on conflict (scenario_id, evidence_id) do nothing;
end;
$seed$;
