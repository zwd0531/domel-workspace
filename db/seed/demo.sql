-- Controlled fictional seed data. Do not run this file against a production database.

insert into public.plants (id, code, name, timezone)
values ('10000000-0000-0000-0000-000000000001', 'SZ', 'Domel Electric Motors Suzhou', 'Asia/Shanghai')
on conflict (code) do nothing;

insert into public.products (id, plant_id, code, name, family, application, owner_label)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SZ-DRY', 'Dry Vacuum Unit A', 'Dry vacuum unit', 'Household vacuum cleaner', 'Production line 1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'SZ-WET', 'Wet & Dry Vacuum Unit B', 'Wet & dry vacuum unit', 'Household vacuum cleaner', 'Production line 2'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'SZ-EC', 'EC High-efficiency Unit C', 'EC vacuum unit', 'Premium household appliance', 'Production line 3')
on conflict (plant_id, code) do nothing;

insert into public.monthly_production
  (product_id, month, planned_units, produced_units, on_time_rate, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 1200, 1165, 96, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 760, 702, 91, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 450, 438, 94, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 1250, 1212, 97, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 800, 748, 92, 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 480, 469, 95, 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_quality
  (product_id, month, tested_units, passed_units, field_returns, defect_rate, risk, quality_note, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 1165, 1146, 8, 1.6, 'Low', 'Stable line output; no recurring issue recorded.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 702, 683, 13, 2.7, 'Medium', 'Seal inspection follow-up required before next batch.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 438, 432, 4, 1.4, 'Low', 'Efficiency test results are within the demo target.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 1212, 1198, 7, 1.2, 'Low', 'Output improved after work-cell balancing.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 748, 726, 15, 2.9, 'High', 'Seal inspection remains the main quality action.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 469, 464, 3, 1.1, 'Low', 'No open quality escalation in the demo record.', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_sales
  (product_id, month, order_count, shipped_units, unit_price, currency, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 46, 1120, 148, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 31, 680, 186, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 24, 410, 232, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 49, 1180, 148, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 34, 735, 186, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 27, 455, 232, 'EUR', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_costs
  (product_id, month, unit_variable_cost, monthly_fixed_cost, currency, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-09-01', 92, 10000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-09-01', 115, 10000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-09-01', 144, 13000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 92, 10000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 115, 10000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 144, 13000, 'EUR', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.work_items
  (id, product_id, assigned_role, title, action, priority, due_at, status)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'sales', 'Follow up Wet & Dry Unit B order', 'Confirm the seal-inspection note with the customer before accepting the next order.', 'High', '2026-10-28T09:00:00+08:00', 'open'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'sales', 'Prepare EC Unit C quotation', 'Use the current unit price and shipped volume as the starting point for the customer quote.', 'Medium', '2026-10-30T09:00:00+08:00', 'open'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'production_planner', 'Rebalance line 2 for Wet & Dry Unit B', 'Review the 52-unit backlog and move the next batch into the production plan.', 'High', '2026-10-27T09:00:00+08:00', 'open'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'production_planner', 'Confirm line 1 capacity release', 'Check that the work-cell balancing change can be retained for the next planning cycle.', 'Medium', '2026-10-29T09:00:00+08:00', 'open'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'quality_engineer', 'Close the seal inspection action', 'Record the corrective-action result for the 2.9% defect rate before release.', 'High', '2026-10-29T09:00:00+08:00', 'open'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'quality_engineer', 'Archive EC efficiency test evidence', 'Attach the next efficiency test result to the product record for traceability.', 'Medium', '2026-10-31T09:00:00+08:00', 'open')
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
end;
$seed$;
