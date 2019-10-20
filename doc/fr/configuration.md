# Configuration de l'application

Cette application peut être configurée en spécifiant des paramètres au démarrage. La plupart des paramètres ont des 
valeurs par défaut. Ceux qui n'en ont pas correspondent à des fonctionnalités désactivées par défaut (par exemple 
l'envoi d'email), ou qui nécessitent des valeurs spécifiques à l'environnement (par exemple Redis ou MongoDB) et sont donc 
des paramètres obligatoires.

Il est recommandée de bien spécifier des valeur à tous les paramètres nécessaires, afin que l'application corresponde à 
vos besoins, soit sécurisée, et que toutes les fonctionnalités voulues soient activée.

Il y a 2 moyens de définir les paramètres de configuration de l'application :
- en utilisant un fichier (`YAML`) de configuration
- avec des variables d'environnement

Lorsque l'application est lancée dans un conteneur Docker, les variables d'environnement sont fortement recommandées (en 
fait, bien qu'il soit possible d'utiliser un fichier de configuration en mode Docker, ça demande un peu de bricolage et 
ce n'est pas officiellement supporté).

Quand l'application est lancée directement, vous pouvez choisir la méthode qui vous convient. Mais utiliser un fichier 
de configuration sera probablement plus simple.

# Méthodes de configuration

## Fichier de configuration

Il faut créer un fichier `.yml`, et y ajouter tous les paramètres de configuration que vous voulez définir.

Tous les paramètres de configurations possibles et leur valeur par défaut sont disponibles dans le fichier 
[src/config/default.yml](src/config/default.yml).

> Ne **PAS** modifier ce fichier ! En créer un nouveau contenant les paramètres que vous voulez définir, et qui sera
> passé en paramètre en démarrage de l'application. 

Certains de ces paramètres ne sont pas n'ont pas beaucoup d'utilité à être redéfinis. Vous n'avez pas besoin de déclarer 
tous les paramètres dans votre fichier de configuration, ajoutez juste ceux qui vous intéressent, mais vous devez 
respecter la structure des paramètres.   
Par exemple, si vous voulez configurer un host spécifique pour Redis et MongoDb, avec un utilisateur et un mot de passe 
pour ce dernier, et voulez configurer un serveur SMTP pour l'envoi d'email, créez un fichier `myconfig.yml` contenant :

```yaml
redis:
  host: 'redis.host'
database:
  host: 'mongo.host'
  user: '3dptools'
  pass: 'secret_password'
mail:
  smtp:
    host: 'smtp.mailserver.org'
``` 

> Attention à la syntaxe du YAML, qui est assez stricte: **2 espaces** pour l'indentation (pas 3, pas 4, pas de tabulation),
> pas d'espace entre le nom d'une clé et les ':' qui suivent, mais un espace après ces ':'.

Une fois le fichier créé, vous pouvez utiliser l'option de ligne de commande `-c` pour démarrer l'application en lui 
indiquant votre fichier de configuration à utiliser : 

```shell
yarn start -c path/to/myconfig.yml
```

## Variables d'environnement

L'utilisation des variables d'environnement obéit à une règle simple : chaque paramètres dans le fichier YAML de 
configuration correspond à une variable d'environnement dont le nom est la concatenation de chaque clés YAML depuis la 
racine, joins avec `__` (2 underscores).

Donc par exemple, la même configuration que l'exemple ci-dessus avec des variables d'environnement sera :

```shell
redis__host="redis.host"
database__host="mongo.host"
database__user="3dptools"
database__pass="secret_password"
mail__smtp__host="smtp.mailserver.org"
```

> Les noms des variables d'environnement sont **sensibles à la casse**.

# Paramètres de configuration

Cette section liste tous les paramètres de configuration disponible avec une description de leur utilisation.

Tous les exemples sont présentés en utilisant le format d'un fichier de configuration YAML en partant de la racine 
(vous pouvez donc les copier/coller par bloc dans votre fichier de configuration).  
Tous les valeurs utilisées dans les exemples sont les valeurs par défaut.  
Combiner les exemples selon vos besoins, et ils peuvent tous être convertis au format variable d'environnement si 
nécessaire.

## Redis

Redis est utilisé pour stocké les données de session, ainsi que pour du cache. Son usage n'est pas optionnel, il doit 
y avoir un Redis pour que l'application fonctionne.

```yaml
redis:
  host: localhost
  port: '6379'
```

Le bloc de configuration principal est `redis`.

- `host` *Requis* (string) Hostname du serveur Redis.
- `port` *Requis* (string|int) Port du serveur Redis. La valeur par défaut est le port Redis standard.

## Base de données

La base de donnée utilisée est MongoDB, **>= v3.6**. Compatible avec la version 4.0 

```yaml
database:
  host: localhost
  port: '27017'
  name: 3dptools
  user: 3dptools
  pass: 3dpt
  connectOptions: {}
```

Le bloc de configuration principal est `database`.

- `host` *Requis* (string) Hostname du serveur MongoDB.
- `port` *Requis* (string|int) Port du serveur MongoDB. La valeur par défaut est le port MongoDB standard.
- `name` *Requis* (string) Nom de la base MongoDB qui sera utilisée pour stocker les données de 3DPTools. Sera créée par l'application si elle n'existe pas.
- `user` (string) Nom d'utilisateur pour se connecter au server MongoDB, si nécessaire. *Il est recommandé d'activer l'authentification sur le serveur MongoDB*. 
- `pass` (string) Mot de passe pour se connecter au server MongoDB, si nécessaire.  *Il est recommandé d'activer l'authentification sur le serveur MongoDB*. 
- `connectOptions` (object) Permet de passer des options de connexion directement au driver client MongoDB.

## HTTP

Paramètre du serveur HTTP.

```yaml
http:
  compression: true
```

Le bloc de configuration principal est `http`.

- `compression` (boolean) Active la compression des réponses HTTP.

## Session

Paramètres pour configurer les sessions. 

```yaml
session:
  name: 3dptools
  secret:
    - 9729dcac-5df4-46e7-acd5-0789ce17f0f3
    - 3e9c7e2e-469f-4ce0-97b7-f424ae7020ac
    - ad89f8fa-9653-4ba4-836c-86d147eb1796
    - 72d01cca-1824-4dd0-97f8-f2eef1dda21d
    - 068ba006-1cd2-473e-ae39-506c20fa2dc1
```

Le bloc de configuration principal est `session`.

- `name` (string) Le nom de session, qui sera le nom du cookie. Vous pouvez conserver la valeur par défaut.
- `secret` *Requis* (array of strings) Une liste de chaîne de caractères pour chiffrer les données de sessions. **Doit rester secret**. *Il est très fortement recommandé de remplacer les valeurs par défaut par des valeurs spécifiques à votre installation*. Des [UUID](https://www.uuidgenerator.net/) sont de bonnes valeurs. **<u>Ne PAS utiliser les valeurs de l'exemple ci-dessus</u>**.

## Langue

Pour configurer la localisation.

```yaml
language:
  cookieName: locale
```

Le bloc de configuration principal est `language`.

- `cookieName` (string) Nom du cookie qui contiendra la langue choisie par l'utilisateur.

## Envoyer un email

Certaine fonctionnalités de l'application ont besoin d'envoyer des emails. L'envoie d'email nécessite d'être configuré.  
Par défaut il n'y a pas de configuration pour l'envoie d'email.

Dans le cas où aucune configuration valide n'est présente, l'application désactivera toutes les fonctionnalité nécessitant 
l'envoie d'email (récupération de compte et changement de mot de passe par exemple).

Pour le moment, une seule méthode de transport est reconnue : SMTP.

So vous avez besoin de tester si votre configuration fonctionne, il y a un bouton pour tester l'envoie d'un email dans 
l'interface de l'application, dans la section "Administration" -> "Afficher la configuration".

```yaml
mail:
  enabled: true
  debug: false
  verboseDebug: false
  testConnection: true
  smtp:
    host: ''
    port: '587'
    secure: false
    needAuth: false
    user: ''
    pass: ''
  from:
    name: 3DPTools
    mail: ''
```

Le bloc de configuration principal est `mail`.

- `enabled` (boolean) Active ou non la capacité à envoyer des emails, et donc toutes les fonctionnalités qui en dépendent. Si `true` mais qu'il n'y a pas de configuration valide et fonctionnelle, l'application forcera ce paramètre à `false` au démarrage.
- `debug` (boolean) Active les messages de debug pour l'envoie des email sur la console (stdout, logs docker). Utile pour corriger des configurations qui ne fonctionnent pas. 
- `verboseDebug` (boolean) Si '`debug` est activé, mettre ce paramètre à `true` écrira encore plus de message de debug.
- `testConnection` (boolean) Si activé, au démarrage l'application tentera de se "connecter" au mécanisme de transport configuré (pour SMTP, elle essaiera de se connecter au serveur SMTP, mais n'enverra *aucun* email). Si le test échoue, l'application forcera le paramètre `enabled` à `false`.
- `smtp` *Requis* Configure le transport SMTP.
  - `host` *Requis*(string) Hostname du serveur SMTP.
  - `port` *Requis* (string|int) Port du serveur SMTP.
  - `secure` (boolean) Mettre à `true` pour activer la connexion sécurisée (SSL) au serveur SMTP.
  - `needAuth` (boolean) Mettre à `true` si le serveur SMTP requière une authentification, et définir les paramètres `user` et `pass`.
  - `user` (string) Uniquement si l'authentification SMTP est activée, nom d'utilisateur (login) à utiliser.
  - `pass` (string) Uniquement si l'authentification SMTP est activée, mot de passe à utiliser.
- `from` *Requis* Identité que l'application utilisera comme expéditeur (*From:*) de tous les emails.
  - `name` *Requis* (string) Nom de l'expéditeur
  - `mail` *Requis* (string) Adresse email de l'expéditeur. 

> Merci de noter que **beaucoup** de serveurs d'envoie de mail **imposent**  que l'adresse email de l'expéditeur existe (ou au moins que le domaine existe, avec un serveur d'email qui répond). Donc utiliser une véritable adresse email.

## Supervision

Vous pouvez activer ici les fonctionnalités de supervision, comme l'export de métriques pour [Prometheus](https://prometheus.io/).

```yaml
monitoring:
  prometheus:
    enabled: true
```

Le bloc de configuration principal est `monitoring`.

- `prometheus` Configure le point de collecte de métriques pour Prometheus. Il sera accessible à l'adresse `http://your.3dptools.fqdn:PORT/metrics`.
  - `enabled` (boolean) Active le point de collecte de métrique pour Prometheus.

## Comptes utilisateurs

```yaml
accounts:
  recovery:
    ttl: 24
    tokenLength: 32
```

Le bloc de configuration principal est `accounts`.
  
- `recovery` Configure la fonctionnalité de récupération de compte ("J'ai oublié mon mot de passe")
  - `ttl` (int) En heures. Nombre d'heure au bout desquelles une demande de récupération de compte expirera.
  - `tokenLength` (int) Longueur en octets de token de récupération unique et aléatoire généré pour la récupération (il est utilisé dans le lien envoyé par mail à l'utilisateur pour récupérer son compte). 

## Filaments

```yaml
filament:
  leftThresholds:
    warning: 35
    danger: 10
  index:
    lastUsedCount: 5
    almostFinishedPercentThreshold: 25
```

Le bloc de configuration principal est `filament`.

- `leftThresholds` Seuils pour la quantité de matières restante par filament.
  - `warning` (int) Seuil en pourcentage de filament restant en dessous duquel un filament sera considéré comme bas (couleur orange) 
  - `danger` (int) Seuil en pourcentage de filament restant en dessous duquel un filament sera considéré comme très bas (couleur rouge)
- `index` Paramètres pour la page d'accueil.
  - `lastUsedCount` (int) Nombre de filament récemment utilisé à afficher.
  - `almostFinishedPercentThreshold` (int) Pourcentage de filament restant en dessous duquel un filament sera affiché dans la section "Presque terminés".

## Divers

```yaml
upload:
  tmpPath: tmp/uploads
```

- `upload.tmpPath` (string) Chemin où l'application déposera temporairement les fichiers uploadés par l'utilisateur (images et autres pièces jointes), avant leur stockage définitif. 
