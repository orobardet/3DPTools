'use strict';

module.exports = function (app) {
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    const merge = require('merge');

    let filamentSchema = new Schema({
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
            code: String    // CSS compliant #hex color code or rgba
        },
        masterColorCode: String, // CSS compliant #hex color code or rgba
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
        printingSpeed: { // in mm/s
            min: Number,
            max: Number
        },
        density: Number,
        buyDate: Date,
        price: Number,
        pricePerKg: {type: Number, default: null },
        shop: {type: Schema.Types.ObjectId, ref: 'Shop'},
        initialMaterialWeight: Number,  // in Kgram
        initialTotalWeight: Number,  // in Kgram
        materialLeftPercentage: Number,
        flowPercentage: Number,
        finished: { type: Boolean, default: false },
        finishedDate: { type: Date, default: null },
        _version : { type: Number }
    });


    /**
     * Current schema version
     *
     * @type {number}
     *
     * <b>Version history:</b>
     * - 1: add creationDate. Migrating to buyDate.
     * - 2: add modificationDate. Migrating to creationDate.
     * - 3: add lastUsedDate. Migrating to modificationDate.
     * - 4: add finished and finishedDate
     * - 5: add pricePerKG
     * - 6: replace speedPercentage with printingSpeed range
     * - 7: add masterColor
     */
    filamentSchema.statics.currentVersion = 7;

    filamentSchema.methods.getData = function(noPictures) {
        let data = this.toObject({getters: false, virtuals: true, versionKey: false});

        if (noPictures) {
            data.pictures = data.pictures.map(picture => {
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
    };

    filamentSchema.methods.setInMigration = function() {
        this.inMigration = true;
    };

    filamentSchema.methods.isInMigration = function() {
        return this.inMigration;
    };

    filamentSchema.methods.resetInMigration = function() {
        delete this.inMigration;
    };

    filamentSchema.pre('save', function(next) {
        // No pre save during migration, to avoid updating unwanted data
        if (this.isInMigration()) {
            this.resetInMigration();
            next();
            return;
        }

        // If no creationDate defined, set it to now (it means we are creating the entry
        if (!this.creationDate) {
            this.creationDate = Date.now();
        }

        // Updating modification date
        this.modificationDate = Date.now();

        // Compute price per Kg
        if (this.initialMaterialWeight) {
            let pricePerKg = this.price / this.initialMaterialWeight;
            if (this.pricePerKg !== pricePerKg) {
                this.pricePerKg = pricePerKg;
            }
        }

        this._version = filamentSchema.statics.currentVersion;

        next();
    });

    filamentSchema.methods.migrate = async function() {
        let migrated = false;
        if (app.models.migrate && app.models.migrate.filament) {
            for (let version of Object.keys(app.models.migrate.filament)) {
                let migrator = new app.models.migrate.filament[version](this, filamentSchema.statics.currentVersion, app);

                if (migrator.needMigration && typeof migrator.needMigration === 'function' && migrator.needMigration()) {
                    migrated = true;
                    if (migrator.migrate && typeof migrator.migrate === 'function') {
                        await migrator.migrate();
                    }
                }
            }
        }

        this._version = filamentSchema.statics.currentVersion;

        return migrated;
    };

    filamentSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    filamentSchema.statics.findOneRandom = async function (callback) {
        let count = await this.count().exec();
        let rand = Math.floor(Math.random() * count);
        return this.findOne({}, {}, {skip: rand}, callback);
    };

    filamentSchema.statics.list = function (options) {
        options = merge({
            filter: {},
            sort: {
                'masterColorCode': 1,
                'color.code': 1,
                'material.name': 1,
                'brand.name': 1
            }
        }, options);

        return this.find(options.filter).populate('material brand shop').sort(options.sort).exec();
    };

    filamentSchema.statics.getColors = function () {
        return this.aggregate([
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
        ]);
    };

    filamentSchema.statics.getTotalCost = async function () {
        let result = await this.aggregate([{
            $group: {
                _id: '',
                total: { $sum: '$price' }
            }
        }, {
            $project: {
                _id: 0,
                total: '$total'
            }
        }]).exec();

        if (result.length) {
            return result[0].total;
        } else {
            return null;
        }
    };

    filamentSchema.statics.getTotalWeight = async function () {
        let result = await this.aggregate([{
            $group: {
                _id: '',
                total: { $sum: '$initialMaterialWeight' }
            }
        }, {
            $project: {
                _id: 0,
                total: '$total'
            }
        }]).exec();

        if (result.length) {
            return result[0].total;
        } else {
            return null;
        }
    };

    filamentSchema.statics.getTotalLength = async function () {
        let results = await this.aggregate([{
            $group: {
                _id: {diameter: '$diameter',
                    density: '$density'
                },
                weight: { $sum: '$initialMaterialWeight' }
            }
        }]).exec();

        let totalLength = 0;
        for (let doc of results) {
            totalLength += this.getLength(doc.weight, doc._id.density, doc._id.diameter);
        }

        return totalLength;
    };

    filamentSchema.statics.getCostPerBrands = async function () {
        let aggregation = await this.aggregate([
            { $group: {
                    _id: '$brand',
                    cost: { $sum: '$price' }
                }
            },
            { $sort: { 'cost': -1 } }
        ]).exec();

        let results = await app.models.brand.populate(aggregation, { "path" : "_id"});

        return results.map(doc => {
            doc.label = doc._id.name;
            doc._id = doc._id._id;
            return doc;
        });
    };

    filamentSchema.statics.getCostPerShops = async function () {
        let aggregation = this.aggregate([
            { $group: {
                _id: '$shop',
                cost: { $sum: '$price' }
            }
            },
            { $sort: { 'cost': -1 } }
        ]).exec();

        let results = await app.models.shop.populate(aggregation, { "path" : "_id"});

        return results.map(doc => {
                doc.label = doc._id.name;
                doc._id = doc._id._id;
                return doc;
            });
    };

    filamentSchema.statics.getCostPerMasterMaterials = async function (remove_finished) {
        let aggregationConfig = [
            { $project: {
                material: "$material",
                price: "$price"
            }},
            { $lookup: {
                from: "materials",
                localField: "material",
                foreignField: "_id",
                as: "materialData"
            }},
            // Use parent material ID if there is one
            { $project: {
                materialId: {
                    $cond: {
                        if : { $gt: [ { $size : "$materialData.parentMaterial" },  0] } ,
                        then: { $arrayElemAt: [ "$materialData.parentMaterial", 0 ] },
                        else: "$material"
                    }
                },
                price: "$price"
            }},
            { $group: {
                _id: '$materialId',
                cost: { $sum: "$price" }
            }},
            { $sort: { 'cost': -1 } },
            { $lookup: {
                from: "materials",
                localField: "_id",
                foreignField: "_id",
                as: "_id"
            }},
            { $project: {
                _id: { $arrayElemAt: [ "$_id", 0 ] },
                cost: "$cost"
            }}
        ];

        if (remove_finished === true) {
            aggregationConfig.unshift({
                $match: { finished: false }
            });
        }
        let results = await this.aggregate(aggregationConfig).exec();

        return results.map(doc => {
            doc.label = doc._id.name;
            doc._id = doc._id._id;
            return doc;
        });
    };

    filamentSchema.statics.getCostPerMasterColors = async function (predefinedColorsIndex) {
        let results = await this.aggregate([
            { $group: {
                _id: '$masterColorCode',
                cost: { $sum: '$price' }
            }
            },
            { $sort: { '_id': 1 } }
        ]).exec();

        return results.map(doc => {
            let colorCode = doc._id;
            doc._id = {
                code: colorCode,
                name: ""
            };
            if (predefinedColorsIndex && predefinedColorsIndex[doc._id.code]) {
                doc._id.name = predefinedColorsIndex[doc._id.code];
            };
            doc.label = doc._id.name;
            return doc;
        });
    };

    filamentSchema.statics.getCountPerBrands = async function () {
        let aggregation = await this.aggregate([
            { $group: {
                _id: '$brand',
                count: { $sum: 1 }
            }
            },
            { $sort: { 'count': -1 } }
        ]).exec();

        let results = await app.models.brand.populate(aggregation, { "path" : "_id"});

        return results.map(doc => {
            doc.label = doc._id.name;
            doc._id = doc._id._id;
            return doc;
        });
    };

    filamentSchema.statics.getCountPerShops = async function () {
        let aggregation = await this.aggregate([
            { $group: {
                _id: '$shop',
                count: { $sum: 1 }
            }
            },
            { $sort: { 'count': -1 } }
        ]).exec();

        let results = await app.models.shop.populate(aggregation, { "path" : "_id"});

        return results.map(doc => {
            doc.label = doc._id.name;
            doc._id = doc._id._id;
            return doc;
        });
    };

    filamentSchema.statics.getCountPerMasterMaterials = async function (remove_finished) {
        let aggregationConfig = [
            { $project: {
               material: "$material",
            }},
            { $lookup: {
                from: "materials",
                localField: "material",
                foreignField: "_id",
                as: "materialData"
            }},
            // Use parent material ID if there is one
            { $project: {
                materialId: {
                    $cond: {
                        if : { $gt: [ { $size : "$materialData.parentMaterial" },  0] } ,
                        then: { $arrayElemAt: [ "$materialData.parentMaterial", 0 ] },
                        else: "$material"
                    }
                }
            }},
            { $group: {
                _id: '$materialId',
                count: { $sum: 1 }
            }},
            { $sort: { 'count': -1 } },
            { $lookup: {
                from: "materials",
                localField: "_id",
                foreignField: "_id",
                as: "_id"
            }},
            { $project: {
                _id: { $arrayElemAt: [ "$_id", 0 ] },
                count: "$count"
            }}
        ];

        if (remove_finished === true) {
            aggregationConfig.unshift({
                $match: { finished: false }
            });
        }
        let results = await this.aggregate(aggregationConfig).exec();

        return results.map(doc => {
            doc.label = doc._id.name;
            doc._id = doc._id._id;
            return doc;
        });
    };

    filamentSchema.statics.getCountPerMasterColors = async function (predefinedColorsIndex) {
        let results = await this.aggregate([
            { $group: {
                    _id: '$masterColorCode',
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]).exec();

        return results.map(doc => {
            let colorCode = doc._id;
            doc._id = {
                code: colorCode,
                name: ""
            };
            if (predefinedColorsIndex && predefinedColorsIndex[doc._id.code]) {
                doc._id.name = predefinedColorsIndex[doc._id.code];
            };
            doc.label = doc._id.name;
            return doc;
        });
    };

    filamentSchema.statics.getUsagePerMasterColors = async function (predefinedColorsIndex) {
        let results = await this.aggregate([
            { $project: {
                    color: '$masterColorCode',
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
        ]).exec();

        return results.map(doc => {
            let colorCode = doc._id;
            doc._id = {
                code: colorCode,
                name: ""
            };
            if (predefinedColorsIndex && predefinedColorsIndex[doc._id.code]) {
                doc._id.name = predefinedColorsIndex[doc._id.code];
            };
            return doc;
        });
    };

    filamentSchema.statics.getUsagePerMasterMaterials = async function () {
        let results = await this.aggregate([
            { $project: {
                material: "$material",
                initialMaterialWeight: '$initialMaterialWeight',
                materialLeftPercentage: '$materialLeftPercentage'
            }},
            { $lookup: {
                from: "materials",
                localField: "material",
                foreignField: "_id",
                as: "materialData"
            }},
            // Use parent material ID if there is one
            { $project: {
                material: {
                    $cond: {
                        if : { $gt: [ { $size : "$materialData.parentMaterial" },  0] } ,
                        then: { $arrayElemAt: [ "$materialData.parentMaterial", 0 ] },
                        else: "$material"
                    }
                },
                initialWeight: '$initialMaterialWeight',
                leftPercentage : '$materialLeftPercentage',
                leftWeight: { $divide : [ { $multiply: [ '$initialMaterialWeight', '$materialLeftPercentage'] }, 100 ] }
            }},
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
            { $sort: { 'totalUsedWeight': -1 } },
            { $lookup: {
                from: "materials",
                localField: "_id",
                foreignField: "_id",
                as: "_id"
            }},
            { $project: {
                _id: { $arrayElemAt: [ "$_id", 0 ] },
                count: "$count",
                totalWeight: "$totalWeight",
                totalLeftWeight: "$totalLeftWeight",
                totalUsedWeight: "$totalUsedWeight"
            }}
        ]).exec();

        return results.map(doc => {
            doc.label = doc._id.name;
            doc._id = doc._id._id;
            return doc;
        });
    };

    filamentSchema.statics.getUsagePerBrands = async function () {
        let aggregation = await this.aggregate([
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
        ]).exec();

        let results = await app.models.brand.populate(aggregation, { "path" : "_id"});

        return results.map(doc => {
            doc.label = doc._id.name;
            doc._id = doc._id._id;
            return doc;
        });
    };

    filamentSchema.statics.getStatsPerUsage = async function () {
        let [weightAndCostUsage, lengthUsage] = await Promise.all([this.aggregate([
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
        ]);

        let results = {};
        if (weightAndCostUsage.length) {
            results = weightAndCostUsage[0];
        }

        let totalLength = 0;
        let totalLeftLength = 0;

        for (let doc of lengthUsage) {
            totalLength += this.getLength(doc.weight, doc._id.density, doc._id.diameter);
            totalLeftLength += this.getLength(doc.leftWeight, doc._id.density, doc._id.diameter);
        }

        results.totalLength = totalLength;
        results.totalLeftLength = totalLeftLength;

        return results;
    };

    filamentSchema.statics.getBoughtTimeline = async function () {
        let results = await this.aggregate([
            { $project: {
                    yearMonthDay: { $dateToString: { format: "%Y-%m-%d", date: "$buyDate" } },
                    buyDate: '$buyDate',
                    price: '$price',
                    name: '$name',
                    brandId: '$brand',
                    shopId: '$shop',
                    materialWeight: '$initialMaterialWeight',
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
                    materialWeight: '$materialWeight',
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
                    materialWeight: { $sum: '$materialWeight' },
                    names: { $push: '$name' },
                    brands: { $addToSet: '$brand' },
                    shops: { $addToSet: '$shop' }
                }
            },
            { $sort: { '_id.buyDay': 1 } }
        ]).exec();

        return results.map(doc => {
            doc.buyTimestamp = doc._id.buyDate.getTime();
            return doc;
        });
    };

    filamentSchema.statics.getPurchaseIntervalStats = async function () {
        let aggregation = await this.aggregate([
            { $project: { buyDate: '$buyDate' } },
            { $group: { _id: "$buyDate" } },
            { $sort: { _id: 1 } },
            { $group: {
                _id: null,
                purchaseDates: { $push : "$_id" }
            } },
            { $project: { purchaseDates: true , _id: false} }
        ]).exec();

        let purchaseDates = [];

        if (aggregation.length && aggregation[0].purchaseDates && Array.isArray(aggregation[0].purchaseDates)) {
            purchaseDates = aggregation[0].purchaseDates;
        }

        let intervals = [];
        let previousDate = null;
        let intervalSum = 0;

        let averageInterval = null;
        let lastPurchase = null;

        if (purchaseDates.length) {
            for (let date of purchaseDates) {
                if (previousDate) {
                    let interval = date.getTime() - previousDate.getTime();
                    intervalSum += interval;
                    intervals.push(interval);
                }
                previousDate = date;
            }
            lastPurchase = new Date().getTime() - purchaseDates[purchaseDates.length-1];
        }

        if (intervals.length) {
            averageInterval = Math.floor(intervalSum / intervals.length);
        }

        return {
            purchaseDates: purchaseDates,
            averageInterval: averageInterval,
            lastPurchase: lastPurchase
        };
    };

    filamentSchema.statics.getStatsCostPerKg = async function () {
        return await this.aggregate([
            { $project: {
                material: "$material",
                initialMaterialWeight: '$initialMaterialWeight',
                price: '$price',
            }},
            { $lookup: {
                from: "materials",
                localField: "material",
                foreignField: "_id",
                as: "materialData"
            }},
            // Use parent material ID if there is one
            { $project: {
                materialId: {
                    $cond: {
                        if : { $gt: [ { $size : "$materialData.parentMaterial" },  0] } ,
                        then: { $arrayElemAt: [ "$materialData.parentMaterial", 0 ] },
                        else: "$material"
                    }
                },
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
        ]).exec();
    };

    filamentSchema.statics.getLength = function (weight, density, diameter) {
        let volume = weight / density;
        return volume / (Math.PI * Math.pow(diameter / 2 / 1000, 2));
    };

    filamentSchema.methods.leftMaterialWeight = function () {
        return this.initialMaterialWeight * this.materialLeftPercentage / 100;
    };

    filamentSchema.methods.setLeftWeight = function (leftWeight) {
        if (leftWeight > this.initialMaterialWeight) {
            return false;
        }

        return this.setLeftTotalWeight(leftWeight + (this.initialTotalWeight - this.initialMaterialWeight));
    };

    filamentSchema.methods.setLeftTotalWeight = function (leftTotalWeight) {
        if (leftTotalWeight > this.initialTotalWeight) {
            return false;
        }

        let netLeftWeight = Math.max(0, leftTotalWeight - (this.initialTotalWeight - this.initialMaterialWeight));
        this.materialLeftPercentage = 100 * netLeftWeight / this.initialMaterialWeight;

        return true;
    };

    filamentSchema.methods.setLastUsed = function(lastDate) {
        if (!lastDate) {
            lastDate = Date.now();
        }

        this.lastUsedDate = lastDate;
    };

    filamentSchema.methods.setLeftLength = function (leftLength) {
        let volume = Math.PI * Math.pow(this.diameter / 2 / 1000, 2) * leftLength;
        let netLeftWeight = volume * this.density;

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
            for (let picture of this.pictures) {
                if (picture._id.toString() === id) {
                    return picture;
                }
            }
        }

        return false;
    };

    filamentSchema.methods.deletePicture = function (id) {
        if (this.pictures && this.pictures.length) {
            let deleteIndex = -1;
            for (let i in this.pictures) {
                if (this.pictures[i]._id.toString() === id) {
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


    return mongoose.model('Filament', filamentSchema);
};