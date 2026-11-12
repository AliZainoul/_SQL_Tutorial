-- Reset to the reference state (SQLite). Run inside the sqlite3 client:
--   .read sql/sqlite/04_reset.sql
-- WARNING: drops all bookstore objects. Use only on a training database.
PRAGMA foreign_keys = OFF;
DROP VIEW  IF EXISTS v_customer_totals;
DROP VIEW  IF EXISTS v_available_books;
DROP VIEW  IF EXISTS v_order_totals;
DROP VIEW  IF EXISTS v_unsold_books;
DROP VIEW  IF EXISTS v_customers_without_phone;
DROP VIEW  IF EXISTS v_le_titles;
DROP VIEW  IF EXISTS v_paris_newsletter;
DROP VIEW  IF EXISTS v_customer_spending;
DROP VIEW  IF EXISTS v_paid_orders;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS categories;
PRAGMA foreign_keys = ON;
.read sql/sqlite/02_schema.sql
.read sql/sqlite/03_seed.sql
