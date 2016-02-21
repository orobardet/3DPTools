module.exports = function (app) {
    var when = require('when');
    var libLocale = new app.lib.locale();
    var User = app.models.user;

    this.adminIndex = function (req, res, next) {
        when(app.models.user.find().sort('name').exec())
            .then(function (users) {
                res.render('admin/index', {
                    users: users,
                    pageTitle: 'Administration',
                    errors: []
                });
            })
            .catch(function (err) {
                next(err);
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
                res.status(400);
                return res.json({
                    errors: res.__(err.message)
                });
            }

            return res.json({
                message: res.__('User %s successfully added.', user.name)
            });
        });

    };

    return this;
};
