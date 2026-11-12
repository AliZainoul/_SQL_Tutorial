-- Seed data: fictional bookstore. Identical on PostgreSQL, MySQL and SQLite.
-- ISBN values are fictitious. Insertion order respects foreign keys.

INSERT INTO categories (category_id, category_name, description) VALUES
  (1, 'Roman', 'Romans et nouvelles de la littérature générale'),
  (2, 'Policier', 'Enquêtes, romans noirs et suspense'),
  (3, 'Science-fiction', 'Anticipation, voyages extraordinaires et fantastique'),
  (4, 'Histoire', 'Récits et ouvrages historiques'),
  (5, 'Informatique', 'Programmation, bases de données et numérique'),
  (6, 'Jeunesse', 'Albums et romans pour les jeunes lecteurs'),
  (7, 'Poésie', NULL);

INSERT INTO customers (customer_id, first_name, last_name, email, phone, city, country, created_at, newsletter_opt_in) VALUES
  (1, 'Camille', 'Durand', 'camille.durand@example.org', '0601020304', 'Marseille', 'France', '2023-01-15', TRUE),
  (2, 'Lucas', 'Martin', 'lucas.martin@example.org', NULL, 'Lyon', 'France', '2023-02-20', FALSE),
  (3, 'Emma', 'Bernard', 'emma.bernard@example.org', '0602030405', 'Paris', 'France', '2023-03-05', TRUE),
  (4, 'Hugo', 'Petit', 'hugo.petit@example.org', NULL, 'Montpellier', 'France', '2023-04-12', FALSE),
  (5, 'Léa', 'Robert', 'lea.robert@example.org', '0603040506', 'Paris', 'France', '2023-06-01', TRUE),
  (6, 'Nathan', 'Richard', 'nathan.richard@example.org', NULL, 'Lille', 'France', '2023-07-18', FALSE),
  (7, 'Chloé', 'Dubois', 'chloe.dubois@example.org', '0604050607', 'Bruxelles', 'Belgique', '2023-09-09', TRUE),
  (8, 'Louis', 'Moreau', 'louis.moreau@example.org', '0605060708', 'Lyon', 'France', '2024-01-10', FALSE),
  (9, 'Manon', 'Laurent', 'manon.laurent@example.org', NULL, 'Marseille', 'France', '2024-02-14', TRUE),
  (10, 'Jules', 'Simon', 'jules.simon@example.org', '0606070809', 'Bordeaux', 'France', '2024-03-30', FALSE),
  (11, 'Inès', 'Michel', 'ines.michel@example.org', '0607080910', 'Nantes', 'France', '2024-05-22', TRUE),
  (12, 'Arthur', 'Lefèbvre', 'arthur.lefebvre@example.org', NULL, 'Paris', 'France', '2024-09-03', FALSE);

INSERT INTO books (book_id, isbn, title, author, category_id, unit_price, stock_quantity, publication_year, publisher) VALUES
  (1, '978-2-0000-0001-1', 'Les Misérables', 'Victor Hugo', 1, 12.90, 40, 1862, 'Éditions Horizon'),
  (2, '978-2-0000-0002-8', 'Le Rouge et le Noir', 'Stendhal', 1, 9.50, 25, 1830, 'Éditions Horizon'),
  (3, '978-2-0000-0003-5', 'Germinal', 'Émile Zola', 1, 8.90, 30, 1885, 'Éditions Horizon'),
  (4, '978-2-0000-0004-2', 'Le Crime de lOrient-Express', 'Agatha Christie', 2, 7.90, 50, 1934, 'Maison Lanterne'),
  (5, '978-2-0000-0005-9', 'Le Chien des Baskerville', 'Arthur Conan Doyle', 2, 6.90, 35, 1902, 'Maison Lanterne'),
  (6, '978-2-0000-0006-6', 'Arsène Lupin, gentleman-cambrioleur', 'Maurice Leblanc', 2, 7.50, 0, 1907, 'Maison Lanterne'),
  (7, '978-2-0000-0007-3', 'Vingt mille lieues sous les mers', 'Jules Verne', 3, 10.50, 20, 1870, 'Éditions Boréale'),
  (8, '978-2-0000-0008-0', 'La Machine à explorer le temps', 'H. G. Wells', 3, 8.50, 15, 1895, 'Éditions Boréale'),
  (9, '978-2-0000-0009-7', 'Frankenstein', 'Mary Shelley', 3, 9.90, 18, 1818, 'Éditions Boréale'),
  (10, '978-2-0000-0010-3', 'La Guerre des Gaules', 'Jules César', 4, 11.00, 12, NULL, 'Presses du Forum'),
  (11, '978-2-0000-0011-0', 'Histoire de la Révolution française', 'Jules Michelet', 4, 14.50, 8, 1847, 'Presses du Forum'),
  (12, '978-2-0000-0012-7', 'Alice au pays des merveilles', 'Lewis Carroll', 6, 7.00, 45, 1865, NULL),
  (13, '978-2-0000-0013-4', 'Le Livre de la jungle', 'Rudyard Kipling', 6, 8.00, 22, 1894, NULL),
  (14, '978-2-0000-0014-1', 'Python pour les curieux', 'Claire Moreau', 5, 29.90, 14, 2022, 'Atelier Pixel'),
  (15, '978-2-0000-0015-8', 'SQL pas à pas', 'Julien Bernard', 5, 34.90, 10, 2023, 'Atelier Pixel');

INSERT INTO orders (order_id, customer_id, order_date, status, shipped_date) VALUES
  (1, 1, '2024-01-05', 'shipped', '2024-01-07'),
  (2, 1, '2024-03-12', 'shipped', '2024-03-14'),
  (3, 1, '2024-06-20', 'paid', NULL),
  (4, 1, '2024-11-02', 'pending', NULL),
  (5, 2, '2024-02-14', 'shipped', '2024-02-16'),
  (6, 2, '2024-07-08', 'cancelled', NULL),
  (7, 3, '2024-03-01', 'shipped', '2024-03-04'),
  (8, 3, '2024-09-15', 'paid', NULL),
  (9, 4, '2024-04-22', 'shipped', '2024-04-25'),
  (10, 5, '2024-05-30', 'paid', NULL),
  (11, 6, '2024-08-19', 'pending', NULL),
  (12, 7, '2024-10-10', 'paid', NULL),
  (13, 8, '2024-12-01', 'shipped', '2024-12-03'),
  (14, 9, '2025-01-20', 'cancelled', NULL);

INSERT INTO order_items (order_item_id, order_id, book_id, quantity, unit_price) VALUES
  (1, 1, 1, 1, 11.90),
  (2, 1, 4, 2, 7.90),
  (3, 2, 7, 1, 10.50),
  (4, 2, 14, 1, 29.90),
  (5, 3, 2, 1, 9.50),
  (6, 3, 3, 1, 8.90),
  (7, 3, 5, 1, 6.90),
  (8, 4, 15, 1, 34.90),
  (9, 5, 9, 1, 9.90),
  (10, 5, 8, 1, 8.50),
  (11, 6, 1, 2, 11.90),
  (12, 7, 4, 1, 7.90),
  (13, 7, 5, 1, 6.90),
  (14, 8, 14, 1, 29.90),
  (15, 8, 15, 1, 34.90),
  (16, 9, 12, 3, 7.00),
  (17, 10, 3, 2, 8.90),
  (18, 10, 10, 1, 11.00),
  (19, 11, 7, 1, 10.50),
  (20, 12, 11, 1, 14.50),
  (21, 12, 2, 1, 9.50),
  (22, 13, 1, 1, 12.90),
  (23, 13, 9, 1, 9.90),
  (24, 13, 12, 1, 7.00),
  (25, 14, 8, 1, 8.50);

INSERT INTO payments (payment_id, order_id, amount, payment_date, method) VALUES
  (1, 1, 27.70, '2024-01-05', 'card'),
  (2, 2, 40.40, '2024-03-13', 'card'),
  (3, 3, 25.30, '2024-06-20', 'paypal'),
  (4, 5, 18.40, '2024-02-14', 'transfer'),
  (5, 7, 14.80, '2024-03-01', 'card'),
  (6, 8, 64.80, '2024-09-16', 'card'),
  (7, 9, 21.00, '2024-04-22', 'paypal'),
  (8, 10, 28.80, '2024-05-31', 'card'),
  (9, 12, 24.00, '2024-10-11', 'paypal'),
  (10, 13, 29.80, '2024-12-01', 'card');

