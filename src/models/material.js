module.exports = function (app) {
    var when = require('when');
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var materialSchema = new Schema({
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
        _version : { type: Number }
    });

    /**
     * Current schema version
     *
     * @type {number}
     *
     * <b>Version history:</b>
     * - 0: initial model
     */
    materialSchema.statics.currentVersion = 0;

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
        var that = this;

        var migrated = false;
        if (app.models.migrate && app.models.migrate.filament) {
            Object.keys(app.models.migrate.filament).forEach(function (element, index) {
                var migrator = new app.models.migrate.filament[element](that, materialSchema.statics.currentVersion);

                if (migrator.needMigration && typeof migrator.needMigration === 'function' && migrator.needMigration()) {
                    migrated = true;
                    if (migrator.migrate && typeof migrator.migrate === 'function') {
                        migrator.migrate();
                    }
                }
            });
        }

        this._version = materialSchema.statics.currentVersion;

        return migrated;
    };

    materialSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    materialSchema.statics.findOneRandom = function (callback) {
        return when(this.count().exec())
            .with(this)
            .then(function (count) {
                var rand = Math.floor(Math.random() * count);
                return this.findOne({}, {}, {skip: rand}, callback);
            });
    };

    var Material = mongoose.model('Material', materialSchema);

    return Material;
};