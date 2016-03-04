module.exports = function (app) {
    var when = require('when');
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var filamentSchema = new Schema({
        name: String,
        description: String,
        brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
        material: { type: Schema.Types.ObjectId, ref: 'Material' },
        diameter: Number,   // in mm
        color: {
            name: String,
            code: String    // HTML compliant #hex color code
        },
        photos: [{
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
        shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
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

    var Filament = mongoose.model('Filament', filamentSchema);

    return Filament;
};