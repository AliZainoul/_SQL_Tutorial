- Se placer en situation d’épreuve : 9 cas pratiques et 26 questions en 1 h 30
- Identifier ses points faibles par compétence
- Relire des corrections entièrement expliquées
===
:::warning Simulation pédagogique non officielle
Cet examen blanc est **construit pour ce cours**. Il ne reproduit aucune question officielle ENI et n’applique **aucune méthode de notation ENI** : le référentiel indique seulement le format (9 cas pratiques, 26 questions professionnelles, 1 h 30, seuil de 700/1000) sans détailler la conversion des points. Votre bilan ci-dessous est un outil d’auto-évaluation, pas une prédiction de score.
:::

## Mode d’emploi

- **Durée indicative : 1 h 30** (environ 60 minutes pour les cas pratiques, 30 pour les questions). Chronométrez-vous.
- Travaillez sur la base de référence (`04_reset` avant de commencer). Écrivez vos requêtes **dans votre client SQL** avant d’ouvrir les corrections.
- Les corrections sont dans des blocs dépliables ; les résultats affichés sont ceux du jeu de référence.
- Chaque énoncé indique la compétence évaluée, pour le bilan final.

## Partie A · 9 cas pratiques

:::exercise Cas pratique 1 · C.1 · 5 min|Requête simple
Affichez le titre, l’auteur et le prix des livres dont le prix est compris entre 8 et 12 € (bornes incluses), du moins cher au plus cher (à prix égal, par `book_id`).
---solution---
```sql run
SELECT title, author, unit_price
FROM books
WHERE unit_price BETWEEN 8 AND 12
ORDER BY unit_price, book_id;
```
`BETWEEN` inclut les bornes. Erreur fréquente : `ORDER BY` oublié, ou `>` / `<` au lieu de `>=` / `<=`.
:::

:::exercise Cas pratique 2 · C.1 · 5 min|Agrégat
Calculez le nombre de livres publiés avant 1900 et leur prix moyen (arrondi à 2 décimales). Un livre dont l’année est inconnue doit-il être compté ?
---solution---
```sql run
SELECT COUNT(*) AS books_count, ROUND(AVG(unit_price), 2) AS average_price
FROM books
WHERE publication_year < 1900;
```
*La Guerre des Gaules* (année NULL) **n’est pas compté** : la comparaison `NULL < 1900` n’est jamais vraie. Pour l’inclure, il faudrait `OR publication_year IS NULL`.
:::

:::exercise Cas pratique 3 · C.2 · 8 min|Jointure externe et agrégat
Affichez, pour **chaque** client (même sans commande), son nom et son nombre de commandes, triés par nombre décroissant puis par `customer_id`.
---solution---
```sql run
SELECT c.customer_id, c.last_name, COUNT(o.order_id) AS orders_count
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.last_name
ORDER BY orders_count DESC, c.customer_id;
```
`LEFT JOIN` garde les clients sans commande ; `COUNT(o.order_id)` donne 0 pour eux. `COUNT(*)` aurait donné 1.
:::

:::exercise Cas pratique 4 · C.2 · 8 min|Sous-requête corrélée
Listez les livres (titre, catégorie, stock) dont le stock est **inférieur à la moyenne des stocks de leur catégorie**.
---solution---
```sql run
SELECT b.title, b.category_id, b.stock_quantity
FROM books AS b
WHERE b.stock_quantity < (SELECT AVG(b2.stock_quantity)
                          FROM books AS b2
                          WHERE b2.category_id = b.category_id)
ORDER BY b.book_id;
```
La sous-requête est corrélée par `b2.category_id = b.category_id` : la moyenne dépend de la catégorie de la ligne courante.
:::

:::exercise Cas pratique 5 · C.2 · 8 min|Opérateurs ensemblistes
Trouvez les identifiants des clients qui ont acheté au moins un livre de la catégorie **Policier (2)** et au moins un livre de la catégorie **Science-fiction (3)**.
---solution---
```sql run
SELECT o.customer_id
FROM orders AS o
INNER JOIN order_items AS oi ON oi.order_id = o.order_id
INNER JOIN books AS b ON b.book_id = oi.book_id
WHERE b.category_id = 2
INTERSECT
SELECT o.customer_id
FROM orders AS o
INNER JOIN order_items AS oi ON oi.order_id = o.order_id
INNER JOIN books AS b ON b.book_id = oi.book_id
WHERE b.category_id = 3
ORDER BY customer_id;
```
Un seul client (le 1) a acheté dans les deux catégories. `INTERSECT` exige deux requêtes à une colonne compatible ; sur MySQL il requiert la version 8.0.31 ou plus.
:::

:::exercise Cas pratique 6 · C.2 · 8 min|Absence de correspondance
Listez les livres **jamais commandés** avec le nom de leur catégorie, par `book_id`. (Deux écritures sont possibles.)
---solution---
```sql run
SELECT b.book_id, b.title, cat.category_name
FROM books AS b
INNER JOIN categories AS cat ON cat.category_id = b.category_id
WHERE NOT EXISTS (SELECT 1 FROM order_items AS oi WHERE oi.book_id = b.book_id)
ORDER BY b.book_id;
```
Variante : `LEFT JOIN order_items … WHERE oi.order_item_id IS NULL`. `NOT EXISTS` est plus sûr que `NOT IN` si la colonne comparée peut être NULL.
:::

:::exercise Cas pratique 7 · C.3 · 6 min|UPDATE avec WHERE
Augmentez de 5 % (arrondi à 2 décimales) le prix des livres de la catégorie Histoire (4), puis affichez-les.
---solution---
```sql run
UPDATE books
SET unit_price = ROUND(unit_price * 1.05, 2)
WHERE category_id = 4;

SELECT book_id, title, unit_price
FROM books
WHERE category_id = 4
ORDER BY book_id;
```
Le `WHERE` limite la modification aux deux livres d’histoire. Sans lui, tout le catalogue augmenterait.
:::

:::exercise Cas pratique 8 · C.3 · 6 min|DELETE avec WHERE
Supprimez les lignes de commande des commandes **annulées**, puis comptez les lignes de commande restantes.
---solution---
```sql run
DELETE FROM order_items
WHERE order_id IN (SELECT order_id FROM orders WHERE status = 'cancelled');

SELECT COUNT(*) AS remaining_items FROM order_items;
```
Deux lignes sont supprimées (commandes 6 et 14) : il en reste 23. La sous-requête désigne les commandes concernées ; sans `WHERE`, toute la table serait vidée.
:::

:::exercise Cas pratique 9 · C.4 · 8 min|Vue
Créez la vue `v_paid_orders` donnant, pour chaque commande **payée ou expédiée**, son numéro, le nom du client et son total (alias `total_amount`), puis affichez celles dont le total dépasse 30 €.
---solution---
```sql run
CREATE VIEW v_paid_orders AS
SELECT o.order_id, c.last_name, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_amount
FROM orders AS o
INNER JOIN customers AS c ON c.customer_id = o.customer_id
INNER JOIN order_items AS oi ON oi.order_id = o.order_id
WHERE o.status IN ('paid', 'shipped')
GROUP BY o.order_id, c.last_name;

SELECT order_id, last_name, total_amount
FROM v_paid_orders
WHERE total_amount > 30
ORDER BY order_id;
```
L’alias `total_amount` nomme le calcul dans la vue ; le filtre de statut est dans la vue, le filtre de montant dans la requête qui l’interroge.
:::

## Partie B · 26 questions professionnelles

Chaque question a une seule bonne réponse. La compétence visée est indiquée entre crochets.

:::quiz 1 [C.1] Quelle instruction affiche toutes les colonnes de la table books ?
- [x] SELECT * FROM books; :: L’étoile désigne toutes les colonnes.
- [ ] SHOW books; :: Instruction non standard.
- [ ] GET books; :: N’existe pas en SQL.
:::

:::quiz 2 [C.1] Quel mot-clé filtre les lignes avant tout regroupement ?
- [ ] HAVING :: Il filtre les groupes.
- [x] WHERE :: Il agit ligne par ligne, avant GROUP BY.
- [ ] LIMIT :: Il limite le nombre de lignes.
:::

:::quiz 3 [C.1] Quel est l’ordre de tri par défaut de ORDER BY ?
- [x] Croissant (ASC) :: ASC est implicite.
- [ ] Décroissant (DESC) :: Il faut l’écrire.
- [ ] Aléatoire :: Un tri explicite n’est jamais aléatoire.
:::

:::quiz 4 [C.1] Que renvoie COUNT(phone) ?
- [ ] Le nombre de lignes de la table :: C’est COUNT(*).
- [x] Le nombre de valeurs non NULL de phone :: Les NULL sont ignorés.
- [ ] La somme des téléphones :: Ce n’est pas une somme.
:::

:::quiz 5 [C.1] Quelle condition teste l’absence de valeur ?
- [ ] phone = NULL :: Jamais vrai.
- [x] phone IS NULL :: Seul test correct.
- [ ] phone = '' :: Teste le texte vide.
:::

:::quiz 6 [C.1] Quelle fonction donne le prix le plus bas ?
- [x] MIN(unit_price) :: Plus petite valeur.
- [ ] LOW(unit_price) :: N’existe pas.
- [ ] FIRST(unit_price) :: N’est pas standard.
:::

:::quiz 7 [C.1] « title LIKE '%Python%' » sélectionne…
- [x] les titres contenant « Python » n’importe où :: % encadre le motif des deux côtés.
- [ ] les titres commençant par Python :: Il faudrait 'Python%'.
- [ ] les titres égaux à Python :: Il faudrait =.
:::

:::quiz 8 [C.2] Quelle jointure conserve toutes les lignes de la table de gauche ?
- [ ] INNER JOIN :: Garde seulement les correspondances.
- [x] LEFT JOIN :: Complète avec NULL à droite.
- [ ] CROSS JOIN :: Produit cartésien.
:::

:::quiz 9 [C.2] À quoi sert l’alias dans « FROM customers AS c » ?
- [x] À raccourcir et lever les ambiguïtés des noms :: On écrit c.customer_id.
- [ ] À créer une nouvelle table :: Un alias est temporaire.
- [ ] À accélérer la requête :: Aucun effet de vitesse.
:::

:::quiz 10 [C.2] Que provoque FROM a, b sans condition WHERE ?
- [ ] Une erreur :: Aucune erreur n’est signalée.
- [x] Un produit cartésien :: Toutes les combinaisons de lignes.
- [ ] Une jointure interne :: Il manque la condition.
:::

:::quiz 11 [C.2] Où place-t-on un filtre sur le résultat d’un COUNT ?
- [ ] WHERE :: Les groupes n’existent pas encore.
- [x] HAVING :: Il filtre les groupes.
- [ ] ON :: ON sert à la condition de jointure.
:::

:::quiz 12 [C.2] Quel opérateur renvoie les lignes de A absentes de B ?
- [ ] INTERSECT :: Lignes communes.
- [x] EXCEPT :: Différence A − B.
- [ ] UNION :: Réunion.
:::

:::quiz 13 [C.2] Quelle différence entre UNION et UNION ALL ?
- [x] UNION supprime les doublons ; UNION ALL les garde :: Donc UNION ALL est plus rapide.
- [ ] UNION trie le résultat :: Pas de tri garanti.
- [ ] Aucune :: Le traitement des doublons diffère.
:::

:::quiz 14 [C.2] Une sous-requête corrélée…
- [x] référence une colonne de la requête externe :: Elle est évaluée pour chaque ligne externe.
- [ ] s’exécute toujours une seule fois :: C’est la sous-requête non corrélée.
- [ ] ne peut pas utiliser EXISTS :: EXISTS en est un usage typique.
:::

:::quiz 15 [C.2] Pourquoi éviter NOT IN avec une colonne nullable ?
- [ ] C’est plus lent :: Ce n’est pas la raison.
- [x] Un seul NULL dans la liste rend la condition jamais vraie :: Le résultat est vide.
- [ ] NOT IN est interdit :: Il est autorisé.
:::

:::quiz 16 [C.2] Que fait CREATE TEMPORARY TABLE t AS SELECT … ?
- [x] Crée une table copiant le résultat, visible durant la session :: C’est un instantané.
- [ ] Crée une vue permanente :: Une vue ne copie rien.
- [ ] Modifie la table source :: Elle ne la modifie pas.
:::

:::quiz 17 [C.2] Dans un LEFT JOIN, où placer une condition qui ne doit pas supprimer les lignes sans correspondance ?
- [x] Dans ON :: Elle participe à l’appariement sans éliminer la ligne de gauche.
- [ ] Dans WHERE :: Elle éliminerait les lignes NULL.
- [ ] Dans ORDER BY :: Sans effet.
:::

:::quiz 18 [C.3] Quelle instruction ajoute une ligne ?
- [x] INSERT INTO :: Avec la liste des colonnes et VALUES.
- [ ] ADD ROW :: N’existe pas.
- [ ] UPDATE :: Modifie des lignes existantes.
:::

:::quiz 19 [C.3] UPDATE books SET unit_price = 5; modifie…
- [ ] une seule ligne :: Aucun filtre.
- [x] toutes les lignes de la table :: Il manque le WHERE.
- [ ] aucune ligne :: L’instruction est valide.
:::

:::quiz 20 [C.3] Quelle commande annule une transaction en cours ?
- [ ] COMMIT :: Valide.
- [x] ROLLBACK :: Annule depuis BEGIN.
- [ ] SAVE :: N’existe pas.
:::

:::quiz 21 [C.3] DELETE FROM customers WHERE customer_id = 1; échoue car…
- [x] des commandes référencent ce client (ON DELETE RESTRICT) :: Intégrité référentielle.
- [ ] customer_id est NULL :: C’est une clé primaire.
- [ ] DELETE exige un JOIN :: Faux.
:::

:::quiz 22 [C.3] Quelle différence entre DELETE FROM t et DROP TABLE t ?
- [x] DELETE supprime des lignes ; DROP supprime la table :: La structure disparaît avec DROP.
- [ ] Aucune :: Ce sont deux opérations différentes.
- [ ] DROP est annulable sur tous les moteurs :: Pas sur MySQL.
:::

:::quiz 23 [C.4] Une vue stocke…
- [ ] une copie des lignes :: Ce serait une table.
- [x] une requête, exécutée à chaque lecture :: Les données restent dans les tables.
- [ ] un index :: Ce n’est pas un index.
:::

:::quiz 24 [C.4] Pourquoi nommer un calcul avec AS dans une vue ?
- [x] Pour donner un nom exploitable à la colonne de la vue :: L’alias devient le nom de colonne.
- [ ] Pour accélérer la vue :: Aucun effet de vitesse.
- [ ] Pour rendre la vue modifiable :: Sans lien.
:::

:::quiz 25 [C.4] Quel filtre détecte les titres commençant par « Le » + espace dans une vue ?
- [x] WHERE title LIKE 'Le %' :: Le joker % remplace la suite.
- [ ] WHERE title = 'Le %' :: Le % serait littéral.
- [ ] WHERE title IS 'Le' :: IS n’accepte pas cela.
:::

:::quiz 26 [C.4] Quelle instruction supprime la vue v_paid_orders sans toucher aux tables ?
- [x] DROP VIEW v_paid_orders; :: Les tables restent intactes.
- [ ] DELETE VIEW v_paid_orders; :: N’existe pas.
- [ ] DROP TABLE v_paid_orders; :: Ce n’est pas une table.
:::

## Grille de correspondance et bilan

| Éléments | Compétence ENI évaluée | Nombre |
|---|---|---|
| Cas 1 et 2 · Questions 1 à 7 | **C.1** Extraction d’une table | 2 cas · 7 questions |
| Cas 3 à 6 · Questions 8 à 17 | **C.2** Extraction de plusieurs tables | 4 cas · 10 questions |
| Cas 7 et 8 · Questions 18 à 22 | **C.3** Mise à jour des données | 2 cas · 5 questions |
| Cas 9 · Questions 23 à 26 | **C.4** Vues | 1 cas · 4 questions |

**Comment faire votre bilan.** Pour chaque compétence, notez la part de cas réussis (requête correcte *et* résultat identique) et de questions justes. Une compétence en dessous de ce que vous jugez solide est à retravailler :

| Si vous échouez sur… | Relisez |
|---|---|
| C.1 | Chapitres 6 et 7 (WHERE, NULL, agrégats, ORDER BY) |
| C.2, jointures | Chapitre 8 (INNER / LEFT, ON ou WHERE, multiplication des lignes) |
| C.2, sous-requêtes et ensembles | Chapitres 9 et 10 (EXISTS, NOT IN et NULL, EXCEPT, INTERSECT) |
| C.2, tables temporaires | Chapitre 12 (CREATE TABLE AS, SELECT INTO selon le moteur) |
| C.3 | Chapitre 11 (WHERE, transactions, clés étrangères) |
| C.4 | Chapitres 12 et 13 (CREATE VIEW, alias, NOT IN / IS NULL / LIKE) |

Le **seuil de certification** annoncé par le référentiel est de 700 sur 1000, mais la façon dont les points se convertissent n’est pas publiée : ne cherchez pas à extrapoler. Visez plutôt la **maîtrise régulière** de chaque compétence.
