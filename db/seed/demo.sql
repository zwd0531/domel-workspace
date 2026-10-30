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

insert into public.monthly_operations
  (product_id, month, planned_units, produced_units, on_time_rate, tested_units, passed_units, field_returns, defect_rate, risk, quality_note, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 1250, 1212, 97, 1212, 1198, 7, 1.2, 'Low', 'Output improved after work-cell balancing.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 800, 748, 92, 748, 726, 15, 2.9, 'High', 'Seal inspection remains the main quality action.', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 480, 469, 95, 469, 464, 3, 1.1, 'Low', 'No open quality escalation in the demo record.', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_sales
  (product_id, month, order_count, shipped_units, unit_price, currency, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 49, 1180, 148, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 34, 735, 186, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 27, 455, 232, 'EUR', 'fictional-course-seed')
on conflict (product_id, month) do nothing;

insert into public.monthly_costs
  (product_id, month, unit_variable_cost, monthly_fixed_cost, currency, source_label)
values
  ('20000000-0000-0000-0000-000000000001', '2026-10-01', 92, 10000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000002', '2026-10-01', 115, 10000, 'EUR', 'fictional-course-seed'),
  ('20000000-0000-0000-0000-000000000003', '2026-10-01', 144, 13000, 'EUR', 'fictional-course-seed')
on conflict (product_id, month) do nothing;
