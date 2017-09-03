'use strict';

const libLocale = require('lib/locale');
const util = require('util');
const diskusage = util.promisify(require('diskusage').check);
const mongoose = require('mongoose');
const yaml = require('js-yaml');

module.exports = function(app) {
    const User = app.models.user;

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
            let configData = app.config.get() || {};
            // Cleaning 'garbage" entries in the configuration object (dirty to show, and not compatible with YAML
            configData["$0"] = undefined;
            configData["_"] = undefined;
            configData["type"] = undefined;
            delete configData["$0"];
            delete configData["_"];
            delete configData["type"];
            let protectedData = protectData(configData, [/.*secret.*/, /.*pass.*/, /.*password.*/, /dsn/], '*****');

            let canSendEmail = false;
            const mailer = app.get('mailer');
            if (mailer && mailer.isMailerEnabled()) {
                canSendEmail = true;
            }

            return res.render('admin/show-config', {
                navModule: 'config',
                pageTitle: "System's configuration",
                jsonConfigToShow: protectedData,
                yamlConfigToShow: yaml.safeDump(protectedData, {noRefs: true}),
                canSendEmail: canSendEmail,
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Send a test email to the logged user
     *
     * @param req
     * @param res
     * @param next
     * @returns {Promise.<*>}
     */
    this.sendTestEmail = async (req, res, next) => {
        try {
            const user = req.user;
            let to = req.user.email;
            if (req.user.firstname || req.user.lastname) {
                to = `"${req.user.firstname} ${req.user.lastname}" <${req.user.email}>`;
            }

            let status = false;
            let message = '';
            const mailer = app.get('mailer');
            if (mailer) {
                let result = await mailer.sendMail({
                    to: to,
                    subject: "Test mail",
                    template: "test-email.ejs",
                    templateData: {
                        appVersion: app.config.get('version')
                    },
                    locale: req.getLocale()
                });
                if (result) {
                    status = true;
                }
            } else {
                message = res.__('Account recovery feature is disabled as there is no valid email sending configuration.');
            }

            return res.json({
                status: status,
                message: message,
                recipent: to,
            });
        } catch (err) {
            return next(err);
        }
    };

    return this;
};