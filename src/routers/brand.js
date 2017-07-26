'use strict';

module.exports = function (app) {
    const router = require('express').Router();
    const Controller = app.controllers.brand;
    const Form = app.forms.brand;
    const multer = require('multer');
    const fileUpload = multer({
        dest: app.get('config').get('upload:tmpPath'),
        limits: {fileSize: 10000000, files: 1}
    });

    router.use((req, res, next) => {
        res.locals.navModule = 'brand';
        next();
    });

    router.get('/', Controller.index);

    router.get('/get/:brand_id', Controller.get);
    router.get('/get-logo/:brand_id', Controller.getLogo);

    router.post('/add', Form.brand, Controller.add);
    router.get('/add', Controller.addForm);

    router.post('/set-logo/:brand_id', fileUpload.single('logo'), Controller.setLogo);
    router.get('/delete-logo/:brand_id', Controller.deleteLogo);
    router.get('/set-logo/:brand_id', Controller.logoForm);

    router.post('/edit/:brand_id', Form.brand, Controller.edit);
    router.get('/edit/:brand_id', Controller.editForm);

    router.delete('/delete/:brand_id', Controller.delete);

    app.use('/brand', router);

    return this;
};
