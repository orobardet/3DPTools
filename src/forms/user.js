'use strict';

module.exports = function (app) {
    const form = require('express-form');
    const field = form.field;
    const User = app.models.user;

    this.changePassword = form(
        field("password", "Password")
            .trim()
            .required()
            .is(/^\w{6,}$/),
        field("passwordConfirmation", "Password verification")
            .trim()
            .required()
            .equals("field::password", "Passwords does not match"),
    );

    this.createUser = form(
        field("email", "Email")
            .trim()
            .required()
            .isEmail()
            .custom((email, source, validatorCb) => {
                User.count({'email': email}).exec((err, count) => {
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
            .equals("field::password", "Passwords does not match"),
        field("isAdmin")
            .ifNull(false)
            .toBoolean()
    );

    this.editUser = form(
        field("email", "Email")
            .trim()
            .required()
            .isEmail(),
        field("firstname", "Firstname")
            .trim()
            .required()
            .is(/^[a-zA-Z -']+$/),
        field("lastname", "Lastname")
            .trim()
            .is(/^[a-zA-Z -']+$/),
        field("password", "Password")
            .trim()
            .is(/^\w{6,}$/),
        field("password2", "Password verification")
            .trim()
            .equals("field::password", "Passwords does not match"),
        field("isAdmin")
            .ifNull(false)
            .toBoolean()
    );

    return this;
};