module.exports = function (app) {
    var express = require('express');
    var router = express.Router();

    var controller = app.controllers.app;

    /* GET home page. */
    router.get('/', controller.index);

    // set language
    router.get('/_lang/:lang', controller.changeLanguage);

    app.use('/', router);
};
