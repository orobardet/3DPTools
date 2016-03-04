module.exports = function (app) {
    var form = require('express-form');
    var field = form.field;

    this.filament = form(
        field("name", "Name")
            .trim()
            .required(),
        field("description", "Description")
            .trim(),
        field("material", "Material")
            .required(),
        field("brand", "Brand")
            .required(),
        field("shop", "Shop")
            .required(),
        field("colorName", "Color name")
            .trim()
            .required(),
        field("colorCode", "Color code")
            .trim()
            .required(),
        field("diameter", "Diameter")
            .trim()
            .required()
            .isNumeric(),
        field("buyDate", "Purchase date")
            .trim()
            .required()
            .toInt(),
        field("price", "Price")
            .trim()
            .required()
            .isNumeric(),
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
        field("headTempExperienced", "Experienced extrusion temperature")
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
            }),
        field("bedTempExperienced", "Experienced bed temperature")
            .trim()
            .isInt()
            .custom(function (value) {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("density", "Density")
            .trim()
            .required()
            .isInt()
            .custom(function (value) {
                if (value <= 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("flowPercentage", "Flow")
            .trim()
            .isInt()
            .custom(function (value) {
                if (value <= 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("speedPercentage", "Speed")
            .trim()
            .isInt()
            .custom(function (value) {
                if (value <= 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("initialMaterialWeight", "Initial material weight")
            .trim()
            .required()
            .isNumeric()
            .custom(function (value) {
                if (value <= 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("initialTotalWeight", "Initial total weight")
            .trim()
            .required()
            .isNumeric()
            .custom(function (value) {
                if (value <= 0) {
                    throw new Error('%s must be greater than 0.');
                }
            })
    );

    return this;
};