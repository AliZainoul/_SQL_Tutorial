# SQL — La librairie · Préparation à la certification ENI (Crystal Clear Code)

Cours SQL interactif en français, projet fil rouge unique : la base de données
d'une **librairie en ligne** (`customers`, `categories`, `books`, `orders`,
`order_items`, `payments`). PostgreSQL est le dialecte de référence ; MySQL et
SQLite sont présentés en onglets.

> **État : les 16 chapitres (00 à 15), la cheatsheet de 59 fiches, le diagnostic
> initial, 12 schémas SVG, la matrice de couverture ENI et les scripts SQL des
> trois moteurs sont rédigés.** Les limites de vérification sont listées au §5
> et dans `docs/TEST_REPORT.md`.

## 1. Ouvrir le cours

Décompressez le dossier, puis ouvrez `index.html` dans un navigateur récent
(double-clic). Aucun serveur, aucun CDN, aucune police externe : tout fonctionne
en `file://`. JavaScript est facultatif (onglets, recherche, progression, copie
du code, agrandissement des schémas) ; sans lui, tout le contenu et les
corrections (blocs dépliables) restent lisibles.

## 2. Installer et initialiser la base

Les scripts sont dans `sql/<moteur>/` : `01_setup` (base + utilisateur),
`02_schema`, `03_seed`, `04_reset`. **Attention : `04_reset` supprime les tables
de la librairie. Ne l'exécutez que sur une base d'entraînement.**

### SQLite (3.39 ou plus)

```text
sqlite3 bookstore.db
sqlite> .read sql/sqlite/02_schema.sql
sqlite> .read sql/sqlite/03_seed.sql
sqlite> PRAGMA foreign_keys = ON;     -- à refaire à CHAQUE connexion
```

Réinitialiser : `.read sql/sqlite/04_reset.sql`. SQLite n'a ni `CREATE DATABASE`
ni `CREATE USER`.

### PostgreSQL (16 ou plus)

Ouvrez un terminal à la racine du projet. La commande `psql` doit être
disponible dans le `PATH` et le serveur PostgreSQL doit être démarré sur
`localhost:5432`.

**1. Créer le rôle `bookstore_user` et la base `bookstore` avec un
superutilisateur PostgreSQL existant.** Choisissez la commande correspondant à
votre système et à votre terminal :

<!-- markdownlint-disable MD013 -->
<!-- Keep each copyable OS-specific command on one table row. -->

| Système      | Terminal                  | Commande de création (à exécuter une seule fois)                           |
| ------------ | ------------------------- | -------------------------------------------------------------------------- |
| macOS        | zsh / bash                | `psql -h localhost -U "$USER" -d postgres -f sql/postgresql/01_setup.sql`  |
| Unix / Linux | sh / bash / zsh           | `psql -h localhost -U "$USER" -d postgres -f sql/postgresql/01_setup.sql`  |
| Windows      | PowerShell                | `psql -h localhost -U postgres -d postgres -f sql/postgresql/01_setup.sql` |
| Windows      | Invite de commandes (cmd) | `psql -h localhost -U postgres -d postgres -f sql/postgresql/01_setup.sql` |

<!-- markdownlint-enable MD013 -->

- **macOS / Unix / Linux :** `$USER` contient le nom du compte système. Ces
  commandes supposent qu'un rôle PostgreSQL superutilisateur du même nom existe,
  ce qui est courant avec Homebrew sur macOS, mais pas garanti sous Unix /
  Linux. Si votre superutilisateur est `postgres`, remplacez `-U "$USER"` par
  `-U postgres`.
- **Windows :** `postgres` est le rôle administrateur habituel de l'installateur
  PostgreSQL. Si votre installation utilise un autre rôle, remplacez
  `-U postgres` par `-U NOM_DU_ROLE`. Si ce rôle porte le nom de votre compte
  Windows, vous pouvez utiliser `-U "$env:USERNAME"` dans PowerShell ou
  `-U "%USERNAME%"` dans cmd.
- Si un mot de passe est demandé, saisissez celui du **superutilisateur
  PostgreSQL choisi**.
- `-U` désigne le rôle de connexion ; `-d postgres` désigne la base
  administrative. Un nom de base et un nom de rôle sont distincts : la base
  `postgres` peut exister sans rôle nommé `postgres`.

**2. Créer les tables, puis charger les données avec le rôle d'entraînement
(commandes identiques sur tous les systèmes).**

```text
psql -h localhost -U bookstore_user -d bookstore -f sql/postgresql/02_schema.sql
psql -h localhost -U bookstore_user -d bookstore -f sql/postgresql/03_seed.sql
```

Si un mot de passe est demandé à cette étape, celui défini par `01_setup.sql`
est `change_me_please`.

Réinitialiser :
`psql -h localhost -U bookstore_user -d bookstore -f sql/postgresql/04_reset.sql`
(lancer depuis la racine du projet : `\i` utilise des chemins relatifs).

### MySQL (8.4 LTS visé ; 8.0.31 minimum pour INTERSECT/EXCEPT)

```text
mysql -u root -p < sql/mysql/01_setup.sql
mysql -u bookstore_user -p bookstore < sql/mysql/02_schema.sql
mysql -u bookstore_user -p bookstore < sql/mysql/03_seed.sql
```

Réinitialiser : dans le client, `source sql/mysql/04_reset.sql`.

Remplacez les mots de passe d'exemple (`change_me_please`) hors machine
d'entraînement locale. État attendu après `03_seed` : 7 catégories, 12 clients,
15 livres, 14 commandes, 25 lignes, 10 paiements.

## 3. Régénérer le site (facultatif)

`pip install -r requirements-build.txt`, puis `python3 build_figures.py`
(schémas SVG) et `python3 build.py`. Le générateur **exécute chaque requête «
run » sur SQLite** et affiche le résultat réel ; il enregistre les requêtes dans
`verification/queries.json`.

## 4. Vérifier sur les trois moteurs

`pip install psycopg2-binary pymysql` puis
`python3 verification/check_engines.py` (variables `PG_DSN`, `MYSQL_*`). Le
script rejoue toutes les requêtes sur SQLite, PostgreSQL et MySQL et compare
avec les résultats affichés. **Il réinitialise les bases ciblées : utilisez des
bases d'entraînement.**

## 5. Contrôles réellement effectués (voir `docs/TEST_REPORT.md`)

Exécutés : scripts schéma/seed/reset sur SQLite 3.45.1, PostgreSQL 16.15 et
MySQL 8.0.46 ; 193 requêtes communes rejouées sur les 3 moteurs avec des
résultats identiques (erreurs attendues comprises) ; écarts de dialecte
constatés sur les moteurs ; commandes de rôles et de droits testées ; rendu des
22 pages dans Chromium, sans erreur console ni lien cassé. **Non réalisés** :
MySQL 8.4 (testé sur 8.0.46), PostgreSQL 17/18, mesure WCAG avec un outil, tests
mobile réel/Firefox/Safari/impression, confrontation des seuils de version
(SQLite 3.39, MySQL 8.0.31) aux documentations officielles.

## 6. Idées d'évolution

Éditeur SQL avec exécution réelle (SQLite compilé en WebAssembly, intégré
localement), animations pas à pas des jointures, jeux d'exercices
supplémentaires.

Ce cours est une préparation **non officielle** : il ne reproduit aucune
question ENI ni méthode de notation non publiée.
