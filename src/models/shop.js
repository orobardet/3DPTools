'use strict';

module.exports = function (app) {
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    let shopSchema = new Schema({
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

    shopSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    shopSchema.statics.findOneRandom = async function (callback) {
        let count = await this.count().exec();
        var rand = Math.floor(Math.random() * count);
        return this.findOne({}, {}, {skip: rand}, callback);
    };

    return mongoose.model('Shop', shopSchema);
};