#!/bin/bash

# exit on any error
set -e

# wait for services (db, cache) to be ready
node bin/wait-services
# run database migration
node bin/cli database migrate filaments
# start the application
yarn start