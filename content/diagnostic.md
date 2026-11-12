Six questions pour situer votre point de départ. Elles ne sont pas notées : chaque réponse est justifiée. Si plusieurs vous échappent, commencez par le chapitre 00 ; si tout vous semble acquis, parcourez le chapitre 14 puis l’examen blanc.

:::quiz Qu’est-ce que SQL ?
- [ ] Un système de gestion de base de données :: Cela, c’est le SGBD (PostgreSQL, MySQL…).
- [x] Un langage pour interroger et modifier des bases de données relationnelles :: Structured Query Language.
- [ ] Un tableur :: Un tableur n’est pas un SGBD.
:::

:::quiz Dans une table, une « ligne » représente…
- [x] un élément précis (un client, un livre) :: Une ligne = un enregistrement.
- [ ] une caractéristique commune à tous les éléments :: C’est une colonne.
- [ ] une règle de validation :: C’est une contrainte.
:::

:::quiz À quoi sert une clé primaire ?
- [ ] À accélérer les calculs :: Ce n’est pas son rôle premier.
- [x] À identifier chaque ligne de façon unique :: Unique et jamais NULL.
- [ ] À relier deux bases :: Elle identifie, elle ne relie pas.
:::

:::quiz Que signifie NULL ?
- [ ] Zéro :: C’est une valeur.
- [x] Une valeur absente ou inconnue :: Ce n’est ni 0 ni du texte vide.
- [ ] Une erreur :: Une donnée peut légitimement manquer.
:::

:::quiz Quelle requête affiche les livres à plus de 10 € ?
- [x] SELECT title FROM books WHERE unit_price > 10; :: SELECT … FROM … WHERE.
- [ ] SELECT title WHERE unit_price > 10 FROM books; :: Ordre des clauses incorrect.
- [ ] FIND books WHERE unit_price > 10; :: FIND n’existe pas.
:::

:::quiz Une clé étrangère garantit que…
- [ ] la table ne contient aucun doublon :: C’est UNIQUE.
- [x] la valeur existe dans la table référencée :: Intégrité référentielle.
- [ ] la colonne n’est jamais vide :: C’est NOT NULL.
:::
