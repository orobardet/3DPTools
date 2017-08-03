'use strict';

module.exports = function(app) {
    const libLocale = app.lib.locale;
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
                    pageTitle: "System's information"
                });
            }

            let systemData = {
                app: {
                    version: app.config.get('version')
                },
                node: {
                    version: process.version
                }
            };

            return res.json({
                system: systemData,
                lastUpdate: new Date().getTime()
            });
        } catch (err) {
            return next(err);
        }
    };

    return this;
};