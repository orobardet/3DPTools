module.exports = function (app) {
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var bcrypt = require('bcrypt-nodejs');

    var userSchema = new Schema({
        email: {type: String, index: {unique: true}},
        lastname: String,
        firstname: String,
        creationDate: {type: Date, default: Date.now},
        passwordHash: String,
        isAdmin: {type: Boolean, default: false}
    });

    userSchema.virtual('name').get(function () {
        return (this.firstname + ' ' + this.lastname).trim();
    });
    userSchema.virtual('name').set(function (name) {
        var split = name.split(' ');
        this.firstname = split[0].trim();
        this.lastname = split[1].trim();
    });

    userSchema.methods.validPassword = function (password) {
        return bcrypt.compareSync(password, this.passwordHash);
    };

    userSchema.statics.generateHash = function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    userSchema.statics.getActiveUserCount = function () {
        return this.count().exec();
    };

    userSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    var User = mongoose.model('User', userSchema);

    return User;
};