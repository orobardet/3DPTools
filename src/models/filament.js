module.exports = function (app) {
    var when = require('when');
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var Brand  = app.models.brand;

    var filamentSchema = new Schema({
        name: String,
        description: String,
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
        speedPercentage: Number
    });

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

    filamentSchema.statics.getCostPerBrands = function (callback) {
        return when(this.aggregate([
            { $group: {
                    _id: '$brand',
                    totalCost: { $sum: '$price' }
                }
            },
            { $sort: { 'totalCost': -1 } }
        ]).exec())
            .with(this)
            .then(function (result) {
                Brand.populate(result, { "path" : "_id"}, function(err,results) {
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

    filamentSchema.methods.setLeftLength = function (leftLength) {
        var volume = Math.PI * Math.pow(this.diameter / 2 / 1000, 2) * leftLength;
        var netLeftWeight = volume * this.density;

        this.materialLeftPercentage = 100 * netLeftWeight / this.initialMaterialWeight;

        return true;
    };

    filamentSchema.methods.getLength = function (weight) {
        var volume = weight / this.density;
        return volume / (Math.PI * Math.pow(this.diameter / 2 / 1000, 2));
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