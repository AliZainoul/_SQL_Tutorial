- Écrire une sous-requête dans WHERE, avec comparaison, IN et NOT IN
- Utiliser EXISTS et NOT EXISTS
- Distinguer sous-requête imbriquée et sous-requête corrélée
- Expliquer le piège de NOT IN en présence de NULL
- Choisir entre jointure et sous-requête
===
:::eni Périmètre ENI · compétence C.2
Critère : « la sélection de données utilise un mécanisme de sous-requêtes **imbriquées ou corrélées** » avec `EXISTS` **ou** une sous-requête imbriquée. `IN`, `NOT IN` et les tables dérivées sont des prérequis proches.
:::

## Une requête dans une requête

Une **sous-requête** est un `SELECT` placé à l’intérieur d’une autre requête, entre parenthèses. Elle répond à une question intermédiaire dont la réponse sert à la requête principale.

Demande : *« Quels livres coûtent plus cher que le prix moyen du catalogue ? »* En deux temps : calculer le prix moyen, puis comparer. Une sous-requête fait les deux en une seule instruction.

[[figure:subqueries.svg|Imbriquée : une exécution. Corrélée : une exécution par ligne de la requête externe.|Comparaison d’une sous-requête imbriquée, qui s’exécute une fois, et d’une sous-requête corrélée, qui s’exécute pour chaque ligne externe.]]

## Sous-requête imbriquée (non corrélée)

```sql run
SELECT title, unit_price
FROM books
WHERE unit_price > (SELECT AVG(unit_price) FROM books)
ORDER BY unit_price DESC, book_id;
```

La sous-requête `(SELECT AVG(unit_price) FROM books)` est **indépendante** de la requête externe : elle s’exécute une fois et renvoie une valeur unique (12,52). Le moteur compare ensuite chaque livre à cette valeur. Quand la sous-requête renvoie **une seule valeur**, on dit qu’elle est **scalaire**, et on peut utiliser `>`, `=`, `<`, etc.

## IN : appartenir à une liste calculée

Quand la sous-requête renvoie **plusieurs valeurs** (une colonne, plusieurs lignes), on utilise `IN`.

```sql run
SELECT customer_id, first_name
FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled')
ORDER BY customer_id;
```

Les clients qui ont au moins une commande annulée. La sous-requête construit la liste des identifiants ; `IN` teste l’appartenance. Le même résultat s’obtiendrait avec une jointure, mais la sous-requête exprime directement la question : « ceux dont l’identifiant figure dans… ».

## NOT IN et le piège de NULL

`NOT IN` sélectionne ce qui n’est **pas** dans la liste :

```sql run
SELECT customer_id, first_name
FROM customers
WHERE customer_id NOT IN (SELECT customer_id FROM orders)
ORDER BY customer_id;
```

Les clients sans commande. Ici tout se passe bien parce que `orders.customer_id` est `NOT NULL`. Mais si la liste contient **un seul NULL**, `NOT IN` ne renvoie **plus aucune ligne**. Pourquoi : `x NOT IN (1, NULL)` signifie `x <> 1 AND x <> NULL`, et `x <> NULL` est *inconnu*, donc l’ensemble n’est jamais vrai.

```sql run
SELECT customer_id
FROM customers
WHERE customer_id NOT IN (SELECT 1 UNION ALL SELECT NULL)
ORDER BY customer_id;
```

Zéro ligne, sans erreur. Il y aurait pourtant 11 clients différents de 1. C’est l’une des erreurs les plus sournoises de SQL. Deux protections : filtrer les NULL dans la sous-requête (`WHERE colonne IS NOT NULL`), ou utiliser `NOT EXISTS`.

## EXISTS et NOT EXISTS

`EXISTS (sous-requête)` est **vrai** si la sous-requête renvoie **au moins une ligne**, quelles que soient les colonnes. On écrit conventionnellement `SELECT 1`. `NOT EXISTS` est vrai si elle ne renvoie **aucune** ligne.

```sql run
SELECT b.book_id, b.title
FROM books AS b
WHERE NOT EXISTS (SELECT 1 FROM order_items AS oi WHERE oi.book_id = b.book_id)
ORDER BY b.book_id;
```

Les livres jamais commandés. Remarquez `oi.book_id = b.book_id` : la sous-requête utilise une colonne de la requête externe (`b`). Elle est donc **corrélée**.

## Sous-requête corrélée

Une sous-requête est **corrélée** quand elle fait référence à une colonne de la requête externe : elle ne peut plus s’exécuter seule, et le raisonnement est « pour chaque ligne de la requête externe, évaluer la sous-requête avec les valeurs de cette ligne ».

```sql run
SELECT c.customer_id, c.first_name
FROM customers AS c
WHERE EXISTS (SELECT 1 FROM orders AS o
              WHERE o.customer_id = c.customer_id AND o.status = 'pending')
ORDER BY c.customer_id;
```

Les clients qui ont une commande en attente. Pour le client 1, la sous-requête cherche ses commandes `pending` : il y en a une, `EXISTS` est vrai, le client est gardé.

Autre usage, avec un agrégat : les livres **plus chers que la moyenne de leur propre catégorie**.

```sql run
SELECT b.title, b.category_id, b.unit_price
FROM books AS b
WHERE b.unit_price > (SELECT AVG(b2.unit_price)
                      FROM books AS b2
                      WHERE b2.category_id = b.category_id)
ORDER BY b.book_id;
```

La moyenne n’est plus unique : elle change selon la catégorie de la ligne courante. C’est impossible avec une sous-requête non corrélée.

## Une sous-requête dans le SELECT ou le FROM

Une sous-requête scalaire peut fournir une colonne :

```sql run
SELECT c.customer_id,
       (SELECT COUNT(*) FROM orders AS o WHERE o.customer_id = c.customer_id) AS orders_count
FROM customers AS c
ORDER BY c.customer_id;
```

Dans le `FROM`, elle devient une **table dérivée**, qui **doit avoir un alias** sur PostgreSQL et MySQL. Exemple : la moyenne des montants de commande.

```sql run
SELECT ROUND(AVG(t.total), 2) AS average_order_total
FROM (SELECT order_id, SUM(quantity * unit_price) AS total
      FROM order_items
      GROUP BY order_id) AS t;
```

On agrège d’abord par commande (une ligne par commande), puis on calcule la moyenne de ces totaux : impossible d’écrire `AVG(SUM(…))` directement.

## Jointure ou sous-requête ?

| Situation | Choix habituel |
|---|---|
| Afficher des colonnes de l’autre table | **Jointure** |
| Tester seulement l’existence d’une correspondance | `EXISTS` |
| Chercher l’absence de correspondance | `NOT EXISTS` (ou `LEFT JOIN … IS NULL`) |
| Comparer à un agrégat (moyenne, maximum) | Sous-requête scalaire |
| Liste de valeurs à tester, sans NULL possible | `IN` |
| Liste pouvant contenir NULL, négation | `NOT EXISTS`, jamais `NOT IN` |

Les moteurs savent souvent traduire l’une en l’autre ; choisissez la forme la plus **lisible** et la plus **sûre**.

:::exercise Exercice guidé : livres commandés au moins une fois|Niveau 2 · guidé
Écrivez la liste des livres qui ont été commandés au moins une fois, de deux façons : avec `IN`, puis avec `EXISTS`.
---solution---
Avec `IN` :
```sql run
SELECT b.book_id, b.title
FROM books AS b
WHERE b.book_id IN (SELECT oi.book_id FROM order_items AS oi)
ORDER BY b.book_id;
```
Avec `EXISTS` (corrélée) :
```sql run
SELECT b.book_id, b.title
FROM books AS b
WHERE EXISTS (SELECT 1 FROM order_items AS oi WHERE oi.book_id = b.book_id)
ORDER BY b.book_id;
```
Les deux donnent 13 livres (les 15 moins les deux jamais commandés). `EXISTS` s’arrête à la première ligne trouvée ; `IN` raisonne sur une liste de valeurs. Ici le résultat est identique parce que `order_items.book_id` n’est jamais NULL.
:::

:::exercise Exercice autonome : commandes plus grosses que la moyenne|Niveau 3 · autonome
Listez les commandes dont le total est supérieur à la **moyenne des totaux de commandes** (environ 26,6 €). Affichez `order_id` et le total arrondi, du plus gros au plus petit.
---solution---
```sql run
SELECT t.order_id, ROUND(t.total, 2) AS total
FROM (SELECT order_id, SUM(quantity * unit_price) AS total
      FROM order_items
      GROUP BY order_id) AS t
WHERE t.total > (SELECT AVG(t2.total)
                 FROM (SELECT order_id, SUM(quantity * unit_price) AS total
                       FROM order_items
                       GROUP BY order_id) AS t2)
ORDER BY t.total DESC, t.order_id;
```
Une table dérivée calcule les totaux par commande ; une sous-requête scalaire calcule leur moyenne ; la requête externe compare. La table dérivée est répétée : le chapitre 12 montrera comment la nommer une fois pour toutes dans une vue.
:::

:::exercise Exercice de débogage : zéro ligne inattendue|Niveau 3 · débogage
On cherche les clients dont le téléphone n’est pas porté par un client de Paris. Cette requête renvoie 0 ligne alors que des clients répondent à la demande. Pourquoi ?
```text
SELECT first_name FROM customers
WHERE phone NOT IN (SELECT phone FROM customers WHERE city = 'Paris');
```
---solution---
Parmi les clients de Paris, Arthur (n° 12) a un téléphone **NULL**. La sous-requête renvoie donc une liste contenant NULL, et `NOT IN` ne peut plus être vrai pour aucune ligne.
```sql run
SELECT first_name
FROM customers
WHERE phone NOT IN (SELECT phone FROM customers WHERE city = 'Paris');
```
Correction par `NOT EXISTS` (ou en ajoutant `AND phone IS NOT NULL` dans la sous-requête) :
```sql run
SELECT c.customer_id, c.first_name
FROM customers AS c
WHERE c.phone IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM customers AS p
                  WHERE p.city = 'Paris' AND p.phone = c.phone)
ORDER BY c.customer_id;
```
:::

:::quiz Qu’est-ce qui rend une sous-requête « corrélée » ?
- [ ] Elle contient un agrégat :: Un agrégat n’a rien à voir avec la corrélation.
- [x] Elle utilise une colonne de la requête externe :: Elle dépend donc de la ligne courante et s’évalue pour chaque ligne.
- [ ] Elle est placée dans le FROM :: Une table dérivée est généralement indépendante.
:::

:::quiz Pourquoi NOT IN renvoie-t-il zéro ligne si la liste contient un NULL ?
- [ ] Le moteur plante silencieusement :: Aucune panne.
- [x] La comparaison avec NULL est inconnue, donc la condition globale n’est jamais vraie :: x <> NULL n’est ni vrai ni faux.
- [ ] NULL est égal à zéro :: NULL n’est pas une valeur.
:::

:::quiz Pour trouver les clients sans commande de façon sûre, quelle écriture privilégier ?
- [ ] NOT IN sur une colonne nullable :: Elle risque le piège de NULL.
- [x] NOT EXISTS ou LEFT JOIN … IS NULL :: Ces formes se comportent correctement même avec des NULL.
- [ ] COUNT(*) = 0 dans le WHERE :: Un agrégat ne peut pas figurer dans le WHERE.
:::
