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
        let count = await this.countDocuments().exec();
        var rand = Math.floor(Math.random() * count);
        return this.findOne({}, {}, {skip: rand}, callback);
    };

    shopSchema.statics.list = async function (options) {
        const Filament = app.models.filament;

        options = Object.assign({
            countFilaments: false,
            locale: null
        }, options);

        let results = await this.find().sort('name').exec();
        if (options.countFilaments) {
            let filamentsCounts = await Filament.getCountPerShopsMapping();
            for (let shop of results) {
                if (filamentsCounts[shop.id]) {
                    shop.filamentsCount = filamentsCounts[shop.id];
                } else {
                    shop.filamentsCount = 0;
                }
            }
        }

        return results;
    };

    shopSchema.pre('remove', async function(next) {
        const Filament = app.models.filament;

        if (await Filament.find({shop: this.id}).countDocuments().exec() > 0) {
            return next(new Error("A shop used by filament(s) can not be deleted."));
        } else {
            return next();
        }
    });

    return mongoose.model('Shop', shopSchema);
};