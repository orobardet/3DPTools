'use strict';

module.exports = function (app) {
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    let brandSchema = new Schema({
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

    brandSchema.statics.findById = function (id) {
        return this.findOne({_id: id});
    };

    brandSchema.statics.findOneRandom = async function () {
        let count = await this.countDocuments().exec();
        let rand = Math.floor(Math.random() * count);
        return this.findOne({}, {}, {skip: rand});
    };

    const Brand = mongoose.model('Brand', brandSchema);

    return Brand;
};