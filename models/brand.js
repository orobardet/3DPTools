module.exports = function (app) {
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

    var Brand = mongoose.model('Brand', brandSchema);

    return Brand;
};