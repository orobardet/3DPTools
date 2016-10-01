module.exports = function (app) {
    var when = require('when');
    var libLocale = new app.lib.locale();
    var User = app.models.user;

    this.adminIndex = function (req, res, next) {
        when(User.find().sort('name').exec())
            .then(function (users) {
                return res.render('admin/index', {
                    users: users,
                    pageTitle: 'Administration',
                    errors: []
                });
            })
            .catch(function (err) {
                return next(err);
            });
    };

    this.addUser = function (req, res, next) {
        if (!req.form.isValid) {
            res.status(400);
            return res.json({
                errors: libLocale.localizeFormErrors(res, req.form.getErrors())
            });
        }
        var user = new User({
            email: req.form.email,
            firstname: req.form.firstname,
            lastname: req.form.lastname,
            passwordHash: User.generateHash(req.form.password),
            isAdmin: req.form.isAdmin
        });
        user.save(function (err) {
            if (err) {
                res.status(500);
                return res.json({
                    errors: res.__(err.message)
                });
            }

            return res.json({
                message: res.__('User %s successfully added.', user.name)
            });
        });

    };

    this.getUser = function (req, res, next) {
        var userId = req.params.user_id;

        when(User.findById(userId).exec())
            .then(function (user) {
                var userData = user.toObject({ getters: false, virtuals: true, versionKey: false });
                delete userData.passwordHash;
                return res.json({
                    user: userData
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('User %s not found.', userId)
                });
            });
    };

    this.editUser = function (req, res, next) {
        if (!req.form.isValid) {
            res.status(400);
            return res.json({
                errors: libLocale.localizeFormErrors(res, req.form.getErrors())
            });
        }

        var userId = req.params.user_id;

        when(User.findById(userId).exec())
            .then(function (user) {
                user.email = req.form.email;
                user.lastname = req.form.lastname;
                user.firstname = req.form.firstname;
                user.isAdmin = req.form.isAdmin;
                if (req.form.password && req.form.password != '') {
                    user.passwordHash = User.generateHash(req.form.password);
                }

                user.save(function (err) {
                    if (err) {
                        res.status(500);
                        return res.json({
                            errors: res.__(err.message)
                        });
                    }

                    return res.json({
                        message: res.__('User %s successfully edited.', user.name)
                    });
                });
            })
            .catch(function (err) {
                res.status(404);
                return res.json({
                    message: res.__('User %s not found.', userId)
                });
            });
    };

    this.deleteUser = function (req, res, next) {
        var userId = req.params.user_id;

        when(User.findById(userId).remove().exec())
            .then(function (user) {
                return res.json({
                    message: res.__('User %s successfully deleted.', userId)
                });
            })
            .catch(function (err) {
                res.status(500);
                return res.json({
                    message: res.__(err.message)
                });
            });
    };

    return this;
};
