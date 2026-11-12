- Écrire un INSERT sur une ou plusieurs lignes
- Utiliser les valeurs par défaut et NULL
- Prédire et lire les erreurs de violation de contraintes
- Peupler la librairie dans le bon ordre et contrôler les compteurs
===
## Ajouter une ligne : INSERT INTO

`INSERT INTO` ajoute des lignes dans une table. Syntaxe générale :

```text
INSERT INTO nom_table (colonne1, colonne2, …)
VALUES (valeur1, valeur2, …);
```

On **liste toujours les colonnes** : le code reste correct si la table gagne une colonne plus tard, et il se relit sans consulter la structure. Les valeurs sont dans le **même ordre** que les colonnes. Le texte et les dates s’écrivent entre apostrophes ; les nombres sans ; l’absence de valeur s’écrit `NULL`.

```sql run
INSERT INTO customers (first_name, last_name, email, city, created_at)
VALUES ('Sophie', 'Garnier', 'sophie.garnier@example.org', 'Nice', '2025-02-01');

SELECT customer_id, first_name, last_name, phone, country, newsletter_opt_in
FROM customers
WHERE email = 'sophie.garnier@example.org';
```

Ce que l’on observe : l’identifiant 13 a été **généré automatiquement** (nous ne l’avons pas fourni) ; `phone` vaut NULL car nous ne l’avons pas indiqué et la colonne l’autorise ; `country` vaut `France` et `newsletter_opt_in` vaut faux grâce aux valeurs `DEFAULT`.

:::note Le booléen s’affiche différemment
Le résultat « faux » apparaît sous la forme `0` avec SQLite et MySQL, et `false` avec PostgreSQL. La valeur logique est la même ; seul l’affichage change.
:::

## Insérer plusieurs lignes à la fois

```sql run
INSERT INTO categories (category_name, description)
VALUES ('Théâtre', NULL),
       ('Bande dessinée', 'Albums illustrés');

SELECT category_id, category_name, description
FROM categories
WHERE category_id > 7
ORDER BY category_id;
```

Une seule instruction avec plusieurs parenthèses séparées par des virgules est plus rapide et **atomique** : soit toutes les lignes entrent, soit aucune.

## Les valeurs par défaut en action

Une commande n’a pas besoin qu’on précise son statut à la création : `DEFAULT 'pending'` s’en charge.

```sql run
INSERT INTO orders (customer_id, order_date)
VALUES (10, '2025-02-02');

SELECT order_id, customer_id, status, shipped_date
FROM orders
WHERE customer_id = 10;
```

## Les erreurs de contraintes

Un `INSERT` qui viole une règle est **entièrement refusé**. Lire ces erreurs est une compétence essentielle.

**Doublon sur une colonne UNIQUE** (l’e-mail de Camille existe déjà) :

```sql error
INSERT INTO customers (first_name, last_name, email, city, created_at)
VALUES ('Test', 'Doublon', 'camille.durand@example.org', 'Paris', '2025-02-01');
```

**Colonne NOT NULL sans valeur** (`city` est obligatoire et n’a pas de `DEFAULT`) :

```sql error
INSERT INTO customers (first_name, last_name, email, created_at)
VALUES ('Test', 'SansVille', 'test.sansville@example.org', '2025-02-01');
```

**Violation de CHECK** (une quantité doit être strictement positive) :

```sql error
INSERT INTO order_items (order_id, book_id, quantity, unit_price)
VALUES (4, 6, 0, 7.50);
```

**Violation de clé étrangère** (le client 99 n’existe pas) :

```sql error
INSERT INTO orders (customer_id, order_date)
VALUES (99, '2025-02-01');
```

:::error Rappel SQLite
Cette dernière erreur n’apparaît avec SQLite que si `PRAGMA foreign_keys = ON;` a été exécuté sur la connexion. Sans lui, la ligne invalide serait acceptée en silence.
:::

## Peupler toute la librairie

Le fichier `03_seed.sql` de chaque moteur insère les données de référence **dans l’ordre des dépendances** : catégories, clients, livres, commandes, lignes de commande, paiements. Insérer une ligne de commande avant sa commande déclencherait une erreur de clé étrangère.

Le jeu de données contient volontairement : des clients **sans commande** (10, 11 et 12), un client avec **quatre commandes** (1), des livres **jamais commandés** (*Arsène Lupin…* et *Le Livre de la jungle*), une catégorie **sans livre** (Poésie), des **NULL** (téléphone, date d’expédition, année de publication, éditeur) et des commandes **sans paiement** (en attente ou annulées).

:::note Particularité PostgreSQL
Les identifiants ont été insérés explicitement. PostgreSQL ne fait pas avancer son compteur automatique dans ce cas : le script se termine par six appels à `setval(…)` qui le resynchronisent. Sans cela, le prochain `INSERT` sans identifiant échouerait avec un doublon de clé primaire.
:::

### Contrôler le résultat

Après un peuplement, on compte les lignes de chaque table. `UNION ALL` (chapitre 10) empile simplement les résultats de plusieurs requêtes :

```sql run
SELECT 'categories' AS table_name, COUNT(*) AS row_count FROM categories
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'books', COUNT(*) FROM books
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'payments', COUNT(*) FROM payments;
```

Ces six compteurs (7, 12, 15, 14, 25, 10) sont l’**état de référence**. S’ils diffèrent chez vous, exécutez le script `04_reset` de votre moteur avant de continuer.

:::eni Périmètre ENI
`INSERT` fait partie du critère **C.3** (« une requête est écrite pour ajouter des données dans une table »). Le chapitre 11 y revient avec UPDATE, DELETE et les transactions.
:::

:::exercise Exercice guidé : ajouter un livre|Niveau 1 · guidé
Ajoutez le livre « Candide » de Voltaire (ISBN fictif `978-2-0000-0016-5`, catégorie Roman, 6,50 €, stock 12, année 1759, sans éditeur). Puis relisez-le.
---solution---
```sql run
INSERT INTO books (isbn, title, author, category_id, unit_price, stock_quantity, publication_year)
VALUES ('978-2-0000-0016-5', 'Candide', 'Voltaire', 1, 6.50, 12, 1759);

SELECT book_id, title, category_id, publisher
FROM books
WHERE isbn = '978-2-0000-0016-5';
```
`publisher` est absent de la liste des colonnes : il vaut donc NULL. `category_id = 1` correspond à *Roman* : la catégorie doit exister, sinon la clé étrangère refuserait la ligne.
:::

:::exercise Exercice autonome : prédire l’erreur|Niveau 2 · autonome
Cette instruction échoue : `INSERT INTO payments (order_id, amount, payment_date, method) VALUES (1, 10.00, '2025-01-01', 'card');`. Quelle contrainte est en cause et pourquoi ?
---solution---
```sql error
INSERT INTO payments (order_id, amount, payment_date, method)
VALUES (1, 10.00, '2025-01-01', 'card');
```
La commande 1 a **déjà** un paiement, et `payments.order_id` est `UNIQUE` : c’est la traduction SQL de la cardinalité « une commande a au plus un paiement ». Cette erreur est voulue : elle protège la règle métier.
:::

:::quiz Pourquoi liste-t-on toujours les colonnes dans un INSERT ?
- [ ] C’est obligatoire pour tous les moteurs :: Ce n’est pas obligatoire, mais fortement recommandé.
- [x] Le code reste valable si la table gagne une colonne et il se relit sans consulter sa structure :: Sans liste, l’ordre implicite des colonnes devient une dépendance fragile.
- [ ] Cela rend l’insertion plus rapide :: Le gain est négligeable.
:::

:::quiz Que devient un INSERT qui viole une contrainte ?
- [ ] Il est accepté partiellement :: Une instruction est refusée en entier.
- [x] Il est refusé en entier et la table reste inchangée :: Le moteur annule l’instruction fautive.
- [ ] Les colonnes fautives passent à NULL :: Le moteur ne corrige jamais de lui-même.
:::
