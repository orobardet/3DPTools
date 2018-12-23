# Installation

L'application *3DPTools* utilise [NodeJS](https://nodejs.org), [MongoDB](https://www.mongodb.com/) et [Redis](https://redis.io/). 
Elle peut être installé à la main à partir des sources, ou bien via des conteneurs [Docker](https://www.docker.com/).

## Stack technique

- [Node.js](https://nodejs.org/) (10.x ou supérieur) avec [Yarn](https://yarnpkg.com)
- [MongoDB](https://www.mongodb.com/) (3.6 ou supérieur)
- [Redis](https://redis.io/)

## Docker

C'est la méthode recommandée pour installer 3DPTools, car la plus simple.

Des images docker de l'application 3DPTools sont disponible sur le [Hub Docker](https://hub.docker.com/r/orobardet/3dptools/) 

- Copier le fichier [docker-compose.yml](docker-compose.yml) dans un repertoire de votre hébergement.

- Créer un fichier `docker-compose.override.yml` dans le même répertoire, en vous inspirant de [docker-compose.override.dist.db-auth.yml](docker-compose.override.dist.db-auth.yml).  

- Configurer l'application en utilisant des variables d'environnement dans le fichier `docker-compose.override.yml` pour le 
service `3dptools`. Voir la doc sur [la configuration](doc/fr/configuration) pour plus d'information.

- Lancer la stack docker compose

### Mise à jour

Il suffit de faire un docker pull de la dernière version de l'image 3DPTools, puis de redémarrer la stack docker compose.  
Les migrations de la base de données, si nécessaire, seront réalisée automatiquement.

## A partir des sources

Cette méthode est à utiliser si vous n'avez pas la possibilité de mettre en oeuvre Docker, ou pour développer 3DPTools.

- Installer Node, Mongo, Redis
- Cloner le code

```shell
git clone -b '<version_tag>' git@gitlab.com:orobardet/3DPTools.git
cd 3DPTools/src
```

- Installer les dépendances avec Yarn et Bower (bower n'a pas besoin d'être installé sur le système, Yarn l'installe localement) :

```shell
yarn install --production
yarn run bower install --production
```

- Compiler les feuilles de style :

```shell
scss -C -f public/stylesheets/style.scss > public/stylesheets/style.css
```

- Copier (ou faire un lien symbolique) le fichier `CHANGELOG.md` dans le répertoire `src` :

```shell
cp CHANGELOG.md src/CHANGELOG.md
```

- Copier (ou faire un lien symbolique) le répertoire `doc/` dans le répertoire `src` : 

```shell
cp -r doc src/doc
```

- Configurer l'application, en créant des fichiers de configuration ou en définissant des variables d'environnement.  
  Voir la doc sur [la configuration](doc/fr/configuration) pour plus d'information.

- Lancer l'application :

```shell
yarn start -c "<path/to/config.yml>" 
```

### Mise à jour

Pour mettre à jour l'application :

- Mettez à jour le dépôt git :

```shell
cd 3DPTools
git fetch
git co 'tags/<version_tag>'
```

- Répétez les opérations d'installation pour :
 - Installer les dépendances Yarn et Bower
 - Compiler les feuilles de style
 - Copier le `CHANGELOG.md` et le répertoire `doc/`

- Lancer les migration de la basse de donnée : 

```shell
node bin/cli -c "<path/to/config.yml>" database migrate filaments
```

- Lancer l'application

```shell
yarn start -c "<path/to/config.yml>" 
```