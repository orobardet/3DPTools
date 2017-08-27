# 3DPTools

[![build status](https://gitlab.com/orobardet/3DPTools/badges/master/build.svg)](https://gitlab.com/orobardet/3DPTools/commits/master) 
[![coverage report](https://gitlab.com/orobardet/3DPTools/badges/master/coverage.svg)](https://gitlab.com/orobardet/3DPTools/commits/master)

Web-based 3DPrinting tools

# Requirements

## Run

- [NodeJS](https://nodejs.org/) (8.x) with npm
- ImageMagick
- [MongoDB](https://www.mongodb.com/) (3.4, **with [3.4 Feature compatibility enabled](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/)**)
- [Redis](http://redis.io/)
- Any OS where the previous requirements runs. Has been proven to work on Linux (Ubuntu and Debian tested) and Windows (Windows 10 tested).
- Of course MongoDB and Redis does not needs to run on the same host as the Node app.
- Docker (only if run as Docker containers)

## Dev/build

- Bower (`sudo npm install -g bower`)
- build-essential (as know on Debian-like OS, or any other equivalent on your OS ; needed by npm to build some extensions)
- SASS (`sudo apt-get install ruby-sass`)
- Any OS where the previous requirements runs. Has been proven to work for development on Linux (Ubuntu and Debian tested) and Windows (Windows 10 tested).
- Docker (only to build docker image or run the development environment as Docker containers)

# Setup and run

## Manual

First, you need to get the code:

```shell
git clone git@gitlab.com:orobardet/3DPTools.git
cd 3DPTools/src
```

Then prepare it:

```shell
npm install
bower install
scss -f public/stylesheets/style.scss > public/stylesheets/style.css
```

And finally run it:

```shell
NODE_ENV=production npm start
```
> **Note:** When running the application in a production environnement, you **MUST** set the environment variable 
> `NODE_ENV` to something different than `development` (which is the default value for ExpressJS if not set). 
> In `development` environment mode, the application will:
> - Show every details on screen (i.e. on the web pages) when an error occurs. This can be a **SECURITY** issue.
> - Run in debug mode, where caching and pre-compilation are not fully enabled. This can lead to **PERFORMANCE** issues.

## Using Docker

> Building the docker image of this application require at least **Docker v17.05** (multi-stage build)

A [docker-compose.yml](docker-compose.yml) file is provided to run this image using Docker. 
It start a Redis and a MongoDB (both in very basic and minimalist mode).

So you can start a instance with just :
```shell
docker-compose up -d
```

Once start, you can access to 3DPTools using the url http://localhost:3000/. 
If no valid data is already found, the 3DPTools will start in setup mode. Just follow the instructions.

By default, the docker-compose environment will create a `docker-volumes` folder that will hold data for persitence: 
you can stop, kill and restart the Docker environment and still retreive all your data, as long as the `docker-volumes` is kept.

> Backup note: copying the `docker-volumes` directory to make a backup is acceptable 
> **only if done when the Docker environment is stopped**. To make a live backup (which is certainly what you want), 
> please use [the backup features of MongoDB](https://docs.mongodb.com/v3.2/core/backups/) directly

You can change some parameters of the docker-compose environment by creating a `docker-compose.override.yml` file. Common changes can be :
- the access port: override the `ports` mapping of the `3dptools` service
- the mapped volumes for data: override the `volumes` of the `mongo` service
- start 3dptools in development mode: add the environment variable `NODE_ENV=dev` in the `3dptools` service

Some `docker-compose.override.yml` sample are provided in the files `docker-compose.override.dist.*.yml`

# Configuration

This application can be configured by giving it some parameters on startup. Most of the settings have default values. 
Those who don't correspond to disabled feature by default (e.g. sending email), or requires specific environment configuration 
(e.g. Redis and MongoDB on localhost without authentification). 

It is recommended to configure the application in order to fit your needs, secure your setup and enable all features.

There is mainly 2 ways to pass configuration settings to the application:
- using a (`JSON`) configuration file
- with environment variables

When running in a Docker container, environment variables are highly recommended (actually, although it's possible to 
use a configuration file for a Docker container, it can be a bit tricky and it's not supported).

When running directly in the host, you can choose whatever method you prefer. But the configuration file may be easier.

## Configuration file

You need to create a `.json` file, and add any configuration settings you want to override.

All available configuration settings can be found in the internal default configuration file: [src/config/default.json](src/config/default.json).

> Do **NOT** modify this file! Create a new one with your overrided settings, that will be loaded when starting the application.

Some of theses settings are not interesting to override. You don't need to use all the settings in your configuration file, 
just add the one you need, but you must respect the structire.  
For example, if you want to configure a specific host for Redis and MongoDB, with a user and password for the latter, 
and set a SMTP server host for sending emails, create a `myconfig.json` file containing: 

```json
{
  "redis": {
    "host": "redis.host"
  },
  "database": {
    "host": "mongo.host",
    "user": "3dptools",
    "pass": "secret_password"
  },
  "mail": {
    "smtp": {
      "host": "smtp.mailserver.org"
    }
  }
}
``` 

> Beware of the syntax of JSON, which not as flexible as pure javascript: no tailling ',' after the last element of objects 
> or array, every object keys must be quoted (").

Once the file is created, you can use the `-c` option to start the application and have it use your configuration file:

```shell
npm start -c path/to/myconfig.json
```

## Environment variables

Using environment variables is simple: each settings in the JSON configuration file correspond to a variable whose name 
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

# FAQ

## Error `req.flash() requires sessions`

Is Redis installed, running and correctly configured in 3DPTools?
