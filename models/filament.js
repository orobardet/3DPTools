module.exports = function (app) {
    var when = require('when');
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

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
        initialMaterialWeight: Number,  // in gram
        initialTotalWeight: Number,  // in gram
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

    filamentSchema.methods.leftMaterialWeight = function () {
        return this.initialMaterialWeight * this.materialLeftPercentage / 100;
    };

    filamentSchema.methods.setLeftTotalWeight = function (leftTotalWeight) {
        if (leftTotalWeight > this.initialMaterialWeight) {
            return false;
        }

        var netLeftWeight = Math.max(0, leftTotalWeight - (this.initialTotalWeight - this.initialMaterialWeight));
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

    var Filament = mongoose.model('Filament', filamentSchema);

    return Filament;
};