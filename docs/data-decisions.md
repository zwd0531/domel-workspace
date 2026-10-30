# Data definitions requiring business confirmation

The formal project will not silently assume that the course-demo fields match production systems.

| Field | Current demo meaning | Decision required |
|---|---|---|
| `order_count` | Number displayed as “Orders” | Confirm whether this is order headers, order lines or ordered units |
| `shipped_units` | Units shipped in the selected month | Confirm posting date and cancellation/return treatment |
| `planned_units` | Production plan; also used as a capacity proxy | Confirm whether a separate rated/available capacity source exists |
| `on_time_rate` | Product-level percentage | Confirm numerator, denominator and weighting |
| `defect_rate` | Product-level demo percentage | Confirm defect population and aggregation rule |
| `unit_variable_cost` | Fictional course assumption | Confirm authoritative ERP source and cost version |
| `monthly_fixed_cost` | Fictional course assumption | Confirm allocation policy and owner |
| `currency` | EUR | Confirm source currency, reporting currency and exchange-rate policy |

Approval is also required for the initial permission matrix in `domain/permissions/policy.ts`.
