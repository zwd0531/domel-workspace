# Role-based product analysis

The dashboard keeps `role`, `month`, and `product` in the URL. Selecting a product changes KPI, chart and table scope without opening analysis. Clicking **View product analysis** also selects its product and sets `analysis=1#product-analysis`; the page expands an analysis section below the worklist. Explicit open actions scroll and focus the analysis heading. Filtering and role switching preserve open analysis and update it without forced scrolling. Collapse keeps the selection; View all products clears product and analysis while preserving role/month. Legacy `record=<id>` URLs redirect to this canonical state (an explicit `product` takes precedence).

## Data and calculations

- Sales revenue uses shipped units times unit price, not order count. The sales-share denominator is computed before the product filter from active products in the same month and currency. Mixed currencies are not combined into one monetary KPI.
- Production completion uses produced/planned; uncompleted units are `max(planned-produced, 0)`. Overproduction may exceed 100%. A zero plan has no calculable completion percentage.
- Quality pass rate uses passed/tested, while recorded defect rate remains a separate field. Not-passed count is tested minus passed. Returns and original quality notes are shown separately.
- Missing input and undefined rates remain null and render as a dash, with an explanation. Empty product-month scopes show a clear no-record message. A recorded zero remains zero. Invalid product selections do not silently load all products.
- Analysis interpretation is deterministic and bilingual; no AI request or cause inference is added. Existing task queues, auth/role rules and Supabase schema are unchanged. CSV columns remain compatible and missing values remain blank.
- The local SQLite loader now queries the actual `YYYY-MM-01` stored month. Existing October seed data is not copied or relabeled as September data.

## Verification

Tests cover arithmetic, missing/zero values, mixed currencies, overproduction, role boundaries, canonical URLs, actual SQLite month filtering and connected-loader product/month scope. Browser acceptance covers all three role analyses, product/month changes, sales share denominators, inline opening, collapse/reset, back/forward, legacy URLs, unavailable products, English/Chinese and a 390px viewport. Original source and production checkpoints are documented in `product-analysis-baseline.md`.
