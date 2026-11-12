- Combiner des résultats avec UNION et UNION ALL
- Calculer une intersection avec INTERSECT et une différence avec EXCEPT
- Respecter les règles de compatibilité des colonnes et placer correctement ORDER BY
- Connaître les écarts entre moteurs (versions, priorités)
- Reformuler INTERSECT et EXCEPT avec IN, EXISTS ou une jointure
===
:::eni Périmètre ENI · compétence C.2
Critère : « les données sont sélectionnées à l’aide d’opérateurs ensemblistes » : `EXCEPT` et `INTERSECT`. `UNION` et `UNION ALL` sont ajoutés comme prérequis.
:::

## Raisonner en ensembles

Un résultat de requête est un ensemble de lignes. Les **opérateurs ensemblistes** combinent **deux résultats** (et non deux tables) :

| Opérateur | Résultat |
|---|---|
| `UNION` | Les lignes de l’un **ou** de l’autre, sans doublon |
| `UNION ALL` | Toutes les lignes des deux, **doublons conservés** |
| `INTERSECT` | Les lignes présentes dans **les deux** |
| `EXCEPT` | Les lignes du premier **absentes** du second |

**Règles** : les deux requêtes doivent avoir le **même nombre de colonnes**, avec des **types compatibles** dans le même ordre ; les noms de colonnes du résultat sont ceux de la **première** requête ; un `ORDER BY` éventuel se place **à la fin**, une seule fois.

## UNION et UNION ALL

Clients ayant une commande expédiée ou une commande payée :

```sql run
SELECT customer_id FROM orders WHERE status = 'shipped'
UNION
SELECT customer_id FROM orders WHERE status = 'paid'
ORDER BY customer_id;
```

Sept clients, chacun **une seule fois** : `UNION` élimine les doublons. Avec `UNION ALL`, rien n’est éliminé :

```sql run
SELECT customer_id FROM orders WHERE status = 'shipped'
UNION ALL
SELECT customer_id FROM orders WHERE status = 'paid'
ORDER BY customer_id;
```

Dix lignes : les clients 1 et 3 apparaissent plusieurs fois. `UNION ALL` est **plus rapide** (pas de recherche de doublons) et doit être préféré quand les doublons sont impossibles ou souhaités. `UNION` sert aussi à combiner des sources de natures différentes :

```sql run
SELECT first_name AS name, 'client' AS kind FROM customers WHERE customer_id <= 2
UNION
SELECT author, 'auteur' FROM books WHERE book_id <= 2
ORDER BY kind, name;
```

## INTERSECT : ce qu’ils ont en commun

Clients qui ont **à la fois** une commande expédiée **et** une commande payée :

```sql run
SELECT customer_id FROM orders WHERE status = 'shipped'
INTERSECT
SELECT customer_id FROM orders WHERE status = 'paid'
ORDER BY customer_id;
```

Les clients 1 et 3. Équivalent avec une sous-requête :

```text
SELECT DISTINCT customer_id FROM orders
WHERE status = 'shipped'
  AND customer_id IN (SELECT customer_id FROM orders WHERE status = 'paid')
```

## EXCEPT : la différence

Clients qui ont une commande expédiée **mais aucune** payée :

```sql run
SELECT customer_id FROM orders WHERE status = 'shipped'
EXCEPT
SELECT customer_id FROM orders WHERE status = 'paid'
ORDER BY customer_id;
```

Les clients 2, 4 et 8. **L’ordre compte** : `A EXCEPT B` n’est pas `B EXCEPT A`. Équivalent avec `NOT EXISTS` ; on retrouve la logique du chapitre 9.

:::note Oracle
Oracle appelle `MINUS` l’opérateur que le standard SQL, PostgreSQL, MySQL et SQLite appellent `EXCEPT`.
:::

## Doublons et NULL

`UNION`, `INTERSECT` et `EXCEPT` (sans `ALL`) **éliminent les doublons** et considèrent deux `NULL` comme **identiques** pour cette comparaison, contrairement à `=`. C’est cohérent avec `DISTINCT` (chapitre 6).

## Différences entre moteurs

| Sujet | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| `UNION` / `UNION ALL` | Oui | Oui | Oui |
| `INTERSECT`, `EXCEPT` | Oui | **8.0.31 ou plus** (testé sur 8.0.46) | Oui |
| `INTERSECT ALL`, `EXCEPT ALL` | Oui | Oui (à partir de 8.0.31) | Non |
| Priorité entre opérateurs | `INTERSECT` avant `UNION` / `EXCEPT` | Standard | **Tous au même niveau, de gauche à droite** |
| Parenthèses autour d’une requête | Oui | Oui | **Non** |

:::warning Priorité sous SQLite
Selon le standard, `SELECT 1 UNION SELECT 2 INTERSECT SELECT 3` calcule d’abord `2 INTERSECT 3` (vide) puis réunit avec 1 : le résultat est `1` (c’est ce que renvoient PostgreSQL et MySQL, **constaté**). SQLite évalue de gauche à droite : `(1 UNION 2) INTERSECT 3` donne un **résultat vide** (constaté sur SQLite 3.45). Quand vous mélangez plusieurs opérateurs ensemblistes, décomposez la requête avec des tables dérivées plutôt que de dépendre de la priorité.
:::

Si votre MySQL est plus ancien que 8.0.31, `INTERSECT` et `EXCEPT` n’existent pas : utilisez `IN` / `EXISTS` / `NOT EXISTS` (chapitre 9).

:::exercise Exercice guidé : trois ensembles|Niveau 2 · guidé
Trouvez les clients qui ont une commande **annulée** mais **aucune** commande payée ou expédiée. Écrivez d’abord les trois ensembles, puis combinez.
---solution---
Ensemble A : clients ayant une commande annulée. Ensemble B : clients ayant une commande payée ou expédiée. On veut `A EXCEPT B`.
```sql run
SELECT customer_id FROM orders WHERE status = 'cancelled'
EXCEPT
SELECT customer_id FROM orders WHERE status IN ('paid', 'shipped')
ORDER BY customer_id;
```
Le client 2 a une commande annulée **et** une expédiée : il est retiré. Seul le client 9 reste. `IN ('paid','shipped')` évite un `UNION` supplémentaire.
:::

:::exercise Exercice autonome : livres jamais commandés, de trois façons|Niveau 3 · autonome
Obtenez les identifiants des livres jamais commandés avec `EXCEPT`, puis avec `NOT EXISTS`.
---solution---
Avec `EXCEPT` (une seule colonne dans chaque requête) :
```sql run
SELECT book_id FROM books
EXCEPT
SELECT book_id FROM order_items
ORDER BY book_id;
```
Avec `NOT EXISTS` :
```sql run
SELECT b.book_id
FROM books AS b
WHERE NOT EXISTS (SELECT 1 FROM order_items AS oi WHERE oi.book_id = b.book_id)
ORDER BY b.book_id;
```
Livres 6 et 13 dans les deux cas. `EXCEPT` ne renvoie que les colonnes sélectionnées : pour afficher aussi le titre, la forme `NOT EXISTS` (ou une jointure) est plus simple.
:::

:::exercise Exercice de débogage : colonnes incompatibles|Niveau 2 · débogage
Cette requête échoue. Pourquoi ?
```text
SELECT customer_id, city FROM customers
UNION
SELECT order_id FROM orders;
```
---solution---
Les deux requêtes n’ont pas le même nombre de colonnes (2 contre 1). Les types doivent aussi être compatibles : combiner un identifiant numérique et une ville (texte) est refusé ou ambigu selon les moteurs.
```sql error
SELECT customer_id, city FROM customers
UNION
SELECT order_id FROM orders;
```
:::

:::quiz Quelle différence entre UNION et UNION ALL ?
- [ ] UNION trie, UNION ALL ne trie pas :: Aucun des deux ne garantit un tri.
- [x] UNION supprime les doublons, UNION ALL les conserve :: UNION ALL est donc plus rapide.
- [ ] UNION ALL combine plus de deux requêtes :: Les deux peuvent en combiner plusieurs.
:::

:::quiz Que renvoie « A EXCEPT B » ?
- [ ] Les lignes communes à A et B :: C’est INTERSECT.
- [x] Les lignes de A qui ne figurent pas dans B :: L’ordre des opérandes compte.
- [ ] Les lignes de B absentes de A :: Ce serait B EXCEPT A.
:::
