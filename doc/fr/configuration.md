# Configuration de l'application

Cette application peut être configurée en spécifiant des paramètres au démarrage. La plupart des paramètres ont des 
valeurs par défaut. Ceux qui n'en ont pas correspondent à des fonctionnalités désactivées par défaut (par exemple 
l'envoi d'email), ou qui nécessitent des valeur spécifique à l'environnement (par exemple Redis ou MongoDB) et sont donc 
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

Some of theses settings are not interesting to override. You don't need to use all the settings in your configuration file, 
just add the one you need, but you must respect the structire.  
For example, if you want to configure a specific host for Redis and MongoDB, with a user and password for the latter, 
and set a SMTP server host for sending emails, create a `myconfig.yml` file containing: 

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

> Beware of the syntax of YAML, which is pretty strict: **2 spaces** intendation (not 3, not 4, not tab), no space between a key name and the following colon, a space after this colon.

Once the file is created, you can use the `-c` option to start the application and have it use your configuration file:

```shell
yarn start -c path/to/myconfig.yml
```

## Variables d'environnement

Using environment variables is simple: each settings in the YAML configuration file correspond to a variable whose name 
is the concatenation of each key from the top of the structure, joined by `__` (2 underscores).

So for example, the same configuration than the example above can be set using environment variables like this:

```shell
redis__host="redis.host"
database__host="mongo.host"
database__user="3dptools"
database__pass="secret_password"
mail__smtp__host="smtp.mailserver.org"
```

> The variable names are **case-sensitive**.

# Paramètres de configuration

This section will list all available configuration settings with description of how to use them.  

All examples use the YAML syntax, as root from a `.yml` file (e.g.: you can copy paste the block as is in you config file).  
All values used in the example are the default values.
Merge them smartly and convert them in environment variables name if needed.  

## Redis

Redis is used to store session data, as well as cache storage. It is required for the application to run.

```yaml
redis:
  host: localhost
  port: '6379'
```

The main configuration block is `redis`.

- `host` *Required* (string) Hostname of the Redis server
- `port` *Required* (string|int) Port of the Redis server. Default value will fit most users.

## Base de données

The database used is MongoDB, **>= v3.4**. 

```yaml
database:
  host: localhost
  port: '27017'
  name: 3dptools
  user: 3dptools
  pass: 3dpt
  connectOptions: {}
```

The main configuration block is `database`.

- `host` *Required* (string) Hostname of the MongoDB server
- `port` *Required* (string|int) Port of the MongoDB server
- `name` *Required* (string) Name of the MongoDB to use to store 3DPTools data. Will be created if not exists
- `user` (string) Username to connect to the MongoDB server, if needed. *It is recommended to enable auth on the MongoDb server* 
- `pass` (string) Password to connect to the MongoDB server, if needed. *It is recommended to enable auth on the MongoDb server* 
- `connectOptions` (object) Allow to pass some specific connection options to the MongoDB client driver

## Session

Settings to configure web session. 

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

The main configuration block is `session`.

- `name` (string) Then name of the session to use, which is the cookie name. You may safely leave the default value.
- `secret` *Required* (array of strings) A list of strings used to encrypt session data. *It is highly recommended to replace the default value by specific one for your instance*. [UUID](https://www.uuidgenerator.net/) a great as values. **Do NOT use the value from the example above**.

## Langue

Used to configure localization.

```yaml
language:
  cookieName: locale
```

The main configuration block is `language`.

- `cookieName` (string) Name of the cookie that will contains the locale selected by the user.

## Envoyer un email

Some of the feature within the application needs to send email. And sending emails needs a specific configuration.   
By default there is no configuration.

In case no valid email configuration is found, the application will disable all features requiring to send emails (account recovery)

For now, only one transport method is supported: SMTP.

If you need to test your configuration, there is a button to send a test email on the WebUI, in admin -> show configuration section.

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

The main configuration block is `mail`.

- `enabled` (boolean) Enable or not the mail sending capabilities, and so all the dependent features. If `true` but no valid and working configuration is defined, the application will force this settings to `false` on startup.
- `debug` (boolean) Enable debug message on console. Helpfull to fix non working email configuration. 
- `verboseDebug` (boolean) If '`debug` is enabled, setting this to `true` will log even more message on console.
- `testConnection` (boolean) If enabled, on startup the application will try to "connect" using the transport method (for SMTP, it will try to connect to the SMTP serveur, but *not* to send an email). If the test failed, the application will force the `enabled` setting to `false`.
- `smtp` *Required* Configure the SMTP transport
  - `host` *Required*(string) Hostname of the SMTP server
  - `port` *Required* (string|int) Port of the SMTP server
  - `secure` (boolean) Set to `true` to enable secured (SSL) connection to the SMTP server
  - `needAuth` (boolean) Set to `true` it the SMTP server need authentification, and set values to `user` and `pass`.
  - `user` (string) Only if authentification is enabled, the username (login) for auth
  - `pass` (string) Only if authentification is enabled, the password for auth
- `from` *Required* Identity the application will use as sender (*From:*) of all emails
  - `name` *Required* (string) Name of the sender
  - `mail` *Required* (string) email address of the sender.  

> Please not that **many** email servers **require** the sender email address to exists (or at least the domain, with a valid and responding email server). So use a real email address.  

## Supervision

You can enable some monitoring feature, like a Prometheus metrics endpoint.

```yaml
monitoring:
  prometheus:
    enabled: true
```

The main configuration block is `monitoring`.

- `prometheus` Configure Prometheus metrics endpoint. It will be accessible on the `http://your.3dptools.fqdn:PORT/metrics` URL.
  - `enabled` (boolean) Enable the Prometheus metrics endpoint

## Comptes utilisateurs

```yaml
accounts:
  recovery:
    ttl: 24
    tokenLength: 32
```

The main configuration block is `accounts`.
  
- `recovery` Configure the account recovy feature ("I forgot my password")
  - `ttl` (int) In hours. Number of hours after which the account recovery request will expire.
  - `tokenLength` (int) Lneght in byte of the random unique recovery token generated for the recovery (will be used in the link sent to the user to recover his account). 

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

The main configuration block is `filament`.

- `leftThresholds`
  - `warning` (int) Threshold in percentage under which a filament will be consider as low level (orange color) 
  - `danger` (int) Threshold in percentage under which a filament will be consider as very low level (red color)
- `index` Settings for the homepage
  - `lastUsedCount` (int) Number of last used filaments
  - `almostFinishedPercentThreshold` (int) Percentage under which a filament is consider as "almost finished".

## Divers

```yaml
upload:
  tmpPath: tmp/uploads
```

- `upload.tmpPath` (string) Path where the application will temporary store the file uploaded by the user (images and other attachements) 
