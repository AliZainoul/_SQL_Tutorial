- Écrire des expressions conditionnelles avec CASE, COALESCE et NULLIF
- Convertir des types avec CAST
- Utiliser les fonctions de texte, de nombres et de dates en tenant compte des différences entre moteurs
- Résumer l’ordre logique d’exécution et lire un message d’erreur SQL
- Découvrir les index et EXPLAIN (approfondissement facultatif)
===
:::eni Périmètre ENI · compétence C.4
Le critère C.4 indique que « les fonctions du moteur sont utilisées pour mieux filtrer les données ». Ce chapitre présente les fonctions les plus utiles ; elles s’emploient dans `SELECT`, `WHERE`, `ORDER BY` et dans les vues.
:::

## CASE : une condition dans une colonne

`CASE` renvoie une valeur **selon des conditions**, comme un « si… sinon… » dans une requête. Les conditions sont testées dans l’ordre ; la première vraie l’emporte.

```sql run
SELECT title, unit_price,
       CASE
         WHEN unit_price < 8  THEN 'économique'
         WHEN unit_price < 15 THEN 'standard'
         ELSE 'premium'
       END AS price_band
FROM books
ORDER BY book_id;
```

Sans `ELSE`, une ligne qui ne correspond à aucune condition reçoit **NULL**. `CASE` fonctionne aussi dans `ORDER BY` et à l’intérieur d’un agrégat, par exemple compter conditionnellement :

```sql run
SELECT COUNT(*) AS orders_count,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
FROM orders;
```

## COALESCE : une valeur de remplacement pour NULL

`COALESCE(a, b, c…)` renvoie la **première valeur non NULL**. Idéal pour un affichage lisible :

```sql run
SELECT customer_id, COALESCE(phone, 'non renseigné') AS phone_label
FROM customers
ORDER BY customer_id;
```

C’est aussi la réponse à la question du chapitre 6 sur l’ordre des NULL : `ORDER BY COALESCE(colonne, valeur_haute)` donne le même ordre sur les trois moteurs.

## NULLIF : transformer une valeur en NULL

`NULLIF(a, b)` renvoie NULL si `a` vaut `b`, sinon `a`. Utilité classique : **éviter une division par zéro**, car diviser par NULL donne NULL (pas d’erreur).

```sql run
SELECT book_id, title,
       ROUND(unit_price / NULLIF(stock_quantity, 0), 2) AS price_per_unit_in_stock
FROM books
WHERE book_id IN (1, 6)
ORDER BY book_id;
```

Le livre 6 a un stock de 0 : `NULLIF(0, 0)` donne NULL, donc le résultat est NULL. Sans `NULLIF`, une division par zéro est une **erreur sous PostgreSQL**, alors que MySQL et SQLite renvoient NULL : un excellent exemple de comportement divergent.

## CAST : convertir un type

`CAST(valeur AS type)` convertit une valeur. La syntaxe du **type cible** change :

:::tabs
```sql pg check
SELECT CAST('42' AS INTEGER) + 1 AS answer;
```
```sql mysql check
SELECT CAST('42' AS SIGNED) + 1 AS answer;
```
```sql sqlite run
SELECT CAST('42' AS INTEGER) + 1 AS answer;
```
:::

MySQL n’accepte pas `AS INTEGER` (il faut `SIGNED` ou `UNSIGNED`) ; PostgreSQL ne connaît pas `SIGNED`. Attention aussi aux conversions qui **perdent** de l’information : `CAST(12.90 AS INTEGER)` donne `13` sur PostgreSQL (arrondi) et `12` sur SQLite (troncature), constaté sur les moteurs réels. Convertissez explicitement, et arrondissez avec `ROUND` plutôt que de compter sur le comportement du moteur.

## Fonctions de texte

| Besoin | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| Majuscules | `UPPER(x)` | `UPPER(x)` | `UPPER(x)` (ASCII seulement) |
| Sous-chaîne | `SUBSTR(x, début, longueur)` | `SUBSTR(x, début, longueur)` | `SUBSTR(x, début, longueur)` |
| Longueur en caractères | `LENGTH(x)` | `CHAR_LENGTH(x)` (`LENGTH` compte des **octets**) | `LENGTH(x)` |
| Concaténation | `a \|\| b` ou `CONCAT` | `CONCAT(a, b)` — `\|\|` = **OU logique** | `a \|\| b` |

```sql run
SELECT customer_id,
       UPPER(last_name) AS last_name_upper,
       LENGTH(last_name) AS name_length,
       SUBSTR(first_name, 1, 3) AS short_name
FROM customers
WHERE customer_id IN (1, 2)
ORDER BY customer_id;
```

Cette requête fonctionne partout parce que ces noms sont en ASCII. Sous MySQL, `LENGTH('Chloé')` renvoie 6 (octets) et `CHAR_LENGTH('Chloé')` renvoie 5 (constaté avec une connexion en `utf8mb4`). La concaténation est le piège le plus courant :

:::tabs
```sql pg check
SELECT customer_id, first_name || ' ' || last_name AS full_name
FROM customers
WHERE customer_id IN (1, 2)
ORDER BY customer_id;
```
```sql mysql check
SELECT customer_id, CONCAT(first_name, ' ', last_name) AS full_name
FROM customers
WHERE customer_id IN (1, 2)
ORDER BY customer_id;
```
```sql sqlite run
SELECT customer_id, first_name || ' ' || last_name AS full_name
FROM customers
WHERE customer_id IN (1, 2)
ORDER BY customer_id;
```
:::

Sur MySQL, `'a' || 'b'` ne concatène pas : par défaut `||` est l’opérateur **OU** et la requête renvoie `0` (constaté).

## Fonctions numériques

`ROUND(x, n)` arrondit à `n` décimales ; `ABS(x)` donne la valeur absolue ; `x % y` donne le reste de la division entière. Ces trois-là fonctionnent identiquement partout. `CEIL`, `FLOOR` et les fonctions mathématiques avancées dépendent des versions (SQLite les fournit seulement si elles ont été compilées).

```sql run
SELECT order_item_id, quantity, quantity % 2 AS is_odd
FROM order_items
WHERE order_id = 8 OR order_id = 9
ORDER BY order_item_id;
```

## Fonctions de dates

Les dates sont le domaine où les moteurs divergent le plus. Extraire l’année d’une commande :

:::tabs
```sql pg check
SELECT order_id, order_date, EXTRACT(YEAR FROM order_date) AS order_year
FROM orders
WHERE order_id IN (1, 14)
ORDER BY order_id;
```
```sql mysql check
SELECT order_id, order_date, EXTRACT(YEAR FROM order_date) AS order_year
FROM orders
WHERE order_id IN (1, 14)
ORDER BY order_id;
```
```sql sqlite run
SELECT order_id, order_date, CAST(strftime('%Y', order_date) AS INTEGER) AS order_year
FROM orders
WHERE order_id IN (1, 14)
ORDER BY order_id;
```
:::

SQLite n’a pas `EXTRACT` : il stocke les dates comme du texte ISO et utilise `strftime`. Le délai d’expédition en jours :

:::tabs
```sql pg check
SELECT order_id, shipped_date - order_date AS shipping_days
FROM orders
WHERE status = 'shipped'
ORDER BY order_id;
```
```sql mysql check
SELECT order_id, DATEDIFF(shipped_date, order_date) AS shipping_days
FROM orders
WHERE status = 'shipped'
ORDER BY order_id;
```
```sql sqlite run
SELECT order_id,
       CAST(julianday(shipped_date) - julianday(order_date) AS INTEGER) AS shipping_days
FROM orders
WHERE status = 'shipped'
ORDER BY order_id;
```
:::

La date du jour s’obtient avec `CURRENT_DATE` sur les trois moteurs (les exemples du cours n’en dépendent pas, pour rester reproductibles).

:::note Filtrer avec une fonction
Placer une fonction sur une colonne dans `WHERE` (`WHERE UPPER(city) = 'PARIS'`) est pratique mais peut empêcher l’usage d’un index. Pour des volumes importants, comparez plutôt à une valeur normalisée.
:::

## Retour sur l’ordre logique d’exécution

Rappel du chapitre 7 : **FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT**. C’est pourquoi un alias de `CASE` défini dans `SELECT` est utilisable dans `ORDER BY` mais pas dans `WHERE`, et pourquoi `WHERE` ne peut pas contenir d’agrégat.

## Lire une erreur SQL

Un message d’erreur dit presque toujours **quoi** et **où**. Méthode :

1. **Lisez la première ligne** : elle nomme l’erreur (*syntax error*, *no such column*, *ambiguous*, *violates … constraint*).
2. **Repérez la position** (ligne, mot cité « near … » ou « LINE 3 »). L’erreur est souvent **juste avant** le mot cité.
3. **Classez-la** : syntaxe (virgule, mot-clé), nom (faute de frappe, alias oublié), type (comparaison texte/nombre), contrainte (ligne refusée), logique (aucune erreur mais résultat faux).
4. **Réduisez** : retirez des clauses jusqu’à ce que la requête fonctionne, puis réintroduisez-les une à une.

| Message (extrait) | Cause habituelle |
|---|---|
| *no such column* / *column … does not exist* | Faute de frappe ou alias non défini |
| *ambiguous column* | Colonne présente dans plusieurs tables sans préfixe |
| *must appear in the GROUP BY clause* | Colonne non agrégée absente du `GROUP BY` |
| *violates foreign key / unique / check constraint* | Donnée refusée par une règle d’intégrité |
| *syntax error at or near …* | Mot-clé manquant ou mal placé, virgule en trop |

## Index et EXPLAIN (approfondissement facultatif)

Un **index** est une structure annexe qui accélère la recherche, comme l’index d’un livre. Sans index, le moteur doit parcourir toute la table pour trouver les commandes d’un client ; avec un index sur `orders.customer_id`, il va directement aux bonnes lignes. Contrepartie : un espace disque supplémentaire et des écritures un peu plus lentes.

```text
CREATE INDEX idx_orders_customer ON orders (customer_id);
```

Cette syntaxe est identique sur les trois moteurs. Les clés primaires et les contraintes `UNIQUE` créent automatiquement un index ; les clés étrangères en créent un sur MySQL (InnoDB) mais **pas sur PostgreSQL** (constaté sur l’état de la table `orders` : seul `orders_pkey` existe), d’où l’habitude d’indexer manuellement les colonnes de jointure sous PostgreSQL.

`EXPLAIN` affiche le **plan d’exécution** choisi par le moteur :

:::tabs
```text pg
EXPLAIN SELECT * FROM orders WHERE customer_id = 1;
```
```text mysql
EXPLAIN SELECT * FROM orders WHERE customer_id = 1;
```
```text sqlite
EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1;
```
:::

La sortie est propre à chaque moteur et change selon la taille des données : ce cours ne la reproduit pas, car elle n’est pas stable d’une version à l’autre. Sur une petite table comme celle de la librairie, l’effet d’un index est de toute façon invisible.

:::exercise Exercice guidé : étiqueter les commandes|Niveau 2 · guidé
Affichez chaque commande avec une colonne `payment_state` valant `'réglée'` si le statut est `paid` ou `shipped`, `'à relancer'` si `pending`, et `'annulée'` sinon. Triez par `order_id`.
---solution---
```sql run
SELECT order_id, status,
       CASE
         WHEN status IN ('paid', 'shipped') THEN 'réglée'
         WHEN status = 'pending' THEN 'à relancer'
         ELSE 'annulée'
       END AS payment_state
FROM orders
ORDER BY order_id;
```
Les conditions sont évaluées dans l’ordre : `IN (…)` capte deux statuts d’un coup ; `ELSE` couvre le dernier cas (`cancelled`). Le résultat est un tableau de 14 lignes.
:::

:::exercise Exercice autonome : téléphone lisible|Niveau 2 · autonome
Affichez, pour les clients 1 à 4, une colonne `contact` contenant le téléphone, ou l’e-mail si le téléphone est NULL.
---solution---
```sql run
SELECT customer_id, COALESCE(phone, email) AS contact
FROM customers
WHERE customer_id BETWEEN 1 AND 4
ORDER BY customer_id;
```
`COALESCE` renvoie le premier argument non NULL : le téléphone si présent, sinon l’e-mail (qui est `NOT NULL`, donc toujours disponible).
:::

:::exercise Exercice de débogage : concaténation sous MySQL|Niveau 2 · débogage
La requête `SELECT first_name || ' ' || last_name FROM customers;` fonctionne sous PostgreSQL et SQLite, mais renvoie des `0` sous MySQL. Pourquoi, et quelle est la version portable ?
---solution---
Sous MySQL (mode par défaut), `||` est l’opérateur logique **OU** : il évalue les chaînes comme des nombres et renvoie 0. La version qui fonctionne sur MySQL **et** PostgreSQL est `CONCAT(first_name, ' ', last_name)` ; SQLite ne la propose que dans ses versions récentes (vérifiez la vôtre), donc l’opérateur `||` reste la forme sûre pour SQLite.
:::

:::quiz Que renvoie COALESCE(NULL, NULL, 'x', 'y') ?
- [ ] NULL :: Il existe des arguments non NULL.
- [x] 'x' :: COALESCE renvoie le premier argument non NULL.
- [ ] 'y' :: Seul le premier non NULL est renvoyé.
:::

:::quiz Pourquoi NULLIF(stock, 0) protège-t-il une division ?
- [ ] Il remplace 0 par 1 :: Il remplace 0 par NULL.
- [x] Il transforme 0 en NULL, et diviser par NULL donne NULL au lieu d’une erreur :: PostgreSQL lève sinon une erreur de division par zéro.
- [ ] Il arrondit le résultat :: Ce n’est pas son rôle.
:::

:::quiz Quel opérateur concatène du texte sur SQLite ?
- [ ] + :: Le plus additionne des nombres.
- [x] || :: C’est l’opérateur standard, aussi valable sur PostgreSQL.
- [ ] & :: Il n’existe pas pour le texte.
:::
