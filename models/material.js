module.exports = function (app) {
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
        }
    });

    materialSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    var Material = mongoose.model('Material', materialSchema);

    return Material;
};