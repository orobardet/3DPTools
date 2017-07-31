# 3DPTools

[![build status](https://gitlab.com/orobardet/3DPTools/badges/master/build.svg)](https://gitlab.com/orobardet/3DPTools/commits/master) 
[![coverage report](https://gitlab.com/orobardet/3DPTools/badges/master/coverage.svg)](https://gitlab.com/orobardet/3DPTools/commits/master)

Web-based 3DPrinting tools

# Requirements

## Run

- [NodeJS](https://nodejs.org/) (7.x) with npm
- ImageMagick
- [MongoDB](https://www.mongodb.com/) (3.2)
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

A [docker-compose.yml](docker-compose.yml) file is provided to run this image using Docker. It start a Redis and a MongoDB (both in very basic and minimalist mode).

So you can start a instance with just :
```shell
docker-compose up -d
```

Once start, you can access to 3DPTools using the url http://localhost:3000/. If no valid data is already found, the 3DPTools will start in setup mode. Just follow the instructions.

By default, the docker-compose environment will create a `docker-volumes` folder that will hold data for persitance: you can stop, kill and restart the Docker environment and 
still retreive all your data, as long as the `docker-volumes` is kept.

> Backup note: copying the `docker-volumes` directory to make a backup is acceptable **only if done when the Docker environment is stopped**. To make a live backup (which is 
> certainly what you want), please use [the backup features of MongoDB](https://docs.mongodb.com/v3.2/core/backups/) directly

You can change some parameters of the docker-compose environment by creating a `docker-compose.override.yml` file. Common changes can be :
- the access port: override the `ports` mapping of the `3dptools` service
- the mapped volumes for data: override the `volumes` of the `mongo` service
- start 3dptools in development mode: add the environment variable `NODE_ENV=dev` in the `3dptools` service

Some `docker-compose.override.yml` sample are provided in the files `docker-compose.override.dist.*.yml`

# FAQ

## Error `req.flash() requires sessions`

Is Redis installed, running and correctly configured in 3DPTools?
