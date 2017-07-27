'use strict';

module.exports = function (app) {
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    let materialSchema = new Schema({
        name: String,
        description: String,
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
     */
    materialSchema.statics.currentVersion = 1;

    materialSchema.methods.setInMigration = function() {
        this.inMigration = true;
    }

    materialSchema.methods.isInMigration = function() {
        return this.inMigration;
    }

    materialSchema.methods.resetInMigration = function() {
        delete this.inMigration;
    }

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

    materialSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    materialSchema.statics.findOneRandom = async function (callback) {
        let count = this.count().exec();
        let rand = Math.floor(Math.random() * count);
        return this.findOne({}, {}, {skip: rand}, callback);
    };

    return mongoose.model('Material', materialSchema);
};