- Lire une table avec SELECT … FROM et choisir ses colonnes
- Filtrer avec WHERE, les comparaisons, AND, OR, NOT, IN, BETWEEN, LIKE, IS NULL
- Éliminer les doublons avec DISTINCT
- Trier avec ORDER BY et limiter avec LIMIT / OFFSET
- Identifier et corriger les erreurs classiques d’une requête simple
===
:::eni Périmètre ENI · compétence C.1
Ce chapitre couvre les critères C.1 : requête **SELECT** simple avec **FROM**, filtrage avec **WHERE**, tri avec **ORDER BY**. Les fonctions d’agrégation MIN, MAX, AVG et COUNT (aussi en C.1) sont au chapitre 7. `DISTINCT`, `IN`, `BETWEEN`, `LIKE` et `LIMIT` sont des prérequis qui facilitent la progression.
:::

## Poser une question à la base

Les chapitres précédents préparaient le terrain. Voici le cœur du métier : **interroger** les données. Une requête de lecture se construit en répondant à trois questions : *quelles colonnes veux-je ?* (`SELECT`), *dans quelle table ?* (`FROM`), *quelles lignes ?* (`WHERE`). Puis, éventuellement : *dans quel ordre ?* (`ORDER BY`).

## SELECT et FROM : lire une table

```sql run
SELECT *
FROM categories
ORDER BY category_id;
```

`SELECT *` signifie « toutes les colonnes ». `FROM categories` désigne la table. Le résultat est lui-même un tableau, mais **temporaire** : la table d’origine n’est pas modifiée. Notez la catégorie *Poésie* : elle existe mais ne contient aucun livre.

L’étoile est pratique pour explorer, mais déconseillée dans une application : si la table gagne des colonnes, le résultat change sans prévenir. On préfère nommer les colonnes (c’est la **projection**) :

```sql run
SELECT title, author, unit_price
FROM books
ORDER BY book_id;
```

L’ordre des colonnes du résultat suit celui de votre `SELECT`, pas celui de la table.

## WHERE : filtrer les lignes

`WHERE` ne garde que les lignes pour lesquelles la **condition** est vraie. Une condition compare une colonne à une valeur avec : `=` (égal), `<>` (différent), `<`, `>`, `<=`, `>=`.

```sql run
SELECT title, unit_price
FROM books
WHERE unit_price > 10
ORDER BY unit_price DESC, book_id;
```

On lit : « les titres et prix des livres dont le prix dépasse 10 », puis triés. La condition `unit_price > 10` est évaluée **ligne par ligne**.

:::error Erreur fréquente
Écrire `=` pour du texte sans apostrophes (`WHERE city = Paris`). Le moteur croit que `Paris` est un nom de colonne. Le texte s’écrit `'Paris'`.
:::

### AND, OR, NOT

`AND` exige que **les deux** conditions soient vraies ; `OR` qu’**au moins une** le soit ; `NOT` inverse une condition.

```sql run
SELECT title, category_id, unit_price
FROM books
WHERE category_id = 2 AND unit_price < 7.50
ORDER BY book_id;
```

Policiers (catégorie 2) **et** moins de 7,50 € : une seule ligne répond. Quand on mélange `AND` et `OR`, **utilisez des parenthèses** : `AND` est prioritaire sur `OR`, et `a OR b AND c` signifie `a OR (b AND c)`, rarement ce que l’on voulait dire.

### IN : plusieurs valeurs possibles

```sql run
SELECT customer_id, first_name, city
FROM customers
WHERE city IN ('Paris', 'Lyon')
ORDER BY customer_id;
```

`IN (…)` est une écriture abrégée de `city = 'Paris' OR city = 'Lyon'`.

### BETWEEN : un intervalle

```sql run
SELECT title, publication_year
FROM books
WHERE publication_year BETWEEN 1850 AND 1900
ORDER BY publication_year, book_id;
```

`BETWEEN a AND b` **inclut** les deux bornes. Le livre sans année de publication (NULL) n’apparaît pas : une comparaison avec une valeur inconnue n’est jamais vraie.

### LIKE : chercher un motif dans du texte

Dans un motif `LIKE`, `%` remplace **n’importe quelle suite de caractères** (même vide) et `_` remplace **exactement un caractère**.

```sql run
SELECT title
FROM books
WHERE title LIKE 'Le %'
ORDER BY book_id;
```

Les titres commençant par « Le » suivi d’une espace.

:::warning La casse dépend du moteur
`'abc' LIKE 'ABC'` donne **faux** sur PostgreSQL (sensible à la casse) mais **vrai** sur MySQL (comparaison insensible à la casse par défaut) et sur SQLite (pour les lettres ASCII). PostgreSQL propose `ILIKE` pour ignorer la casse ; cet opérateur n’existe pas ailleurs. Les exemples du cours sont écrits pour donner le même résultat partout.
:::

### IS NULL : tester l’absence de valeur

```sql run
SELECT customer_id, first_name, phone
FROM customers
WHERE phone IS NULL
ORDER BY customer_id;
```

C’est la **seule** bonne façon de chercher les valeurs absentes. Son contraire est `IS NOT NULL`. Voyons pourquoi `= NULL` est une erreur de logique :

```sql run
SELECT customer_id, first_name, phone
FROM customers
WHERE phone = NULL;
```

Aucune ligne, **sans message d’erreur**. `phone = NULL` n’est jamais vrai (ni faux : il est *inconnu*), donc aucune ligne n’est retenue. Ces erreurs silencieuses sont les plus dangereuses.

## DISTINCT : supprimer les doublons

```sql run
SELECT DISTINCT city
FROM customers
ORDER BY city;
```

Sans `DISTINCT`, Paris et Lyon apparaîtraient plusieurs fois. `DISTINCT` garde une seule occurrence de chaque ligne **entièrement identique** du résultat.

## ORDER BY : trier le résultat

Sans `ORDER BY`, l’ordre des lignes **n’est pas garanti** : un moteur peut les renvoyer dans l’ordre de stockage aujourd’hui, dans un autre demain. Pour un ordre stable, il faut le demander.

- `ASC` : croissant (valeur par défaut) ; `DESC` : décroissant.
- On peut trier sur plusieurs colonnes : la deuxième départage les égalités de la première.

```sql run
SELECT title, unit_price
FROM books
ORDER BY unit_price DESC, book_id
LIMIT 3;
```

:::note NULL et tri
Où placer les NULL ? PostgreSQL les met **en dernier** en tri croissant ; MySQL et SQLite les mettent **en premier**. Si l’ordre compte, ajoutez une règle explicite (chapitre 13, `CASE` ou `COALESCE`).
:::

## LIMIT et OFFSET : limiter et paginer

`LIMIT n` ne garde que les `n` premières lignes ; `OFFSET k` en saute d’abord `k`. Associés à un `ORDER BY`, ils permettent la pagination (page 2, avec 3 lignes par page) :

```sql run
SELECT title, unit_price
FROM books
ORDER BY unit_price DESC, book_id
LIMIT 3 OFFSET 3;
```

`LIMIT … OFFSET …` fonctionne à l’identique sur PostgreSQL, MySQL et SQLite. PostgreSQL accepte aussi la forme du standard SQL, `OFFSET 3 ROWS FETCH FIRST 3 ROWS ONLY`, que MySQL et SQLite ne reconnaissent pas.

## Construire une requête pas à pas

Demande métier : *« Quels livres de la catégorie Roman coûtent moins de 10 € ? Du moins cher au plus cher. »*

1. **Table** : `books`. 2. **Colonnes** : `title`, `unit_price`. 3. **Filtre** : `category_id = 1` (Roman) et `unit_price < 10`. 4. **Tri** : prix croissant.

```sql run
SELECT title, unit_price
FROM books
WHERE category_id = 1 AND unit_price < 10
ORDER BY unit_price, book_id;
```

Prenez cette habitude : décomposer la demande en table, colonnes, filtre, tri avant d’écrire.

## Exercices

:::exercise Exercice guidé : livres récents|Niveau 1 · guidé
Affichez le titre et l’année des livres publiés **après 1890**, du plus récent au plus ancien. Réfléchissez : que se passe-t-il pour le livre dont l’année est NULL ?
---solution---
```sql run
SELECT title, publication_year
FROM books
WHERE publication_year > 1890
ORDER BY publication_year DESC, book_id;
```
`publication_year > 1890` est faux ou inconnu pour *La Guerre des Gaules* (NULL) : la ligne est donc exclue. C’est le comportement attendu ici, mais à garder en tête : un filtre numérique **ne retient jamais** les NULL.

Erreur habituelle : écrire `>= 1890`, qui ajouterait les livres de 1890 (aucun ici, mais la nuance compte) ; ou oublier `DESC`.
:::

:::exercise Exercice autonome : clients à contacter|Niveau 2 · autonome
Listez les clients (identifiant, prénom, ville) qui ont accepté la newsletter **et** dont le téléphone est connu, triés par identifiant.
---solution---
```sql run
SELECT customer_id, first_name, city
FROM customers
WHERE newsletter_opt_in = TRUE AND phone IS NOT NULL
ORDER BY customer_id;
```
Deux conditions reliées par `AND`. `newsletter_opt_in = TRUE` fonctionne sur les trois moteurs récents (SQLite reconnaît `TRUE` depuis la version 3.23). Écrire `= TRUE` plutôt que de tester la colonne seule garde la requête lisible pour un débutant.
:::

:::exercise Exercice de débogage : trois requêtes fautives|Niveau 2 · débogage
Ces trois requêtes ne font pas ce qu’on attend. Trouvez l’erreur de chacune.
```text
(a) SELECT titel FROM books;
(b) SELECT * FROM book;
(c) SELECT first_name FROM customers WHERE phone = NULL;
```
---solution---
**(a)** Faute de frappe dans le nom de colonne : `titel` n’existe pas. Le moteur le signale :
```sql error
SELECT titel FROM books;
```
**(b)** Nom de table incorrect (`book` au lieu de `books`) :
```sql error
SELECT * FROM book;
```
**(c)** Erreur **logique** : aucune erreur affichée, mais zéro ligne, car `= NULL` n’est jamais vrai. Correction : `WHERE phone IS NULL`.

Moralité : une erreur de syntaxe se voit immédiatement ; une erreur de logique peut rester invisible. Vérifiez toujours qu’un résultat vide est plausible.
:::

:::quiz Quelle condition sélectionne les clients sans téléphone ?
- [ ] WHERE phone = NULL :: Cette comparaison n’est jamais vraie ; elle renvoie zéro ligne sans erreur.
- [ ] WHERE phone = '' :: Une chaîne vide n’est pas NULL : on testerait une valeur vide, pas une valeur absente.
- [x] WHERE phone IS NULL :: IS NULL est l’unique test correct d’absence de valeur.
:::

:::quiz Que signifie « title LIKE 'Le %' » ?
- [ ] Le titre vaut exactement « Le % » :: Le % est un joker, pas un caractère littéral.
- [x] Le titre commence par « Le » suivi d’une espace :: % remplace n’importe quelle suite de caractères après le motif.
- [ ] Le titre contient « Le » n’importe où :: Il faudrait '%Le%' pour cela.
:::

:::quiz Sans ORDER BY, dans quel ordre les lignes sont-elles renvoyées ?
- [ ] Dans l’ordre de la clé primaire, toujours :: Rien ne le garantit.
- [x] Dans un ordre non garanti :: Pour un ordre fiable, il faut ORDER BY.
- [ ] Dans l’ordre alphabétique :: Aucun tri implicite n’existe.
:::
