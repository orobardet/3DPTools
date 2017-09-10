'use strict';

module.exports = function (app) {
    const router = require('express').Router();
    const Controller = app.controllers.doc;
    const express = require('express');
    const config = app.get('config');

    router.use((req, res, next) => {
        res.locals.navModule = 'documentation';
        next();
    });

    router.get('/', Controller.extractUrlParams, Controller.showDocPage);
    router.get('/*', Controller.extractUrlParams, Controller.showDocPage);

    app.use('/doc', router);
    app.use('/doc-statics', express.static(config.get('doc:root') || ''), (req, res, next) => {
        const notFoundPath = '/doc' + req.url;
        console.error(`Documentation static not found: ${notFoundPath}`);
        return res.status(404).send('Not found: ' + notFoundPath);
    });

    return this;
};
