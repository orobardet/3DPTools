module.exports = function (app) {
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var shopSchema = new Schema({
        name: String,
        url: String,
        logo: {
            name: String,
            contentType: String,
            size: Number,
            data: Buffer
        },
        creationDate: {type: Date, default: Date.now}
    });

    userSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    var Shop = mongoose.model('Shop', shopSchema);

    return Shop;
};