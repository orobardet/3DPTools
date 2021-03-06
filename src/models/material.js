'use strict';

module.exports = function (app) {
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    const Filament = app.models.filament;

    let materialSchema = new Schema({
        name: String,
        description: String,
        parentMaterial: {
            type: Schema.Types.ObjectId,
            ref: 'Material',
            index: true
        },
        density: Number,
        headTemp: {
            min: Number,
            max: Number
        },
        bedTemp: {
            min: Number,
            max: Number
        },
        printingSpeed: { // in mm/s
            min: Number,
            max: Number
        },
        files: [{
            id: Schema.Types.ObjectId,
            displayName: String,
            fileName: String,
            mimeType: String,
            size: Number,
            data: Buffer
        }],
        _version : { type: Number }
    });

    /**
     * Current schema version
     *
     * @type {number}
     *
     * <b>Version history:</b>
     * - 1: printing speed range
     * - 2: master filament
     */
    materialSchema.statics.currentVersion = 2;

    materialSchema.methods.setInMigration = function() {
        this.inMigration = true;
    };

    materialSchema.methods.isInMigration = function() {
        return this.inMigration;
    };

    materialSchema.methods.resetInMigration = function() {
        delete this.inMigration;
    };

    materialSchema.pre('save', function(next) {
        // No pre save during migration, to avoid updating unwanted data
        if (this.isInMigration()) {
            this.resetInMigration();
            next();
            return;
        }

        this._version = materialSchema.statics.currentVersion;

        next();
    });

    materialSchema.methods.migrate = function() {
        let migrated = false;
        if (app.models.migrate && app.models.migrate.material) {
            for (version of Object.keys(app.models.migrate.material)) {
                let migrator = new app.models.migrate.material[version](this, materialSchema.statics.currentVersion);

                if (migrator.needMigration && typeof migrator.needMigration === 'function' && migrator.needMigration()) {
                    migrated = true;
                    if (migrator.migrate && typeof migrator.migrate === 'function') {
                        migrator.migrate();
                    }
                }
            }
        }

        this._version = materialSchema.statics.currentVersion;

        return migrated;
    };

    materialSchema.methods.addFile = function(file) {
        this.files.push(file);
    };

    materialSchema.methods.getFile = function (id) {
        if (this.files && this.files.length) {
            for (let i = 0; i < this.files.length; i++) {
                if (this.files[i]._id.toString() === id) {
                    return this.files[i];
                }
            }
        }

        return false;
    };

    materialSchema.methods.deleteFile = function (id) {
        if (this.files && this.files.length) {
            let deleteIndex = -1;
            for (let i = 0; i < this.files.length; i++) {
                if (this.files[i]._id.toString() === id) {
                    deleteIndex = i;
                    break;
                }
            }

            if (deleteIndex >= 0) {
                this.files.splice(deleteIndex, 1);
                return true;
            }
        }

        return false;
    };

    materialSchema.pre('remove', async function(next) {
        if (await Filament.find({material: this.id}).countDocuments().exec() > 0) {
            return next(new Error("Material is being used by some filaments."));
        } else if (await this.getChildCount() > 0) {
            return next(new Error("Material has variants."));
        } else {
            return next();
        }
    });

    materialSchema.methods.getChildCount = async function() {
        return await this.constructor.find({parentMaterial: this.id}).countDocuments().exec();
    };

    materialSchema.statics.list = async function (options) {
        options = Object.assign({
            rootMaterials: true,
            childMaterials: true,
            treeList: false,
            countFilaments: false,
            locale: null
        }, options);

        options.locale = options.locale || app.getCurrentLocale();

        let filters = {};
        let collationOptions = {
            locale: options.locale,
            numericOrdering: true
        };

        let aggregationPipeline = [];

        let matchPipeline = null;
        // Tree mode will return root and child material, ignoring dedicated options
        if (options.tree === true || options.childMaterials === false) {
            matchPipeline = {
                $match: { parentMaterial: null }
            };
        } else {
            if (options.rootMaterials === false) {
                matchPipeline = {
                    $match: { parentMaterial: { $ne: null } }
                };
            }
        }
        if (matchPipeline) {
            aggregationPipeline.push(matchPipeline);
        }

        aggregationPipeline.push({
            $lookup: {
                from: 'materials',
                localField: '_id',
                foreignField: 'parentMaterial',
                as: 'variants'
            }
        });
        aggregationPipeline.push({
            $addFields: {
                childCount: {$size: '$variants'}
            }
        });
        aggregationPipeline.push({ $sort: { name: 1, 'variants.name': 1 }});

        let results = await this.aggregate(aggregationPipeline).collation(collationOptions).exec();

        if (options.countFilaments && results.length) {
            let filamentsCounts = await Filament.getCountPerMaterialsMapping();

            for (let material of results) {
                if (filamentsCounts[material._id]) {
                    material.filamentsCount = filamentsCounts[material._id];
                } else {
                    material.filamentsCount = 0;
                }

                if (material.variants && material.variants.length) {
                    for (let variant of material.variants) {
                        if (filamentsCounts[variant._id]) {
                            variant.filamentsCount = filamentsCounts[variant._id];
                        } else {
                            variant.filamentsCount = 0;
                        }
                    }
                }
            }
        }

        return results;
    };

    materialSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    materialSchema.statics.findByParentId = function (id, options, cb) {
        options = Object.assign({
            locale: null
        }, options);

        options.locale = options.locale || app.getCurrentLocale();

        let collationOptions = {
            locale: options.locale,
            numericOrdering: true
        };

        return this.find({parentMaterial: id}).sort('name').collation(collationOptions).exec(cb);
    };

    materialSchema.statics.findOneRandom = async function (cb) {
        let count = await this.countDocuments().exec();
        let rand = Math.floor(Math.random() * count);
        return this.findOne({}, {}, {skip: rand}, cb);
    };

    return mongoose.model('Material', materialSchema);
};