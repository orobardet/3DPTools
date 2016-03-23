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
        }
    });

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