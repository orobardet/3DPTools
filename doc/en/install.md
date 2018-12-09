# Installation

*3DPTools* application uses [NodeJS](https://nodejs.org), [MongoDB](https://www.mongodb.com/) and [Redis](https://redis.io/). 
It can be installed manually from source, or using [Docker](https://www.docker.com/) containers (recommended).

## Technical stack

- [Node.js](https://nodejs.org/) (10.x or higher) with [Yarn](https://yarnpkg.com)
- [MongoDB](https://www.mongodb.com/) (3.4 or higher)
- [Redis](https://redis.io/)

## Docker

It is the recommended method to install 3DPTools, because it is the simplest.

Docker images of 3DPtools are available on the [Docker Hub](https://hub.docker.com/r/orobardet/3dptools/) 

- Copy the file [docker-compose.yml](docker-compose.yml) in a directory of your hosting server. 

- Create a file `docker-compose.override.yml` in the same directory, from [docker-compose.override.dist.db-auth.yml](docker-compose.override.dist.db-auth.yml).  

- Configure the application using environment variables in the `docker-compose.override.yml` file for the `3dptools` service. 
  Read the documentation about [configuration](doc/en/configuration) to have more information.

- Run the docker compose stack

### Upgrade

You just have to docker pull the latest version of the 3DPTools image, and then restart the docker compose stack.
Database migration, if needed, will be done automatically. 

## Manually from source

This method should be used only if you can setup using Docker, or for developing on 3DPTools

- Install Node, Mongo, Redis
- Clone the code

```shell
git clone -b '<version_tag>' git@gitlab.com:orobardet/3DPTools.git
cd 3DPTools/src
```

- Install dependencies with Yarn and Bower (Bower does not need to be installe on the system, Yarn will locally install a copy):

```shell
yarn install --production
yarn run bower install --production
```

- Compile style sheets:

```shell
scss -C -f public/stylesheets/style.scss > public/stylesheets/style.css
```

- Copy (or make a symlink) the file `CHANGELOG.md` in the directory `src` :

```shell
cp CHANGELOG.md src/CHANGELOG.md
```

- Copy (or make a symlink) the directory `doc/` in the directory `src` : 

```shell
cp -r doc src/doc
```

- Configure the application by creating a configuration file, or by defining environment variables.    
  Read the documentation about [configuration](doc/en/configuration) to have more information.

- Start the application:

```shell
yarn start -c "<path/to/config.yml>" 
```

### Upgrade

To upgrade the application

- Update the git repository :

```shell
cd 3DPTools
git fetch
git co 'tags/<version_tag>'
```

- Repeat the installation steps for:
 - Installing dependencies using Yarn and Bower
 - Compiling style sheets
 - Copying `CHANGELOG.md` file and `doc/` directory

- Launch database migrations: 

```shell
node bin/cli -c "<path/to/config.yml>" database migrate filaments
```

- Start the application:

```shell
yarn start -c "<path/to/config.yml>" 
```