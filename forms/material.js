module.exports = function (app) {
    var form = require('express-form');
    var field = form.field;

    this.material = form(
        field("name", "Name")
            .trim()
            .required(),
        field("description", "Description")
            .trim(),
        field("density", "Density")
            .trim()
            .required()
            .isInt()
            .custom(function (value) {
                if (value <= 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("headTempMin", "Minimal extrusion temperature")
            .trim()
            .isInt()
            .custom(function (value) {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("headTempMax", "Maximal extrusion temperature")
            .trim()
            .isInt()
            .custom(function (value) {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("bedTempMin", "Minimal bed temperature")
            .trim()
            .isInt()
            .custom(function (value) {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("bedTempMax", "Maximal bed temperature")
            .trim()
            .isInt()
            .custom(function (value) {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            })
    );

    return this;
};