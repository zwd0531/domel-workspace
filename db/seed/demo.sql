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
