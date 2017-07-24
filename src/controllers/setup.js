'use strict';

module.exports = function (app) {
    const User = app.models.user;

    this.index = function (req, res) {
        res.render('setup/index', {
            layout: 'setup/layout',
            errors: [],
            email: null,
            firstname: null,
            lastname: null
        });
    };

    this.createUser = async function (req, res, next) {
        if (!req.form.isValid) {
            return res.render('setup/index', {
                layout: 'setup/layout',
                errors: req.form.getErrors()
            });
        }

        let user = new User({
            email: req.form.email,
            firstname: req.form.firstname,
            lastname: req.form.lastname,
            passwordHash: User.generateHash(req.form.password),
            isAdmin: true
        });

        try {
            if (await user.save()) {
                res.redirect("/setup/done");
            }
        } catch (err) {
            next(err);
        }
    };

    this.done = function (req, res) {
        res.render('setup/done', {
            layout: 'setup/layout'
        });
    };

    return this;
};