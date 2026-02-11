# Data (Working Files)

This folder is for collecting fish price data *before* you connect a database.

## Recommended format
Use the columns that match the database table:
- `fish_type` (text)
- `min_price` (number)
- `max_price` (number)
- `avg_price` (number)
- `date_updated` (YYYY-MM-DD)

Templates:
- `fish_prices_template.csv`
- `fish_prices_template.json`

## Where does data go when ready?
The source of truth is PostgreSQL in the `fish_prices` table (see backend schema).

When you’re ready to load real data, you have two options:
1) Admin UI: login at `/admin` and add/update entries (good for small batches)
2) Bulk import: we can add an import script that reads this CSV/JSON and inserts rows into Postgres (best for lots of rows)

## Tip
If you only have min/max, you can set:
- avg_price = (min_price + max_price) / 2

(You can also leave avg_price as min/max average and refine later.)
