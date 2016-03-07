module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.filament;
    var FilamentForm = app.forms.filament;

    router.use(function (req, res, next) {
        res.locals.navModule = 'filament';
        next();
    });

    router.get('/', Controller.index);

    router.post('/add', FilamentForm.filament, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/edit/:filament_id', FilamentForm.filament, Controller.edit);
    router.get('/edit/:filament_id', Controller.editForm);

    app.use('/filament', router);
    return this;
};
