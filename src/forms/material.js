'use strict';

module.exports = function (app) {
    const form = require('express-form');
    const field = form.field;

    this.material = form(
        field("name", "Name")
            .trim()
            .required(),
        field("parentMaterial", "Parent material"),
        field("description", "Description")
            .trim(),
        field("density", "Density")
            .trim()
            .required()
            .isInt()
            .custom(value => {
                if (value <= 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("headTempMin", "Minimal extrusion temperature")
            .trim()
            .isInt()
            .custom(value => {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("headTempMax", "Maximal extrusion temperature")
            .trim()
            .isInt()
            .custom(value => {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("bedTempMin", "Minimal bed temperature")
            .trim()
            .isInt()
            .custom(value => {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("bedTempMax", "Maximal bed temperature")
            .trim()
            .isInt()
            .custom(value => {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("printingSpeedMin", "Minimal printing speed")
            .trim()
            .isInt()
            .custom(value => {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            }),
        field("printingSpeedMax", "Maximal printing speed")
            .trim()
            .isInt()
            .custom(value => {
                if (value < 0) {
                    throw new Error('%s must be greater than 0.');
                }
            })
    );

    this.file = form(
        field("name", "Name of the file")
            .trim()
            .required()
    );

    return this;
};