-- Reset to the reference state (MySQL). Run inside the mysql client:
--   source sql/mysql/04_reset.sql
-- WARNING: drops all bookstore objects. Use only on a training database.
SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW  IF EXISTS v_customer_totals;
DROP VIEW  IF EXISTS v_available_books;
DROP VIEW  IF EXISTS v_order_totals;
DROP VIEW  IF EXISTS v_unsold_books;
DROP VIEW  IF EXISTS v_customers_without_phone;
DROP VIEW  IF EXISTS v_le_titles;
DROP VIEW  IF EXISTS v_paris_newsletter;
DROP VIEW  IF EXISTS v_customer_spending;
DROP VIEW  IF EXISTS v_paid_orders;
DROP TABLE IF EXISTS payments, order_items, orders, books, customers, categories;
SET FOREIGN_KEY_CHECKS = 1;
source sql/mysql/02_schema.sql
source sql/mysql/03_seed.sql
