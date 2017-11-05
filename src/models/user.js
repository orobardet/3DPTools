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
            expiration: {type: Date, index: true},
        },
        sessionKeeperTokens: [{
            id: {type: String, index: {unique: true}},
            token: {type: String, index: {unique: true}},
            expiration: {type: Date, index: true},
            ip: String,
            userAgent: String,
        }]
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

    /**
     * Create a new session keeper id/token pair and add it the user
     *
     * The ID and token are returned, in order to use them for future authentification.
     * The ID and a **hash** of the token are stored in the user object, as a new id/token pair.
     *
     * A user can have multiples session keeper id/token pair.
     *
     * Note: the user object is modified but not yet save to database
     *
     * @param userAgent string User agent to associate to the token
     * @param ip string IP address to assiciate to the token
     * @param expirationDelay int expiration delay of the token from now, in minutes
     * @param options object Options for token generation.
     *
     * @returns {{id, token}}
     */
    userSchema.methods.createSessionKeeperToken = function(userAgent, ip, expirationDelay, options) {
        options = Object.assign({
            tokenLength: 32
        }, options);

        let id = crypto.randomBytes(Math.floor(options.tokenLength / 2)).toString('hex');
        let token = crypto.randomBytes(Math.floor(options.tokenLength / 2)).toString('hex');
        let tokenHash = crypto.createHash('sha256').update(token, 'utf8').digest('hex');
        this.sessionKeeperTokens.push({
            id: id,
            token: tokenHash,
            expiration: moment().add(expirationDelay, 'minutes'),
            ip: ip,
            userAgent: userAgent,
        });

        return { id: id, token: token };
    };

    /**
     * Find session keeper data based on its ID in the current user
     *
     * @param id string ID of the token to find
     * @returns {*} object All data for the token, of false if not found
     */
    userSchema.methods.findSessionKeeperToken = function(id) {
        if (this.sessionKeeperTokens && this.sessionKeeperTokens.length) {
            for (let tokenData of this.sessionKeeperTokens) {
                if (tokenData.id == id) {
                    return tokenData;
                }
            }
        }

        return false
    };

    /**
     * Remove a session keeper based on its ID in the current user
     *
     * Note: the user object is modified but not yet save to database
     *
     * @param id string ID of the token to remove
     */
    userSchema.methods.removeSessionKeeperTokens = function (id) {
        // If at least userAgent or ip are given, remove only the tokens matching them
        this.sessionKeeperTokens = this.sessionKeeperTokens.filter(tokenData => tokenData.id != id);
    };

    /**
     * Clear session keepers of a user, all of by filter
     *
     * userAgent and ip are both optional. If given and non null, only tokens matchin them (with and AND) will be
     * cleared. If none or them are given, all tokens will be deleted.
     *
     * Note: the user object is modified but not yet save to database
     *
     * @param userAgent string User agent to associate to the token
     * @param ip string IP address to assiciate to the token
     */
    userSchema.methods.clearSessionKeeperTokens = function (userAgent, ip) {
        // If at least userAgent or ip are given, remove only the tokens matching them
        if (userAgent || ip) {
            this.sessionKeeperTokens = this.sessionKeeperTokens.filter(tokenData => {
                if (userAgent && ip) {
                    if (tokenData.userAgent == userAgent && tokenData.ip == ip) {
                        return false;
                    }
                }
                else if (userAgent && tokenData.userAgent == userAgent) {
                    return false;
                }
                else if (ip && tokenData.ip == ip) {
                    return false;
                }
                return true;
            });
        } else {
            // If no userAgent nor ip are given, remove all tokens
            this.sessionKeeperTokens = undefined;
        }
    };

    /**
     * Clean only expired session tokens of a user
     *
     * Note: the user object is modified but not yet save to database
     */
    userSchema.methods.cleanExpiredSessionKeeperTokens = function () {
        if (!this.sessionKeeperTokens || this.sessionKeeperTokens.length < 1) {
            return;
        }

        let now = new Date();
        this.sessionKeeperTokens = this.sessionKeeperTokens.filter(tokenData => tokenData.expiration >= now );
    };

    /**
     * Find the user that match a session keeper id/token pair, and return it
     *
     * @param id string Token ID to match
     * @param token string Token to match (the token, **not** its hash)
     * @returns Promise that return the user object, or false if not found
     */
    userSchema.statics.findBySessionKeeperToken = async function(id, token) {
        let user = await this.findOne({'sessionKeeperTokens.id': id }).exec();

        if (user) {
            let tokenData = user.findSessionKeeperToken(id);
            let tokenHash = crypto.createHash('sha256').update(token, 'utf8').digest('hex');
            if (tokenData.token == tokenHash && tokenData.expiration >= new Date()) {
                return user;
            }
        }

        return false;
    };

    //
    /**
     * Clean expired session keeper tokens of all users
     *
     * Note: modified user object **are** saved to database
     *
     * @returns Number of user modified
     */
    userSchema.statics.CleanAllExpiredSessionKeeperTokens = async function () {
        let users = await this.find({'sessionKeeperTokens.expiration': { $lt: new Date() } }).exec();

        let toSave = [];
        for (let user of users) {
            user.cleanExpiredSessionKeeperTokens();
            toSave.push(user.save());
        }

        await(Promise.all(toSave));

        return toSave.length;
    };

    // Clean expired password recovery tokens of all users
    userSchema.statics.CleanAllExpiredRecovery = async function () {
        let users = await this.find({'recovery.expiration': { $lt: new Date() } }).exec();

        let toSave = [];
        for (let user of users) {
            user.clearRecovery();
            toSave.push(user.save());
        }

        await(Promise.all(toSave));

        return toSave.length;
    };

    userSchema.statics.getActiveUserCount = function () {
        return this.count().exec();
    };

    userSchema.statics.findById = function (id, cb) {
        return this.findOne({_id: id}, cb);
    };

    return mongoose.model('User', userSchema);
};