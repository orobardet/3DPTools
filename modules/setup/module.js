var express = require('express');
var router = express.Router();
var form = require('express-form');
var field = form.field;
var User = require('../user/model/user');

/* add user */
router.post('/', form(
    field("email", "Email")
        .trim()
        .required()
        .isEmail()
        .custom(function (email, source, validatorCb) {
            User.count({'email': email}).exec(function (err, count) {
                if (err) {
                    validatorCb(err);
                } else if (count) {
                    validatorCb(new Error("Already used"));
                } else {
                    validatorCb(null);
                }
            });
        }, "Already used"),
    field("firstname", "Firstname")
        .trim()
        .required()
        .is(/^[a-zA-Z -']+$/),
    field("lastname", "Lastname")
        .trim()
        .is(/^[a-zA-Z -']+$/),
    field("password", "Password")
        .trim()
        .required()
        .is(/^\w{6,}$/),
    field("password2", "Password verification")
        .trim()
        .required()
        .equals("field::password", "Passwords does not match")
), function (req, res, next) {
    if (!req.form.isValid) {
        res.render('setup/index', {
            layout: 'setup/layout',
            errors: req.form.getErrors()
        });
    } else {
        var user = new User({
            email: req.form.email,
            firstname: req.form.firstname,
            lastname: req.form.lastname,
            passwordHash: req.form.password,
            isAdmin: true
        });
        user.save(function (err) {
            if (err) {
                next(err);
            } else {
                res.redirect("/setup/done");
            }
        });
    }
});

/* setup root */
router.get('/', function (req, res) {
    res.render('setup/index', {
        layout: 'setup/layout',
        errors: [],
        email: null,
        firstname: null,
        lastname: null
    });
});

/* setup finished */
router.get('/done', function (req, res) {
    res.render('setup/done', {
        layout: 'setup/layout'
    });
});

module.exports = {
    rootPath: "/setup",
    "router": router
};
