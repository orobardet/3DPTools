module.exports = function (app) {
    var express = require('express');
    var router = express.Router();
    var Controller = app.controllers.material;
    var MaterialForm = app.forms.material;

    router.use(function (req, res, next) {
        res.locals.navModule = 'material';
        next();
    });

    router.get('/', Controller.index);

    router.get('/get/:material_id', Controller.get);

    router.post('/add', MaterialForm.material, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/edit/:material_id', MaterialForm.material, Controller.edit);
    router.get('/edit/:material_id', Controller.editForm);

    router.delete('/delete/:material_id', Controller.delete);

    app.use('/material', router);
    return this;
};
