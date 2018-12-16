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

    brandSchema.statics.list = async function (options) {
        const Filament = app.models.filament;

        options = Object.assign({
            countFilaments: false,
            locale: null
        }, options);

        let results = await this.find().sort('name').exec();
        if (options.countFilaments) {
            let filamentsCounts = await Filament.getCountPerBrandsMapping();
            for (let brand of results) {
                if (filamentsCounts[brand.id]) {
                    brand.filamentsCount = filamentsCounts[brand.id];
                } else {
                    brand.filamentsCount = 0;
                }
            }
        }

        return results;
    };

    brandSchema.pre('remove', async function(next) {
        const Filament = app.models.filament;

        if (await Filament.find({brand: this.id}).countDocuments().exec() > 0) {
            return next(new Error("A brand used by filament(s) can not be deleted."));
        } else {
            return next();
        }
    });

    const Brand = mongoose.model('Brand', brandSchema);

    return Brand;
};