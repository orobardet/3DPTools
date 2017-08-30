'use strict';

module.exports = function(app) {
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    const bcrypt = require('bcrypt-nodejs');
    const moment = require('moment');
    const crypto = require('crypto');

    let userSchema = new Schema({
        email: {type: String, index: {unique: true}},
        lastname: String,
        firstname: String,
        creationDate: {type: Date, default: Date.now},
        passwordHash: String,
        isAdmin: {type: Boolean, default: false},
        recovery: {
            token: {type: String, index: {unique: true}},
            expiration: {type: Date, index: true}
        }
    });

    userSchema.virtual('name').get(function () {
        return (this.firstname + ' ' + this.lastname).trim();
    });
    userSchema.virtual('name').set(function(name) {
        let split = name.split(' ');
        this.firstname = split[0].trim();
        this.lastname = split[1].trim();
    });

    userSchema.methods.validPassword = function (password) {
        return bcrypt.compareSync(password, this.passwordHash);
    };

    userSchema.statics.generateHash = function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    userSchema.methods.generateRecovery = function (options) {
        options = Object.assign({
            ttl: 24,
            tokenLength: 32
        }, options);

        // tokenLength represent the length in char of the token string. Has each bytes is represented by
        // 2 chars in Hex, we need to compute a random of half bytes the length
        this.recovery.token = crypto.randomBytes(Math.floor(options.tokenLength / 2)).toString('hex');
        this.recovery.expiration = moment().add(options.ttl, 'hours');
    };

    userSchema.methods.clearRecovery = function () {
        this.recovery.token = undefined;
        this.recovery.expiration = undefined;
        this.recovery = undefined;
    };

    userSchema.statics.getActiveUserCount = function () {
        return this.count().exec();
    };

    userSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    return mongoose.model('User', userSchema);
};