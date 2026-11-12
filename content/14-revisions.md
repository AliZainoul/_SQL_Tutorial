- Synthétiser les quatre compétences ENI en une fiche de modèles de requêtes
- Reconnaître les erreurs les plus fréquentes et les corriger
- Analyser des requêtes incorrectes avec une méthode
- S’entraîner en temps limité sur chaque compétence
===
:::eni Périmètre ENI · synthèse C.1 à C.4
Ce chapitre ne présente aucune notion nouvelle : il consolide. La page « Couverture ENI » relie chaque critère du référentiel au chapitre qui le traite.
:::

## Synthèse par compétence

| Compétence | Ce que l’on sait faire | Modèle de requête |
|---|---|---|
| **C.1** Une seule table | Afficher, filtrer, agréger, trier | `SELECT … FROM t WHERE … ORDER BY …` ; `SELECT MIN(x), MAX(x), AVG(x), COUNT(*) FROM t` |
| **C.2** Plusieurs tables | Joindre, regrouper, combiner, imbriquer, stocker un résultat | `… FROM a JOIN b ON … GROUP BY … HAVING …` ; `EXCEPT` / `INTERSECT` ; `WHERE EXISTS (…)` ; `CREATE TEMPORARY TABLE … AS SELECT` |
| **C.3** Mise à jour | Ajouter, modifier, supprimer | `INSERT INTO t (cols) VALUES (…)` ; `UPDATE t SET … WHERE …` ; `DELETE FROM t WHERE …` |
| **C.4** Vues | Enregistrer une requête réutilisable | `CREATE VIEW v AS SELECT … ` avec alias `AS`, sous-requêtes, `NOT IN`, `IS NULL`, `LIKE` |

## Les erreurs les plus fréquentes

1. **`= NULL`** au lieu de `IS NULL` : aucune erreur, aucune ligne.
2. **`WHERE` avec un agrégat** : il faut `HAVING`.
3. **Colonne non agrégée absente du `GROUP BY`** (refusé par PostgreSQL et MySQL, accepté à tort par SQLite).
4. **Jointure sans condition** (ou `FROM a, b` sans `WHERE`) : produit cartésien.
5. **`INNER JOIN` quand il faut `LEFT JOIN`** : les clients sans commande disparaissent.
6. **Condition d’une jointure externe placée dans le `WHERE`** : la jointure externe est annulée.
7. **Agrégation après multiplication des lignes** : total gonflé.
8. **`NOT IN` sur une colonne pouvant contenir NULL** : zéro ligne.
9. **`UPDATE` / `DELETE` sans `WHERE`** : toute la table est touchée.
10. **Texte sans apostrophes**, ou guillemets doubles pour du texte.

## Méthode de résolution d’un cas pratique

1. **Reformulez** la demande avec vos mots : que veut-on obtenir, une ligne par quoi ?
2. **Repérez les tables** et les colonnes nécessaires (consultez le schéma du chapitre 2).
3. **Choisissez la structure** : une table ? jointure ? agrégat ? absence de correspondance ? modification ?
4. **Écrivez par étapes** : `FROM` / jointures, puis `WHERE`, puis `GROUP BY` / `HAVING`, puis `SELECT`, puis `ORDER BY`.
5. **Prédisez** le nombre de lignes attendu avant d’exécuter.
6. **Vérifiez** : NULL, doublons, lignes multipliées, résultat vide plausible ?

## Analyser des requêtes incorrectes

:::exercise Requête 1 : le texte sans apostrophes|Niveau 1 · débogage
`SELECT order_id FROM orders WHERE status = paid;`
---solution---
`paid` sans apostrophes est lu comme un **nom de colonne** : il n’existe pas.
```sql error
SELECT order_id FROM orders WHERE status = paid;
```
Correction : `WHERE status = 'paid'`.
:::

:::exercise Requête 2 : la virgule en trop|Niveau 1 · débogage
`UPDATE books SET unit_price = 10, WHERE book_id = 1;`
---solution---
Une virgule avant `WHERE` laisse penser à une deuxième affectation : erreur de syntaxe.
```sql error
UPDATE books SET unit_price = 10, WHERE book_id = 1;
```
Correction : `UPDATE books SET unit_price = 10 WHERE book_id = 1;`
:::

:::exercise Requête 3 : le mot-clé oublié|Niveau 1 · débogage
`DELETE orders WHERE order_id = 6;`
---solution---
Il manque `FROM` : la forme correcte est `DELETE FROM orders WHERE order_id = 6;`.
```sql error
DELETE orders WHERE order_id = 6;
```
:::

:::exercise Requête 4 : les clients sans commande qui n’apparaissent pas|Niveau 2 · débogage
On veut les clients sans commande, mais la requête ne renvoie rien :
```text
SELECT c.customer_id FROM customers c
INNER JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;
```
---solution---
`INNER JOIN` supprime les clients sans commande avant que `IS NULL` ne puisse les voir.
```sql run
SELECT c.customer_id
FROM customers AS c
INNER JOIN orders AS o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;
```
Correction : `LEFT JOIN` (les lignes sans correspondance sont gardées avec NULL), ou `NOT EXISTS`.
```sql run
SELECT c.customer_id
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL
ORDER BY c.customer_id;
```
:::

:::exercise Requête 5 : agrégat sans GROUP BY|Niveau 2 · débogage
`SELECT c.first_name, COUNT(*) FROM customers c INNER JOIN orders o ON o.customer_id = c.customer_id;`
---solution---
Une colonne non agrégée (`first_name`) est mélangée à un agrégat sans `GROUP BY` : PostgreSQL et MySQL refusent. SQLite renverrait une ligne arbitraire, sans prévenir. Correction : grouper par client.
```sql run
SELECT c.customer_id, c.first_name, COUNT(*) AS orders_count
FROM customers AS c
INNER JOIN orders AS o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.first_name
ORDER BY c.customer_id;
```
:::

## Exercices chronométrés

Fixez-vous le temps indiqué, **sans regarder la correction**, puis comparez.

:::exercise Chrono 1 · C.1 · 3 minutes|Niveau 1
Titres et prix des livres des catégories 3 et 4, du plus cher au moins cher (à prix égal, par `book_id`).
---solution---
```sql run
SELECT title, unit_price
FROM books
WHERE category_id IN (3, 4)
ORDER BY unit_price DESC, book_id;
```
:::

:::exercise Chrono 2 · C.1 · 3 minutes|Niveau 1
Prix minimum, maximum et moyen (arrondi à 2 décimales) des livres informatiques (catégorie 5).
---solution---
```sql run
SELECT MIN(unit_price) AS min_price,
       MAX(unit_price) AS max_price,
       ROUND(AVG(unit_price), 2) AS avg_price
FROM books
WHERE category_id = 5;
```
:::

:::exercise Chrono 3 · C.2 · 6 minutes|Niveau 2
Pour chaque ville, le nombre de clients **ayant au moins une commande**, du plus grand au plus petit (puis par ville).
---solution---
```sql run
SELECT c.city, COUNT(DISTINCT c.customer_id) AS buyers
FROM customers AS c
INNER JOIN orders AS o ON o.customer_id = c.customer_id
GROUP BY c.city
ORDER BY buyers DESC, c.city;
```
`DISTINCT` évite de compter un client autant de fois qu’il a de commandes.
:::

:::exercise Chrono 4 · C.2 · 8 minutes|Niveau 3
Les livres (identifiant et titre) commandés au moins une fois par Camille Durand, sans doublon, par `book_id`.
---solution---
```sql run
SELECT DISTINCT b.book_id, b.title
FROM customers AS c
INNER JOIN orders AS o ON o.customer_id = c.customer_id
INNER JOIN order_items AS oi ON oi.order_id = o.order_id
INNER JOIN books AS b ON b.book_id = oi.book_id
WHERE c.first_name = 'Camille' AND c.last_name = 'Durand'
ORDER BY b.book_id;
```
Quatre jointures pour traverser client → commande → ligne → livre.
:::

:::exercise Chrono 5 · C.3 · 5 minutes|Niveau 2
Passez à `cancelled` les commandes `pending` datées d’avant le 31/12/2024, puis affichez les commandes 4 et 11.
---solution---
```sql run
UPDATE orders
SET status = 'cancelled'
WHERE status = 'pending' AND order_date < '2024-12-31';

SELECT order_id, status
FROM orders
WHERE order_id IN (4, 11)
ORDER BY order_id;
```
:::

:::exercise Chrono 6 · C.4 · 6 minutes|Niveau 2
Créez `v_customer_spending` (identifiant, nom, total payé arrondi) à partir des paiements, puis listez les clients ayant payé plus de 50 €.
---solution---
```sql run
CREATE VIEW v_customer_spending AS
SELECT c.customer_id, c.last_name, ROUND(SUM(p.amount), 2) AS total_paid
FROM customers AS c
INNER JOIN orders AS o ON o.customer_id = c.customer_id
INNER JOIN payments AS p ON p.order_id = o.order_id
GROUP BY c.customer_id, c.last_name;

SELECT customer_id, last_name, total_paid
FROM v_customer_spending
WHERE total_paid > 50
ORDER BY customer_id;
```
:::

:::quiz Quelle compétence ENI regroupe INTERSECT et EXCEPT ?
- [ ] C.1 :: C.1 porte sur une seule table.
- [x] C.2 :: Les opérateurs ensemblistes figurent dans les critères de C.2.
- [ ] C.4 :: C.4 porte sur les vues.
:::

:::quiz Quel est le premier réflexe avant tout UPDATE ?
- [ ] L’exécuter pour voir :: C’est le réflexe qui provoque les accidents.
- [x] Écrire le SELECT équivalent avec le même WHERE :: On vérifie les lignes concernées avant de les modifier.
- [ ] Supprimer le WHERE :: Cela toucherait toute la table.
:::
