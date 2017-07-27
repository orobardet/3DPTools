'use strict';

module.exports = function (app) {
    const form = require('express-form');
    const field = form.field;

    this.shop = form(
        field("name", "Name")
            .trim()
            .required(),
        field("url", "Url")
            .trim()
            .isUrl()
    );

    return this;
};