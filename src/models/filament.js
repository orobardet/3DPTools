module.exports = function (app) {
    var when = require('when');
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    /**
     * Current schema version
     *
     * @type {number}
     *
     * <b>Version history:</b>
     * - 1: add creationDate. Migrating to buyDate.
     * - 2: add modificationDate. Migrating to creationDate.
     * - 3: add lastUsedDate. Migrating to modificationDate.
     */
    var currentVersion = 3;

    var filamentSchema = new Schema({
        name: String,
        description: String,
        creationDate: { type: Date, default: null },
        modificationDate: { type: Date, default: null },
        lastUsedDate: { type: Date, default: null },
        brand: {type: Schema.Types.ObjectId, ref: 'Brand'},
        material: {type: Schema.Types.ObjectId, ref: 'Material'},
        diameter: Number,   // in mm
        color: {
            name: String,
            code: String    // HTML compliant #hex color code
        },
        pictures: [{
            id: Schema.Types.ObjectId,
            name: String,
            mimeType: String,
            size: Number,
            data: Buffer
        }],
        headTemp: {
            min: Number,
            max: Number,
            experienced: Number
        },
        bedTemp: {
            min: Number,
            max: Number,
            experienced: Number
        },
        density: Number,
        buyDate: Date,
        price: Number,
        shop: {type: Schema.Types.ObjectId, ref: 'Shop'},
        initialMaterialWeight: Number,  // in Kgram
        initialTotalWeight: Number,  // in Kgram
        materialLeftPercentage: Number,
        flowPercentage: Number,
        speedPercentage: Number,
        _version : { type: Number }
    });


    filamentSchema.methods.getData = function(noPictures) {
        var data = this.toObject({getters: false, virtuals: true, versionKey: false});

        if (noPictures) {
            data.pictures = data.pictures.map(function(picture) {
                picture.data = null;
                return picture;
            });
            if (data.shop && data.shop.logo) {
                data.shop.logo.data = null;
            }
            if (data.brand && data.brand.logo) {
                data.brand.logo.data = null;
            }
        }

        return data;
    }


    filamentSchema.methods.setInMigration = function() {
        this.inMigration = true;
    }

    filamentSchema.methods.isInMigration = function() {
        return this.inMigration;
    }

    filamentSchema.methods.resetInMigration = function() {
        delete this.inMigration;
    }

    filamentSchema.pre('save', function(next) {
        if (this.isInMigration()) {
            this.resetInMigration();
            next();
            return;
        }

        if (!this.creationDate) {
            this.creationDate = Date.now();
        }

        this.modificationDate = Date.now();

        next();
    });

    filamentSchema.methods.migrate = function() {
        var that = this;

        var migrated = false;
        if (app.models.migrate && app.models.migrate.filament) {
            Object.keys(app.models.migrate.filament).forEach(function (element, index) {
                var migrator = new app.models.migrate.filament[element](that, currentVersion);

                if (migrator.needMigration && typeof migrator.needMigration === 'function' && migrator.needMigration()) {
                    migrated = true;
                    if (migrator.migrate && typeof migrator.migrate === 'function') {
                        migrator.migrate();
                    }
                }
            });
        }

        this._version = currentVersion;

        return migrated;
    };

    filamentSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    filamentSchema.statics.findOneRandom = function (callback) {
        return when(this.count().exec())
            .with(this)
            .then(function (count) {
                var rand = Math.floor(Math.random() * count);
                return this.findOne({}, {}, {skip: rand}, callback);
            });
    };

    filamentSchema.statics.getColors = function (callback) {
        return when(this.aggregate([
            { $group: {
                _id: '$color',
            }
            },
            { $sort: { '_id.code': 1 } },
            { $project: {
                _id: 0,
                name: '$_id.name',
                code: '$_id.code'
            }
            },
        ]).exec());
    };

    filamentSchema.statics.getTotalCost = function (callback) {
        return when(this.aggregate({
            $group: {
                _id: '',
                total: { $sum: '$price' }
            }
        }, {
            $project: {
                _id: 0,
                total: '$total'
            }
        }).exec())
            .with(this)
            .then(function (result) {
                return result[0].total;
            });
    };

    filamentSchema.statics.getTotalWeight = function (callback) {
        return when(this.aggregate({
            $group: {
                _id: '',
                total: { $sum: '$initialMaterialWeight' }
            }
        }, {
            $project: {
                _id: 0,
                total: '$total'
            }
        }).exec())
            .with(this)
            .then(function (result) {
                return result[0].total;
            });
    };

    filamentSchema.statics.getTotalLength = function (callback) {
        return when(this.aggregate({
            $group: {
                _id: {diameter: '$diameter',
                    density: '$density'
                },
                weight: { $sum: '$initialMaterialWeight' }
            }
        }).exec())
            .with(this)
            .then(function (results) {
                var totalLength = 0;

                var that = this;
                results = results.forEach(function(doc) {
                    totalLength += that.getLength(doc.weight, doc._id.density, doc._id.diameter);
                });

                return totalLength;
            });
    };

    filamentSchema.statics.getCostPerBrands = function (callback) {
        return when(this.aggregate([
            { $group: {
                    _id: '$brand',
                    cost: { $sum: '$price' }
                }
            },
            { $sort: { 'cost': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.brand.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getCostPerShops = function (callback) {
        return when(this.aggregate([
            { $group: {
                _id: '$shop',
                cost: { $sum: '$price' }
            }
            },
            { $sort: { 'cost': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.shop.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getCostPerMaterials = function (callback) {
        return when(this.aggregate([
            { $group: {
                _id: '$material',
                cost: { $sum: '$price' }
            }
            },
            { $sort: { 'cost': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.material.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getCostPerColors = function (callback) {
        return when(this.aggregate([
            { $group: {
                _id: '$color',
                cost: { $sum: '$price' }
            }
            },
            { $sort: { '_id.code': 1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                result = result.map(function(doc) {
                    doc.label = doc._id.name;
                    return doc;
                });

                return result;
            });
    };

    filamentSchema.statics.getCountPerBrands = function (callback) {
        return when(this.aggregate([
            { $group: {
                _id: '$brand',
                count: { $sum: 1 }
            }
            },
            { $sort: { 'count': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.brand.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getCountPerShops = function (callback) {
        return when(this.aggregate([
            { $group: {
                _id: '$shop',
                count: { $sum: 1 }
            }
            },
            { $sort: { 'count': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.shop.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getCountPerMaterials = function (callback) {
        return when(this.aggregate([
            { $group: {
                _id: '$material',
                count: { $sum: 1 }
            }
            },
            { $sort: { 'count': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.material.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getCountPerColors = function (callback) {
        return when(this.aggregate([
            { $group: {
                    _id: '$color',
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.code': 1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                result = result.map(function(doc) {
                    doc.label = doc._id.name;
                    return doc;
                });

                return result;
            });
    };

    filamentSchema.statics.getUsagePerColors = function (callback) {
        return when(this.aggregate([
            { $project: {
                    color: '$color',
                    initialWeight: '$initialMaterialWeight',
                    leftPercentage : '$materialLeftPercentage',
                    leftWeight: { $divide : [ { $multiply: [ '$initialMaterialWeight', '$materialLeftPercentage'] }, 100 ] }
                }
            },
            { $project: {
                    color: '$color',
                    initialWeight: '$initialWeight',
                    leftPercentage : '$leftPercentage',
                    leftWeight: '$leftWeight',
                    usedWeight: { $subtract : [ '$initialWeight', '$leftWeight' ] }
                }
            },
            { $group: {
                    _id: '$color',
                    count: { $sum: 1 },
                    totalWeight: { $sum: '$initialWeight'},
                    totalLeftWeight:  { $sum: '$leftWeight'},
                    totalUsedWeight:  { $sum: '$usedWeight'}
                }
            },
            { $match: { totalUsedWeight: { $gt: 0 } } },
            { $sort: { 'totalUsedWeight': -1 } }
        ]).exec());
    };

    filamentSchema.statics.getUsagePerMaterials = function (callback) {
        return when(this.aggregate([
            { $project: {
                material: '$material',
                initialWeight: '$initialMaterialWeight',
                leftPercentage : '$materialLeftPercentage',
                leftWeight: { $divide : [ { $multiply: [ '$initialMaterialWeight', '$materialLeftPercentage'] }, 100 ] }
            }
            },
            { $project: {
                material: '$material',
                initialWeight: '$initialWeight',
                leftPercentage : '$leftPercentage',
                leftWeight: '$leftWeight',
                usedWeight: { $subtract : [ '$initialWeight', '$leftWeight' ] }
            }
            },
            { $group: {
                _id: '$material',
                count: { $sum: 1 },
                totalWeight: { $sum: '$initialWeight'},
                totalLeftWeight:  { $sum: '$leftWeight'},
                totalUsedWeight:  { $sum: '$usedWeight'}
            }
            },
            { $match: { totalUsedWeight: { $gt: 0 } } },
            { $sort: { 'totalUsedWeight': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.material.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getUsagePerBrands = function (callback) {
        return when(this.aggregate([
            { $project: {
                brand: '$brand',
                initialWeight: '$initialMaterialWeight',
                leftPercentage : '$materialLeftPercentage',
                leftWeight: { $divide : [ { $multiply: [ '$initialMaterialWeight', '$materialLeftPercentage'] }, 100 ] }
            }
            },
            { $project: {
                brand: '$brand',
                initialWeight: '$initialWeight',
                leftPercentage : '$leftPercentage',
                leftWeight: '$leftWeight',
                usedWeight: { $subtract : [ '$initialWeight', '$leftWeight' ] }
            }
            },
            { $group: {
                _id: '$brand',
                count: { $sum: 1 },
                totalWeight: { $sum: '$initialWeight'},
                totalLeftWeight:  { $sum: '$leftWeight'},
                totalUsedWeight:  { $sum: '$usedWeight'}
            }
            },
            { $match: { totalUsedWeight: { $gt: 0 } } },
            { $sort: { 'totalUsedWeight': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                return app.models.brand.populate(result, { "path" : "_id"}, function(err, results) {
                    if (err) { throw err; }

                    result = result.map(function(doc) {
                        doc.label = doc._id.name;
                        doc._id = doc._id._id;
                        return doc;
                    });

                    return result;
                });
            });
    };

    filamentSchema.statics.getStatsPerUsage = function (callback) {
        return when.all([this.aggregate([
                { $project: {
                        initialWeight: '$initialMaterialWeight',
                        price: '$price',
                        leftPercentage : '$materialLeftPercentage',
                        leftWeight: { $divide : [ { $multiply: [ '$initialMaterialWeight', '$materialLeftPercentage'] }, 100 ] },
                        leftPrice: { $divide : [ { $multiply: [ '$price', '$materialLeftPercentage'] }, 100 ] }
                    }
                },
                { $group: {
                        _id: 'usage',
                        totalWeight: { $sum: '$initialWeight'},
                        totalLeftWeight:  { $sum: '$leftWeight'},
                        totalCost: { $sum: '$price'},
                        totalLeftCost: { $sum: '$leftPrice'}
                    }
                }
            ]).exec(),
            this.aggregate( [
                { $project: {
                        diameter: '$diameter',
                        density: '$density',
                        initialWeight: '$initialMaterialWeight',
                        leftPercentage : '$materialLeftPercentage',
                        leftWeight: { $divide : [ { $multiply: [ '$initialMaterialWeight', '$materialLeftPercentage'] }, 100 ] },
                    }
                },
                { $group: {
                        _id: {diameter: '$diameter',
                            density: '$density'
                        },
                        weight: { $sum: '$initialWeight' },
                        leftWeight: { $sum: '$leftWeight' }
                    }
                }]).exec()
        ]).with(this)
        .spread(function (weightAndCostUsage, lengthUsage) {
            var results = weightAndCostUsage[0];

            var totalLength = 0;
            var totalLeftLength = 0;

            var that = this;
            lengthUsage.forEach(function(doc) {
                totalLength += that.getLength(doc.weight, doc._id.density, doc._id.diameter);
                totalLeftLength += that.getLength(doc.leftWeight, doc._id.density, doc._id.diameter);
            });

            results.totalLength = totalLength;
            results.totalLeftLength = totalLeftLength;

            return results;
        });
    };

    filamentSchema.statics.getBoughtTimeline = function (callback) {
        return when(this.aggregate([
            { $project: {
                    yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$buyDate" } },
                    buyDate: '$buyDate',
                    price: '$price',
                    name: '$name',
                    brandId: '$brand',
                    shopId: '$shop'
                }
            },
            { $lookup: {
                    from: 'brands',
                    localField: 'brandId',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            { $lookup: {
                    from: 'shops',
                    localField: 'shopId',
                    foreignField: '_id',
                    as: 'shop'
                }
            },
            {
                $project: {
                    yearMonthDay: '$yearMonthDay',
                    buyDate: '$buyDate',
                    price: '$price',
                    name: '$name',
                    brand: '$brand.name',
                    shop: '$shop.name'
                }
            },
            {
                $unwind: '$brand'
            },
            {
                $unwind: '$shop'
            },
            { $group: {
                    _id: { buyDay:'$yearMonthDay', buyDate: '$buyDate' },
                    count: { $sum: 1 },
                    cost: { $sum: '$price' },
                    names: { $push: '$name' },
                    brands: { $addToSet: '$brand' },
                    shops: { $addToSet: '$shop' }
                }
            },
            { $sort: { '_id.buyDay': 1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                result = result.map(function(doc) {
                    doc.buyTimestamp = doc._id.buyDate.getTime();
                    return doc;
                });

                return result;
            });
    };


    filamentSchema.statics.getStatsCostPerKg = function (callback) {
        return when(this.aggregate([
            { $project: {
                materialId: '$material',
                materialWeight: '$initialMaterialWeight',
                price: '$price',
                pricePerKg: { $divide : [ '$price', '$initialMaterialWeight'] }
            }
            },
            { $group: {
                _id: '$materialId',
                count: { $sum: 1 },
                materialWeight: { $sum: '$materialWeight' },
                totalCost: { $sum: '$price' },
                pricePerKg: { $avg: '$pricePerKg'}
            }
            },
            { $lookup: {
                from: 'materials',
                localField: '_id',
                foreignField: '_id',
                as: 'material'
            }
            },
            {
                $unwind: '$material'
            },
            { $sort: { 'pricePerKg': 1 } }
        ]).exec());
    };

    filamentSchema.statics.getLength = function (weight, density, diameter) {
        var volume = weight / density;
        return volume / (Math.PI * Math.pow(diameter / 2 / 1000, 2));
    };

    filamentSchema.methods.leftMaterialWeight = function () {
        return this.initialMaterialWeight * this.materialLeftPercentage / 100;
    };

    filamentSchema.methods.setLeftTotalWeight = function (leftTotalWeight) {
        if (leftTotalWeight > this.initialTotalWeight) {
            return false;
        }

        var netLeftWeight = Math.max(0, leftTotalWeight - (this.initialTotalWeight - this.initialMaterialWeight));
        this.materialLeftPercentage = 100 * netLeftWeight / this.initialMaterialWeight;

        return true;
    };

    filamentSchema.methods.setLastUsed = function(lastDate) {
        if (!lastDate) {
            lastDate = Date.now();
        }

        this.lastUsedDate = lastDate;
    }

    filamentSchema.methods.setLeftLength = function (leftLength) {
        var volume = Math.PI * Math.pow(this.diameter / 2 / 1000, 2) * leftLength;
        var netLeftWeight = volume * this.density;

        this.materialLeftPercentage = 100 * netLeftWeight / this.initialMaterialWeight;

        return true;
    };

    filamentSchema.methods.getLength = function (weight) {
        return this.constructor.getLength(weight, this.density, this.diameter);
    };

    filamentSchema.methods.getInitialLength = function () {
        return this.getLength(this.initialMaterialWeight);
    };

    filamentSchema.methods.getLeftLength = function () {
        return this.getLength(this.leftMaterialWeight());
    };

    filamentSchema.methods.addPicture = function (picture) {
        this.pictures.push(picture);
    };

    filamentSchema.methods.getPicture = function (id) {
        if (this.pictures && this.pictures.length) {
            for (var i = 0; i < this.pictures.length; i++) {
                if (this.pictures[i]._id == id) {
                    return this.pictures[i];
                }
            }
        }

        return false;
    };

    filamentSchema.methods.deletePicture = function (id) {
        if (this.pictures && this.pictures.length) {
            var deleteIndex = -1;
            for (var i = 0; i < this.pictures.length; i++) {
                if (this.pictures[i]._id == id) {
                    deleteIndex = i;
                    break;
                }
            }

            if (deleteIndex >= 0) {
                this.pictures.splice(deleteIndex, 1);
                return true;
            }
        }

        return false;
    };


    var Filament = mongoose.model('Filament', filamentSchema);

    return Filament;
};