'use strict';

module.exports = function(app) {
    const libLocale = require('lib/locale');
    const User = app.models.user;
    const util = require('util');
    const diskusage = util.promisify(require('diskusage').check);
    const mongoose = require('mongoose');

    /**
     * Index page of the admin section
     */
    this.userIndex = async (req, res, next) => {
        let users;

        // Get all users from database
        try {
            users = await User.find().sort('name').exec();
        } catch(err) {
            return next(err);
        }

        return res.render('admin/users', {
            navModule: 'user',
            users: users,
            pageTitle: "Users administration",
            errors: []
        });
    };

    /**
     * Add a new user
     */
    this.addUser = async (req, res, next) => {
        // Check if user data from form is valid
        if (!req.form.isValid) {
            res.status(400);
            return res.json({
                errors: libLocale.localizeFormErrors(res, req.form.getErrors())
            });
        }

        // Create a new user object from form's data
        let user = new User({
            email: req.form.email,
            firstname: req.form.firstname,
            lastname: req.form.lastname,
            passwordHash: User.generateHash(req.form.password),
            isAdmin: req.form.isAdmin
        });

        // Save this new user to database
        try {
            await user.save();
        } catch (err) {
            // Handling of save error
            res.status(500);
            return res.json({
                errors: res.__(err.message)
            });
        }

        // Return the appropriate result
        return res.json({
            message: res.__('User %s successfully added.', user.name)
        });

    };

    /**
     * Get data of an user
     *
     * **Route params:**
     *  - user_id: database id of the user
     */
    this.getUser = async (req, res, next) => {
        let userId = req.params.user_id;

        let user;
        try {
            user = await User.findById(userId).exec();
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('User %s not found.', userId)
            });
        }

        let userData = user.toObject({ getters: false, virtuals: true, versionKey: false });
        delete userData.passwordHash;
        return res.json({
            user: userData
        });
    };

    /**
     * Modify an existing user
     */
    this.editUser = async (req, res, next) => {
        // Check if user data from form is valid
        if (!req.form.isValid) {
            res.status(400);
            return res.json({
                errors: libLocale.localizeFormErrors(res, req.form.getErrors())
            });
        }

        let userId = req.params.user_id;

        // Find and get the user to modify
        let user;
        try {
            user = await User.findById(userId).exec()
        } catch (err) {
            res.status(404);
            return res.json({
                message: res.__('User %s not found.', userId)
            });
        }

        // Apply the new data to the user
        user.email = req.form.email;
        user.lastname = req.form.lastname;
        user.firstname = req.form.firstname;
        user.isAdmin = req.form.isAdmin;
        if (req.form.password && req.form.password !== '') {
            user.passwordHash = User.generateHash(req.form.password);
        }

        // Save the modified user
        try {
            await user.save();
        } catch (err) {
            res.status(500);
            return res.json({
                errors: res.__(err.message)
            });
        }

        // Return the appropriate result
        return res.json({
            message: res.__('User %s successfully edited.', user.name)
        });
    };

    /**
     * Modify a user
     */
    this.deleteUser = async (req, res, next) => {
        let userId = req.params.user_id;

        // Delete the user
        try {
            await User.findById(userId).remove().exec()
        } catch (err) {
            res.status(500);
            return res.json({
                message: res.__(err.message)
            });
        }

        // Return the appropriate result
        return res.json({
            message: res.__('User %s successfully deleted.', userId)
        });
    };

    /**
     * Index page of the admin section
     */
    this.systemInformation = async (req, res, next) => {
        try {
            if (!req.xhr) {
                return res.render('admin/system-information', {
                    navModule: 'system',
                    pageTitle: "System's information",
                    prometheusEnabled: app.config.get('monitoring:prometheus:enabled') || false,
                });
            }

            let promises = [];

            const dbAdmin = mongoose.connection.db.admin(mongoose.connection.db);
            let [mongoDbStats, mongoServerInfo] = await Promise.all([mongoose.connection.db.stats(), dbAdmin.serverInfo()]);

            const du = {};
            for (let path of [app.get('config').get('upload:tmpPath')]) {
                du[path] = await diskusage(path);
            }

            let metricsData = {
                app: {
                    version: app.config.get('version'),
                    uptime: Math.floor(process.uptime()),
                    startTstamp: new Date().getTime() - process.uptime() * 1000,
                    pid: process.pid,
                    memoryUsage: process.memoryUsage()
                },
                node: {
                    version: process.version,
                    modulesVersions: process.versions
                },
                system: {
                    arch: process.arch,
                    platform: process.platform,
                    du: du
                },
                env: process.env,
                mongo: {
                    serverInfo: mongoServerInfo,
                    dbStats: mongoDbStats
                }
            };

            return res.json({
                metrics: metricsData,
                lastUpdate: new Date().getTime()
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Show the actual configuration used by the application
     *
     * It is not only the content of the configuration file, but the full runtime configuration that can come
     * from multiple sources (config file, environment variables, command line arguments, ...)
     */
    this.showConfig = async (req, res, next) => {
        const protectData = require(process.cwd()+'/tools/protectConfigData');
        try {
            return res.render('admin/show-config', {
                navModule: 'config',
                pageTitle: "System's configuration",
                configToShow: protectData(app.config.get() || {}, [/.*secret.*/, /.*pass.*/, /.*password.*/, /dsn/], '*****')
            });
        } catch (err) {
            return next(err);
        }
    };

    return this;
};