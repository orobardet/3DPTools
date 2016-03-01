module.exports = function (app) {
    var when = require('when');
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var brandSchema = new Schema({
        name: String,
        url: String,
        logo: {
            name: String,
            mimeType: String,
            size: Number,
            data: Buffer
        },
        creationDate: {type: Date, default: Date.now}
    });

    brandSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    brandSchema.statics.findOneRandom = function (callback) {
        return when(this.count().exec())
            .with(this)
            .then(function (count) {
                var rand = Math.floor(Math.random() * count);
                return this.findOne({}, {}, {skip: rand}, callback);
            });
    };

    var Brand = mongoose.model('Brand', brandSchema);

    return Brand;
};