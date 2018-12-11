'use strict';

module.exports = function(app) {
    const colors = require('colors');
    const mongoose = require('mongoose');
    const when = require('when');
    const sprintf = require('sprintf-js').sprintf;

    /**
     * @constructor
     * @returns {exports}
     */
    this.constructor = function () {
        app.program
            .command('database')
            .alias('db')
            .arguments('<action> [params...]')
            .description('Run maintenance operations on collection of the database')
            .action((action, params, program) => {
                if (this[action] && (typeof this[action] === 'function')) {
                    this[action](params, program);
                } else {
                    app.program.outputHelp(text => {
                        return colors.red('*** Unknown action "' + action + '"\n') + text;
                    });
                    app.cliStop();
                }
            }).on('--help', () => {
            console.log('  Actions:');
            console.log();
            console.log('    migrate: Migrate every items in the collections to the last version, saving them if needed.');
            console.log('    patch: Apply patches to database, which are specific data manipulation scripts.');
            console.log('    resave: Resave every items in the collections. Useful to force schema update on existing data. Try migrate before resave.');
            console.log();
        });

        return this;
    }

    /**
     * Do a resave of each items in a collection of the database
     *
     * @param {string[]} collectionNames - Name of the collection as received on the command line.
     * @param {Command} program - A commander object representing the parsed command line
     *
     * @returns {Promise}
     */
    this.resave = function (collectionNames, program) {
        if (!Array.isArray(collectionNames) || collectionNames.length == 0) {
            console.error(colors.red('*** No collection name given'));
            app.cliStop();
            process.exit(1);
        }

        let itemName = this.modelNameFromCollectionParameter(collectionNames[0]);
        if (app.models[itemName] && (typeof app.models[itemName] === "function") && app.models[itemName].base.Mongoose) {
            let model = app.models[itemName];
            return when(model.countDocuments().exec().then(nbItems => {
                console.log("Re-saving " + nbItems + " " + collectionName + "(s)...");
                let countCharacters = sprintf('%d', nbItems).length;

                when(model.find().exec()).then(item => {
                    let saved = 0;
                    process.stdout.write(sprintf('-> %'+countCharacters+'d/%'+countCharacters+'d - %3f%%   \r', saved, nbItems, saved?Math.round(nbItems/saved*100):0));
                    items.forEach(item => {
                        item.save(err => {
                            if (err) {
                                process.stdout.write("\n");
                                console.error(colors.red(err));
                                app.cliStop();
                            }
                            saved++;
                            process.stdout.write(sprintf('-> %'+countCharacters+'d/%'+countCharacters+'d - %3f%%   \r', saved, nbItems, saved?Math.round(nbItems/saved*100):0));

                            if (saved >= nbItems) {
                                app.cliStop();
                            }
                        });
                    });
                });

            }));
        } else {
            console.error(colors.red('*** No models found for collection "'+collectionNames+'"'));
            app.cliStop();
            process.exit(1);
        }
    };

    /**
     * Migrate of each items in a collection of the database
     *
     * @param {string[]} collectionNames - Name of the collection as received on the command line.
     * @param {Command} program - A commander object representing the parsed command line
     *
     * @returns {Promise}
     */
    this.migrate = function (collectionNames, program) {
        if (!Array.isArray(collectionNames) || collectionNames.length == 0) {
            console.error(colors.red('*** No collection name given'));
            app.cliStop();
            process.exit(1);
        }
        let itemName = this.modelNameFromCollectionParameter(collectionNames[0]);
        if (app.models[itemName] && (typeof app.models[itemName] === "function") && app.models[itemName].base.Mongoose) {
            let model = app.models[itemName];

            let versionFilter = {
                $or: [
                    { _version: { $exists : false } },
                    { _version: null }
                ]
            };
            if (model.currentVersion) {
                versionFilter = {
                    $or: [
                        { _version: { $exists : false } },
                        { _version: null },
                        { _version: { $lt : model.currentVersion } }
                    ]
                };
            }

            return when.all([
                model.countDocuments().exec(),
                model.countDocuments(versionFilter).exec()
            ]).spread((nbItems, nbItemsToMigrate) => {
                if (nbItemsToMigrate) {
                    console.log("Migrating " + nbItemsToMigrate + " " + itemName + "(s) out of " + nbItems + "...");
                    let countCharacters = sprintf('%d', nbItemsToMigrate).length;

                    when(model.find(versionFilter).exec()).then(items => {
                        let processed = 0;
                        let saved = 0;
                        process.stdout.write(sprintf('-> %' + countCharacters + 'd/%' + countCharacters + 'd - %3f%%   \r', processed, nbItemsToMigrate, processed ? Math.round(nbItemsToMigrate / processed * 100) : 0));
                        let savePromises = items.map(item => {
                            let promise = false;
                            if (item.migrate()) {
                                item.setInMigration();
                                saved++;
                                promise = item.save();
                            }
                            processed++;
                            process.stdout.write(sprintf('-> %' + countCharacters + 'd/%' + countCharacters + 'd - %3f%%   \r', processed, nbItemsToMigrate, processed ? Math.round(nbItemsToMigrate / processed * 100) : 0));
                            return promise;
                        });
                        Promise.all(savePromises).then(results => {
                            app.cliStop();
                        });

                        console.log("\n" + saved + " " + itemName + "(s) migrated.");
                    });
                } else {
                    console.log("Migrating " + nbItemsToMigrate + " " + itemName + "(s) out of " + nbItems + "...");
                    app.cliStop();
                }

            });
        } else {
            console.error(colors.red('*** No models found for collection "'+collectionNames+'"'));
            app.cliStop();
            process.exit(1);
        }
    };

    /**
     * Run database patch scripts
     *
     * @param {string[]} patches - Name of the patches to apply
     * @param {Command} program - A commander object representing the parsed command line
     *
     * @returns {Promise}
     */
    this.patch = async function (patches, program) {
        // Only keep non empty patches names
        patches = patches.filter(str => str.trim() != "");

        // Lazy loading of patches
        const consign = require('consign');
        consign({
            verbose: false
        }).include('models/patches')
            .into(app);

        // Is there any optional patches?
        if (!app.models.patches || !app.models.patches.optionals) {
            console.error(colors.red('*** No patches available'));
            app.cliStop();
            process.exit(1);
        }

        // Check if all patches exists
        let validPatches = [];
        for (let patch of patches) {
            if (app.models.patches.optionals[patch] && (typeof app.models.patches.optionals[patch] === "function")) {
                validPatches.push(patch)
            } else {
                console.error(colors.yellow(`Invalid patch "${patch}"`));
            }
        }
        // At least one existing patch should be given
        if (validPatches.length == 0) {
            console.error(colors.red('*** No patches given'));
            app.cliStop();
            process.exit(1);
        }

        // Run each patch sequentially
        for (let patch of validPatches) {
            console.log(`Running patch "${patch}":`);
            await app.models.patches.optionals[patch](app);
        }

        app.cliStop();
    };

    /**
     * Convert a collection name, received on the command line, to the model name
     *
     * Assume the model name is a lowercase version of the collection name,
     * and truncated from the last 's' character if any.
     *
     * There is no validation of the computed model name.
     *
     * @param {string} collectionName - Name of the collection as received on the command line.
     *
     * @returns {string} The name of the model
     */
    this.modelNameFromCollectionParameter = function (collectionName) {
        return String(collectionName).toLowerCase().replace(/s$/, '');
    };

    return this.constructor();
};